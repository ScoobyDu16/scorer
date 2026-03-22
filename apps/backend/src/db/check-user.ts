import { pool } from "./index";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, roles, userRoles } from "./schema";
import { eq } from "drizzle-orm";

const db = drizzle(pool);

async function checkUser() {
  try {
    // Check user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@scorer.com"))
      .limit(1);

    console.log("User:", user[0]);

    // Check user role
    const userRole = await db
      .select({
        user: users,
        role: roles,
        userRole: userRoles
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.email, "admin@scorer.com"))
      .limit(1);

    console.log("User with role:", userRole[0]);

  } catch (error) {
    console.error("Error:", error);
  }
}

checkUser();
