import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DashboardStats {
  totalUsers: number;
  totalSubmissions: number;
  pendingClaims: number;
  approvedClaims: number;
  kycForms: number;
  cddForms: number;
  claimsForms: number;
  recentSubmissions: any[];
  monthlyData: Array<{ month: string; submissions: number }>;
}

// Helper function to get collections based on user role
const getCollectionsForRole = (role: string) => {
  const collections: string[] = [];
  
  // KYC and CDD collections for compliance, admin, and super admin
  if (['compliance', 'admin', 'super admin'].includes(role)) {
    collections.push(
      'Individual-kyc-form', 'corporate-kyc-form', // KYC
      'agents-kyc', 'brokers-kyc', 'corporate-kyc', 'individual-kyc', 'partners-kyc' // CDD
    );
  }
  
  // Claims collections for claims, admin, and super admin
  if (['claims', 'admin', 'super admin'].includes(role)) {
    collections.push(
      'motor-claims', 'burglary-claims', 'all-risk-claims', 'money-insurance-claims',
      'fidelity-guarantee-claims', 'fire-special-perils-claims', 'goods-in-transit-claims',
      'group-personal-accident-claims', 'employers-liability-claims', 'professional-indemnity-claims',
      'public-liability-claims', 'rent-assurance-claims', 'contractors-claims', 'combined-gpa-employers-liability-claims'
    );
  }
  
  return collections;
};

// Fetch dashboard statistics with parallel requests for speed
const fetchDashboardStats = async (userRole: string): Promise<DashboardStats> => {
  const canViewUsers = userRole === 'super admin';
  const canViewClaims = ['claims', 'admin', 'super admin'].includes(userRole);
  const canViewKYCCDD = ['compliance', 'admin', 'super admin'].includes(userRole);

  // Create parallel requests array
  const parallelRequests: Promise<any>[] = [];
  
  // 1. Users count (super admin only)
  if (canViewUsers) {
    parallelRequests.push(
      getDocs(collection(db, 'userroles')).catch(() => ({ size: 0 }))
    );
  } else {
    parallelRequests.push(Promise.resolve({ size: 0 }));
  }

  // 2. Claims collections (parallel)
  const claimsCollections = canViewClaims ? [
    'motor-claims', 'burglary-claims', 'all-risk-claims', 'money-insurance-claims',
    'fidelity-guarantee-claims', 'fire-special-perils-claims', 'goods-in-transit-claims',
    'group-personal-accident-claims', 'employers-liability-claims', 'professional-indemnity-claims',
    'public-liability-claims', 'rent-assurance-claims', 'contractors-claims', 'combined-gpa-employers-liability-claims'
  ] : [];

  if (canViewClaims) {
    parallelRequests.push(
      Promise.all(
        claimsCollections.map(collectionName =>
          getDocs(collection(db, collectionName)).catch(() => ({ docs: [] }))
        )
      )
    );
  } else {
    parallelRequests.push(Promise.resolve([]));
  }

  // 3. KYC collections (parallel)
  const kycCollections = canViewKYCCDD ? ['Individual-kyc-form', 'corporate-kyc-form'] : [];
  
  if (canViewKYCCDD) {
    parallelRequests.push(
      Promise.all(
        kycCollections.map(collectionName =>
          getDocs(collection(db, collectionName)).catch(() => ({ size: 0 }))
        )
      )
    );
  } else {
    parallelRequests.push(Promise.resolve([]));
  }

  // 4. CDD collections (parallel)
  const cddCollections = canViewKYCCDD ? [
    'agentsCDD', 'brokersCDD', 'corporateCDD', 'individualCDD', 'partnersCDD'
  ] : [];
  
  if (canViewKYCCDD) {
    parallelRequests.push(
      Promise.all(
        cddCollections.map(collectionName =>
          getDocs(collection(db, collectionName)).catch(() => ({ size: 0 }))
        )
      )
    );
  } else {
    parallelRequests.push(Promise.resolve([]));
  }

  // 5. Recent submissions (limited to 10 from each collection for speed)
  const recentCollections = [];
  if (canViewKYCCDD) {
    recentCollections.push(...kycCollections, ...cddCollections);
  }
  if (canViewClaims) {
    recentCollections.push(...claimsCollections.slice(0, 5)); // Limit to first 5 claims collections for speed
  }

  if (recentCollections.length > 0) {
    parallelRequests.push(
      Promise.all(
        recentCollections.map(collectionName =>
          getDocs(query(
            collection(db, collectionName),
            // orderBy('timestamp', 'desc'), // Remove this to avoid requiring index
            // limit(3) // Limit per collection for speed
          )).catch(() => ({ docs: [] }))
        )
      )
    );
  } else {
    parallelRequests.push(Promise.resolve([]));
  }

  // Execute all requests in parallel
  const [
    usersSnapshot,
    claimsSnapshots,
    kycSnapshots,
    cddSnapshots,
    recentSnapshots
  ] = await Promise.all(parallelRequests);

  // Process results
  const totalUsers = usersSnapshot.size || 0;
  
  // Process claims data
  let claimsCount = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  
  if (Array.isArray(claimsSnapshots)) {
    claimsSnapshots.forEach(snapshot => {
      if (snapshot && snapshot.docs) {
        claimsCount += snapshot.size || snapshot.docs.length;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'pending' || data.status === 'processing') {
            pendingCount++;
          }
          if (data.status === 'approved') {
            approvedCount++;
          }
        });
      }
    });
  }

  // Process KYC data
  let kycCount = 0;
  if (Array.isArray(kycSnapshots)) {
    kycSnapshots.forEach(snapshot => {
      kycCount += snapshot.size || 0;
    });
  }

  // Process CDD data
  let cddCount = 0;
  if (Array.isArray(cddSnapshots)) {
    cddSnapshots.forEach(snapshot => {
      cddCount += snapshot.size || 0;
    });
  }

  // Process recent submissions (limit to 5 most recent)
  const allSubmissions: any[] = [];
  if (Array.isArray(recentSnapshots)) {
    recentSnapshots.forEach((snapshot, index) => {
      if (snapshot && snapshot.docs) {
        const collectionName = recentCollections[index];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.timestamp) {
            try {
              let timestamp;
              if (data.timestamp.toDate) {
                timestamp = data.timestamp.toDate();
              } else if (typeof data.timestamp === 'string') {
                timestamp = new Date(data.timestamp);
              } else {
                timestamp = new Date();
              }
              
              allSubmissions.push({
                id: doc.id,
                collection: collectionName,
                formType: data.formType || collectionName,
                timestamp,
                submittedBy: data.submittedBy || data.email || 'Unknown',
                status: data.status || null
              });
            } catch (error) {
              // Skip invalid timestamps
            }
          }
        });
      }
    });
  }

  // Sort by timestamp and take top 5
  const recentSubmissions = allSubmissions
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return {
    totalUsers,
    totalSubmissions: kycCount + cddCount + claimsCount,
    pendingClaims: pendingCount,
    approvedClaims: approvedCount,
    kycForms: kycCount,
    cddForms: cddCount,
    claimsForms: claimsCount,
    recentSubmissions,
    monthlyData: []
  };
};

// Fetch monthly submission data with parallel requests
const fetchMonthlyData = async (userRole: string): Promise<Array<{ month: string; submissions: number }>> => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  const collections = getCollectionsForRole(userRole);
  const monthlyData: { [key: string]: number } = {};
  
  // Initialize last 6 months with 0 submissions
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    monthlyData[monthKey] = 0;
  }

  // Fetch data from all collections in parallel
  const collectionPromises = collections.map(async (collectionName) => {
    try {
      // Simplified query without where clauses to avoid index requirements
      const snapshot = await getDocs(collection(db, collectionName));
      
      const monthCounts: { [key: string]: number } = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let timestamp;
        
        // Handle different timestamp formats
        if (data.timestamp?.toDate) {
          timestamp = data.timestamp.toDate();
        } else if (data.timestamp?.seconds) {
          timestamp = new Date(data.timestamp.seconds * 1000);
        } else if (data.timestamp) {
          timestamp = new Date(data.timestamp);
        } else {
          return; // Skip if no valid timestamp
        }
        
        // Filter client-side for last 6 months
        if (timestamp >= sixMonthsAgo && timestamp <= now) {
          const monthKey = timestamp.toLocaleDateString('en-US', { month: 'short' });
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
      });
      
      return monthCounts;
    } catch (error) {
      console.log(`Collection ${collectionName} not found or error:`, error);
      return {};
    }
  });

  // Wait for all collections to be processed
  const allMonthCounts = await Promise.all(collectionPromises);
  
  // Merge all month counts
  allMonthCounts.forEach(monthCounts => {
    Object.keys(monthCounts).forEach(month => {
      if (monthlyData.hasOwnProperty(month)) {
        monthlyData[month] += monthCounts[month];
      }
    });
  });

  // Convert to array format for chart and sort chronologically
  const monthOrder = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOrder.push(date.toLocaleDateString('en-US', { month: 'short' }));
  }
  
  return monthOrder.map(month => ({
    month,
    submissions: monthlyData[month] || 0
  }));
};

// React Query hooks
export const useAdminDashboardStats = (userRole: string) => {
  return useQuery({
    queryKey: ['adminDashboardStats', userRole],
    queryFn: () => fetchDashboardStats(userRole),
    enabled: !!userRole,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // 1 second retry delay
  });
};

export const useMonthlySubmissionData = (userRole: string) => {
  return useQuery({
    queryKey: ['monthlySubmissionData', userRole],
    queryFn: () => fetchMonthlyData(userRole),
    enabled: !!userRole,
    staleTime: 1000 * 60 * 15, // 15 minutes cache (changes less frequently)
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // 1 second retry delay
  });
};