// Debug version of UserDashboard to help identify the issue

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { User, FileText, Eye, Calendar, Mail, Phone, Lock, Shield, AlertCircle } from 'lucide-react';
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!user) return null;

  // Updated collections to match your submission service
  const formCollections = [
    'motor-claims',
    'burglaryClaims',
    'fireSpecialPerilsClaims',
    'allRiskClaims',
    'goodsInTransitClaims',
    'moneyInsuranceClaims',
    'fidelityGuaranteeClaims',
    'employers-liability-claims',
    'professional-indemnity-claims',
    'public-liability-claims',
    'rentAssuranceClaims',
    'groupPersonalAccidentClaims',
    'contractorsPlantMachineryClaims',
    'combined-gpa-employers-liability-claims',
    'corporateCDD',
    'individualCDD', 
    'brokersCDD',
    'agentsCDD',
    'partnersCDD',
    'corporateKYC',
    'individualKYC'
  ];

  useEffect(() => {
    fetchUserForms();
  }, [user]);

  const fetchUserForms = async () => {
    if (!user?.email) {
      setDebugInfo(prev => [...prev, 'No user email found']);
      return;
    }

    try {
      const allForms: FormSubmission[] = [];
      const debugMessages: string[] = [`Searching for forms for email: ${user.email}`];
      
      for (const collectionName of formCollections) {
        try {
          debugMessages.push(`Checking collection: ${collectionName}`);
          
          const q = query(
            collection(db, collectionName),
            where('submittedBy', '==', user.email),
            orderBy('submittedAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          debugMessages.push(`Found ${querySnapshot.size} documents in ${collectionName}`);
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            debugMessages.push(`Document ${doc.id} - Status: ${data.status}, SubmittedBy: ${data.submittedBy}`);
            
            allForms.push({
              id: doc.id,
              formType: collectionName,
              status: data.status || 'processing',
              submittedAt: data.submittedAt,
              collection: collectionName
            });
          });
        } catch (error: any) {
          debugMessages.push(`Error in ${collectionName}: ${error.message}`);
          
          // Try without orderBy in case the index doesn't exist
          try {
            debugMessages.push(`Trying ${collectionName} without orderBy...`);
            const q2 = query(
              collection(db, collectionName),
              where('submittedBy', '==', user.email)
            );
            
            const querySnapshot2 = await getDocs(q2);
            debugMessages.push(`Without orderBy - Found ${querySnapshot2.size} documents in ${collectionName}`);
            
            querySnapshot2.forEach((doc) => {
              const data = doc.data();
              allForms.push({
                id: doc.id,
                formType: collectionName,
                status: data.status || 'processing',
                submittedAt: data.submittedAt,
                collection: collectionName
              });
            });
          } catch (error2: any) {
            debugMessages.push(`Still failed for ${collectionName}: ${error2.message}`);
          }
        }
      }

      debugMessages.push(`Total forms found: ${allForms.length}`);
      setDebugInfo(debugMessages);
      setSubmittedForms(allForms);
      calculateStats(allForms);
    } catch (error: any) {
      console.error('Error fetching user forms:', error);
      setDebugInfo(prev => [...prev, `General error: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (forms: FormSubmission[]) => {
    const stats: FormStats = {
      total: forms.length,
      cdd: forms.filter(f => f.formType.toLowerCase().includes('cdd')).length,
      kyc: forms.filter(f => f.formType.toLowerCase().includes('kyc')).length,
      claims: forms.filter(f => f.formType.toLowerCase().includes('claims') || f.formType.toLowerCase().includes('claim')).length,
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
    const type = formType.toLowerCase();
    if (type.includes('cdd')) return 'CDD';
    if (type.includes('kyc')) return 'KYC';
    if (type.includes('claims') || type.includes('claim')) return 'Claims';
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

      {/* Debug Information */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            <span>Debug Information</span>
          </CardTitle>
          <CardDescription>Troubleshooting information (remove this card once fixed)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            <div className="text-sm font-mono space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-700">{info}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
