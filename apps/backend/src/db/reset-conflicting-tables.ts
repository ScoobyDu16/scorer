import { pool } from "./index";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(pool);

/**
 * Reset conflicting tables for fresh migration
 * This script drops tables that conflict with the new RBAC schema
 */

async function resetConflictingTables() {
  console.log("🔄 Resetting conflicting tables for migration...");

  try {
    // Drop enum types first
    const enumTypes = [
      'dismissal_type',
      'extra_type', 
      'innings_status',
      'match_status',
      'result_type',
      'team',
      'toss_decision',
      'wicket_type'
    ];

    for (const enumType of enumTypes) {
      try {
        await pool.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE`);
        console.log(`✅ Dropped enum type: ${enumType}`);
      } catch (error: any) {
        console.log(`⚠️  Enum type ${enumType} not found or error dropping:`, error?.message || error);
      }
    }

    // Drop tables in reverse order of dependencies
    const tablesToDrop = [
      'user_roles',
      'role_permissions', 
      'permissions',
      'roles',
      'users',
      'subscriptions',
      'plans',
      'match_players',
      'player_match_stats',
      'balls',
      'innings',
      'matches',
      'players',
      'access_codes',
      'turfs'
    ];

    for (const table of tablesToDrop) {
      try {
        await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error: any) {
        console.log(`⚠️  Table ${table} not found or error dropping:`, error?.message || error);
      }
    }

    console.log("🎉 Conflicting tables reset completed");
    console.log("📋 Next steps:");
    console.log("1. Run: pnpm drizzle:migrate");
    console.log("2. Run: pnpm ts-node src/db/seed-super-admin.ts");

  } catch (error) {
    console.error("❌ Error resetting tables:", error);
    process.exit(1);
  }
}

resetConflictingTables()
  .then(() => {
    console.log("✅ Reset completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  });
