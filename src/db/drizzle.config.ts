import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ override: true });

let dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.includes('dpg-') && !dbUrl.includes('.render.com')) {
  const region = process.env.RENDER_REGION || 'frankfurt';
  dbUrl = dbUrl.replace(/dpg-([a-z0-9-]+-[a-z])/, `dpg-$1.${region}-postgres.render.com`);
  if (!dbUrl.includes('sslmode=')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: process.env.SQL_HOST
    ? {
        host: process.env.SQL_HOST!,
        user: process.env.SQL_USER || process.env.SQL_ADMIN_USER || "postgres",
        password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || "",
        database: process.env.SQL_DB_NAME || "postgres",
        ssl: (process.env.NODE_ENV === 'production' && !process.env.SQL_HOST.startsWith('/')) ? { rejectUnauthorized: false } : false,
      }
    : (dbUrl && dbUrl.startsWith('postgres')) 
    ? { url: dbUrl + (process.env.RENDER ? "" : "?sslmode=require") }
    : {
        host: "localhost",
        user: "postgres",
        password: "",
        database: "postgres",
      },
  verbose: true,
});
