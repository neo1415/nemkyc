import { collection, query, where, getDocs, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SubmissionCard {
  id: string;
  ticketId: string;
  formType: string;
  submittedAt: Date;
  status: 'processing' | 'approved' | 'rejected' | 'pending';
  collection: string;
}

export interface UserAnalytics {
  totalSubmissions: number;
  kycForms: number;
  claimForms: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// All form collections to query
const FORM_COLLECTIONS = [
  'motor-claims',
  'fire-special-perils-claims',
  'burglary-claims',
  'all-risk-claims',
  'goods-in-transit-claims',
  'money-insurance-claims',
  'public-liability-claims',
  'employers-liability-claims',
  'group-personal-accident-claims',
  'fidelity-guarantee-claims',
  'rent-assurance-claims',
  'contractors-claims',
  'combined-gpa-employers-liability-claims',
  'professional-indemnity-claims',
  'Individual-kyc-form',
  'corporate-kyc-form',
  'individual-kyc',
  'corporate-kyc',
  'brokers-kyc',
  'agentsCDD',
  'partnersCDD'
];

// KYC form collections for categorization
const KYC_COLLECTIONS = [
  'Individual-kyc-form',
  'corporate-kyc-form',
  'individual-kyc',
  'corporate-kyc',
  'brokers-kyc',
  'agentsCDD',
  'partnersCDD'
];

/**
 * Get all submissions for a user across all form collections
 * @param userEmail - The email of the user
 * @returns Array of submission cards sorted by submission date (newest first)
 */
export const getUserSubmissions = async (userEmail: string): Promise<SubmissionCard[]> => {
  const submissions: SubmissionCard[] = [];
  
  // Normalize email to lowercase for consistent matching
  const normalizedEmail = userEmail.toLowerCase().trim();
  console.log('🔍 Fetching submissions for user:', normalizedEmail);

  for (const collectionName of FORM_COLLECTIONS) {
    try {
      // Query without orderBy to avoid needing composite index
      // We'll sort in memory after fetching
      const q = query(
        collection(db, collectionName),
        where('submittedBy', '==', normalizedEmail)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        console.log(`📂 Collection ${collectionName}: found ${snapshot.docs.length} documents`);
      }
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          ticketId: data.ticketId || 'N/A',
          formType: data.formType || collectionName,
          submittedAt: data.submittedAt instanceof Timestamp 
            ? data.submittedAt.toDate() 
            : new Date(data.submittedAt || Date.now()),
          status: data.status || 'processing',
          collection: collectionName
        });
      });
    } catch (error: any) {
      // Log the actual error for debugging
      console.warn(`Failed to query collection ${collectionName}:`, error?.message || error);
    }
  }

  console.log(`✅ Total submissions found: ${submissions.length}`);
  
  // Sort all submissions by date (newest first) in memory
  return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
};

/**
 * Calculate analytics from user submissions
 * @param submissions - Array of submission cards
 * @returns Analytics object with counts and breakdowns
 */
export const getUserAnalytics = (submissions: SubmissionCard[]): UserAnalytics => {
  const totalSubmissions = submissions.length;
  
  // Count KYC vs Claims forms
  const kycForms = submissions.filter(sub => 
    KYC_COLLECTIONS.includes(sub.collection)
  ).length;
  const claimForms = totalSubmissions - kycForms;
  
  // Count by status
  const pendingCount = submissions.filter(sub => 
    sub.status === 'pending' || sub.status === 'processing'
  ).length;
  const approvedCount = submissions.filter(sub => 
    sub.status === 'approved'
  ).length;
  const rejectedCount = submissions.filter(sub => 
    sub.status === 'rejected'
  ).length;
  
  return {
    totalSubmissions,
    kycForms,
    claimForms,
    pendingCount,
    approvedCount,
    rejectedCount
  };
};

/**
 * Subscribe to real-time updates for user submissions
 * @param userEmail - The email of the user
 * @param onUpdate - Callback function called when submissions change
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToUserSubmissions = (
  userEmail: string,
  onUpdate: (submissions: SubmissionCard[]) => void
): Unsubscribe => {
  const unsubscribers: Unsubscribe[] = [];
  const submissionsMap = new Map<string, SubmissionCard>();

  // Normalize email to lowercase for consistent matching
  const normalizedEmail = userEmail.toLowerCase().trim();
  console.log('🔔 Setting up real-time subscription for user:', normalizedEmail);

  // Helper to update submissions and notify
  const notifyUpdate = () => {
    const submissions = Array.from(submissionsMap.values())
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    console.log(`📊 Real-time update: ${submissions.length} submissions`);
    onUpdate(submissions);
  };

  // Subscribe to each collection
  FORM_COLLECTIONS.forEach(collectionName => {
    try {
      // Query without orderBy to avoid needing composite index
      const q = query(
        collection(db, collectionName),
        where('submittedBy', '==', normalizedEmail)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.docs.length > 0) {
            console.log(`📂 Real-time ${collectionName}: ${snapshot.docs.length} documents`);
          }
          
          // Update submissions for this collection
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const key = `${collectionName}-${doc.id}`;
            submissionsMap.set(key, {
              id: doc.id,
              ticketId: data.ticketId || 'N/A',
              formType: data.formType || collectionName,
              submittedAt: data.submittedAt instanceof Timestamp 
                ? data.submittedAt.toDate() 
                : new Date(data.submittedAt || Date.now()),
              status: data.status || 'processing',
              collection: collectionName
            });
          });

          // Remove deleted documents
          const currentIds = new Set(snapshot.docs.map(doc => `${collectionName}-${doc.id}`));
          Array.from(submissionsMap.keys()).forEach(key => {
            if (key.startsWith(`${collectionName}-`) && !currentIds.has(key)) {
              submissionsMap.delete(key);
            }
          });

          notifyUpdate();
        },
        (error) => {
          console.warn(`Failed to subscribe to collection ${collectionName}:`, error?.message || error);
        }
      );

      unsubscribers.push(unsubscribe);
    } catch (error: any) {
      console.warn(`Failed to set up listener for collection ${collectionName}:`, error?.message || error);
    }
  });

  // Return a function that unsubscribes from all collections
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
};
