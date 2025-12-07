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
  reload,
  RecaptchaVerifier,
  signInWithCustomToken
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';
import { normalizeRole, isAdminRole, rolesMatch } from '../utils/roleNormalization';
import { exchangeToken } from '../services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaEnrollmentRequired: boolean;
  emailVerificationRequired: boolean;
  mfaResolver: any;
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
  initiateMFAVerification: () => Promise<void>;
  setVerificationId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider. Current context:', context);
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
            let userRole = normalizeRole(userData.role || 'default');
            if (firebaseUser.email === 'neowalker502@gmail.com' && !rolesMatch(userRole, 'super admin')) {
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
      setLoading(true);
      
      // Use Firebase client auth for login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Check MFA enrollment status from Firebase client
      const mfaUser = multiFactor(userCredential.user);
      const enrolledFactors = mfaUser.enrolledFactors;
      console.log('🔍 FRONTEND: Checking MFA status from Firebase');
      console.log('📱 Enrolled MFA Factors:', enrolledFactors.length);
      console.log('📋 Factor details:', enrolledFactors);
      
      // Exchange token with backend to check MFA and email verification requirements
      const response = await exchangeToken(idToken);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 FRONTEND: Token Exchange Response');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Success:', response.success);
      console.log('📧 Email Verification Required:', response.requireEmailVerification || false);
      console.log('🔐 MFA Required:', response.requireMFA || false);
      console.log('📱 MFA Enrollment Required:', response.requireMFAEnrollment || false);
      console.log('👔 Role from backend:', response.role);
      console.log('📊 Login Count:', response.loginCount);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (!response.success) {
        // Check if email verification is required
        if (response.requireEmailVerification) {
          console.log('🚫 LOGIN BLOCKED: Email verification required for:', email);
          console.log('💡 Showing email verification modal to user');
          setEmailVerificationRequired(true);
          setFirebaseUser(userCredential.user);
          toast.info('Please verify your email address to continue');
          return;
        }
        
        // Check if MFA enrollment is required (backend enforces this)
        if (response.requireMFAEnrollment) {
          console.log('📱 MFA enrollment required by backend');
          setMfaEnrollmentRequired(true);
          setFirebaseUser(userCredential.user);
          toast.info(response.message || 'Please enroll in multi-factor authentication to continue');
          return;
        }
        
        // Check if MFA verification is required
        if (response.requireMFA) {
          console.log('🔐 MFA verification required by backend');
          setMfaRequired(true);
          setFirebaseUser(userCredential.user);
          toast.info('Multi-factor authentication required');
          return;
        }
        
        throw new Error(response.error || 'Authentication failed');
      }
      
      console.log('✅ AUTHENTICATION SUCCESSFUL - User can access application');
      
      // Check if this is an admin role that needs MFA check
      // COMMENTED OUT: MFA every 3rd login logic
      /*
      const adminRoles = ['admin', 'super admin', 'compliance', 'claims'];
      const isAdminRole = adminRoles.includes(response.role || '');
      
      if (isAdminRole) {
        // For admin roles, only enforce MFA/email verification on every 3rd login
        const isThirdLogin = response.loginCount && response.loginCount % 3 === 0;
        console.log('🔒 Admin role detected:', response.role, 'Login count:', response.loginCount, 'Is 3rd login:', isThirdLogin);
        
        if (isThirdLogin) {
          // Check if user has MFA enrolled
          const multiFactorUser = multiFactor(userCredential.user);
          const hasEnrolledFactors = multiFactorUser.enrolledFactors.length > 0;
          
          if (!hasEnrolledFactors) {
            // No MFA enrolled, need to enroll first
            if (!userCredential.user.emailVerified) {
              console.log('📧 Email verification required for MFA enrollment');
              setEmailVerificationRequired(true);
              setFirebaseUser(userCredential.user);
              toast.info('Email verification required for MFA enrollment (3rd login security check)');
              return;
            }
            
            console.log('📱 MFA enrollment required');
            setMfaEnrollmentRequired(true);
            setFirebaseUser(userCredential.user);
            toast.info('Please enroll in multi-factor authentication (3rd login security check)');
            return;
          } else {
            // MFA enrolled, require verification
            console.log('🔐 MFA verification required');
            setMfaRequired(true);
            setFirebaseUser(userCredential.user);
            toast.info('Multi-factor authentication required (3rd login security check)');
            return;
          }
        } else {
          // Not 3rd login, proceed normally
          const nextMfaLogin = Math.ceil(response.loginCount / 3) * 3;
          console.log('✅ Admin login successful - next MFA required at login:', nextMfaLogin);
          toast.success(`Login successful - MFA will be required on login #${nextMfaLogin}`);
        }
      }
      */
      
      // Successful login without MFA required
      setMfaRequired(false);
      setMfaEnrollmentRequired(false);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      console.log('🔍 Full error object:', error);
      console.log('🔍 Error code:', error.code);
      console.log('🔍 Error customData:', error.customData);
      console.log('🔍 Error customData._serverResponse:', error.customData?._serverResponse);
      console.log('🔍 Error._tokenResponse:', error._tokenResponse);
      
      // Handle MFA resolver if needed (do this FIRST before resetting state)
      if (error.code === 'auth/multi-factor-auth-required') {
        console.log('🔐 MFA required - extracting MFA data from server response');
        
        const serverResponse = error.customData?._serverResponse;
        if (serverResponse?.mfaInfo && serverResponse?.mfaPendingCredential) {
          console.log('✅ MFA data found in server response');
          console.log('📱 MFA Info:', serverResponse.mfaInfo);
          console.log('🔑 Pending Credential:', serverResponse.mfaPendingCredential);
          
          // Store the MFA data we need for verification
          const mfaData = {
            mfaInfo: serverResponse.mfaInfo,
            mfaPendingCredential: serverResponse.mfaPendingCredential,
            phoneInfo: serverResponse.mfaInfo[0]?.phoneInfo,
            mfaEnrollmentId: serverResponse.mfaInfo[0]?.mfaEnrollmentId
          };
          
          setMfaRequired(true);
          setMfaResolver(mfaData); // Store our custom MFA data object
          toast.info('Multi-factor authentication required');
          return;
        } else {
          console.error('❌ MFA required but no MFA data in server response');
          throw new Error('MFA verification failed - please contact support');
        }
      }
      
      // Reset all MFA/verification flags on other errors
      setMfaRequired(false);
      setMfaEnrollmentRequired(false);
      setEmailVerificationRequired(false);
      setFirebaseUser(null);
      
      // Re-throw the error with proper structure so SignIn component can handle it
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

      // Automatically send email verification
      try {
        await firebaseSendEmailVerification(user);
        toast.success('Account created! Please check your email to verify your account before logging in.');
      } catch (verificationError) {
        console.error('Failed to send verification email:', verificationError);
        toast.warning('Account created, but verification email failed to send. Please request a new one when logging in.');
      }
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

  const initiateMFAVerification = async () => {
    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Get stored phone number from userroles collection
      const userDoc = await getDoc(doc(db, 'userroles', firebaseUser.uid));
      if (!userDoc.exists() || !userDoc.data().phone) {
        throw new Error('No phone number found for MFA. Please re-enroll in MFA.');
      }

      const phoneNumber = userDoc.data().phone;
      
      // Initialize reCAPTCHA if not already done
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA solved');
            }
          });
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
      toast.success('Verification code sent to your phone');
      
    } catch (error: any) {
      console.error('MFA initiation error:', error);
      throw new Error('Failed to initiate MFA: ' + error.message);
    }
  };

  const verifyMFA = async (verificationCode: string) => {
    try {
      if (mfaResolver && mfaResolver.mfaPendingCredential) {
        // Using our custom MFA data with REST API
        console.log('🔐 Verifying MFA code with REST API');
        
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        const response = await fetch(`https://identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mfaPendingCredential: mfaResolver.mfaPendingCredential,
            phoneVerificationInfo: {
              sessionInfo: verificationId,
              code: verificationCode
            }
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Invalid verification code');
        }
        
        console.log('✅ MFA verification successful');
        
        // Sign in with the ID token we got back
        const idToken = data.idToken;
        const credential = await signInWithCustomToken(auth, idToken);
        
        setMfaRequired(false);
        setMfaResolver(null);
        setVerificationId(null);
        setFirebaseUser(credential.user);
        toast.success('MFA verification successful');
        
      } else if (firebaseUser) {
        // Direct verification for users already signed in but need MFA
        if (!verificationId) {
          await initiateMFAVerification();
          throw new Error('Verification code sent. Please enter the code.');
        }
        
        phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
        multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
        
        // Complete MFA verification
        await multiFactor(firebaseUser).enroll(multiFactorAssertion, 'Phone Number');
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
    return rolesMatch(user?.role, role);
  };

  const isAdmin = (): boolean => {
    return isAdminRole(user?.role);
  };

  // Secure storage functions for form drafts
  const saveFormDraft = (formType: string, data: any) => {
    try {
      // Use dynamic import for secure storage
      import('../utils/secureStorage').then(({ secureStorageSet }) => {
        const key = `formDraft_${formType}`;
        secureStorageSet(key, data);
      });
    } catch (error) {
      console.error('Error saving form draft:', error);
    }
  };

  const getFormDraft = (formType: string) => {
    try {
      // For now, use localStorage directly with basic encryption
      const key = `formDraft_${formType}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          // Simple decryption (base64)
          const decoded = atob(stored.split(':')[1] || stored);
          const parsed = JSON.parse(decoded);
          // Check expiry
          if (parsed.expiry && Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
          }
          return parsed.data;
        } catch {
          return null;
        }
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
    mfaResolver,
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
    resendMFACode,
    initiateMFAVerification,
    setVerificationId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
