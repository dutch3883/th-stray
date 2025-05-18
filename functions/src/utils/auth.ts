import * as functions from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { getUserRole } from "../services/roleService";

export type UserRole = "admin" | "rescuer" | "reporter";

export interface OperationConfig {
  allowedRoles: UserRole[];
  requiresAuth: boolean;
}

export const OPERATION_CONFIG: Record<string, OperationConfig> = {
  createReport: {
    allowedRoles: ["admin", "rescuer", "reporter"],
    requiresAuth: true,
  },
  listMyReports: {
    allowedRoles: ["admin", "rescuer", "reporter"],
    requiresAuth: true,
  },
  listReports: {
    allowedRoles: ["admin", "rescuer"],
    requiresAuth: true,
  },
  updateReport: {
    allowedRoles: ["admin", "rescuer", "reporter"],
    requiresAuth: true,
  },
  putOnHold: { allowedRoles: ["admin", "rescuer"], requiresAuth: true },
  resume: { allowedRoles: ["admin", "rescuer"], requiresAuth: true },
  cancel: {
    allowedRoles: ["admin", "rescuer", "reporter"],
    requiresAuth: true,
  },
  complete: { allowedRoles: ["admin", "rescuer"], requiresAuth: true },
};

export function checkAuth(req: functions.https.CallableRequest): string {
  if (!req.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  return req.auth.uid;
}

export async function checkAuthorization(
  req: functions.https.CallableRequest,
  operation: string,
): Promise<string> {
  const uid = checkAuth(req);
  const config = OPERATION_CONFIG[operation];

  if (!config) {
    throw new HttpsError("internal", `Operation ${operation} not configured`);
  }

  if (config.requiresAuth && !uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  if (config.allowedRoles.length > 0) {
    const userRole = (await getUserRole(uid)) || "reporter";
    if (!config.allowedRoles.includes(userRole as UserRole)) {
      throw new HttpsError(
        "permission-denied",
        `Operation ${operation} requires roles: ${config.allowedRoles.join(", ")}`,
      );
    }
  }

  return uid;
}
