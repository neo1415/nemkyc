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
  // MFA DISABLED - All MFA state variables commented out
  const [mfaRequired, setMfaRequired] = useState(false); // Always false
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false); // Always false
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false); // Always false
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔍 Auth: Checking user data for UID:', firebaseUser.uid, 'Email:', firebaseUser.email);
          
          // Get user data from Firestore userroles collection
          const userDoc = await getDoc(doc(db, 'userroles', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Debug logging for role normalization
            console.log('🔍 Auth: Found user in userroles collection');
            console.log('🔍 Auth: Raw role from Firestore:', userData.role);
            
            // Auto-assign super admin role to neowalker502@gmail.com
            let userRole = normalizeRole(userData.role || 'default');
            console.log('🔍 Auth: Normalized role:', userRole);
            
            if (firebaseUser.email === 'neowalker502@gmail.com' && !rolesMatch(userRole, 'super admin')) {
              userRole = 'super admin';
              // Update in Firestore
              await setDoc(doc(db, 'userroles', firebaseUser.uid), {
                ...userData,
                role: 'super admin',
                dateModified: new Date()
              }, { merge: true });
              console.log('🔍 Auth: Auto-assigned super admin role to neowalker502@gmail.com');
            }
            
            console.log('✅ Auth: Setting user with role:', userRole, 'for email:', firebaseUser.email);
            
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
            console.log('⚠️ Auth: User NOT found in userroles collection, checking users collection...');
            
            // Fallback: Check 'users' collection for role
            const usersDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            let existingRole = 'default';
            let existingName = firebaseUser.displayName || '';
            
            if (usersDoc.exists()) {
              const usersData = usersDoc.data();
              existingRole = usersData.role || 'default';
              existingName = usersData.name || usersData.displayName || existingName;
              console.log('🔍 Auth: Found user in users collection with role:', existingRole);
            } else {
              console.log('⚠️ Auth: User NOT found in users collection either');
            }
            
            // Normalize the role
            const normalizedRole = normalizeRole(existingRole);
            console.log('🔍 Auth: Normalized role:', normalizedRole);
            
            // Create user record in userroles collection with the existing role (or default)
            await setDoc(doc(db, 'userroles', firebaseUser.uid), {
              name: existingName,
              email: firebaseUser.email,
              role: normalizedRole, // Use normalized role
              dateCreated: new Date(),
              dateModified: new Date()
            });
            console.log('✅ Auth: Created userroles document with role:', normalizedRole);
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              name: existingName,
              role: normalizedRole,
              notificationPreference: 'email',
              phone: null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          setFirebaseUser(firebaseUser);
        } catch (error: any) {
          console.error('❌ Auth: Error fetching user data:', error);
          console.error('❌ Auth: Error code:', error?.code);
          console.error('❌ Auth: Error message:', error?.message);
          
          // If it's a permission error, the user might be newly registered
          // and the backend hasn't created their document yet, or there's a rules issue
          if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
            console.log('⚠️ Auth: Permission denied - this might be a timing issue for new users');
            console.log('⚠️ Auth: Retrying in 1 second...');
            
            // Wait a bit and retry once (for new user registration timing)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const retryDoc = await getDoc(doc(db, 'userroles', firebaseUser.uid));
              if (retryDoc.exists()) {
                const userData = retryDoc.data();
                console.log('✅ Auth: Retry successful, found user data');
                const userRole = normalizeRole(userData.role || 'default');
                
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email!,
                  name: userData.name || userData.displayName || '',
                  role: userRole,
                  notificationPreference: userData.notificationPreference || 'email',
                  phone: userData.phone || null,
                  createdAt: userData.dateCreated?.toDate() || new Date(),
                  updatedAt: userData.dateModified?.toDate() || new Date()
                });
                setFirebaseUser(firebaseUser);
                setLoading(false);
                return;
              }
            } catch (retryError) {
              console.error('❌ Auth: Retry also failed:', retryError);
            }
          }
          
          // Even if Firestore read fails, the user IS authenticated in Firebase
          // Set a minimal user object so they're not kicked out
          console.log('⚠️ Auth: Setting minimal user from Firebase Auth data');
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
            role: 'default', // Default role until Firestore is accessible
            notificationPreference: 'email',
            phone: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setFirebaseUser(firebaseUser);
        }
      } else {
        console.log('🔒 Auth: No Firebase user, clearing state');
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
      console.log('🔐 FRONTEND: Token Exchange Response (MFA DISABLED)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Success:', response.success);
      console.log('👔 Role from backend:', response.role);
      console.log('📊 Login Count:', response.loginCount);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      /* MFA CHECKS DISABLED
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
      */
      
      if (!response.success) {
        throw new Error(response.error || 'Authentication failed');
      }
      
      console.log('✅ AUTHENTICATION SUCCESSFUL - User can access application (MFA disabled)');
      
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
      
      // MFA ERROR HANDLING - Catch and provide helpful message
      if (error.code === 'auth/multi-factor-auth-required') {
        console.error('❌ Firebase MFA is still enrolled for this user');
        console.error('❌ MFA must be removed from Firebase Console or via Admin SDK');
        toast.error('Your account has MFA enrolled. Please contact an administrator to remove MFA enrollment before logging in.');
        throw new Error('MFA is enrolled on this account. Please contact support to have it removed.');
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
        console.log('📋 MFA finalize response:', data);
        
        // Firebase returns idToken and refreshToken
        // We need to use the refreshToken to get a proper Firebase auth session
        if (data.refreshToken) {
          // Use the refresh token to sign in
          const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
          const tokenResponse = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grant_type: 'refresh_token',
              refresh_token: data.refreshToken
            })
          });
          
          const tokenData = await tokenResponse.json();
          console.log('🔄 Got new tokens from refresh');
          
          // Now we have a valid ID token, exchange with backend
          const backendResponse = await exchangeToken(tokenData.id_token);
          
          if (backendResponse.success) {
            console.log('✅ Authentication complete');
            setMfaRequired(false);
            setMfaResolver(null);
            setVerificationId(null);
            toast.success('Login successful!');
            
            // Reload to let Firebase auth pick up the session
            window.location.reload();
          } else {
            throw new Error(backendResponse.error || 'Authentication failed');
          }
        } else {
          throw new Error('No refresh token in response');
        }
        
      } else if (firebaseUser) {
        // Direct verification for users already signed in but need MFA
        if (!verificationId) {
          await initiateMFAVerification();
          throw new Error('Verification code sent. Please enter the code.');
        }
        
        const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
        
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
    
    // CRITICAL FIX: Preserve tour state in BOTH localStorage AND sessionStorage
    console.log('🔍 Logout: Preserving tour state before clearing storage');
    const tourStateKeys = Object.keys(localStorage).filter(key => key.startsWith('broker-tour-state'));
    const tourStates: Record<string, string> = {};
    
    tourStateKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        tourStates[key] = value;
        console.log(`🔍 Logout: Found tour state for key ${key}:`, value);
        // ALSO save to sessionStorage as backup
        try {
          sessionStorage.setItem(key, value);
          console.log(`✅ Logout: Backed up tour state to sessionStorage for key ${key}`);
        } catch (e) {
          console.error(`❌ Logout: Failed to backup to sessionStorage:`, e);
        }
      }
    });
    
    console.log('🔍 Logout: Tour states to preserve:', Object.keys(tourStates));
    
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🔍 Logout: Storage cleared, now restoring tour state');
    
    // Restore tour state to BOTH storages
    Object.entries(tourStates).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
        console.log(`✅ Logout: Restored tour state to localStorage for key ${key}`);
        
        // Verify it was saved
        const verification = localStorage.getItem(key);
        if (!verification) {
          console.error(`❌ Logout: localStorage restore FAILED for key ${key}`);
        }
      } catch (e) {
        console.error(`❌ Logout: Failed to restore to localStorage:`, e);
      }
      
      try {
        sessionStorage.setItem(key, value);
        console.log(`✅ Logout: Restored tour state to sessionStorage for key ${key}`);
      } catch (e) {
        console.error(`❌ Logout: Failed to restore to sessionStorage:`, e);
      }
    });
    
    // Final verification
    console.log('🔍 Logout: Final verification of tour state preservation');
    tourStateKeys.forEach(key => {
      const localValue = localStorage.getItem(key);
      const sessionValue = sessionStorage.getItem(key);
      console.log(`🔍 Logout: Key ${key} - localStorage: ${localValue ? 'EXISTS' : 'MISSING'}, sessionStorage: ${sessionValue ? 'EXISTS' : 'MISSING'}`);
    });
    
    await signOut(auth);
  };

  const hasRole = (role: string): boolean => {
    return rolesMatch(user?.role, role);
  };

  const isAdmin = (): boolean => {
    return isAdminRole(user?.role);
  };

  // Secure storage functions for form drafts
  // ✅ FIXED: Now uses proper AES-GCM encryption
  const saveFormDraft = (formType: string, data: any) => {
    try {
      // Use dynamic import for secure storage with proper encryption
      import('../utils/secureStorage').then(async ({ secureStorageSet }) => {
        const key = `formDraft_${formType}`;
        await secureStorageSet(key, data);
      });
    } catch (error) {
      console.error('Error saving form draft:', error);
    }
  };

  const getFormDraft = (formType: string) => {
    try {
      // Use secure storage with proper decryption
      import('../utils/secureStorage').then(async ({ secureStorageGet }) => {
        const key = `formDraft_${formType}`;
        return await secureStorageGet(key);
      });
    } catch (error) {
      console.error('Error getting form draft:', error);
      return null;
    }
  };

  const clearFormDraft = (formType: string) => {
    try {
      import('../utils/secureStorage').then(({ secureStorageRemove }) => {
        const key = `formDraft_${formType}`;
        secureStorageRemove(key);
      });
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
