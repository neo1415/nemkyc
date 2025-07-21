
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LogIn, Mail, Loader2 } from 'lucide-react';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      
      // Check if there's a pending submission
      const hasPendingSubmission = sessionStorage.getItem('pendingSubmission');
      if (hasPendingSubmission) {
        // Process pending submission and redirect back to original page
        const { processPendingSubmissionUtil } = await import('../../hooks/useAuthRequiredSubmit');
        const { getAuth } = await import('firebase/auth');
        const currentUser = getAuth().currentUser;
        
        if (currentUser?.email) {
          await processPendingSubmissionUtil(currentUser.email);
        }
        
        // Redirect back to the original page
        navigate(-1);
        return;
      }

      // Normal sign-in flow - role-based navigation
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      const { getAuth } = await import('firebase/auth');
      
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'userroles', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || 'default';
          
          if (['admin', 'super admin', 'compliance', 'claims'].includes(role)) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          navigate(from, { replace: true });
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      
      // Check  here if there's a pending submission
      const hasPendingSubmission = sessionStorage.getItem('pendingSubmission');
      if (hasPendingSubmission) {
        // Process pending submission and redirect back to original page
        const { processPendingSubmissionUtil } = await import('../../hooks/useAuthRequiredSubmit');
        const { getAuth } = await import('firebase/auth');
        const currentUser = getAuth().currentUser;
        
        if (currentUser?.email) {
          await processPendingSubmissionUtil(currentUser.email);
        }
        
        // Redirect back to the original page
        navigate(-1);
        return;
      }

      // Normal sign-in flow - role-based navigation
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      const { getAuth } = await import('firebase/auth');
      
      const userDoc = await getDoc(doc(db, 'userroles', getAuth().currentUser?.uid || ''));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'default';
        
        if (['admin', 'super admin', 'compliance', 'claims'].includes(role)) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-900 to-yellow-600 rounded-lg"></div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Google
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-red-900 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
