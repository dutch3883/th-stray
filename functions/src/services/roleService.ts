import * as admin from "firebase-admin";

export type UserRole = "reporter" | "rescuer" | "admin";

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
