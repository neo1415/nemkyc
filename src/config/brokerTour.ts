/**
 * Broker Onboarding Tour Configuration
 * 
 * Defines the action-based step-by-step tour for new brokers.
 * Tour progresses based on user actions, not manual navigation.
 */

export interface TourStep {
  step: number;
  title: string;
  content: string;
  target: string;
  actionTrigger: string;
  autoAdvance?: boolean;
}

export const ACTION_BASED_TOUR_STEPS: TourStep[] = [
  {
    step: 0,
    title: 'Welcome',
    content: '👋 Welcome! Download a template to get started.',
    target: '[data-tour="download-template"]',
    actionTrigger: 'template_downloaded',
  },
  {
    step: 1,
    title: 'Upload File',
    content: '📤 Fill the template and drag it here to upload.',
    target: '[data-tour="upload-area"]',
    actionTrigger: 'file_uploaded',
  },
  {
    step: 2,
    title: 'View List',
    content: '👁️ Click your list to review the data.',
    target: '[data-tour="list-card"]',
    actionTrigger: 'list_viewed',
  },
  {
    step: 3,
    title: 'Select Customers',
    content: '✅ Select customers to verify.',
    target: '[data-tour="select-entries"]',
    actionTrigger: 'entries_selected',
  },
  {
    step: 4,
    title: 'Send Requests',
    content: '📧 Click "Request NIN" or "Request CAC".',
    target: '[data-tour="request-buttons"]',
    actionTrigger: 'emails_sent',
  },
  {
    step: 5,
    title: 'Done!',
    content: '🎉 You\'re all set! Track progress in the status column.',
    target: '[data-tour="status-column"]',
    actionTrigger: 'tour_completed',
    autoAdvance: true,
  },
];

export const TOUR_STYLES = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  tooltip: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '20px',
    maxWidth: '400px',
    color: '#333',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#800020', // NEM Insurance brand color
    marginBottom: '12px',
  },
  content: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#555',
    whiteSpace: 'pre-line',
  },
  buttonNext: {
    backgroundColor: '#800020',
    color: '#fff',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    marginTop: '16px',
  },
  buttonNextDisabled: {
    backgroundColor: '#ccc',
    color: '#666',
    cursor: 'not-allowed',
  },
  buttonSkip: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '16px',
    marginLeft: '8px',
  },
  progress: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '8px',
  },
};

// Action trigger constants for type safety
export const TOUR_ACTIONS = {
  WELCOME_SHOWN: 'welcome_shown',
  TEMPLATE_DOWNLOADED: 'template_downloaded',
  FILE_UPLOADED: 'file_uploaded',
  LIST_VIEWED: 'list_viewed',
  ENTRIES_SELECTED: 'entries_selected',
  EMAILS_SENT: 'emails_sent',
  TOUR_COMPLETED: 'tour_completed',
} as const;

export type TourAction = typeof TOUR_ACTIONS[keyof typeof TOUR_ACTIONS];

