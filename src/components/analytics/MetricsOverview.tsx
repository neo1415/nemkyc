import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, CheckCircle, XCircle } from 'lucide-react';
import type { AnalyticsSummary } from '../../types/analytics';

interface MetricsOverviewProps {
  summary: AnalyticsSummary | null;
  loading?: boolean;
}

/**
 * MetricsOverview Component
 * 
 * Displays key metrics cards with period comparisons
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function MetricsOverview({ summary, loading }: MetricsOverviewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="metrics-overview">
        No metrics
      </div>
    );
  }

  // Provide default values for previousPeriodComparison if missing
  const comparison = summary.previousPeriodComparison || {
    callsChange: 0,
    costChange: 0,
    successRateChange: 0
  };

  // Provide default values for potentially missing fields
  const totalCalls = summary.totalCalls || 0;
  const totalCost = summary.totalCost || 0;
  const successRate = summary.successRate || 0;
  const dataproCalls = summary.dataproCalls || 0;
  const verifydataCalls = summary.verifydataCalls || 0;

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="metrics-overview">
      {/* Total API Calls Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Metrics: {totalCalls.toLocaleString()} calls</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon(comparison.callsChange)}
            <span className={getTrendColor(comparison.callsChange)}>
              {formatPercentage(comparison.callsChange)}
            </span>
            <span>from last period</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Cost Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          <span className="h-4 w-4 text-muted-foreground font-bold">₦</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon(comparison.costChange)}
            <span className={getTrendColor(comparison.costChange)}>
              {formatPercentage(comparison.costChange)}
            </span>
            <span>from last period</span>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon(comparison.successRateChange)}
            <span className={getTrendColor(comparison.successRateChange)}>
              {formatPercentage(comparison.successRateChange)}
            </span>
            <span>from last period</span>
          </div>
        </CardContent>
      </Card>

      {/* Provider Breakdown Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Provider Breakdown</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Datapro (NIN)</span>
              <span className="text-sm font-medium">{dataproCalls.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">VerifyData (CAC)</span>
              <span className="text-sm font-medium">{verifydataCalls.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
