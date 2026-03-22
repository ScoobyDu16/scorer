import { pool } from "./index";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const db = drizzle(pool);

async function fixAdminPassword() {
  try {
    const password = "Admin123!@#";
    const passwordHash = await bcrypt.hash(password, 12);
    
    console.log("Updating admin password...");
    
    const updated = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, "admin@scorer.com"))
      .returning();

    console.log("Password updated for:", updated[0].email);
    console.log("New hash:", passwordHash);
    
    // Test the new hash
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log("Password verification test:", isValid);

  } catch (error) {
    console.error("Error:", error);
  }
}

fixAdminPassword();
