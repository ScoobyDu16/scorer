import { Pool } from "pg";
import { env } from "../config/env";
import { dbLogger } from "../utils/logger";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Only log errors and important events, not every query
  log: (message, info) => {
    // Only log error messages and connection events
    if (message.includes('error') || message.includes('connect') || message.includes('disconnect')) {
      dbLogger.query(message, info);
    }
  }
});

export const testDbConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    dbLogger.success("Database connection established", { 
      serverTime: result.rows[0].now,
      database: env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'unknown'
    });
  } catch (error) {
    dbLogger.error(error, "Database connection test");
    throw error;
  }
};
