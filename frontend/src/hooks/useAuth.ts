import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserRole } from '../types/auth';

// Extend Firebase User with our custom properties
interface User extends FirebaseUser {
  role: UserRole;
}

// Define the user data we want to cache
type CachedUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [cachedProfileUrl, setCachedProfileUrl] = useState<string | null>(null);

  // Load and validate cached user on mount
  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const cachedUserJson = localStorage.getItem('cachedUser');
        
        if (cachedUserJson) {
          // First try to load from cache
          const cachedUser = JSON.parse(cachedUserJson) as CachedUser;
          
          // Set up auth state listener to validate with Firebase
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
              // Add role to the user object
              const userWithRole = {
                ...firebaseUser,
                role: cachedUser.role || UserRole.USER
              } as User;
              setUser(userWithRole);
              // Update cache with latest data
              cacheUserData(userWithRole);
            } else if (cachedUser) {
              // Try silent reauthentication or clear cache if that fails
              localStorage.removeItem('cachedUser');
            }
            setLoading(false);
          });
          
          return () => unsubscribe();
        } else {
          // No cached user, just listen for auth state changes
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
              // Add default role for new users
              const userWithRole = {
                ...firebaseUser,
                role: UserRole.USER
              } as User;
              setUser(userWithRole);
              cacheUserData(userWithRole);
            }
            setLoading(false);
          });
          
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error loading cached user:', error);
        localStorage.removeItem('cachedUser');
        setLoading(false);
      }
    };
    
    loadCachedUser();
  }, []);

  // Handle profile picture caching
  useEffect(() => {
    if (user?.photoURL) {
      // First check if we have it cached in localStorage
      const cachedUrl = localStorage.getItem(`profilePic_${user.uid}`);
      if (cachedUrl) {
        setCachedProfileUrl(cachedUrl);
        return;
      }
      
      // If not cached, we'll try to pre-load and cache it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      
      img.onload = () => {
        try {
          // Create a canvas to cache the image data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          
          // Store as data URL in localStorage
          const dataUrl = canvas.toDataURL('image/png');
          localStorage.setItem(`profilePic_${user.uid}`, dataUrl);
          setCachedProfileUrl(dataUrl);
        } catch (e) {
          console.warn('Failed to cache profile image:', e);
          setCachedProfileUrl(user.photoURL);
        }
      };
      
      img.onerror = () => {
        console.warn('Failed to load profile image');
        setImageError(true);
      };
      
      img.src = user.photoURL;
    }
  }, [user?.photoURL, user?.uid]);

  // Helper function to cache user data
  const cacheUserData = (user: User) => {
    if (user) {
      const userToCache: CachedUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role
      };
      localStorage.setItem('cachedUser', JSON.stringify(userToCache));
    }
  };

  // Sign in function
  const signIn = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Add default role for new users
      const userWithRole = {
        ...result.user,
        role: UserRole.USER
      } as User;
      setUser(userWithRole);
      cacheUserData(userWithRole);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  // Sign out function
  const logOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('cachedUser');
      // We keep profile image cache for performance reasons
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    loading,
    signIn,
    logOut,
    cachedProfileUrl,
    imageError,
    setImageError
  };
} 