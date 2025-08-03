import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export type UserRole = "reporter" | "rescuer" | "admin";

export interface UserDetails {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export interface UserSettings {
  role?: UserRole;
}

export async function getUserRole(uid: string): Promise<UserRole> {
  try {
    // Get user to access email
    const user = await admin.auth().getUser(uid);
    const email = user.email;

    if (email) {
      // First, try to get role from user_setting collection using email as key
      const db = admin.firestore();
      const userSettingsDoc = await db
        .collection("user_setting")
        .doc(email)
        .get();

      if (userSettingsDoc.exists) {
        const data = userSettingsDoc.data();
        if (data?.role) {
          return data.role as UserRole;
        }
      }
    }

    // Fallback to Firebase Auth custom claims
    const role = user.customClaims?.role as UserRole;
    return role || "reporter";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "reporter";
  }
}

export async function getUsersByIds(userIds: string[]): Promise<UserDetails[]> {
  const startTime = Date.now();
  logger.info("getUsersByIds started", {
    requestedUserCount: userIds.length,
  });

  try {
    // Step 1: Get all users from Firebase Auth
    const listUsersStartTime = Date.now();
    const listUsersResult = await admin.auth().listUsers();
    const listUsersEndTime = Date.now();
    logger.info("getUsersByIds - listUsers completed", {
      duration: listUsersEndTime - listUsersStartTime + "ms",
      totalUsersFromAuth: listUsersResult.users.length,
    });

    // Step 2: Filter users by requested IDs
    const filteringStartTime = Date.now();
    const userIdSet = new Set(userIds);
    const matchedUsers = listUsersResult.users.filter((user) =>
      userIdSet.has(user.uid),
    );
    const filteringEndTime = Date.now();
    logger.info("getUsersByIds - user filtering completed", {
      duration: filteringEndTime - filteringStartTime + "ms",
      matchedUsers: matchedUsers.length,
    });

    // Step 3: Build user details (minimal fields only)
    const buildingStartTime = Date.now();
    const userDetails: UserDetails[] = matchedUsers.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email || undefined,
      displayName:
        userRecord.displayName || userRecord.email?.split("@")[0] || undefined,
      photoURL: userRecord.photoURL || undefined,
    }));
    const buildingEndTime = Date.now();
    logger.info("getUsersByIds - user details building completed", {
      duration: buildingEndTime - buildingStartTime + "ms",
      builtUsers: userDetails.length,
    });

    const totalEndTime = Date.now();
    logger.info("getUsersByIds completed successfully (ULTRA-LIGHTWEIGHT)", {
      totalDuration: totalEndTime - startTime + "ms",
      breakdown: {
        listUsers: listUsersEndTime - listUsersStartTime + "ms",
        userFiltering: filteringEndTime - filteringStartTime + "ms",
        userBuilding: buildingEndTime - buildingStartTime + "ms",
      },
      efficiency: {
        requestedUsers: userIds.length,
        foundUsers: userDetails.length,
        totalAuthUsers: listUsersResult.users.length,
        hitRate:
          userIds.length > 0
            ? Math.round((userDetails.length / userIds.length) * 100) + "%"
            : "0%",
      },
      performance: {
        oldTotalTime: "~3300ms",
        newTotalTime: totalEndTime - startTime + "ms",
        improvementFactor:
          Math.round(3300 / (totalEndTime - startTime)) + "x faster",
        optimizations: "no roles + minimal fields",
      },
    });

    return userDetails;
  } catch (error) {
    const errorTime = Date.now();
    logger.error("getUsersByIds failed", {
      error: error,
      totalDurationBeforeError: errorTime - startTime + "ms",
      requestedUserCount: userIds.length,
    });
    console.error("Error getting users by IDs:", error);
    throw error;
  }
}
