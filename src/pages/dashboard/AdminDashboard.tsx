import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, FileText, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [lineChartData, setLineChartData] = useState<Array<{ month: string; submissions: number }>>([]);

  // Redirect non-admin users
  if (!user || user.role === 'default') {
    return <Navigate to="/dashboard" replace />;
  }

  // Helper function to get collections based on user role
  const getCollectionsForRole = useCallback((role: string) => {
    const collections: string[] = [];
    
    // KYC and CDD collections for compliance, admin, and super admin
    if (['compliance', 'admin', 'super admin'].includes(role)) {
      collections.push(
        'Individual-kyc-form', 'corporate-kyc-form', // KYC
        'agents-kyc', 'brokers-kyc', 'corporate-kyc', 'individual-kyc', 'partners-kyc' // CDD
      );
    }
    
    // Claims collections for claims, admin, and super admin
    if (['claims', 'admin', 'super admin'].includes(role)) {
      collections.push(
        'motor-claims', 'burglary-claims', 'all-risk-claims', 'money-insurance-claims',
        'fidelity-guarantee-claims', 'fire-special-perils-claims', 'goods-in-transit-claims',
        'group-personal-accident-claims', 'employers-liability-claims', 'professional-indemnity-claims',
        'public-liability-claims', 'rent-assurance-claims', 'contractors-claims', 'combined-gpa-employers-liability-claims'
      );
    }
    
    return collections;
  }, []);

  // Dynamic monthly submission data
  const getMonthlySubmissionData = useCallback(async () => {
    if (!user?.role) return;

    try {
      // Get last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      
      const collections = getCollectionsForRole(user.role);
      const monthlyData: { [key: string]: number } = {};
      
      // Initialize last 6 months with 0 submissions
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = 0;
      }

      // Fetch data from all collections
      for (const collectionName of collections) {
        try {
          const q = query(
            collection(db, collectionName),
            where('timestamp', '>=', sixMonthsAgo),
            where('timestamp', '<=', now)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            let timestamp;
            
            // Handle different timestamp formats
            if (data.timestamp?.toDate) {
              timestamp = data.timestamp.toDate();
            } else if (data.timestamp?.seconds) {
              timestamp = new Date(data.timestamp.seconds * 1000);
            } else if (data.timestamp) {
              timestamp = new Date(data.timestamp);
            } else {
              return; // Skip if no valid timestamp
            }
            
            const monthKey = timestamp.toLocaleDateString('en-US', { month: 'short' });
            if (monthlyData.hasOwnProperty(monthKey)) {
              monthlyData[monthKey]++;
            }
          });
        } catch (error) {
          console.log(`Collection ${collectionName} not found or error:`, error);
        }
      }

      // Convert to array format for chart
      const chartData = Object.entries(monthlyData).map(([month, submissions]) => ({
        month,
        submissions
      }));

      // Sort chronologically (last 6 months in order)
      const monthOrder = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthOrder.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }
      
      const sortedData = monthOrder.map(month => 
        chartData.find(item => item.month === month) || { month, submissions: 0 }
      );

      setLineChartData(sortedData);
    } catch (error) {
      console.error('Error fetching monthly submission data:', error);
      setLineChartData([]);
    }
  }, [user?.role, getCollectionsForRole]);

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
              if (data.timestamp && data.timestamp.toDate) {
                try {
                  allSubmissions.push({
                    id: doc.id,
                    collection: collectionName,
                    formType: data.formType || collectionName,
                    timestamp: data.timestamp.toDate(),
                    submittedBy: data.submittedBy || data.email || 'Unknown',
                    status: data.status || null
                  });
                } catch (error) {
                  console.log(`Error processing timestamp for document ${doc.id}:`, error);
                }
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
    getMonthlySubmissionData();
  }, [user, getMonthlySubmissionData]);

  // Role-based chart data with colors
  const chartData = [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  if (['compliance', 'admin', 'super admin'].includes(user?.role || '')) {
    chartData.push({ name: 'KYC Forms', value: kycForms, color: COLORS[0] });
    chartData.push({ name: 'CDD Forms', value: cddForms, color: COLORS[1] });
  }
  if (['claims', 'admin', 'super admin'].includes(user?.role || '')) {
    chartData.push({ name: 'Claims Forms', value: claimsForms, color: COLORS[2] });
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage all forms and user submissions</p>
        </div>
        <div className="text-sm text-gray-500">
          Role: {user?.role}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap gap-6">
        {/* Show Total Users only for super admin */}
        {user?.role === 'super admin' && (
          <Card className="flex-1 min-w-[250px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">12% increase</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show Total Submissions for all admin roles */}
        <Card className="flex-1 min-w-[250px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold">{totalSubmissions}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">8% increase</span>
                </div>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Show KYC Forms for compliance, admin, and super admin */}
        {['compliance', 'admin', 'super admin'].includes(user?.role || '') && (
          <Card className="flex-1 min-w-[250px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">KYC Forms</p>
                  <p className="text-3xl font-bold">{kycForms}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">6% increase</span>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show CDD Forms for compliance, admin, and super admin */}
        {['compliance', 'admin', 'super admin'].includes(user?.role || '') && (
          <Card className="flex-1 min-w-[250px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CDD Forms</p>
                  <p className="text-3xl font-bold">{cddForms}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">4% increase</span>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show Claims statistics only for claims, admin, and super admin */}
        {['claims', 'admin', 'super admin'].includes(user?.role || '') && (
          <>
            <Card className="flex-1 min-w-[250px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Claims</p>
                    <p className="text-3xl font-bold">{pendingClaims}</p>
                    <div className="flex items-center mt-2">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-500">5% decrease</span>
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 min-w-[250px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved Claims</p>
                    <p className="text-3xl font-bold">{approvedClaims}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">15% increase</span>
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Form Distribution */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Form Distribution</h2>
        
        {/* Pie Chart - Only show if user has data to display */}
        {chartData.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Form Distribution Cards in Flex Layout */}
        <div className="flex flex-wrap gap-4">
          {/* Show KYC Forms for compliance, admin, and super admin */}
          {['compliance', 'admin', 'super admin'].includes(user?.role || '') && (
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">KYC Forms</p>
                    <p className="text-2xl font-bold text-blue-600">{kycForms}</p>
                    <p className="text-xs text-gray-500">Individual & Corporate</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show CDD Forms for compliance, admin, and super admin */}
          {['compliance', 'admin', 'super admin'].includes(user?.role || '') && (
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">CDD Forms</p>
                    <p className="text-2xl font-bold text-green-600">{cddForms}</p>
                    <p className="text-xs text-gray-500">Agents, Brokers & Partners</p>
                  </div>
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Claims Forms for claims, admin, and super admin */}
          {['claims', 'admin', 'super admin'].includes(user?.role || '') && (
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Claims Forms</p>
                    <p className="text-2xl font-bold text-orange-600">{claimsForms}</p>
                    <p className="text-xs text-gray-500">All insurance claims</p>
                  </div>
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form Submissions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                  <div className="flex-1">
                    <p className="font-medium">{submission.formType}</p>
                    <p className="text-sm text-gray-600">
                      Submitted by: {submission.submittedBy}
                    </p>
                    <p className="text-sm text-gray-500">
                      {submission.timestamp.toLocaleDateString()} at {submission.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Navigate to appropriate form based on collection
                        let url = '';
                        
                        // CDD Forms
                        if (submission.collection === 'partners-kyc') {
                          url = '/admin/cdd/partners';
                        } else if (submission.collection === 'agents-kyc') {
                          url = '/admin/cdd/agents';
                        } else if (submission.collection === 'brokers-kyc') {
                          url = '/admin/cdd/brokers';
                        } else if (submission.collection === 'individual-kyc') {
                          url = 'admin/cdd/individual';
                        } else if (submission.collection === 'corporate-kyc') {
                          url = '/admin/cdd/corporate';
                        }
                        // KYC Forms
                        else if (submission.collection === 'Individual-kyc-form') {
                          url = '/admin/kyc/individual';
                        } else if (submission.collection === 'corporate-kyc-form') {
                          url = '/admin/kyc/corporate';
                        }
                        // Claims Forms
                        else {
                          url = `/admin/${submission.collection}`;
                        }
                        
                        window.location.href = url;
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
