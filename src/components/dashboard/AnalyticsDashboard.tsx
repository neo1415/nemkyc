import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { UserAnalytics } from '../../services/userSubmissionsService';

interface AnalyticsDashboardProps {
  analytics: UserAnalytics;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  const hasSubmissions = analytics.totalSubmissions > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-[#800020]" />
        <h2 className="text-2xl font-bold text-[#800020]">Your Submissions Overview</h2>
      </div>

      {/* Empty State Message */}
      {!hasSubmissions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 text-sm">
            You haven't submitted any forms yet. Your analytics will appear here once you submit your first form.
          </p>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Submissions */}
        <Card className="border-2 border-[#800020] bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#800020]" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#800020]">
              {analytics.totalSubmissions}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All forms submitted
            </p>
          </CardContent>
        </Card>

        {/* KYC Forms */}
        <Card className="border-2 border-[#DAA520] bg-gradient-to-br from-white to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#DAA520]" />
              KYC Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#DAA520]">
              {analytics.kycForms}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Know Your Customer forms
            </p>
          </CardContent>
        </Card>

        {/* Claims Forms */}
        <Card className="border-2 border-[#DAA520] bg-gradient-to-br from-white to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#DAA520]" />
              Claims Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#DAA520]">
              {analytics.claimForms}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Insurance claim forms
            </p>
          </CardContent>
        </Card>

        {/* Pending/Processing */}
        <Card className="border-2 border-yellow-400 bg-gradient-to-br from-white to-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600">
              {analytics.pendingCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pending review
            </p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="border-2 border-green-400 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {analytics.approvedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="border-2 border-red-400 bg-gradient-to-br from-white to-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">
              {analytics.rejectedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Bar */}
      {hasSubmissions && (
        <Card className="border-2 border-[#800020] bg-gradient-to-r from-[#800020] to-[#DAA520]">
          <CardContent className="py-4">
            <div className="flex flex-wrap justify-around items-center text-white">
              <div className="text-center px-4">
                <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
                <div className="text-xs opacity-90">Total</div>
              </div>
              <div className="text-center px-4 border-l border-white/30">
                <div className="text-2xl font-bold">{analytics.kycForms}</div>
                <div className="text-xs opacity-90">KYC</div>
              </div>
              <div className="text-center px-4 border-l border-white/30">
                <div className="text-2xl font-bold">{analytics.claimForms}</div>
                <div className="text-xs opacity-90">Claims</div>
              </div>
              <div className="text-center px-4 border-l border-white/30">
                <div className="text-2xl font-bold">
                  {analytics.totalSubmissions > 0 
                    ? Math.round((analytics.approvedCount / analytics.totalSubmissions) * 100)
                    : 0}%
                </div>
                <div className="text-xs opacity-90">Approval Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
