import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * Super Admin Invitations table
 * Manages invitation-only super admin registration
 */
export const adminInvitations = pgTable("admin_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Invitation details
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  invitedBy: uuid("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Invitation token and security
  inviteToken: varchar("invite_token", { length: 255 }).notNull().unique(),
  inviteTokenExpiresAt: timestamp("invite_token_expires_at").notNull(),

  // Verification status
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  passwordSet: boolean("password_set").default(false).notNull(),
  totpEnabled: boolean("totp_enabled").default(false).notNull(),

  // OTP verification
  emailOtpHash: varchar("email_otp_hash", { length: 255 }),
  emailOtpExpiresAt: timestamp("email_otp_expires_at"),
  emailOtpAttempts: integer("email_otp_attempts").default(0).notNull(),

  phoneOtpHash: varchar("phone_otp_hash", { length: 255 }),
  phoneOtpExpiresAt: timestamp("phone_otp_expires_at"),
  phoneOtpAttempts: integer("phone_otp_attempts").default(0).notNull(),

  // 2FA setup
  totpSecret: varchar("totp_secret", { length: 255 }),
  backupCodes: text("backup_codes"), // JSON array of hashed backup codes

  // Status and timestamps
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, ACTIVE, EXPIRED, REVOKED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
});

/**
 * Admin Session Management
 * Tracks secure admin sessions for device management
 */
export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Session details
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  refreshToken: varchar("refresh_token", { length: 255 }).notNull().unique(),

  // Device and location info
  deviceInfo: text("device_info"), // JSON string with device details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: text("location"), // JSON string with geo data

  // Security
  isActive: boolean("is_active").default(true).notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Audit Log for Admin Actions
 * Tracks all admin activities for security monitoring
 */
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Action details
  action: varchar("action", { length: 100 }).notNull(), // LOGIN, LOGOUT, INVITE_SENT, USER_CREATED, etc.
  resource: varchar("resource", { length: 100 }), // USER, INVITATION, etc.
  resourceId: varchar("resource_id", { length: 255 }),

  // Request details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: text("location"), // JSON string with geo data

  // Additional data
  metadata: text("metadata"), // JSON string with additional context
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Security Alerts
 * Tracks suspicious activities and security events
 */
export const securityAlerts = pgTable("security_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Alert details
  type: varchar("type", { length: 50 }).notNull(), // NEW_DEVICE, NEW_LOCATION, FAILED_LOGIN, etc.
  severity: varchar("severity", { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // Context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: text("location"), // JSON string with geo data
  metadata: text("metadata"), // JSON string with additional context

  // Status
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const adminInvitationsRelations = relations(adminInvitations, ({ one }) => ({
  invitedByUser: one(users, {
    fields: [adminInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(users, {
    fields: [adminSessions.userId],
    references: [users.id],
  }),
}));

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  user: one(users, {
    fields: [adminAuditLog.userId],
    references: [users.id],
  }),
}));

export const securityAlertsRelations = relations(securityAlerts, ({ one }) => ({
  user: one(users, {
    fields: [securityAlerts.userId],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [securityAlerts.resolvedBy],
    references: [users.id],
  }),
}));
