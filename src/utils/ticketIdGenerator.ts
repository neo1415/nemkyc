/**
 * Ticket ID Generator Utility
 * 
 * Generates unique ticket IDs for form submissions with format: PREFIX-XXXXXXXX
 * where PREFIX is a 3-letter form type code and XXXXXXXX is an 8-digit number.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Form type to prefix mapping
 * Requirements: 3.2 - Use specific prefixes for each form type
 */
export const FORM_TYPE_PREFIXES: Record<string, string> = {
  'Motor Claim': 'MOT',
  'Fire Special Perils Claim': 'FIR',
  'Burglary Claim': 'BUR',
  'All Risk Claim': 'ALL',
  'Goods In Transit Claim': 'GIT',
  'Money Insurance Claim': 'MON',
  'Public Liability Claim': 'PUB',
  'Employers Liability Claim': 'EMP',
  'Group Personal Accident Claim': 'GPA',
  'Fidelity Guarantee Claim': 'FID',
  'Rent Assurance Claim': 'REN',
  'Contractors Plant Machinery Claim': 'CPM',
  'Combined GPA Employers Liability Claim': 'COM',
  'Professional Indemnity Claim': 'PRO',
  'Individual KYC': 'IKY',
  'Corporate KYC': 'CKY',
  'Individual CDD': 'ICD',
  'Corporate CDD': 'CCD',
  'Brokers CDD': 'BCD',
  'Agents CDD': 'ACD',
  'Partners CDD': 'PCD'
};

/**
 * Default prefix for unknown form types
 */
export const DEFAULT_PREFIX = 'GEN';

/**
 * Ticket ID format regex pattern
 * Format: 3 uppercase letters, hyphen, 8 digits
 * Requirements: 3.1
 */
export const TICKET_ID_PATTERN = /^[A-Z]{3}-\d{8}$/;

export interface TicketIdResult {
  ticketId: string;
  prefix: string;
  number: string;
}

/**
 * Gets the prefix for a given form type
 * @param formType - The form type name
 * @returns The 3-letter prefix for the form type
 */
export function getFormTypePrefix(formType: string): string {
  // Use Object.prototype.hasOwnProperty.call to avoid prototype pollution issues
  if (Object.prototype.hasOwnProperty.call(FORM_TYPE_PREFIXES, formType)) {
    return FORM_TYPE_PREFIXES[formType];
  }
  return DEFAULT_PREFIX;
}

/**
 * Generates a random 8-digit number string
 * @returns An 8-digit string (10000000 to 99999999)
 */
export function generateRandomNumber(): string {
  const min = 10000000;
  const max = 99999999;
  const randomNumber = Math.floor(min + Math.random() * (max - min + 1));
  return randomNumber.toString();
}

/**
 * Creates a ticket ID from prefix and number
 * @param prefix - The 3-letter prefix
 * @param number - The 8-digit number string
 * @returns The formatted ticket ID
 */
export function formatTicketId(prefix: string, number: string): string {
  return `${prefix}-${number}`;
}

/**
 * Validates if a string matches the ticket ID format
 * @param ticketId - The string to validate
 * @returns True if the string matches the ticket ID format
 */
export function isValidTicketIdFormat(ticketId: string): boolean {
  return TICKET_ID_PATTERN.test(ticketId);
}

/**
 * Generates a ticket ID result object (without uniqueness check)
 * @param formType - The form type name
 * @returns TicketIdResult with ticketId, prefix, and number
 */
export function generateTicketIdSync(formType: string): TicketIdResult {
  const prefix = getFormTypePrefix(formType);
  const number = generateRandomNumber();
  const ticketId = formatTicketId(prefix, number);
  
  return {
    ticketId,
    prefix,
    number
  };
}

/**
 * Collection names to check for ticket ID uniqueness
 */
const COLLECTIONS_TO_CHECK = [
  'motor-claims',
  'fire-claims',
  'burglary-claims',
  'all-risk-claims',
  'goods-in-transit-claims',
  'money-insurance-claims',
  'public-liability-claims',
  'employers-liability-claims',
  'group-personal-accident-claims',
  'fidelity-guarantee-claims',
  'rent-assurance-claims',
  'contractors-plant-machinery-claims',
  'combined-gpa-employers-liability-claims',
  'professional-indemnity',
  'Individual-kyc-form',
  'corporate-kyc-form',
  'individual-kyc',
  'corporate-kyc',
  'brokers-kyc',
  'agents-kyc',
  'partners-kyc'
];

/**
 * Checks if a ticket ID already exists in Firestore
 * @param ticketId - The ticket ID to check
 * @returns True if the ticket ID exists, false otherwise
 */
export async function checkTicketIdExists(ticketId: string): Promise<boolean> {
  for (const collectionName of COLLECTIONS_TO_CHECK) {
    try {
      const q = query(
        collection(db, collectionName),
        where('ticketId', '==', ticketId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return true;
      }
    } catch (error) {
      // Collection might not exist, continue checking others
      console.warn(`Error checking collection ${collectionName}:`, error);
    }
  }
  return false;
}

/**
 * Maximum number of retry attempts for generating a unique ticket ID
 */
const MAX_RETRY_ATTEMPTS = 10;

/**
 * Generates a unique ticket ID for a form submission
 * Checks against Firestore to ensure uniqueness
 * 
 * Requirements: 3.1, 3.2, 3.3
 * 
 * @param formType - The form type name
 * @returns Promise<TicketIdResult> with unique ticketId, prefix, and number
 * @throws Error if unable to generate unique ID after max retries
 */
export async function generateTicketId(formType: string): Promise<TicketIdResult> {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    const result = generateTicketIdSync(formType);
    
    // Check if this ticket ID already exists
    const exists = await checkTicketIdExists(result.ticketId);
    
    if (!exists) {
      return result;
    }
    
    attempts++;
    console.warn(`Ticket ID ${result.ticketId} already exists, retrying... (attempt ${attempts})`);
  }
  
  throw new Error(`Failed to generate unique ticket ID after ${MAX_RETRY_ATTEMPTS} attempts`);
}
