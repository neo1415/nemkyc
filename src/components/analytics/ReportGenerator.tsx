/**
 * Report Generator Component
 * 
 * Provides UI for generating and downloading analytics reports
 * in multiple formats (PDF, Excel, CSV).
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { cn } from '../../lib/utils';
import { reportService, type ReportData, type ReportMetadata } from '../../services/analytics/ReportService';
import { useToast } from '../../hooks/use-toast';

interface ReportGeneratorProps {
  data: ReportData;
  currentUser: {
    email: string;
    displayName?: string;
  };
}

type ReportFormat = 'pdf' | 'excel' | 'csv';

const REPORT_SECTIONS = [
  { id: 'overview', label: 'Overview Metrics', description: 'Total calls, costs, and success rates' },
  { id: 'usage-charts', label: 'Usage Data', description: 'Daily usage trends and patterns' },
  { id: 'broker-attribution', label: 'Broker Attribution', description: 'Usage breakdown by broker' },
  { id: 'cost-tracking', label: 'Cost Tracking', description: 'Budget utilization and projections' },
  { id: 'audit-logs', label: 'Audit Logs', description: 'Detailed verification logs' },
];

export function ReportGenerator({ data, currentUser }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview']);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerateReport = async () => {
    if (selectedSections.length === 0) {
      toast({
        title: 'No sections selected',
        description: 'Please select at least one section to include in the report.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const metadata: ReportMetadata = {
        title: 'API Analytics Report',
        generatedAt: new Date(),
        generatedBy: currentUser.displayName || currentUser.email,
        dateRange,
      };

      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'pdf':
          blob = await reportService.generatePDFReport(data, metadata, selectedSections);
          filename = `analytics-report-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`;
          break;
        case 'excel':
          blob = await reportService.generateExcelReport(data, metadata, selectedSections);
          filename = `analytics-report-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`;
          break;
        case 'csv':
          blob = await reportService.generateCSVReport(data, metadata, selectedSections);
          filename = `analytics-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
      }

      reportService.downloadBlob(blob, filename);

      toast({
        title: 'Report generated',
        description: `Your ${format.toUpperCase()} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Report generation failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>
          Export analytics data in your preferred format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <Label>Report Format</Label>
          <RadioGroup value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="format-pdf" />
              <Label htmlFor="format-pdf" className="font-normal cursor-pointer">
                PDF - Formatted report with charts and tables
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excel" id="format-excel" />
              <Label htmlFor="format-excel" className="font-normal cursor-pointer">
                Excel - Multi-sheet workbook for analysis
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="format-csv" />
              <Label htmlFor="format-csv" className="font-normal cursor-pointer">
                CSV - Raw data for large datasets
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-3">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !dateRange.start && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.start ? formatDate(dateRange.start, 'PPP') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date) => date && setDateRange((prev) => ({ ...prev, start: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="flex items-center">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !dateRange.end && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.end ? formatDate(dateRange.end, 'PPP') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date) => date && setDateRange((prev) => ({ ...prev, end: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Section Selection */}
        <div className="space-y-3">
          <Label>Include Sections</Label>
          <div className="space-y-3">
            {REPORT_SECTIONS.map((section) => (
              <div key={section.id} className="flex items-start space-x-2">
                <Checkbox
                  id={`section-${section.id}`}
                  checked={selectedSections.includes(section.id)}
                  onCheckedChange={() => handleSectionToggle(section.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={`section-${section.id}`}
                    className="font-normal cursor-pointer"
                  >
                    {section.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating || selectedSections.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate {format.toUpperCase()} Report
            </>
          )}
        </Button>

        {selectedSections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Select at least one section to generate a report
          </p>
        )}
      </CardContent>
    </Card>
  );
}
