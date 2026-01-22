/**
 * Mock Verification Service
 * 
 * Simulates identity verification API responses for development and testing.
 * Provides realistic delays and response structures.
 */

interface NINVerificationResult {
  success: boolean;
  data?: {
    nin: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber?: string;
  };
  error?: string;
}

interface BVNVerificationResult {
  success: boolean;
  data?: {
    bvn: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber?: string;
  };
  error?: string;
}

interface CACVerificationResult {
  success: boolean;
  data?: {
    rcNumber: string;
    companyName: string;
    registrationDate: string;
    companyType: string;
    address: string;
  };
  error?: string;
}

/**
 * Simulate API delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock NIN Verification
 * 
 * Simulates Paystack NIN verification API.
 * Returns success if NIN is 11 digits and matches expected format.
 * 
 * @param nin - National Identity Number (11 digits)
 * @param expectedData - Expected customer data for validation
 */
export async function mockNINVerification(
  nin: string,
  expectedData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
  }
): Promise<NINVerificationResult> {
  // Simulate API delay (500ms - 2s)
  await delay(500 + Math.random() * 1500);

  // Validate NIN format
  if (!/^\d{11}$/.test(nin)) {
    return {
      success: false,
      error: 'Invalid NIN format. Must be 11 digits.',
    };
  }

  // Simulate 90% success rate
  if (Math.random() < 0.9) {
    // Generate mock data that matches expected data if provided
    const mockData = {
      nin,
      firstName: expectedData?.firstName || 'John',
      lastName: expectedData?.lastName || 'Doe',
      dateOfBirth: expectedData?.dateOfBirth || '1990-01-01',
      gender: expectedData?.gender || 'Male',
      phoneNumber: '08012345678',
    };

    return {
      success: true,
      data: mockData,
    };
  } else {
    // Simulate failure
    return {
      success: false,
      error: 'NIN not found in NIMC database.',
    };
  }
}

/**
 * Mock BVN Verification
 * 
 * Simulates BVN verification API.
 * Returns success if BVN is 11 digits.
 * 
 * @param bvn - Bank Verification Number (11 digits)
 * @param expectedData - Expected customer data for validation
 */
export async function mockBVNVerification(
  bvn: string,
  expectedData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  }
): Promise<BVNVerificationResult> {
  // Simulate API delay
  await delay(500 + Math.random() * 1500);

  // Validate BVN format
  if (!/^\d{11}$/.test(bvn)) {
    return {
      success: false,
      error: 'Invalid BVN format. Must be 11 digits.',
    };
  }

  // Simulate 90% success rate
  if (Math.random() < 0.9) {
    const mockData = {
      bvn,
      firstName: expectedData?.firstName || 'John',
      lastName: expectedData?.lastName || 'Doe',
      dateOfBirth: expectedData?.dateOfBirth || '1990-01-01',
      phoneNumber: '08012345678',
    };

    return {
      success: true,
      data: mockData,
    };
  } else {
    return {
      success: false,
      error: 'BVN not found in database.',
    };
  }
}

/**
 * Mock CAC Verification
 * 
 * Simulates CAC verification API.
 * Returns success if RC number matches expected format.
 * 
 * @param rcNumber - CAC Registration Number
 * @param expectedData - Expected company data for validation
 */
export async function mockCACVerification(
  rcNumber: string,
  expectedData?: {
    companyName?: string;
    registrationDate?: string;
  }
): Promise<CACVerificationResult> {
  // Simulate API delay
  await delay(500 + Math.random() * 1500);

  // Validate RC number format (basic check)
  if (!rcNumber || rcNumber.length < 5) {
    return {
      success: false,
      error: 'Invalid CAC registration number format.',
    };
  }

  // Simulate 85% success rate (CAC verification might be slightly less reliable)
  if (Math.random() < 0.85) {
    const mockData = {
      rcNumber,
      companyName: expectedData?.companyName || 'Sample Company Limited',
      registrationDate: expectedData?.registrationDate || '2020-01-01',
      companyType: 'Limited Liability Company',
      address: '123 Business Street, Lagos, Nigeria',
    };

    return {
      success: true,
      data: mockData,
    };
  } else {
    return {
      success: false,
      error: 'CAC registration number not found.',
    };
  }
}

/**
 * Mock field-level validation
 * 
 * Compares provided data with verified data and returns match results.
 * Used to simulate detailed validation responses.
 */
export function mockFieldValidation(
  providedData: Record<string, any>,
  verifiedData: Record<string, any>
): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  for (const key in providedData) {
    if (providedData[key] && verifiedData[key]) {
      // Simulate 95% match rate for provided fields
      results[key] = Math.random() < 0.95;
    }
  }

  return results;
}
