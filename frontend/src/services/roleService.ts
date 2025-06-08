import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

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
 * Get the current user's role from custom claims
 * @returns Promise resolving to the user's role, or undefined if no role is set
 */
export async function getUserRole(): Promise<UserRole> {
  const user = auth.currentUser;
  if (!user) {
    return 'reporter';
  }

  try {
    // Force token refresh to ensure we have the latest claims
    await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult();
    // console.log(JSON.stringify(idTokenResult))
    return (idTokenResult.claims.role as UserRole) || 'reporter';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'reporter';
  }
}

/**
 * Check if the current user has a specific role
 * @param role The role to check for
 * @returns Promise resolving to true if the user has the role, false otherwise
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === role;
}

/**
 * Check if the current user is an admin
 * @returns Promise resolving to true if the user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if the current user is a rescuer
 * @returns Promise resolving to true if the user is a rescuer, false otherwise
 */
export async function isRescuer(): Promise<boolean> {
  return hasRole('rescuer');
}

/**
 * Check if the current user is a reporter
 * @returns Promise resolving to true if the user is a reporter, false otherwise
 */
export async function isReporter(): Promise<boolean> {
  return hasRole('reporter');
}

/**
 * Get all custom claims for the current user
 * @returns Promise resolving to the user's custom claims
 */
export async function getCustomClaims(): Promise<UserClaims> {
  const user = auth.currentUser;
  if (!user) {
    return {};
  }

  try {
    await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims as UserClaims;
  } catch (error) {
    console.error('Error fetching custom claims:', error);
    return {};
  }
} 