import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [approvedClaims, setApprovedClaims] = useState(0);
  const [kycForms, setKycForms] = useState(0);
  const [cddForms, setCddForms] = useState(0);
  const [claimsForms, setClaimsForms] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  // Redirect non-admin users
  if (!user || user.role === 'default') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Role-based data fetching
        const canViewUsers = user?.role === 'super admin';
        const canViewClaims = ['claims', 'admin', 'super admin'].includes(user?.role || '');
        const canViewKYCCDD = ['compliance', 'admin', 'super admin'].includes(user?.role || '');

        // Total Users from userroles collection (super admin only)
        if (canViewUsers) {
          const usersSnapshot = await getDocs(collection(db, 'userroles'));
          setTotalUsers(usersSnapshot.size);
        }

        // Count all submissions except userroles
        let totalSubs = 0;
        let claimsCount = 0;

        // Count claims collections for pending and approved (if user can view claims)
        let pendingCount = 0;
        let approvedCount = 0;
        
        if (canViewClaims) {
          const claimsCollections = [
            'motor-claims',
            'burglary-claims', 
            'all-risk-claims',
            'money-insurance-claims',
            'fidelity-guarantee-claims',
            'fire-special-perils-claims',
            'goods-in-transit-claims',
            'group-personal-accident-claims',
            'employers-liability-claims',
            'professional-indemnity-claims',
            'public-liability-claims',
            'rent-assurance-claims',
            'contractors-claims',
            'combined-gpa-employers-liability-claims'
          ];

          for (const collectionName of claimsCollections) {
            try {
              const collectionSnapshot = await getDocs(collection(db, collectionName));
              claimsCount += collectionSnapshot.size;
              
              collectionSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'pending' || data.status === 'processing') {
                  pendingCount++;
                }
                if (data.status === 'approved') {
                  approvedCount++;
                }
              });
            } catch (error) {
              console.log(`Collection ${collectionName} not found or error:`, error);
            }
          }
        }

        // Count KYC Forms (if user can view KYC/CDD)
        let kycCount = 0;
        let cddCount = 0;
        
        if (canViewKYCCDD) {
          const kycCollections = ['Individual-kyc-form', 'corporate-kyc-form'];
          
          for (const collectionName of kycCollections) {
            try {
              const collectionSnapshot = await getDocs(collection(db, collectionName));
              kycCount += collectionSnapshot.size;
            } catch (error) {
              console.log(`Collection ${collectionName} not found or error:`, error);
            }
          }

          // Count CDD Forms
          const cddCollections = [
            'agents-kyc',
            'brokers-kyc', 
            'corporate-kyc',
            'individual-kyc',
            'partners-kyc'
          ];
          
          for (const collectionName of cddCollections) {
            try {
              const collectionSnapshot = await getDocs(collection(db, collectionName));
              cddCount += collectionSnapshot.size;
            } catch (error) {
              console.log(`Collection ${collectionName} not found or error:`, error);
            }
          }
        }

        totalSubs = kycCount + cddCount + claimsCount;

        setPendingClaims(pendingCount);
        setApprovedClaims(approvedCount);
        setKycForms(kycCount);
        setCddForms(cddCount);
        setClaimsForms(claimsCount);
        setTotalSubmissions(totalSubs);

        // Fetch recent submissions from accessible collections only (limit to 5)
        const allSubmissions: any[] = [];
        
        // Get collections to check based on role
        const collectionsToCheck = [];
        if (canViewKYCCDD) {
          collectionsToCheck.push(...['Individual-kyc-form', 'corporate-kyc-form', 'agents-kyc', 'brokers-kyc', 'corporate-kyc', 'individual-kyc', 'partners-kyc']);
        }
        if (canViewClaims) {
          collectionsToCheck.push(...[
            'motor-claims', 'burglary-claims', 'all-risk-claims', 'money-insurance-claims',
            'fidelity-guarantee-claims', 'fire-special-perils-claims', 'goods-in-transit-claims',
            'group-personal-accident-claims', 'employers-liability-claims', 'professional-indemnity-claims',
            'public-liability-claims', 'rent-assurance-claims', 'contractors-claims', 'combined-gpa-employers-liability-claims'
          ]);
        }

        for (const collectionName of collectionsToCheck) {
          try {
            const collectionSnapshot = await getDocs(collection(db, collectionName));
            collectionSnapshot.forEach(doc => {
              const data = doc.data();
              if (data.timestamp) {
                allSubmissions.push({
                  id: doc.id,
                  collection: collectionName,
                  formType: data.formType || collectionName,
                  timestamp: data.timestamp.toDate(),
                  submittedBy: data.submittedBy || data.email || 'Unknown',
                  status: data.status || null
                });
              }
            });
          } catch (error) {
            console.log(`Collection ${collectionName} not found or error:`, error);
          }
        }

        // Sort by timestamp descending and take top 5
        const sortedSubmissions = allSubmissions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        setRecentSubmissions(sortedSubmissions);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Role-based chart data
  const chartData = [];
  if (['compliance', 'admin', 'super admin'].includes(user?.role || '')) {
    chartData.push({ name: 'KYC', value: kycForms });
    chartData.push({ name: 'CDD', value: cddForms });
  }
  if (['claims', 'admin', 'super admin'].includes(user?.role || '')) {
    chartData.push({ name: 'Claims', value: claimsForms });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Role: {user?.role}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Show Total Users only for super admin */}
          {user?.role === 'super admin' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold">{totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Total Submissions for all admin roles */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-3xl font-bold">{totalSubmissions}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Show Claims statistics only for claims, admin, and super admin */}
          {['claims', 'admin', 'super admin'].includes(user?.role || '') && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Claims</p>
                      <p className="text-3xl font-bold">{pendingClaims}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved Claims</p>
                      <p className="text-3xl font-bold">{approvedClaims}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Form Distribution Cards - Role-based visibility */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Show KYC Forms for compliance, admin, and super admin */}
          {['compliance', 'admin', 'super admin'].includes(user?.role || '') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">KYC Forms</p>
                    <p className="text-3xl font-bold">{kycForms}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show CDD Forms for compliance, admin, and super admin */}
          {['compliance', 'admin', 'super admin'].includes(user?.role || '') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">CDD Forms</p>
                    <p className="text-3xl font-bold">{cddForms}</p>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Claims Forms for claims, admin, and super admin */}
          {['claims', 'admin', 'super admin'].includes(user?.role || '') && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Claims Forms</p>
                    <p className="text-3xl font-bold">{claimsForms}</p>
                  </div>
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chart - Only show if user has data to display */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Form Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Submissions - Show only if user has access to any submissions */}
        {recentSubmissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSubmissions.map((submission, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{submission.formType}</p>
                      <p className="text-sm text-gray-600">
                        Submitted by: {submission.submittedBy}
                      </p>
                      <p className="text-sm text-gray-500">
                        {submission.timestamp.toLocaleDateString()} at {submission.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {/* Show status badge only for claims forms */}
                      {submission.status && submission.collection.includes('claims') && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          submission.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;