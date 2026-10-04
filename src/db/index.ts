import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';

// Override env with .env file to override bad values from the UI
dotenv.config({ override: true });

// Helper to purge all dead/stale idle connections from pg.Pool's internal idle queue
const purgeDeadPoolClients = (p: any) => {
  try {
    const idleQueue = p._idle || p._idleClients || [];
    while (idleQueue.length > 0) {
      const client = idleQueue.pop();
      if (client) {
        try {
          if (client.stream) client.stream.destroy();
          if (typeof client.end === 'function') client.end().catch(() => {});
        } catch (e) {
          // ignore stream destroy errors
        }
      }
    }
  } catch (e) {
    // ignore
  }
};

export const createPool = () => {
  const commonOptions = {
    max: 5, // Keep connection count low to avoid hitting Render free-tier connection caps
    idleTimeoutMillis: 5000, // Automatically close idle clients after 5s before Render server drops TCP
    connectionTimeoutMillis: 10000, // Handshake timeout
    keepAlive: true,
    keepAliveInitialDelayMillis: 1000,
  };

  // Prioritize Cloud SQL if running in AI Studio or GCP where SQL_HOST is provided
  if (process.env.SQL_HOST) {
    return new Pool({
      ...commonOptions,
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres',
      password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'postgres',
      ssl: (process.env.NODE_ENV === 'production' && !(process.env.SQL_HOST || '').startsWith('/')) ? { rejectUnauthorized: false } : false,
    });
  }

  let dbUrl = process.env.DATABASE_URL;

  // Render detection & URL normalization
  // Convert any bare internal hostname dpg-xxx-a into the fully qualified external hostname dpg-xxx-a.<region>-postgres.render.com
  // This guarantees connectivity across different regions and prevents ENOTFOUND on Render internal DNS
  if (dbUrl) {
    const region = process.env.RENDER_REGION || process.env.RENDER_INSTANCE_REGION || 'frankfurt';
    try {
      const parsed = new URL(dbUrl);
      if (parsed.hostname && parsed.hostname.startsWith('dpg-') && !parsed.hostname.includes('.render.com')) {
        parsed.hostname = `${parsed.hostname}.${region}-postgres.render.com`;
        if (!parsed.searchParams.has('sslmode')) {
          parsed.searchParams.set('sslmode', 'require');
        }
        dbUrl = parsed.toString();
      }
    } catch (e) {
      if (dbUrl.includes('dpg-') && !dbUrl.includes('.render.com')) {
        dbUrl = dbUrl.replace(/@dpg-([a-z0-9-]+)([:/?]|$)/i, `@dpg-$1.${region}-postgres.render.com$2`);
        if (!dbUrl.includes('sslmode=')) {
          dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
        }
      }
    }
  }

  // Check valid DB URL
  const hasValidUser = dbUrl && !dbUrl.includes('://:@') && dbUrl.includes('@');

  if (hasValidUser && dbUrl.startsWith('postgres')) {
    const isInternalHost = dbUrl.includes('dpg-') && !dbUrl.includes('.render.com');
    const requiresSsl = !isInternalHost && (dbUrl.includes('.render.com') || dbUrl.includes('sslmode=require') || process.env.NODE_ENV === 'production');

    let cleanDbUrl = dbUrl;
    if (isInternalHost) {
      // Strip sslmode from internal URLs to prevent ssl handshake failure on internal render network
      cleanDbUrl = dbUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/([?&])ssl=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
    }

    return new Pool({
      ...commonOptions,
      connectionString: cleanDbUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    });
  }

  return new Pool({
    ...commonOptions,
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres',
    password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'postgres',
    ssl: (process.env.NODE_ENV === 'production' && !(process.env.SQL_HOST || '').startsWith('/')) ? { rejectUnauthorized: false } : false,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Idle SQL pool client error, purging dead connections:', err?.message || err);
  purgeDeadPoolClients(pool);
});

// Helper to check if an error is due to a transient database disconnect
const isDisconnectError = (err: any): boolean => {
  if (!err) return false;
  const msg = [
    err.message,
    err.detail,
    err.cause?.message,
    String(err.cause),
    String(err),
    err.code
  ].filter(Boolean).join(' ');

  return (
    msg.includes('Connection terminated unexpectedly') ||
    msg.includes('connection closed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('terminating connection') ||
    msg.includes('Client has encountered a connection error') ||
    msg.includes('server closed the connection unexpectedly') ||
    msg.includes('socket has been closed') ||
    msg.includes('Connection terminated') ||
    msg.includes('57P01')
  );
};

// Wrap pool.query with instant dead connection purging and fast retry
const originalPoolQuery = pool.query.bind(pool);
(pool as any).query = async function (...args: any[]) {
  let retries = 5;
  let lastError;

  while (retries > 0) {
    try {
      return await originalPoolQuery(...args);
    } catch (err: any) {
      lastError = err;
      retries--;

      if (isDisconnectError(err)) {
        // Immediately purge all dead idle sockets in the pool so the next retry connects fresh
        purgeDeadPoolClients(pool);

        if (retries > 0) {
          const delay = (5 - retries) * 100; // Fast 100ms, 200ms, 300ms backoff
          console.warn(`Database connection lost during query, purged pool & retrying (${retries} attempts left, waiting ${delay}ms):`, err?.message || err);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
      }
      throw err;
    }
  }
  throw lastError;
};

// Wrap pool.connect with socket validation and instant retry
const originalPoolConnect = pool.connect.bind(pool);
(pool as any).connect = function (...args: any[]) {
  // If called with a callback function (legacy pg.Pool.connect(cb)), delegate directly
  if (typeof args[0] === 'function') {
    return originalPoolConnect(...args);
  }

  return (async () => {
    let retries = 5;
    let lastError;

    while (retries > 0) {
      try {
        const client = await originalPoolConnect();
        if (!client) return client;

        // Safely validate socket state
        const stream = (client as any)?.stream || (client as any)?.connection?.stream;
        if (stream && stream.destroyed) {
          try {
            if (typeof client.release === 'function') client.release(true);
          } catch (e) {
            // ignore release error
          }
          purgeDeadPoolClients(pool);
          retries--;
          continue;
        }
        return client;
      } catch (err: any) {
        lastError = err;
        retries--;

        if (isDisconnectError(err)) {
          purgeDeadPoolClients(pool);
          if (retries > 0) {
            const delay = (5 - retries) * 100;
            console.warn(`Database connection lost during connect(), purged pool & retrying (${retries} attempts left):`, err?.message || err);
            await new Promise(res => setTimeout(res, delay));
            continue;
          }
        }
        throw err;
      }
    }
    throw lastError;
  })();
};

export const db = drizzle(pool, { schema });


