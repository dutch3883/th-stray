export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
} 