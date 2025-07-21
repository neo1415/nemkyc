import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { User, FileText, Eye, Calendar, Mail, Phone, Lock, Shield } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface FormSubmission {
  id: string;
  formType: string;
  status: string;
  submittedAt: any;
  collection: string;
}

interface FormStats {
  total: number;
  cdd: number;
  kyc: number;
  claims: number;
  pending: number;
}

const UserDashboard: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submittedForms, setSubmittedForms] = useState<FormSubmission[]>([]);
  const [formStats, setFormStats] = useState<FormStats>({
    total: 0,
    cdd: 0,
    kyc: 0,
    claims: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!user) return null;

  // Collections to query for user forms
  const formCollections = [
    'motor-claims',
    'burglary-claims', 
    'fire-claims',
    'all-risk-claims',
    'money-insurance-claims',
    'fidelity-guarantee-claims',
    'goods-in-transit-claims',
    'employers-liability-claims',
    'professional-indemnity-claims',
    'public-liability-claims',
    'rent-assurance-claims',
    'group-personal-accident-claims',
    'contractors-plant-machinery-claims',
    'combined-gpa-employers-liability-claims',
    'corporate-cdd',
    'individual-cdd', 
    'brokers-cdd',
    'agents-cdd',
    'partners-cdd',
    'corporate-kyc',
    'individual-kyc'
  ];

  useEffect(() => {
    fetchUserForms();
  }, [user]);

  const fetchUserForms = async () => {
    if (!user?.uid && !user?.email) return;

    try {
      const allForms: FormSubmission[] = [];
      
      for (const collectionName of formCollections) {
        const q = query(
          collection(db, collectionName),
          where('submittedBy', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );
        
        try {
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            allForms.push({
              id: doc.id,
              formType: collectionName,
              status: data.status || 'processing',
              submittedAt: data.submittedAt,
              collection: collectionName
            });
          });
        } catch (error) {
          // Try email fallback for some collections
          const emailQuery = query(
            collection(db, collectionName),
            where('email', '==', user.email),
            orderBy('submittedAt', 'desc')
          );
          
          try {
            const emailSnapshot = await getDocs(emailQuery);
            emailSnapshot.forEach((doc) => {
              const data = doc.data();
              allForms.push({
                id: doc.id,
                formType: collectionName,
                status: data.status || 'processing',
                submittedAt: data.submittedAt,
                collection: collectionName
              });
            });
          } catch (emailError) {
            console.log(`No data found for ${collectionName}`);
          }
        }
      }

      setSubmittedForms(allForms);
      calculateStats(allForms);
    } catch (error) {
      console.error('Error fetching user forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (forms: FormSubmission[]) => {
    const stats: FormStats = {
      total: forms.length,
      cdd: forms.filter(f => f.formType.includes('cdd')).length,
      kyc: forms.filter(f => f.formType.includes('kyc')).length,
      claims: forms.filter(f => f.formType.includes('claims')).length,
      pending: forms.filter(f => f.status === 'processing' || f.status === 'pending').length
    };
    setFormStats(stats);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormDisplayName = (formType: string) => {
    return formType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFormCategory = (formType: string) => {
    if (formType.includes('cdd')) return 'CDD';
    if (formType.includes('kyc')) return 'KYC';
    if (formType.includes('claims')) return 'Claims';
    return 'Other';
  };

  const handleViewForm = (form: FormSubmission) => {
    navigate(`/admin/form-viewer/${form.collection}/${form.id}`);
  };

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
        // Re-authenticate if current password provided
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center space-x-2">
        <User className="h-8 w-8 text-red-900" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Manage your insurance forms and profile</p>
        </div>
      </div>

      {/* Profile and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Your account details (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-900 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>Notifications: {user.notificationPreference === 'email' ? 'Email' : 'SMS'}</span>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Member since {user.createdAt?.toLocaleDateString() || 'N/A'}</span>
              </div>
              {user.role && (
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span>Role: {user.role}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Form Statistics</span>
            </CardTitle>
            <CardDescription>Your submission overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-red-900">{formStats.total}</div>
                <div className="text-xs md:text-sm text-gray-600">Total Forms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-yellow-600">{formStats.pending}</div>
                <div className="text-xs md:text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{formStats.cdd}</div>
                <div className="text-xs md:text-sm text-gray-600">CDD Forms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-green-600">{formStats.kyc}</div>
                <div className="text-xs md:text-sm text-gray-600">KYC Forms</div>
              </div>
            </div>
            <div className="mt-4 text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-purple-600">{formStats.claims}</div>
              <div className="text-xs md:text-sm text-gray-600">Claims Forms</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>My Submitted Forms</span>
          </CardTitle>
          <CardDescription>View your form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading your forms...</p>
            </div>
          ) : submittedForms.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No forms submitted yet</p>
              <p className="text-sm text-gray-400">Your submitted forms will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submittedForms.map((form) => (
                <div key={form.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-red-900" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{getFormDisplayName(form.formType)}</h3>
                      <p className="text-sm text-gray-500">
                        {getFormCategory(form.formType)} • Submitted {form.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end space-x-3 mt-3 md:mt-0">
                    <Badge className={getStatusColor(form.status)}>
                      {form.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewForm(form)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Change Password</span>
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;