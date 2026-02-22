import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, FileText, CheckCircle, Clock, TrendingUp, TrendingDown, RefreshCw, Activity, AlertTriangle, Banknote, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  useAdminDashboardStats, 
  useMonthlySubmissionData,
  useHealthStatus,
  useErrorRate,
  useAPIUsage,
  useSystemAlerts
} from '../../hooks/useAdminDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { rolesMatch, normalizeRole, hasAnyRole } from '../../utils/roleNormalization';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Redirect non-admin users (users with default role or broker role)
  if (!user || rolesMatch(user.role, 'default') || rolesMatch(user.role, 'broker')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Use React Query hooks for cached data fetching
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useAdminDashboardStats(user?.role || '');

  const { 
    data: monthlyData, 
    isLoading: monthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly 
  } = useMonthlySubmissionData(user?.role || '');

  // Health monitoring data
  const {
    data: healthStatus,
    isLoading: healthLoading,
    refetch: refetchHealth
  } = useHealthStatus();

  const {
    data: errorRate,
    isLoading: errorRateLoading,
    refetch: refetchErrorRate
  } = useErrorRate(24);

  const {
    data: apiUsage,
    isLoading: apiUsageLoading,
    refetch: refetchAPIUsage
  } = useAPIUsage('day');

  const {
    data: alerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts
  } = useSystemAlerts();

  const isLoading = statsLoading || monthlyLoading;

  // Handle refresh button
  const handleRefresh = () => {
    refetchStats();
    refetchMonthly();
    refetchHealth();
    refetchErrorRate();
    refetchAPIUsage();
    refetchAlerts();
  };

  // Role-based access helpers using normalization
  const userRole = user?.role;
  const isSuperAdmin = normalizeRole(userRole) === 'super admin';
  const canViewKYCCDD = hasAnyRole(userRole, ['compliance', 'admin', 'super admin']);
  const canViewClaims = hasAnyRole(userRole, ['claims', 'admin', 'super admin']);

  // Role-based chart data with colors
  const chartData = [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  if (stats && canViewKYCCDD) {
    chartData.push({ name: 'KYC Forms', value: stats.kycForms, color: COLORS[0] });
    chartData.push({ name: 'CDD Forms', value: stats.cddForms, color: COLORS[1] });
  }
  if (stats && canViewClaims) {
    chartData.push({ name: 'Claims Forms', value: stats.claimsForms, color: COLORS[2] });
  }

  // Show skeleton while loading instead of full spinner
  if (isLoading && !stats && !monthlyData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 min-w-[250px] bg-gray-200 h-32 rounded"></div>
          ))}
        </div>
        
        <div className="bg-gray-200 h-64 rounded"></div>
        <div className="bg-gray-200 h-80 rounded"></div>
      </div>
    );
  }

  if (statsError || monthlyError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard data</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
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
        <div className="flex items-center gap-4">
          {/* Analytics Dashboard Button - Super Admin Only */}
          {isSuperAdmin && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/admin/analytics')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <BarChart3 className="h-4 w-4" />
              API Analytics
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="text-sm text-gray-500">
            Role: {user?.role}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap gap-6">
        {/* Show Total Users only for super admin */}
        {isSuperAdmin && (
          <Card className="flex-1 min-w-[250px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">System users</span>
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
                <p className="text-3xl font-bold">{stats?.totalSubmissions || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">All forms</span>
                </div>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Show KYC Forms for compliance, admin, and super admin */}
        {canViewKYCCDD && (
          <Card className="flex-1 min-w-[250px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">KYC Forms</p>
                  <p className="text-3xl font-bold">{stats?.kycForms || 0}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">Know Your Customer</span>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show CDD Forms for compliance, admin, and super admin */}
        {canViewKYCCDD && (
          <Card className="flex-1 min-w-[250px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CDD Forms</p>
                  <p className="text-3xl font-bold">{stats?.cddForms || 0}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">Customer Due Diligence</span>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show Claims statistics only for claims, admin, and super admin */}
        {canViewClaims && (
          <>
            <Card className="flex-1 min-w-[250px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Claims</p>
                    <p className="text-3xl font-bold">{stats?.pendingClaims || 0}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-500">Awaiting review</span>
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
                    <p className="text-3xl font-bold">{stats?.approvedClaims || 0}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">Successfully processed</span>
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
          {canViewKYCCDD && (
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">KYC Forms</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.kycForms || 0}</p>
                    <p className="text-xs text-gray-500">Individual & Corporate</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show CDD Forms for compliance, admin, and super admin */}
          {canViewKYCCDD && (
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">CDD Forms</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.cddForms || 0}</p>
                    <p className="text-xs text-gray-500">Agents, Brokers & Partners</p>
                  </div>
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Claims Forms for claims, admin, and super admin */}
          {canViewClaims && (
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Claims Forms</p>
                    <p className="text-2xl font-bold text-orange-600">{stats?.claimsForms || 0}</p>
                    <p className="text-xs text-gray-500">All insurance claims</p>
                  </div>
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* System Health Monitoring - Only for admin and super admin */}
      {(normalizeRole(userRole) === 'admin' || normalizeRole(userRole) === 'super admin') && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">System Health & Monitoring</h2>
          
          {/* Health Status Cards */}
          <div className="flex flex-wrap gap-4">
            {/* API Health Status */}
            <Card className="flex-1 min-w-[250px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">API Status</p>
                    <div className="flex items-center gap-2 mt-2">
                      {healthStatus?.status === 'up' && (
                        <>
                          <Badge className="bg-green-500">Online</Badge>
                          <span className="text-xs text-gray-500">
                            {healthStatus.responseTime}ms
                          </span>
                        </>
                      )}
                      {healthStatus?.status === 'down' && (
                        <Badge className="bg-red-500">Offline</Badge>
                      )}
                      {healthStatus?.status === 'not_configured' && (
                        <Badge className="bg-gray-500">Not Configured</Badge>
                      )}
                      {!healthStatus && (
                        <Badge className="bg-gray-400">Unknown</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {healthStatus?.message || 'Checking...'}
                    </p>
                  </div>
                  <Activity className={`h-8 w-8 ${
                    healthStatus?.status === 'up' ? 'text-green-600' : 
                    healthStatus?.status === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`} />
                </div>
              </CardContent>
            </Card>

            {/* Error Rate */}
            <Card className="flex-1 min-w-[250px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Error Rate (24h)</p>
                    <p className="text-3xl font-bold">
                      {errorRate?.errorRatePercent || '0.00'}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {errorRate?.failed || 0} / {errorRate?.total || 0} failed
                    </p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${
                    parseFloat(errorRate?.errorRatePercent || '0') > 10 ? 'text-red-600' :
                    parseFloat(errorRate?.errorRatePercent || '0') > 5 ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                </div>
              </CardContent>
            </Card>

            {/* API Usage All-Time */}
            <Card className="flex-1 min-w-[250px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">API Calls (All-Time)</p>
                    <p className="text-3xl font-bold">{apiUsage?.calls || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₦{(apiUsage?.cost || 0).toFixed(2)} cost
                    </p>
                  </div>
                  <Banknote className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          {alerts && alerts.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-yellow-800">
                      {alerts.length} System Alert{alerts.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {alerts[0].message}
                      {alerts.length > 1 && ` and ${alerts.length - 1} more`}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Navigate to alerts page or show modal
                      console.log('View alerts');
                    }}
                  >
                    View All
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Form Submissions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData || []}>
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
      {stats?.recentSubmissions && stats.recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSubmissions.map((submission, index) => (
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
