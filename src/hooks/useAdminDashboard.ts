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

// Fetch dashboard statistics
const fetchDashboardStats = async (userRole: string): Promise<DashboardStats> => {
  const canViewUsers = userRole === 'super admin';
  const canViewClaims = ['claims', 'admin', 'super admin'].includes(userRole);
  const canViewKYCCDD = ['compliance', 'admin', 'super admin'].includes(userRole);

  let totalUsers = 0;
  let totalSubs = 0;
  let claimsCount = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let kycCount = 0;
  let cddCount = 0;

  // Total Users from userroles collection (super admin only)
  if (canViewUsers) {
    const usersSnapshot = await getDocs(collection(db, 'userroles'));
    totalUsers = usersSnapshot.size;
  }

  // Count claims collections for pending and approved (if user can view claims)
  if (canViewClaims) {
    const claimsCollections = [
      'motor-claims', 'burglary-claims', 'all-risk-claims', 'money-insurance-claims',
      'fidelity-guarantee-claims', 'fire-special-perils-claims', 'goods-in-transit-claims',
      'group-personal-accident-claims', 'employers-liability-claims', 'professional-indemnity-claims',
      'public-liability-claims', 'rent-assurance-claims', 'contractors-claims', 'combined-gpa-employers-liability-claims'
    ];

    for (const collectionName of claimsCollections) {
      try {
        const collectionSnapshot = await getDocs(collection(db, collectionName));
        claimsCount += collectionSnapshot.size;
        
        collectionSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'pending' || data.status === 'processing') {
            pendingCount++;
          }
          if (data.status === 'approved') {
            approvedCount++;
          }
        });
      } catch (error) {
        console.log(`Collection ${collectionName} not found or error:`, error);
      }
    }
  }

  // Count KYC and CDD Forms (if user can view KYC/CDD)
  if (canViewKYCCDD) {
    const kycCollections = ['Individual-kyc-form', 'corporate-kyc-form'];
    
    for (const collectionName of kycCollections) {
      try {
        const collectionSnapshot = await getDocs(collection(db, collectionName));
        kycCount += collectionSnapshot.size;
      } catch (error) {
        console.log(`Collection ${collectionName} not found or error:`, error);
      }
    }

    // Count CDD Forms
    const cddCollections = [
      'agents-kyc', 'brokers-kyc', 'corporate-kyc', 'individual-kyc', 'partners-kyc'
    ];
    
    for (const collectionName of cddCollections) {
      try {
        const collectionSnapshot = await getDocs(collection(db, collectionName));
        cddCount += collectionSnapshot.size;
      } catch (error) {
        console.log(`Collection ${collectionName} not found or error:`, error);
      }
    }
  }

  totalSubs = kycCount + cddCount + claimsCount;

  // Fetch recent submissions
  const allSubmissions: any[] = [];
  const collectionsToCheck = [];
  
  if (canViewKYCCDD) {
    collectionsToCheck.push(...['Individual-kyc-form', 'corporate-kyc-form', 'agents-kyc', 'brokers-kyc', 'corporate-kyc', 'individual-kyc', 'partners-kyc']);
  }
  if (canViewClaims) {
    collectionsToCheck.push(...[
      'motor-claims', 'burglary-claims', 'all-risk-claims', 'money-insurance-claims',
      'fidelity-guarantee-claims', 'fire-special-perils-claims', 'goods-in-transit-claims',
      'group-personal-accident-claims', 'employers-liability-claims', 'professional-indemnity-claims',
      'public-liability-claims', 'rent-assurance-claims', 'contractors-claims', 'combined-gpa-employers-liability-claims'
    ]);
  }

  for (const collectionName of collectionsToCheck) {
    try {
      const collectionSnapshot = await getDocs(collection(db, collectionName));
      collectionSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && data.timestamp.toDate) {
          try {
            allSubmissions.push({
              id: doc.id,
              collection: collectionName,
              formType: data.formType || collectionName,
              timestamp: data.timestamp.toDate(),
              submittedBy: data.submittedBy || data.email || 'Unknown',
              status: data.status || null
            });
          } catch (error) {
            console.log(`Error processing timestamp for document ${doc.id}:`, error);
          }
        }
      });
    } catch (error) {
      console.log(`Collection ${collectionName} not found or error:`, error);
    }
  }

  // Sort by timestamp descending and take top 5
  const recentSubmissions = allSubmissions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return {
    totalUsers,
    totalSubmissions: totalSubs,
    pendingClaims: pendingCount,
    approvedClaims: approvedCount,
    kycForms: kycCount,
    cddForms: cddCount,
    claimsForms: claimsCount,
    recentSubmissions,
    monthlyData: []
  };
};

// Fetch monthly submission data
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

  // Fetch data from all collections
  for (const collectionName of collections) {
    try {
      const q = query(
        collection(db, collectionName),
        where('timestamp', '>=', sixMonthsAgo),
        where('timestamp', '<=', now)
      );
      
      const snapshot = await getDocs(q);
      
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
        
        const monthKey = timestamp.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      });
    } catch (error) {
      console.log(`Collection ${collectionName} not found or error:`, error);
    }
  }

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
    staleTime: 1000 * 60 * 2, // 2 minutes for dashboard stats
  });
};

export const useMonthlySubmissionData = (userRole: string) => {
  return useQuery({
    queryKey: ['monthlySubmissionData', userRole],
    queryFn: () => fetchMonthlyData(userRole),
    enabled: !!userRole,
    staleTime: 1000 * 60 * 10, // 10 minutes for monthly data (changes less frequently)
  });
};