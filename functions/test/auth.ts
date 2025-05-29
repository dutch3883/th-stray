/**
 * Shared authentication utilities for tests
 */

/**
 * Response type for Firebase Auth operations
 */
export interface AuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

/**
 * User role type
 */
export type UserRole = 'admin' | 'reporter' | 'rescuer';

/**
 * Create a new test user in Firebase Auth emulator
 * @param email User email
 * @param password User password
 * @returns Authentication response with tokens
 */
export async function createTestUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${await response.text()}`);
  }

  return await response.json() as AuthResponse;
}

/**
 * Get authentication token for an existing user
 * @param email User email
 * @param password User password
 * @returns Authentication response with tokens
 */
export async function getAuthToken(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get auth token: ${await response.text()}`);
  }

  return await response.json() as AuthResponse;
}

/**
 * Set a user's role in Firebase Auth emulator
 * @param localId User's local ID
 * @param role Role to set ('admin' or 'user')
 * @param idToken Admin's ID token for authorization
 * @returns Promise that resolves when role is set
 */
export async function setUserRole(localId: string, role: UserRole): Promise<void> {
  const response = await fetch(
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/th-stray/accounts:update?key=fakeapikey',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer owner`
      },
      body: JSON.stringify({
        localId: localId,
        customAttributes: JSON.stringify({ "role": role})
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to set user role: ${await response.text()}`);
  }
}

/**
 * Delete all users from Firebase Auth emulator
 * @returns Promise that resolves when all users are deleted
 */
export async function deleteAllUsers(): Promise<void> {
  const response = await fetch(
    'http://localhost:9099/emulator/v1/projects/th-stray/accounts',
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete all users: ${await response.text()}`);
  }
} 