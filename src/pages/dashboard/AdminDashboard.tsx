
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Eye,
  Edit,
  Download,
  Shield,
  UserCheck,
  Building2,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getAllFormsData, FORM_COLLECTIONS } from '../../services/formsService';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    totalUsers: 0,
    activeUsers: 0,
    kycForms: 0,
    cddForms: 0,
    claimsForms: 0
  });
  const [formsData, setFormsData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  // Chart data
  const monthlyData = [
    { month: 'Jan', submissions: 45, users: 120 },
    { month: 'Feb', submissions: 52, users: 135 },
    { month: 'Mar', submissions: 48, users: 128 },
    { month: 'Apr', submissions: 61, users: 142 },
    { month: 'May', submissions: 55, users: 138 },
    { month: 'Jun', submissions: 67, users: 156 },
    { month: 'Jul', submissions: 73, users: 164 }
  ];

  const formTypeData = [
    { name: 'Claims', value: 156, color: '#ef4444' },
    { name: 'KYC', value: 89, color: '#3b82f6' },
    { name: 'CDD', value: 134, color: '#10b981' }
  ];

  const statusData = [
    { name: 'Pending', value: 18, color: '#f59e0b' },
    { name: 'Approved', value: 156, color: '#10b981' },
    { name: 'Rejected', value: 12, color: '#ef4444' }
  ];

  // Fetch real data from Firestore
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total users from userroles collection
      const usersRef = collection(db, 'userroles');
      const usersSnapshot = await getDocs(usersRef);
      const totalUsers = usersSnapshot.size;
      
      // Define exact collection names for claims
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
      
      // Define exact collection names for KYC
      const kycCollections = ['Individual-kyc-form', 'corporate-kyc-form'];
      
      // Define exact collection names for CDD  
      const cddCollections = ['agents-kyc', 'brokers-kyc', 'corporate-kyc', 'individual-kyc', 'partners-kyc'];
      
      // Calculate stats from real data
      let totalSubmissions = 0;
      let kycForms = 0;
      let cddForms = 0;
      let claimsForms = 0;
      let pendingClaims = 0;
      let approvedClaims = 0;
      const recent: any[] = [];

      // Count KYC forms
      for (const collectionName of kycCollections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          kycForms += snapshot.size;
          totalSubmissions += snapshot.size;
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            recent.push({
              ...data,
              id: doc.id,
              formType: collectionName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              collection: collectionName
            });
          });
        } catch (error) {
          console.log(`Collection ${collectionName} not found`);
        }
      }

      // Count CDD forms
      for (const collectionName of cddCollections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          cddForms += snapshot.size;
          totalSubmissions += snapshot.size;
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            recent.push({
              ...data,
              id: doc.id,
              formType: collectionName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              collection: collectionName
            });
          });
        } catch (error) {
          console.log(`Collection ${collectionName} not found`);
        }
      }

      // Count Claims forms and pending/approved status
      for (const collectionName of claimsCollections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          claimsForms += snapshot.size;
          totalSubmissions += snapshot.size;
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Count pending and approved claims
            if (data.status === 'pending' || data.status === 'processing') {
              pendingClaims++;
            } else if (data.status === 'approved') {
              approvedClaims++;
            }
            
            recent.push({
              ...data,
              id: doc.id,
              formType: collectionName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              collection: collectionName
            });
          });
        } catch (error) {
          console.log(`Collection ${collectionName} not found`);
        }
      }

      // Sort recent by timestamp and take latest 5
      const sortedRecent = recent
        .filter(item => item.timestamp)
        .sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return timeB.getTime() - timeA.getTime();
        })
        .slice(0, 5);

      setRecentSubmissions(sortedRecent);

      // Calculate monthly stats (placeholder logic)
      const thisMonth = Math.ceil(totalSubmissions * 0.15);
      const lastMonth = Math.ceil(totalSubmissions * 0.12);

      setStats({
        totalSubmissions,
        thisMonth,
        lastMonth,
        pendingClaims,
        approvedClaims,
        totalUsers,
        activeUsers: Math.ceil(totalUsers * 0.7),
        kycForms,
        cddForms,
        claimsForms
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const growthRate = ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1);
  const isGrowthPositive = stats.thisMonth > stats.lastMonth;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-red-900" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor submissions and manage the platform</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-xs text-green-600">{stats.activeUsers} active</p>
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">{growthRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
                  <p className="text-sm text-gray-600">Pending Claims</p>
                  <p className="text-xs text-yellow-600">Needs attention</p>
                </div>
              </div>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedClaims}</p>
                  <p className="text-sm text-gray-600">Approved Claims</p>
                  <p className="text-xs text-green-600">This month: {stats.thisMonth}</p>
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monthly Submissions</span>
            </CardTitle>
            <CardDescription>Form submissions over the last 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="submissions" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Form Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown by form type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Categories Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.claimsForms}</p>
                  <p className="text-sm text-gray-600">Claims Forms</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-600">{stats.pendingClaims} pending</p>
                <p className="text-xs text-gray-500">All claim types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.kycForms}</p>
                  <p className="text-sm text-gray-600">KYC Forms</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">Individual & Corporate</p>
                <p className="text-xs text-gray-500">2 form types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.cddForms}</p>
                  <p className="text-sm text-gray-600">CDD Forms</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Agents, Brokers, Partners</p>
                <p className="text-xs text-gray-500">5 form types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Submissions</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/forms')}>
              View All
            </Button>
          </CardTitle>
          <CardDescription>Latest form submissions across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading recent submissions...</div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent submissions found</div>
            ) : (
              recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-900" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{submission.formType}</h3>
                      <p className="text-sm text-gray-500">
                        by {submission.submittedBy || submission.companyName || submission.name || 'Unknown'} • {formatDate(submission.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {submission.collection?.includes('claims') && (
                      <Badge className={`${getStatusColor(submission.status || 'processing')} flex items-center space-x-1`}>
                        {getStatusIcon(submission.status || 'processing')}
                        <span>{submission.status || 'processing'}</span>
                      </Badge>
                    )}
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/form/${submission.collection}/${submission.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
