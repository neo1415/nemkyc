import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { User, Mail, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updatePassword, User as FirebaseUser } from 'firebase/auth';
import { toast } from 'sonner';

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      if (user) {
        await updatePassword(user as unknown as FirebaseUser, passwordData.newPassword);
        toast.success('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <User className="h-8 w-8 text-red-900" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>User Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <Input
                  id="displayName"
                  value={'Not set'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdAt">Account Created</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  id="createdAt"
                  value={(user as unknown as FirebaseUser)?.metadata?.creationTime ? new Date((user as unknown as FirebaseUser).metadata.creationTime).toLocaleDateString() : 'Unknown'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastSignIn">Last Sign In</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  id="lastSignIn"
                  value={(user as unknown as FirebaseUser)?.metadata?.lastSignInTime ? new Date((user as unknown as FirebaseUser).metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;