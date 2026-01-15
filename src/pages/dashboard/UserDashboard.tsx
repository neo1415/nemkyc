import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { User, Calendar, Mail, Phone, Lock, FileText } from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '../../hooks/use-toast';
import AnalyticsDashboard from '../../components/dashboard/AnalyticsDashboard';
import SubmissionCard from '../../components/dashboard/SubmissionCard';
import { getUserSubmissions, getUserAnalytics, subscribeToUserSubmissions, SubmissionCard as SubmissionCardType, UserAnalytics } from '../../services/userSubmissionsService';

const UserDashboard: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionCardType[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalSubmissions: 0,
    kycForms: 0,
    claimForms: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  // Load user submissions on mount and subscribe to real-time updates
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        console.log('📧 UserDashboard: Loading submissions for email:', user.email);
        const userSubmissions = await getUserSubmissions(user.email);
        console.log('📊 UserDashboard: Loaded', userSubmissions.length, 'submissions');
        setSubmissions(userSubmissions);
        const userAnalytics = getUserAnalytics(userSubmissions);
        setAnalytics(userAnalytics);
      } catch (error) {
        console.error('Failed to load submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load your submissions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();

    // Subscribe to real-time updates
    console.log('🔔 UserDashboard: Setting up real-time subscription for:', user.email);
    const unsubscribe = subscribeToUserSubmissions(user.email, (updatedSubmissions) => {
      console.log('📊 UserDashboard: Real-time update received:', updatedSubmissions.length, 'submissions');
      setSubmissions(updatedSubmissions);
      const updatedAnalytics = getUserAnalytics(updatedSubmissions);
      setAnalytics(updatedAnalytics);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user.email, toast]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setPasswordLoading(true);
    try {
      if (firebaseUser && passwordForm.currentPassword) {
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordForm.currentPassword
        );
        await reauthenticateWithCredential(firebaseUser, credential);
      }
      
      if (firebaseUser) {
        await updatePassword(firebaseUser, passwordForm.newPassword);
        toast({
          title: "Success",
          description: "Password updated successfully"
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#800020] to-[#DAA520] rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#800020] text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome, {user.name || 'User'}!</h1>
              <p className="text-white/90 mt-1">Track your submissions and manage your account</p>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Submissions
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile & Settings
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            {/* Analytics Section */}
            <AnalyticsDashboard analytics={analytics} />

            {/* Submissions Grid */}
            <div>
              <h2 className="text-2xl font-bold text-[#800020] mb-4">Your Submissions</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]"></div>
                  <p className="mt-4 text-gray-600">Loading your submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Submissions Yet</h3>
                    <p className="text-gray-500">
                      You haven't submitted any forms yet. Your submissions will appear here once you submit a form.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissions.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Profile & Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information */}
            <Card className="shadow-lg">
              <CardHeader className="bg-[#800020] text-white">
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription className="text-white/80">Your account details (read-only)</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                      {user.name || 'Not provided'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-900 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-900 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{user.createdAt?.toLocaleDateString() || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Notification Preference</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                      {user.notificationPreference === 'email' ? 'Email' : 'SMS'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="shadow-lg">
              <CardHeader className="bg-[#800020] text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Change Password</span>
                </CardTitle>
                <CardDescription className="text-white/80">Update your account password for security</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                        Current Password (optional)
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min 6 characters)"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={passwordLoading || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="w-full bg-[#800020] hover:bg-[#600018]"
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
