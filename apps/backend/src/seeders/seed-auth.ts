import { db } from "../db";
import { roles } from "../db/schema/roles";
import { permissions } from "../db/schema/permissions";
import { rolePermissions } from "../db/schema/role-permissions";
import { ROLE } from "../db/schema/enums";

async function seedRoles() {
  console.log("🌱 Seeding roles...");
  
  const rolesData = [
    { name: ROLE.SUPER_ADMIN },
    { name: ROLE.TURF_ADMIN },
    { name: ROLE.SCORER },
    { name: ROLE.PLAYER },
  ];

  for (const roleData of rolesData) {
    await db.insert(roles).values(roleData).onConflictDoNothing({
      target: roles.name,
    });
  }

  console.log("✅ Roles seeded successfully");
}

async function seedPermissions() {
  console.log("🌱 Seeding permissions...");
  
  const permissionsData = [
    // Platform permissions (SUPER_ADMIN)
    { name: "MANAGE_PLATFORM" },
    { name: "MANAGE_TURFS" },
    { name: "MANAGE_SUBSCRIPTIONS" },
    { name: "VIEW_ANALYTICS" },
    { name: "MODERATE_USERS" },
    
    // Turf management permissions (TURF_ADMIN)
    { name: "MANAGE_OWN_TURF" },
    { name: "MANAGE_PLAYERS" },
    { name: "MANAGE_MATCHES" },
    { name: "MANAGE_SCORERS" },
    { name: "VIEW_TURF_ANALYTICS" },
    
    // Scoring permissions (SCORER)
    { name: "SCORE_MATCH" },
    { name: "VIEW_MATCH_DETAILS" },
    { name: "MANAGE_INNINGS" },
    { name: "RECORD_BALLS" },
    { name: "RECORD_WICKETS" },
    { name: "RECORD_EXTRAS" },
    { name: "UNDO_BALL" },
    
    // Player permissions (PLAYER)
    { name: "VIEW_SCORECARDS" },
    { name: "VIEW_STATS" },
    { name: "FOLLOW_PLAYERS" },
    { name: "SHARE_SCORECARDS" },
  ];

  for (const permissionData of permissionsData) {
    await db.insert(permissions).values(permissionData).onConflictDoNothing({
      target: permissions.name,
    });
  }

  console.log("✅ Permissions seeded successfully");
}

async function seedRolePermissions() {
  console.log("🌱 Seeding role permissions...");
  
  // Get all roles and permissions
  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);
  
  const roleMap = new Map(allRoles.map((role: any) => [role.name, role.id]));
  const permissionMap = new Map(allPermissions.map((permission: any) => [permission.name, permission.id]));

  // Define role-permission mappings
  const rolePermissionMappings = [
    // SUPER_ADMIN permissions
    {
      roleName: ROLE.SUPER_ADMIN,
      permissions: [
        "MANAGE_PLATFORM", "MANAGE_TURFS", "MANAGE_SUBSCRIPTIONS", 
        "VIEW_ANALYTICS", "MODERATE_USERS", "VIEW_SCORECARDS", "VIEW_STATS"
      ]
    },
    
    // TURF_ADMIN permissions
    {
      roleName: ROLE.TURF_ADMIN,
      permissions: [
        "MANAGE_OWN_TURF", "MANAGE_PLAYERS", "MANAGE_MATCHES", 
        "MANAGE_SCORERS", "VIEW_TURF_ANALYTICS", "VIEW_SCORECARDS", 
        "VIEW_STATS", "SHARE_SCORECARDS"
      ]
    },
    
    // SCORER permissions
    {
      roleName: ROLE.SCORER,
      permissions: [
        "SCORE_MATCH", "VIEW_MATCH_DETAILS", "MANAGE_INNINGS", 
        "RECORD_BALLS", "RECORD_WICKETS", "RECORD_EXTRAS", "UNDO_BALL"
      ]
    },
    
    // PLAYER permissions
    {
      roleName: ROLE.PLAYER,
      permissions: [
        "VIEW_SCORECARDS", "VIEW_STATS", "FOLLOW_PLAYERS", "SHARE_SCORECARDS"
      ]
    },
  ];

  for (const mapping of rolePermissionMappings) {
    const roleId = roleMap.get(mapping.roleName);
    if (!roleId) continue;

    for (const permissionName of mapping.permissions) {
      const permissionId = permissionMap.get(permissionName);
      if (!permissionId) continue;

      await db.insert(rolePermissions).values({
        roleId,
        permissionId,
      });
    }
  }

  console.log("✅ Role permissions seeded successfully");
}

export async function seedAuthData() {
  try {
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    
    console.log("🎉 All authentication data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding authentication data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAuthData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
