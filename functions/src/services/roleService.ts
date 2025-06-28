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

export async function getUserRole(uid: string): Promise<UserRole> {
  try {
    const user = await admin.auth().getUser(uid);
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
        const role = userRecord.customClaims?.role as UserRole || "reporter";
        
        userDetails.push({
          uid: userRecord.uid,
          email: userRecord.email || "",
          displayName: userRecord.displayName || userRecord.email?.split('@')[0] || "Unknown User",
          photoURL: userRecord.photoURL || undefined,
          role: role,
          emailVerified: userRecord.emailVerified,
          createdAt: new Date(userRecord.metadata.creationTime || Date.now()),
          lastSignInTime: new Date(userRecord.metadata.lastSignInTime || Date.now()),
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
    const role = userRecord.customClaims?.role as UserRole || "reporter";
    
    return {
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || "Unknown User",
      photoURL: userRecord.photoURL || undefined,
      role: role,
      emailVerified: userRecord.emailVerified,
      createdAt: new Date(userRecord.metadata.creationTime || Date.now()),
      lastSignInTime: new Date(userRecord.metadata.lastSignInTime || Date.now()),
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}
