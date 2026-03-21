import { db } from "../client";
import { roles, permissions, rolePermissions } from "../schema";

/**
 * Seed roles and permissions data
 */
export const seedRolesAndPermissions = async () => {
  try {
    console.log("🌱 Seeding roles and permissions...");

    // Insert permissions
    const permissionData = [
      { name: "MANAGE_PLATFORM", description: "Full platform administration access" },
      { name: "MANAGE_TURFS", description: "Manage turf registrations and verifications" },
      { name: "MANAGE_SUBSCRIPTIONS", description: "Manage subscription plans and billing" },
      { name: "MANAGE_PLAYERS", description: "Manage player registrations and profiles" },
      { name: "MANAGE_MATCHES", description: "Create and manage cricket matches" },
      { name: "SCORE_MATCH", description: "Score live cricket matches" },
      { name: "VIEW_STATS", description: "View cricket statistics and reports" },
      { name: "VIEW_LEADERBOARDS", description: "View player leaderboards and rankings" },
      { name: "MANAGE_SCORERS", description: "Manage scorer accounts and permissions" },
    ];

    const insertedPermissions = await db
      .insert(permissions)
      .values(permissionData)
      .returning();

    console.log(`✅ Inserted ${insertedPermissions.length} permissions`);

    // Insert roles
    const roleData = [
      { name: "SUPER_ADMIN", description: "Platform super administrator with full access" },
      { name: "TURF_ADMIN", description: "Turf owner with management permissions" },
      { name: "SCORER", description: "Match scorer with scoring permissions" },
      { name: "PLAYER", description: "Player with view permissions" },
    ];

    const insertedRoles = await db
      .insert(roles)
      .values(roleData)
      .returning();

    console.log(`✅ Inserted ${insertedRoles.length} roles`);

    // Create role-permission mappings
    const rolePermissionMappings = [
      // SUPER_ADMIN - All permissions
      ...insertedPermissions.map(permission => ({
        roleId: insertedRoles.find(r => r.name === "SUPER_ADMIN")!.id,
        permissionId: permission.id,
      })),

      // TURF_ADMIN - Management permissions (no platform management)
      ...insertedPermissions
        .filter(p => !["MANAGE_PLATFORM"].includes(p.name))
        .map(permission => ({
          roleId: insertedRoles.find(r => r.name === "TURF_ADMIN")!.id,
          permissionId: permission.id,
        })),

      // SCORER - Scoring and viewing permissions
      ...insertedPermissions
        .filter(p => ["SCORE_MATCH", "VIEW_STATS", "VIEW_LEADERBOARDS"].includes(p.name))
        .map(permission => ({
          roleId: insertedRoles.find(r => r.name === "SCORER")!.id,
          permissionId: permission.id,
        })),

      // PLAYER - Viewing permissions only
      ...insertedPermissions
        .filter(p => ["VIEW_STATS", "VIEW_LEADERBOARDS"].includes(p.name))
        .map(permission => ({
          roleId: insertedRoles.find(r => r.name === "PLAYER")!.id,
          permissionId: permission.id,
        })),
    ];

    const insertedRolePermissions = await db
      .insert(rolePermissions)
      .values(rolePermissionMappings)
      .returning();

    console.log(`✅ Inserted ${insertedRolePermissions.length} role-permission mappings`);

    console.log("🎉 Roles and permissions seeded successfully!");
    
    return {
      permissions: insertedPermissions,
      roles: insertedRoles,
      rolePermissions: insertedRolePermissions,
    };
  } catch (error) {
    console.error("❌ Error seeding roles and permissions:", error);
    throw error;
  }
};
