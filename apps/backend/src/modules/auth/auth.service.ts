import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../../config/env";
import { db } from "../../db/client";
import { users, roles, userRoles, turfs } from "../../db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { authLogger } from "../../utils/logger";
import { UserRole, JWTPayload } from "../../middleware/auth.middleware";

export interface LoginRequest {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
  turfId?: string; // For turf admin registration
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    role: UserRole;
    turfId?: string;
    turfName?: string;
  };
}

export interface RegisterRequest {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  role: UserRole;
  turfId?: string;
}

/**
 * Generate JWT token with user info
 */
const generateToken = (userId: string, turfId: string | undefined, role: UserRole): string => {
  const payload: JWTPayload = {
    userId,
    turfId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return jwt.sign(payload, env.JWT_SECRET);
};

/**
 * Send OTP (mock implementation - in production use SMS service)
 */
const sendOTP = async (phone: string): Promise<string> => {
  // In production, use actual SMS service (Twilio, etc.)
  // For now, generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`OTP for ${phone}: ${otp}`); // Log for development
  return otp;
};

/**
 * Authenticate with phone + OTP (for players/scorers)
 */
export const phoneOTPLogin = async (phone: string, otp: string): Promise<AuthResponse> => {
  try {
    // Find user by phone
    const user = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (!user.length) {
      return { success: false, message: "User not found" };
    }

    // In production, verify OTP against stored OTP
    // For now, accept any 6-digit OTP as valid
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, message: "Invalid OTP format" };
    }

    // Get user's role from user_roles table
    const userRole = await db
      .select({
        role: roles.name,
        turfId: userRoles.turfId,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user[0].id))
      .limit(1);

    if (!userRole.length) {
      return { success: false, message: "User role not assigned" };
    }

    const role = userRole[0].role as UserRole;
    const turfId = userRole[0].turfId || undefined;

    // Get turf name if applicable
    let turfName;
    if (turfId) {
      const turf = await db
        .select({ name: turfs.name })
        .from(turfs)
        .where(eq(turfs.id, turfId))
        .limit(1);
      turfName = turf[0]?.name;
    }

    const token = generateToken(user[0].id, turfId, role);

    authLogger.login(true, `Phone OTP login successful for ${phone}`);

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        phone: user[0].phone,
        email: user[0].email || undefined,
        role,
        turfId,
        turfName,
      },
    };
  } catch (error: any) {
    authLogger.login(false, `Phone OTP login error: ${error.message}`);
    return { success: false, message: "Login failed" };
  }
};

/**
 * Authenticate with email + password (for turf admins)
 */
export const emailPasswordLogin = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return { success: false, message: "User not found" };
    }

    // In production, verify password against stored hash
    // For now, accept any non-empty password as valid
    if (!password || password.length < 1) {
      return { success: false, message: "Invalid password" };
    }

    // Get user's role from user_roles table
    const userRole = await db
      .select({
        role: roles.name,
        turfId: userRoles.turfId,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user[0].id))
      .limit(1);

    if (!userRole.length) {
      return { success: false, message: "User role not assigned" };
    }

    const role = userRole[0].role as UserRole;
    const turfId = userRole[0].turfId || undefined;

    // Get turf name if applicable
    let turfName;
    if (turfId) {
      const turf = await db
        .select({ name: turfs.name })
        .from(turfs)
        .where(eq(turfs.id, turfId))
        .limit(1);
      turfName = turf[0]?.name;
    }

    const token = generateToken(user[0].id, turfId, role);

    authLogger.login(true, `Email password login successful for ${email}`);

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        phone: user[0].phone || undefined,
        email: user[0].email || undefined,
        role,
        turfId,
        turfName,
      },
    };
  } catch (error: any) {
    authLogger.login(false, `Email password login error: ${error.message}`);
    return { success: false, message: "Login failed" };
  }
};

/**
 * Authenticate with email + password + 2FA (for super admin)
 */
export const superAdminLogin = async (email: string, password: string, otp: string): Promise<AuthResponse> => {
  try {
    // In production, verify against super admin credentials
    // For now, accept specific email + any password + valid OTP
    if (!email.includes("admin")) {
      return { success: false, message: "Invalid admin credentials" };
    }

    if (!password || password.length < 1) {
      return { success: false, message: "Invalid password" };
    }

    if (!/^\d{6}$/.test(otp)) {
      return { success: false, message: "Invalid 2FA code" };
    }

    // Super admin doesn't need turfId
    const token = generateToken("super-admin", undefined, "SUPER_ADMIN");

    authLogger.login(true, `Super admin login successful for ${email}`);

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: "super-admin",
        name: "Super Admin",
        role: "SUPER_ADMIN",
      },
    };
  } catch (error: any) {
    authLogger.login(false, `Super admin login error: ${error.message}`);
    return { success: false, message: "Login failed" };
  }
};

/**
 * Send OTP for registration (mock implementation)
 */
export const sendRegistrationOTP = async (email?: string, phone?: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!email && !phone) {
      return { success: false, message: "Email or phone number required" };
    }

    // In production, use actual email/SMS service
    // For now, generate a 6-digit OTP and log it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Registration OTP for ${email || phone}: ${otp}`);
    
    // In production, store OTP in database with expiry
    // For now, just return success
    return { success: true, message: "OTP sent successfully" };
  } catch (error: any) {
    console.log(`Failed to send registration OTP: ${error.message}`);
    return { success: false, message: "Failed to send OTP" };
  }
};

/**
 * Register new user with OTP verification
 */
export const register = async (data: RegisterRequest, otp?: string): Promise<AuthResponse> => {
  try {
    // Verify OTP for email/phone based users
    if ((data.email || data.phone) && !otp) {
      return { success: false, message: "OTP verification required" };
    }

    // In production, verify OTP against stored value
    // For now, accept any 6-digit OTP as valid
    if (otp && !/^\d{6}$/.test(otp)) {
      return { success: false, message: "Invalid OTP format" };
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(
        data.phone ? eq(users.phone, data.phone) : undefined,
        data.email ? eq(users.email, data.email) : undefined
      ))
      .limit(1);

    if (existingUser.length) {
      return { success: false, message: "User already exists" };
    }

    // Hash password if provided
    let passwordHash;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash,
        isPhoneVerified: data.phone ? true : false, // Assume verified after OTP
        isEmailVerified: data.email ? true : false, // Assume verified after OTP
      })
      .returning();

    // Get role ID
    const roleRecord = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, data.role))
      .limit(1);

    if (!roleRecord.length) {
      return { success: false, message: "Invalid role" };
    }

    // Assign role to user
    await db.insert(userRoles).values({
      userId: newUser[0].id,
      roleId: roleRecord[0].id,
      turfId: data.turfId,
    });

    // Generate token
    const token = generateToken(newUser[0].id, data.turfId, data.role);

    authLogger.login(true, `Registration successful for ${data.name}`);

    return {
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        phone: newUser[0].phone || undefined,
        email: newUser[0].email || undefined,
        role: data.role,
        turfId: data.turfId,
      },
    };
  } catch (error: any) {
    authLogger.login(false, `Registration error: ${error.message}`);
    return { success: false, message: "Registration failed" };
  }
};

/**
 * Send OTP to phone
 */
export const sendOTPToPhone = async (phone: string): Promise<{ success: boolean; message: string }> => {
  try {
    const otp = await sendOTP(phone);
    // In production, store OTP in database with expiry
    console.log(`OTP sent to ${phone}`);
    return { success: true, message: "OTP sent successfully" };
  } catch (error: any) {
    console.log(`Failed to send OTP: ${error.message}`);
    return { success: false, message: "Failed to send OTP" };
  }
};

/**
 * Unified login function that routes to appropriate auth method
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  // Super admin login (email + password + 2FA)
  if (data.email && data.password && data.otp) {
    return superAdminLogin(data.email, data.password, data.otp);
  }

  // Turf admin login (email + password)
  if (data.email && data.password) {
    return emailPasswordLogin(data.email, data.password);
  }

  // Player/Scorer login (phone + OTP)
  if (data.phone && data.otp) {
    return phoneOTPLogin(data.phone, data.otp);
  }

  return { success: false, message: "Invalid login credentials" };
};
