
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { setDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 245,
    thisMonth: 38,
    lastMonth: 29,
    pendingClaims: 18,
    approvedClaims: 156,
    totalUsers: 1247,
    activeUsers: 892,
    kycForms: 89,
    cddForms: 134,
    claimsForms: 156
  });

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

  // Create test users function - TO BE DELETED AFTER RUNNING ONCE
  const createTestUsers = async () => {
    try {
      // User 1: Default role
      const user1 = await createUserWithEmailAndPassword(auth, 'adetimilehin502@gmail.com', 'password123');
      await setDoc(doc(db, 'users', user1.user.uid), {
        name: 'Ade Timilehin',
        email: 'adetimilehin502@gmail.com',
        role: 'default',
        notificationPreference: 'email',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // User 2: Super admin role
      const user2 = await createUserWithEmailAndPassword(auth, 'adneo502@gmail.com', 'password123');
      await setDoc(doc(db, 'users', user2.user.uid), {
        name: 'Adneo Admin',
        email: 'adneo502@gmail.com',
        role: 'super-admin',
        notificationPreference: 'email',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Test users created successfully!');
    } catch (error) {
      console.error('Error creating test users:', error);
    }
  };

  useEffect(() => {
    // Uncomment this line to create test users, then comment it back
    // createTestUsers();
  }, []);

  const growthRate = ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1);
  const isGrowthPositive = stats.thisMonth > stats.lastMonth;

  const recentSubmissions = [
    {
      id: '1',
      type: 'Motor Claim',
      user: 'John Doe',
      status: 'pending',
      submittedAt: '2024-01-20',
      category: 'Claims',
      collection: 'motor-claims'
    },
    {
      id: '2',
      type: 'Corporate KYC',
      user: 'Jane Smith',
      status: 'completed',
      submittedAt: '2024-01-19',
      category: 'KYC',
      collection: 'corporate-kyc'
    },
    {
      id: '3',
      type: 'Fire Special Perils',
      user: 'Bob Johnson',
      status: 'approved',
      submittedAt: '2024-01-18',
      category: 'Claims',
      collection: 'fire-special-perils-claims'
    },
    {
      id: '4',
      type: 'Individual CDD',
      user: 'Alice Brown',
      status: 'pending',
      submittedAt: '2024-01-17',
      category: 'CDD',
      collection: 'individual-cdd'
    },
    {
      id: '5',
      type: 'Professional Indemnity',
      user: 'Charlie Wilson',
      status: 'approved',
      submittedAt: '2024-01-16',
      category: 'Claims',
      collection: 'professional-indemnity-claims'
    }
  ];

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
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/claims')}>
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
                <p className="text-xs text-gray-500">14 form types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/kyc')}>
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
                <p className="text-sm text-green-600">All completed</p>
                <p className="text-xs text-gray-500">2 form types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/cdd')}>
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
                <p className="text-sm text-blue-600">5 pending</p>
                <p className="text-xs text-gray-500">7 form types</p>
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
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-900" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{submission.type}</h3>
                    <p className="text-sm text-gray-500">
                      by {submission.user} • {submission.category} • {submission.submittedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`${getStatusColor(submission.status)} flex items-center space-x-1`}>
                    {getStatusIcon(submission.status)}
                    <span>{submission.status}</span>
                  </Badge>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/admin/form/${submission.collection}/${submission.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
