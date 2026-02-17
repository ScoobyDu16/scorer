import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const testDbConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("DB Connected. Server time:", result.rows[0].now);
  } catch (error) {
    console.error("DB Connection Failed:", error);
  }
};
