import { Request, Response, NextFunction } from 'express';

export interface SubdomainRequest extends Request {
  tenantSubdomain?: string;
  isSubdomainRequest?: boolean;
}

/**
 * Extracts subdomain from host string or query parameter.
 * Handles edge cases including localhost subdomains, port numbers,
 * cloud platform domains, and www prefixes.
 */
export function extractSubdomain(host: string, queryDomain?: string): string | null {
  // 1. Check explicit query parameter override (e.g. ?domain=alsaadah or ?subdomain=alsaadah)
  if (queryDomain && typeof queryDomain === 'string' && queryDomain.trim() !== '') {
    const cleanQuery = queryDomain.trim().toLowerCase();
    if (!['www', 'localhost', '127.0.0.1', 'admin', 'app'].includes(cleanQuery)) {
      return cleanQuery;
    }
  }

  if (!host) return null;

  // Remove port if present (e.g., alsaadah.localhost:3000 -> alsaadah.localhost)
  const hostWithoutPort = host.split(':')[0].toLowerCase().trim();

  // Handle IP addresses
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostWithoutPort)) {
    return null;
  }

  // Handle localhost subdomains (e.g. alsaadah.localhost)
  if (hostWithoutPort.endsWith('.localhost')) {
    const parts = hostWithoutPort.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }

  // Handle Cloud Run dev/pre URLs and AI Studio preview containers
  if (
    hostWithoutPort.includes('run.app') || 
    hostWithoutPort.includes('ai.studio') ||
    hostWithoutPort.includes('aistudio.dev') ||
    hostWithoutPort.includes('googleusercontent.com') ||
    hostWithoutPort.includes('google.com')
  ) {
    return null;
  }

  // Handle render domain structure (e.g., tenant.sass-gyis.onrender.com)
  if (hostWithoutPort.endsWith('.onrender.com')) {
    const parts = hostWithoutPort.split('.');
    if (parts.length > 3) {
      return parts[0];
    }
    return null;
  }

  // Standard wildcard subdomain (e.g. clientname.ourplatform.com)
  const parts = hostWithoutPort.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'app' && sub !== 'api' && sub !== 'admin') {
      return sub;
    }
  }

  return null;
}

/**
 * Express middleware to intercept requests and resolve wildcard subdomains.
 */
export function subdomainMiddleware(req: SubdomainRequest, res: Response, next: NextFunction) {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const queryDomain = (req.query.domain as string) || (req.query.subdomain as string);

  const subdomain = extractSubdomain(host, queryDomain);

  if (subdomain) {
    req.tenantSubdomain = subdomain;
    req.isSubdomainRequest = true;
    try {
      res.setHeader('X-Tenant-Subdomain', encodeURIComponent(subdomain));
    } catch (err) {
      // Ignore header encoding errors if non-ASCII character exists
    }
  } else {
    req.isSubdomainRequest = false;
  }

  next();
}
