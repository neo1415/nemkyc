import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';

interface BatchProgressBarProps {
  totalRecords: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  reviewRequiredCount: number;
  emailSentCount?: number;
  showLabels?: boolean;
  height?: number;
}

/**
 * Progress bar component showing verification completion status.
 * Displays a segmented progress bar with different colors for each status.
 * Requirements: 6.5
 */
const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  totalRecords,
  verifiedCount,
  pendingCount,
  failedCount,
  reviewRequiredCount,
  emailSentCount = 0,
  showLabels = true,
  height = 24,
}) => {
  // Calculate percentages
  const total = totalRecords || 1; // Prevent division by zero
  const verifiedPercent = (verifiedCount / total) * 100;
  const failedPercent = (failedCount / total) * 100;
  const reviewPercent = (reviewRequiredCount / total) * 100;
  const emailSentPercent = (emailSentCount / total) * 100;
  const pendingPercent = (pendingCount / total) * 100;

  // Calculate overall completion percentage
  const completionPercent = Math.round(((verifiedCount + failedCount) / total) * 100);

  const segments = [
    { 
      label: 'Verified', 
      value: verifiedPercent, 
      color: '#4caf50', // green
      count: verifiedCount 
    },
    { 
      label: 'Failed', 
      value: failedPercent, 
      color: '#f44336', // red
      count: failedCount 
    },
    { 
      label: 'Review Required', 
      value: reviewPercent, 
      color: '#ff9800', // orange
      count: reviewRequiredCount 
    },
    { 
      label: 'Email Sent', 
      value: emailSentPercent, 
      color: '#2196f3', // blue
      count: emailSentCount 
    },
    { 
      label: 'Pending', 
      value: pendingPercent, 
      color: '#9e9e9e', // grey
      count: pendingCount 
    },
  ].filter(s => s.value > 0);

  return (
    <Box sx={{ width: '100%' }}>
      {showLabels && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Verification Progress
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {completionPercent}% Complete ({verifiedCount + failedCount} / {totalRecords})
          </Typography>
        </Box>
      )}
      
      {/* Segmented Progress Bar */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: height,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'grey.200',
        }}
      >
        {segments.map((segment, index) => (
          <Tooltip
            key={segment.label}
            title={`${segment.label}: ${segment.count} (${segment.value.toFixed(1)}%)`}
            arrow
          >
            <Box
              sx={{
                width: `${segment.value}%`,
                height: '100%',
                bgcolor: segment.color,
                transition: 'width 0.3s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  filter: 'brightness(1.1)',
                },
              }}
            />
          </Tooltip>
        ))}
      </Box>

      {/* Legend */}
      {showLabels && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          {segments.map((segment) => (
            <Box key={segment.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: segment.color,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {segment.label}: {segment.count}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BatchProgressBar;
