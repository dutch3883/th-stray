import * as admin from "firebase-admin";

export type UserRole = "reporter" | "rescuer" | "admin";

export interface UserDetails {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  lastSignInTime: Date;
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
  try {
    const userDetails: UserDetails[] = [];

    // Get all users and filter by the provided IDs
    const listUsersResult = await admin.auth().listUsers();

    // Create a set for faster lookup
    const userIdSet = new Set(userIds);

    // Filter users by the provided IDs
    for (const userRecord of listUsersResult.users) {
      if (userIdSet.has(userRecord.uid)) {
        const role = await getUserRole(userRecord.uid);

        userDetails.push({
          uid: userRecord.uid,
          email: userRecord.email || "",
          displayName:
            userRecord.displayName ||
            userRecord.email?.split("@")[0] ||
            "Unknown User",
          photoURL: userRecord.photoURL || undefined,
          role: role,
          emailVerified: userRecord.emailVerified,
          createdAt: new Date(userRecord.metadata.creationTime || Date.now()),
          lastSignInTime: new Date(
            userRecord.metadata.lastSignInTime || Date.now(),
          ),
        });
      }
    }

    return userDetails;
  } catch (error) {
    console.error("Error getting users by IDs:", error);
    throw error;
  }
}

export async function getUserById(uid: string): Promise<UserDetails | null> {
  try {
    const userRecord = await admin.auth().getUser(uid);
    const role = await getUserRole(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName:
        userRecord.displayName ||
        userRecord.email?.split("@")[0] ||
        "Unknown User",
      photoURL: userRecord.photoURL || undefined,
      role: role,
      emailVerified: userRecord.emailVerified,
      createdAt: new Date(userRecord.metadata.creationTime || Date.now()),
      lastSignInTime: new Date(
        userRecord.metadata.lastSignInTime || Date.now(),
      ),
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}
