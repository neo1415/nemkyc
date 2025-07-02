
import React from 'react';
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
  Download
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  // Mock data - will be replaced with real data from Firestore
  const stats = {
    totalSubmissions: 145,
    thisMonth: 23,
    lastMonth: 18,
    pendingClaims: 12,
    approvedClaims: 89
  };

  const growthRate = ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1);
  const isGrowthPositive = stats.thisMonth > stats.lastMonth;

  const recentSubmissions = [
    {
      id: '1',
      type: 'Motor Claim',
      user: 'John Doe',
      status: 'pending',
      submittedAt: '2024-01-20',
      category: 'Claims'
    },
    {
      id: '2',
      type: 'Corporate KYC',
      user: 'Jane Smith',
      status: 'completed',
      submittedAt: '2024-01-19',
      category: 'KYC'
    },
    {
      id: '3',
      type: 'Fire Claim',
      user: 'Bob Johnson',
      status: 'approved',
      submittedAt: '2024-01-18',
      category: 'Claims'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="h-8 w-8 text-red-900" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor submissions and manage the platform</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                <p className="text-sm text-gray-600">This Month</p>
                <div className="flex items-center mt-1">
                  {isGrowthPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${isGrowthPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {growthRate}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
                <p className="text-sm text-gray-600">Pending Claims</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-red-900" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedClaims}</p>
                <p className="text-sm text-gray-600">Approved Claims</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Recent Submissions</span>
          </CardTitle>
          <CardDescription>Latest form submissions across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
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
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
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
