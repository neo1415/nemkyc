import { collection, query, where, getDocs, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COMPLIANCE_COLLECTION_NAMES, SUBMISSION_COLLECTION_NAMES } from '../config/submissionCatalog';
import type { ClaimBlock } from '../lib/claimLifecycle';

export interface SubmissionCard {
  id: string;
  ticketId: string;
  formType: string;
  submittedAt: Date;
  status: 'processing' | 'approved' | 'rejected' | 'pending';
  collection: string;
  /** Claim lifecycle block when present; resolveClaimBlock() synthesises one from status for legacy claims. */
  claim?: Partial<ClaimBlock> | null;
}


// All form collections to query
const FORM_COLLECTIONS = SUBMISSION_COLLECTION_NAMES;

const toSubmissionCard = (collectionName: string, id: string, data: any): SubmissionCard => {
  const rawDate = data.submittedAt || data.createdAt || data.timestamp;
  return {
    id,
    ticketId: data.ticketId || data.formId || id,
    formType: data.formType || collectionName.replace(/[-_]/g, ' '),
    submittedAt: rawDate instanceof Timestamp
      ? rawDate.toDate()
      : rawDate?.toDate?.() || new Date(rawDate || Date.now()),
    status: data.status || 'processing',
    collection: collectionName,
    claim: data.claim && typeof data.claim === 'object' ? (data.claim as Partial<ClaimBlock>) : null,
  };
};

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
        submissions.push(toSubmissionCard(collectionName, doc.id, data));
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
            submissionsMap.set(key, toSubmissionCard(collectionName, doc.id, data));
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
