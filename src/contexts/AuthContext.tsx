
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  sendEmailVerification as firebaseSendEmailVerification,
  reload
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';
import { processPendingSubmissionUtil } from '../hooks/useAuthRequiredSubmit';
import { exchangeToken } from '../services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaEnrollmentRequired: boolean;
  emailVerificationRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, notificationPreference: 'email' | 'sms', phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  saveFormDraft: (formType: string, data: any) => void;
  getFormDraft: (formType: string) => any;
  clearFormDraft: (formType: string) => void;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  enrollMFA: (phoneNumber: string) => Promise<void>;
  verifyMFAEnrollment: (verificationCode: string) => Promise<void>;
  verifyMFA: (verificationCode: string) => Promise<void>;
  resendMFACode: () => Promise<void>;
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
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

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
            if (firebaseUser.email === 'neowalker502@gmail.com' && userRole !== 'super-admin') {
              userRole = 'super-admin';
              // Update in Firestore
              await setDoc(doc(db, 'userroles', firebaseUser.uid), {
                ...userData,
                role: 'super-admin',
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
      setLoading(true);
      
      // Use Firebase client auth for login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Exchange token with backend to check MFA requirements
      const response = await exchangeToken(idToken);
      
      if (!response.success) {
        if (response.requireMFA) {
          setMfaRequired(true);
          setFirebaseUser(userCredential.user);
          toast.info('Multi-factor authentication required');
          return;
        }
        
        if (response.requireMFAEnrollment) {
          // Check if email is verified before MFA enrollment
          if (!userCredential.user.emailVerified) {
            setEmailVerificationRequired(true);
            setFirebaseUser(userCredential.user);
            toast.info('Please verify your email before enrolling in MFA');
            return;
          }
          
          setMfaEnrollmentRequired(true);
          setFirebaseUser(userCredential.user);
          toast.info('Please enroll in multi-factor authentication');
          return;
        }
        
        throw new Error(response.error || 'Authentication failed');
      }
      
      // Successful login without MFA required
      setMfaRequired(false);
      setMfaEnrollmentRequired(false);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      setMfaRequired(false);
      setMfaEnrollmentRequired(false);
      
      // Handle MFA resolver if needed
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaRequired(true);
        setMfaResolver(error.resolver);
        toast.info('Multi-factor authentication required');
        return;
      }
      
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
    } finally {
      setLoading(false);
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

  const sendVerificationEmail = async () => {
    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      await firebaseSendEmailVerification(firebaseUser);
      toast.success('Verification email sent! Please check your inbox and click the verification link.');
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw new Error('Failed to send verification email: ' + error.message);
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Reload user to get latest email verification status
      await reload(firebaseUser);
      
      if (firebaseUser.emailVerified) {
        setEmailVerificationRequired(false);
        // Now proceed with MFA enrollment
        setMfaEnrollmentRequired(true);
        toast.success('Email verified! Please complete MFA enrollment.');
        return true;
      } else {
        toast.error('Email not yet verified. Please check your email and click the verification link.');
        return false;
      }
      
    } catch (error: any) {
      console.error('Email verification check error:', error);
      throw new Error('Failed to check email verification: ' + error.message);
    }
  };

  const enrollMFA = async (phoneNumber: string) => {
    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      const session = await multiFactor(firebaseUser).getSession();
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: session
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const enrollVerificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        (window as any).recaptchaVerifier
      );
      
      setVerificationId(enrollVerificationId);
      
      // Store phone number in Firestore userroles collection
      await updateDoc(doc(db, 'userroles', firebaseUser.uid), {
        phone: phoneNumber,
        dateModified: new Date()
      });
      
      toast.success('Verification code sent to your phone');
      
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      throw new Error('Failed to enroll in MFA: ' + error.message);
    }
  };

  const verifyMFAEnrollment = async (verificationCode: string) => {
    try {
      if (!firebaseUser || !verificationId) {
        throw new Error('Invalid MFA enrollment state');
      }

      const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
      
      await multiFactor(firebaseUser).enroll(multiFactorAssertion, 'Phone Number');
      
      setMfaEnrollmentRequired(false);
      setVerificationId(null);
      toast.success('MFA enrollment successful');
      
      // Re-attempt sign in now that MFA is enrolled
      const idToken = await firebaseUser.getIdToken(true); // Force refresh
      const response = await exchangeToken(idToken);
      
      if (response.success) {
        // Authentication complete
        setMfaRequired(false);
      } else if (response.requireMFA) {
        setMfaRequired(true);
      }
      
    } catch (error: any) {
      console.error('MFA enrollment verification error:', error);
      throw new Error('Failed to verify MFA enrollment: ' + error.message);
    }
  };

  const verifyMFA = async (verificationCode: string) => {
    try {
      if (!firebaseUser || !mfaResolver) {
        throw new Error('Invalid MFA state');
      }

      // Use the resolver to complete MFA verification
      const phoneAuthCredential = PhoneAuthProvider.credential(verificationId!, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
      
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      const idToken = await userCredential.user.getIdToken();
      
      // Verify with backend
      const response = await fetch('https://nem-server-rhdb.onrender.com/api/auth/verify-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          idToken,
          mfaAssertion: 'verified' // Backend will log this as successful
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'MFA verification failed');
      }

      setMfaRequired(false);
      setMfaResolver(null);
      setVerificationId(null);
      toast.success('MFA verification successful');
      
    } catch (error: any) {
      console.error('MFA verification error:', error);
      throw new Error('Failed to verify MFA: ' + error.message);
    }
  };

  const resendMFACode = async () => {
    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      
      // Re-trigger MFA enrollment or verification process
      if (mfaEnrollmentRequired) {
        // For enrollment, we need the phone number again
        throw new Error('Please re-enter your phone number to resend code');
      } else {
        // For MFA verification, retrigger the resolver
        throw new Error('Please try signing in again to resend MFA code');
      }
      
    } catch (error: any) {
      console.error('Resend MFA code error:', error);
      throw new Error('Failed to resend MFA code: ' + error.message);
    }
  };

  const logout = async () => {
    // Clear user state immediately to prevent role leakage
    setUser(null);
    setFirebaseUser(null);
    setMfaRequired(false);
    setMfaEnrollmentRequired(false);
    setEmailVerificationRequired(false);
    setPendingCredential(null);
    setMfaResolver(null);
    setVerificationId(null);
    
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();
    
    await signOut(auth);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'compliance' || user?.role === 'super-admin' || user?.role === 'claims';
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
    mfaRequired,
    mfaEnrollmentRequired,
    emailVerificationRequired,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    hasRole,
    isAdmin,
    saveFormDraft,
    getFormDraft,
    clearFormDraft,
    sendVerificationEmail,
    checkEmailVerification,
    enrollMFA,
    verifyMFAEnrollment,
    verifyMFA,
    resendMFACode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
