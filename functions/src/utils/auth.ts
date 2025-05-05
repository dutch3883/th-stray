import * as functions from "firebase-functions/v2";

export function checkAuth(
  ctx: functions.https.CallableRequest,
  requireAdmin = false,
) {
  if (!ctx.auth)
    throw new functions.https.HttpsError("unauthenticated", "Auth required");
  if (requireAdmin && !ctx.auth.token.admin)
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  return ctx.auth.uid;
}
