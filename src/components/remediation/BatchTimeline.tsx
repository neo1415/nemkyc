import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  Upload,
  Email,
  CheckCircle,
  Schedule,
  Warning,
  Done,
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateFormatter';

interface TimelineEvent {
  id: string;
  type: 'created' | 'emails_sent' | 'verification' | 'review' | 'completed' | 'expired';
  title: string;
  description: string;
  timestamp: Date;
  count?: number;
}

interface BatchTimelineProps {
  events?: TimelineEvent[];
  batchCreatedAt?: Date;
  emailsSentAt?: Date;
  firstVerificationAt?: Date;
  lastVerificationAt?: Date;
  completedAt?: Date;
  totalRecords?: number;
  verifiedCount?: number;
  emailSentCount?: number;
}

/**
 * Timeline component showing batch events in chronological order.
 * Displays key milestones like creation, email sending, and verifications.
 * Requirements: 6.6
 */
const BatchTimeline: React.FC<BatchTimelineProps> = ({
  events = [],
  batchCreatedAt,
  emailsSentAt,
  firstVerificationAt,
  lastVerificationAt,
  completedAt,
  totalRecords = 0,
  verifiedCount = 0,
  emailSentCount = 0,
}) => {
  // Build timeline events from props if not provided
  const timelineEvents: TimelineEvent[] = events.length > 0 ? events : [];

  // Add default events based on batch data
  if (events.length === 0) {
    if (batchCreatedAt) {
      timelineEvents.push({
        id: 'created',
        type: 'created',
        title: 'Batch Created',
        description: `Batch created with ${totalRecords} records`,
        timestamp: new Date(batchCreatedAt),
        count: totalRecords,
      });
    }

    if (emailsSentAt && emailSentCount > 0) {
      timelineEvents.push({
        id: 'emails_sent',
        type: 'emails_sent',
        title: 'Emails Sent',
        description: `${emailSentCount} verification emails sent`,
        timestamp: new Date(emailsSentAt),
        count: emailSentCount,
      });
    }

    if (firstVerificationAt) {
      timelineEvents.push({
        id: 'first_verification',
        type: 'verification',
        title: 'First Verification',
        description: 'First customer completed verification',
        timestamp: new Date(firstVerificationAt),
      });
    }

    if (lastVerificationAt && lastVerificationAt !== firstVerificationAt) {
      timelineEvents.push({
        id: 'last_verification',
        type: 'verification',
        title: 'Latest Verification',
        description: `${verifiedCount} total verifications completed`,
        timestamp: new Date(lastVerificationAt),
        count: verifiedCount,
      });
    }

    if (completedAt) {
      timelineEvents.push({
        id: 'completed',
        type: 'completed',
        title: 'Batch Completed',
        description: 'All records have been processed',
        timestamp: new Date(completedAt),
      });
    }
  }

  // Sort events by timestamp
  const sortedEvents = [...timelineEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return <Upload sx={{ fontSize: 20 }} />;
      case 'emails_sent':
        return <Email sx={{ fontSize: 20 }} />;
      case 'verification':
        return <CheckCircle sx={{ fontSize: 20 }} />;
      case 'review':
        return <Warning sx={{ fontSize: 20 }} />;
      case 'completed':
        return <Done sx={{ fontSize: 20 }} />;
      case 'expired':
        return <Schedule sx={{ fontSize: 20 }} />;
      default:
        return <Schedule sx={{ fontSize: 20 }} />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return '#2196f3'; // blue
      case 'emails_sent':
        return '#9c27b0'; // purple
      case 'verification':
        return '#4caf50'; // green
      case 'review':
        return '#ff9800'; // orange
      case 'completed':
        return '#4caf50'; // green
      case 'expired':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // grey
    }
  };

  if (sortedEvents.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No timeline events available
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', pl: 3 }}>
      {/* Vertical line */}
      <Box
        sx={{
          position: 'absolute',
          left: 11,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: 'grey.300',
        }}
      />

      {sortedEvents.map((event, index) => (
        <Box
          key={event.id}
          sx={{
            position: 'relative',
            pb: index === sortedEvents.length - 1 ? 0 : 3,
          }}
        >
          {/* Event dot */}
          <Box
            sx={{
              position: 'absolute',
              left: -19,
              top: 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: getEventColor(event.type),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            {getEventIcon(event.type)}
          </Box>

          {/* Event content */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              ml: 2,
              bgcolor: 'grey.50',
              borderLeft: 3,
              borderColor: getEventColor(event.type),
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.description}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                {formatDateTime(event.timestamp)}
              </Typography>
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default BatchTimeline;
