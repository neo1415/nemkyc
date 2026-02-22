import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { AlertTriangle, AlertCircle, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import type { CostTrackingData, BudgetConfig } from '../../types/analytics';

interface CostTrackerProps {
  data: CostTrackingData | null;
  budgetConfig: BudgetConfig | null;
  onUpdateBudget?: (config: BudgetConfig) => void;
  loading?: boolean;
}

export function CostTracker({ data, budgetConfig, onUpdateBudget, loading }: CostTrackerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(budgetConfig?.monthlyLimit || 100000);

  // Update local state when budgetConfig changes
  useEffect(() => {
    if (budgetConfig?.monthlyLimit) {
      setMonthlyLimit(budgetConfig.monthlyLimit);
    }
  }, [budgetConfig?.monthlyLimit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No cost data available</div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getAlertColor = () => {
    if (data.alertLevel === 'critical') return 'text-red-600';
    if (data.alertLevel === 'warning') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (data.alertLevel === 'critical') return 'bg-red-600';
    if (data.alertLevel === 'warning') return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const handleSaveBudget = async () => {
    if (onUpdateBudget && budgetConfig) {
      try {
        await onUpdateBudget({
          ...budgetConfig,
          monthlyLimit,
        });
        toast.success('Budget configuration saved successfully');
        setIsDialogOpen(false);
      } catch (error) {
        toast.error('Failed to save budget configuration');
        console.error('Budget save error:', error);
      }
    }
  };

  return (
    <Card data-testid="cost-tracker">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Cost Tracker ({formatCurrency(data.currentSpending)} of {formatCurrency(data.budgetLimit)})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Budget Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyLimit">Monthly Budget Limit (₦)</Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleSaveBudget} className="w-full">
                Save Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Spending */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Current Month Spending</span>
            <span className={`text-2xl font-bold ${getAlertColor()}`}>
              {formatCurrency(data.currentSpending)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            of {formatCurrency(data.budgetLimit)} budget
          </div>
        </div>

        {/* Budget Utilization Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Budget Utilization</span>
            <span className={`text-sm font-bold ${getAlertColor()}`}>
              {data.utilization.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.utilization} className={getProgressColor()} />
        </div>

        {/* Projected Cost */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Projected End-of-Month Cost</span>
            <span className="text-lg font-bold">{formatCurrency(data.projectedCost)}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Based on {data.daysElapsed} of {data.daysInMonth} days elapsed
          </div>
        </div>

        {/* Alert Messages */}
        {data.alertLevel === 'warning' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Warning:</strong> You've reached 80% of your monthly budget. Monitor spending closely.
            </div>
          </div>
        )}

        {data.alertLevel === 'critical' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <strong>Critical:</strong> You've exceeded your monthly budget limit. Take immediate action.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
