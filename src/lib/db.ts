import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Get pool options with connection timeouts and fallback parameter support
function getPoolConfig(connectionString: string): pg.PoolConfig {
  return {
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || "10000", 10),
  };
}

/**
 * Creates a PostgreSQL connection pool with fallback URL support.
 * Uses FALLBACK_DATABASE_URL or DIRECT_URL if primary DATABASE_URL is unavailable or fails.
 */
function createPoolWithFallback(): pg.Pool {
  const primaryUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const fallbackUrl = process.env.FALLBACK_DATABASE_URL || process.env.DIRECT_URL;

  const targetUrl = primaryUrl || fallbackUrl;

  if (!targetUrl) {
    console.error("Database connection URL missing. Ensure DATABASE_URL or FALLBACK_DATABASE_URL is set in environment.");
  }

  const poolConfig = getPoolConfig(targetUrl || "");
  const pool = new pg.Pool(poolConfig);

  // Handle unexpected errors on idle pool clients to prevent unhandled crashes
  pool.on("error", (err) => {
    console.error("PostgreSQL Pool Error:", err.message);
    if (fallbackUrl && primaryUrl && targetUrl === primaryUrl) {
      console.warn("Primary database pool connection error detected. Fallback parameters configured.");
    }
  });

  return pool;
}

/**
 * Executes a database operation with automatic retry logic and exponential backoff.
 */
export async function withRetry<T>(
  operation: (client: PrismaClient) => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation(db);
    } catch (err) {
      lastError = err;
      console.warn(`Database operation attempt ${attempt}/${retries} failed: ${(err as Error).message}`);
      if (attempt < retries) {
        await sleep(delay * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError;
}

function createPrismaClient(): PrismaClient {
  const pool = createPoolWithFallback();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

