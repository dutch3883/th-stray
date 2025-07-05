import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { logger, logDebug, logError, logInfo } from './LoggingService';
import { api } from './apiService';

const auth = getAuth(app);
const fns = getFunctions(app);

// Role types
export type UserRole = 'reporter' | 'rescuer' | 'admin';

// Interface for user claims
export interface UserClaims {
  role?: UserRole;
  [key: string]: any;
}

// Interface for the response from the getCustomClaims function
interface GetCustomClaimsResponse {
  claims: UserClaims;
}

/**
 * Get the current user's role from Cloud Function (with user_setting override)
 * @returns Promise resolving to the user's role, or 'reporter' as default
 */
export async function getUserRole(): Promise<UserRole> {
  const user = auth.currentUser;
  if (!user) {
    logDebug('getUserRole: No current user, returning default role', { defaultRole: 'reporter' });
    return 'reporter';
  }

  logDebug('getUserRole: Starting role fetch from Cloud Function', { 
    userId: user.uid, 
    email: user.email,
    emailVerified: user.emailVerified 
  });

  try {
    // Call Cloud Function to get role with user_setting override
    const role = await api.getUserRole();
    logInfo('getUserRole: Role received from Cloud Function', { userId: user.uid, role });
    return role as UserRole;
  } catch (error) {
    logError('getUserRole: Error fetching user role from Cloud Function', { userId: user.uid, error });
    return 'reporter';
  }
}

/**
 * Check if the current user has a specific role
 * @param role The role to check for
 * @returns Promise resolving to true if the user has the role, false otherwise
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  logDebug('hasRole: Checking role', { requestedRole: role });
  const userRole = await getUserRole();
  const hasRoleResult = userRole === role;
  logDebug('hasRole: Role check result', { 
    requestedRole: role, 
    userRole, 
    hasRole: hasRoleResult 
  });
  return hasRoleResult;
}

/**
 * Check if the current user is an admin
 * @returns Promise resolving to true if the user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  logDebug('isAdmin: Checking admin status');
  const result = await hasRole('admin');
  logDebug('isAdmin: Admin check result', { isAdmin: result });
  return result;
}

/**
 * Check if the current user is a rescuer
 * @returns Promise resolving to true if the user is a rescuer, false otherwise
 */
export async function isRescuer(): Promise<boolean> {
  logDebug('isRescuer: Checking rescuer status');
  const result = await hasRole('rescuer');
  logDebug('isRescuer: Rescuer check result', { isRescuer: result });
  return result;
}

/**
 * Check if the current user is a reporter
 * @returns Promise resolving to true if the user is a reporter, false otherwise
 */
export async function isReporter(): Promise<boolean> {
  logDebug('isReporter: Checking reporter status');
  const result = await hasRole('reporter');
  logDebug('isReporter: Reporter check result', { isReporter: result });
  return result;
}

/**
 * Get all custom claims for the current user
 * @returns Promise resolving to the user's custom claims
 */
export async function getCustomClaims(): Promise<UserClaims> {
  const user = auth.currentUser;
  if (!user) {
    logDebug('getCustomClaims: No current user, returning empty claims');
    return {};
  }

  logDebug('getCustomClaims: Fetching claims for user', { userId: user.uid });

  try {
    await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult();
    
    logDebug('getCustomClaims: Token result received', {
      userId: user.uid,
      allClaims: idTokenResult.claims,
      tokenExpirationTime: idTokenResult.expirationTime
    });

    const claims = idTokenResult.claims as UserClaims;
    logInfo('getCustomClaims: Claims retrieved', { userId: user.uid, claims });
    return claims;
  } catch (error) {
    logError('getCustomClaims: Error fetching custom claims', { userId: user.uid, error });
    return {};
  }
} 