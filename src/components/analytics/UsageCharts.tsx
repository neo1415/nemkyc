import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { UsageDataPoint } from '../../types/analytics';

interface UsageChartsProps {
  data: UsageDataPoint[];
  loading?: boolean;
}

/**
 * UsageCharts Component
 * 
 * Displays various charts for API usage analytics with mobile-responsive design
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3
 */
export function UsageCharts({ data, loading }: UsageChartsProps) {
  const [expandedCharts, setExpandedCharts] = useState({
    dailyCalls: true,
    costComparison: true,
    successFailure: false,
    costTrends: false,
  });

  const toggleChart = (chartName: keyof typeof expandedCharts) => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName],
    }));
  };
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No chart data available
      </div>
    );
  }

  // Calculate totals for pie chart
  const totalDataproCalls = data.reduce((sum, d) => sum + d.dataproCalls, 0);
  const totalVerifydataCalls = data.reduce((sum, d) => sum + d.verifydataCalls, 0);
  const totalSuccess = data.reduce((sum, d) => sum + d.successCount, 0);
  const totalFailure = data.reduce((sum, d) => sum + d.failureCount, 0);

  const providerData = [
    { name: 'Datapro (NIN)', value: totalDataproCalls, color: '#3b82f6' },
    { name: 'VerifyData (CAC)', value: totalVerifydataCalls, color: '#10b981' },
  ];

  const successFailureData = [
    { name: 'Success', value: totalSuccess, color: '#10b981' },
    { name: 'Failure', value: totalFailure, color: '#ef4444' },
  ];

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-4">
      {/* Daily API Calls Line Chart */}
      <Card>
        <CardHeader 
          className="cursor-pointer md:cursor-default flex flex-row items-center justify-between"
          onClick={() => toggleChart('dailyCalls')}
        >
          <CardTitle className="text-base md:text-lg">Daily API Calls</CardTitle>
          <ChevronDown className={`h-5 w-5 md:hidden transition-transform ${expandedCharts.dailyCalls ? 'rotate-180' : ''}`} />
        </CardHeader>
        {(expandedCharts.dailyCalls || window.innerWidth >= 768) && (
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="dataproCalls"
                    stroke="#3b82f6"
                    name="Datapro (NIN)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="verifydataCalls"
                    stroke="#10b981"
                    name="VerifyData (CAC)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cost Comparison Bar Chart */}
      <Card>
        <CardHeader 
          className="cursor-pointer md:cursor-default flex flex-row items-center justify-between"
          onClick={() => toggleChart('costComparison')}
        >
          <CardTitle className="text-base md:text-lg">Cost Comparison</CardTitle>
          <ChevronDown className={`h-5 w-5 md:hidden transition-transform ${expandedCharts.costComparison ? 'rotate-180' : ''}`} />
        </CardHeader>
        {(expandedCharts.costComparison || window.innerWidth >= 768) && (
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="dataproCost" fill="#3b82f6" name="Datapro Cost" />
                  <Bar dataKey="verifydataCost" fill="#10b981" name="VerifyData Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Success/Failure Pie Chart */}
        <Card>
          <CardHeader 
            className="cursor-pointer md:cursor-default flex flex-row items-center justify-between"
            onClick={() => toggleChart('successFailure')}
          >
            <CardTitle className="text-base md:text-lg">Success vs Failure Rate</CardTitle>
            <ChevronDown className={`h-5 w-5 md:hidden transition-transform ${expandedCharts.successFailure ? 'rotate-180' : ''}`} />
          </CardHeader>
          {(expandedCharts.successFailure || window.innerWidth >= 768) && (
            <CardContent>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                  <PieChart>
                    <Pie
                      data={successFailureData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {successFailureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Cost Trends Area Chart */}
        <Card>
          <CardHeader 
            className="cursor-pointer md:cursor-default flex flex-row items-center justify-between"
            onClick={() => toggleChart('costTrends')}
          >
            <CardTitle className="text-base md:text-lg">Cost Trends</CardTitle>
            <ChevronDown className={`h-5 w-5 md:hidden transition-transform ${expandedCharts.costTrends ? 'rotate-180' : ''}`} />
          </CardHeader>
          {(expandedCharts.costTrends || window.innerWidth >= 768) && (
            <CardContent>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="dataproCost"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Datapro Cost"
                    />
                    <Area
                      type="monotone"
                      dataKey="verifydataCost"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      name="VerifyData Cost"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
