import { db } from "../../db/client";
import { turfs, users, subscriptions, plans } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AuthRequest } from "../../middleware/auth.middleware";

export interface TurfVerificationRequest {
  turfId: string;
  action: "APPROVE" | "REJECT" | "REQUEST_INFO";
  rejectionReason?: string;
  infoRequest?: string;
}

export interface TurfVerificationResponse {
  success: boolean;
  message: string;
  turf?: any;
}

/**
 * Get pending turf verifications for super admin
 */
export const getPendingVerifications = async () => {
  try {
    const pendingTurfs = await db
      .select({
        id: turfs.id,
        name: turfs.name,
        email: turfs.email,
        phone: turfs.phone,
        gstNumber: turfs.gstNumber,
        addressLine1: turfs.addressLine1,
        city: turfs.city,
        state: turfs.state,
        pincode: turfs.pincode,
        logoUrl: turfs.logoUrl,
        createdAt: turfs.createdAt,
      })
      .from(turfs)
      .where(eq(turfs.verificationStatus, "PENDING"))
      .orderBy(desc(turfs.createdAt));

    return {
      success: true,
      turfs: pendingTurfs,
      count: pendingTurfs.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to fetch pending verifications: ${error.message}`,
      turfs: [],
      count: 0,
    };
  }
};

/**
 * Get all turfs with verification status for super admin
 */
export const getAllTurfsForVerification = async (page: number = 1, limit: number = 20, status?: string) => {
  try {
    let query = db
      .select({
        id: turfs.id,
        name: turfs.name,
        email: turfs.email,
        phone: turfs.phone,
        gstNumber: turfs.gstNumber,
        city: turfs.city,
        state: turfs.state,
        verificationStatus: turfs.verificationStatus,
        verifiedAt: turfs.verifiedAt,
        subscriptionStatus: turfs.subscriptionStatus,
        createdAt: turfs.createdAt,
        updatedAt: turfs.updatedAt,
      })
      .from(turfs);

    if (status && status !== "ALL") {
      query = query.where(eq(turfs.verificationStatus, status));
    }

    const offset = (page - 1) * limit;
    const turfsList = await query
      .orderBy(desc(turfs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(turfs)
      .limit(1);

    return {
      success: true,
      turfs: turfsList,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to fetch turfs: ${error.message}`,
      turfs: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }
};

/**
 * Process turf verification (approve/reject/request info)
 */
export const processTurfVerification = async (
  superAdminId: string,
  data: TurfVerificationRequest
): Promise<TurfVerificationResponse> => {
  try {
    // Get turf details
    const turf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.id, data.turfId))
      .limit(1);

    if (!turf.length) {
      return { success: false, message: "Turf not found" };
    }

    const currentTurf = turf[0];

    // Check if turf is in pending status
    if (currentTurf.verificationStatus !== "PENDING" && data.action !== "REJECT") {
      return { success: false, message: "Turf is not in pending status" };
    }

    let updateData: any = {
      updatedAt: new Date(),
    };

    switch (data.action) {
      case "APPROVE":
        updateData.verificationStatus = "VERIFIED";
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = superAdminId;
        
        // Activate trial subscription if not already active
        if (currentTurf.subscriptionStatus === "TRIAL") {
          updateData.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
        }
        break;

      case "REJECT":
        updateData.verificationStatus = "REJECTED";
        if (!data.rejectionReason) {
          return { success: false, message: "Rejection reason is required" };
        }
        // Store rejection reason in a notes field or separate table (for now, we'll skip storing it)
        break;

      case "REQUEST_INFO":
        if (!data.infoRequest) {
          return { success: false, message: "Information request details are required" };
        }
        // Keep status as PENDING but mark that info was requested
        // In production, you'd store this in a separate verification_notes table
        break;

      default:
        return { success: false, message: "Invalid action" };
    }

    // Update turf
    await db
      .update(turfs)
      .set(updateData)
      .where(eq(turfs.id, data.turfId));

    // Get updated turf
    const updatedTurf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.id, data.turfId))
      .limit(1);

    return {
      success: true,
      message: `Turf ${data.action.toLowerCase()}d successfully`,
      turf: updatedTurf[0],
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to process verification: ${error.message}`,
    };
  }
};

/**
 * Get turf verification details
 */
export const getTurfVerificationDetails = async (turfId: string) => {
  try {
    const turf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.id, turfId))
      .limit(1);

    if (!turf.length) {
      return { success: false, message: "Turf not found" };
    }

    return {
      success: true,
      turf: turf[0],
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to fetch turf details: ${error.message}`,
    };
  }
};

/**
 * Suspend or reactivate turf
 */
export const updateTurfStatus = async (
  superAdminId: string,
  turfId: string,
  action: "SUSPEND" | "REACTIVATE"
) => {
  try {
    const turf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.id, turfId))
      .limit(1);

    if (!turf.length) {
      return { success: false, message: "Turf not found" };
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (action === "SUSPEND") {
      updateData.verificationStatus = "SUSPENDED";
      // Also suspend subscription
      updateData.subscriptionStatus = "EXPIRED";
    } else {
      updateData.verificationStatus = "VERIFIED";
      // Reactivate subscription if it was expired due to suspension
      if (turf[0].subscriptionStatus === "EXPIRED") {
        updateData.subscriptionStatus = "ACTIVE";
      }
    }

    await db
      .update(turfs)
      .set(updateData)
      .where(eq(turfs.id, turfId));

    return {
      success: true,
      message: `Turf ${action.toLowerCase()}d successfully`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to update turf status: ${error.message}`,
    };
  }
};

// Import sql for count
import { sql } from "drizzle-orm";
