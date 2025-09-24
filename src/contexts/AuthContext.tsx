
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';
import { processPendingSubmissionUtil } from '../hooks/useAuthRequiredSubmit';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, notificationPreference: 'email' | 'sms', phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  saveFormDraft: (formType: string, data: any) => void;
  getFormDraft: (formType: string) => any;
  clearFormDraft: (formType: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore userroles collection
          const userDoc = await getDoc(doc(db, 'userroles', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Auto-assign super admin role to neowalker502@gmail.com
            let userRole = userData.role || 'default';
            if (firebaseUser.email === 'neowalker502@gmail.com' && userRole !== 'super admin') {
              userRole = 'super admin';
              // Update in Firestore
              await setDoc(doc(db, 'userroles', firebaseUser.uid), {
                ...userData,
                role: 'super admin',
                dateModified: new Date()
              }, { merge: true });
            }
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userRole,
              notificationPreference: userData.notificationPreference || 'email',
              phone: userData.phone,
              createdAt: userData.dateCreated?.toDate(),
              updatedAt: userData.dateModified?.toDate()
            });
          } else {
            // Create user record in userroles collection if it doesn't exist
            await setDoc(doc(db, 'userroles', firebaseUser.uid), {
              name: firebaseUser.displayName || '',
              email: firebaseUser.email,
              role: 'default',
              dateCreated: new Date(),
              dateModified: new Date()
            });
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || '',
              role: 'default',
              notificationPreference: 'email',
              phone: null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          setFirebaseUser(firebaseUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Use Firebase client auth for login
      await signInWithEmailAndPassword(auth, email, password);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later');
      }
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    notificationPreference: 'email' | 'sms',
    phone?: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore userroles collection
      await setDoc(doc(db, 'userroles', user.uid), {
        name,
        email: user.email,
        role: 'default',
        dateCreated: new Date(),
        dateModified: new Date()
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      throw new Error('Failed to create account. Please try again');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'userroles', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'userroles', user.uid), {
          name: user.displayName || '',
          email: user.email,
          role: 'default',
          dateCreated: new Date(),
          dateModified: new Date()
        });
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Google Sign-In is not properly configured. Please contact support');
      }
      throw new Error('Failed to sign in with Google. Please try again');
    }
  };

  const logout = async () => {
    // Clear user state immediately to prevent role leakage
    setUser(null);
    setFirebaseUser(null);
    
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();
    
    await signOut(auth);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'compliance' || user?.role === 'super admin' || user?.role === 'claims';
  };

  // Local storage functions for form drafts
  const saveFormDraft = (formType: string, data: any) => {
    try {
      const key = `formDraft_${formType}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving form draft:', error);
    }
  };

  const getFormDraft = (formType: string) => {
    try {
      const key = `formDraft_${formType}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting form draft:', error);
      return null;
    }
  };

  const clearFormDraft = (formType: string) => {
    try {
      const key = `formDraft_${formType}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing form draft:', error);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    hasRole,
    isAdmin,
    saveFormDraft,
    getFormDraft,
    clearFormDraft
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
