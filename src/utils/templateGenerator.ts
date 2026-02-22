import * as XLSX from 'xlsx';

/**
 * Template headers for Individual client identity collection
 * Based on Requirements 17.3 and 18.1-18.4
 * Order: Policy Number, First Name, Last Name, Date of Birth, Email, Gender, Phone Number, Address
 * Optional: BVN, Occupation, Nationality, NIN
 */
export const INDIVIDUAL_TEMPLATE_HEADERS = [
  'Policy Number',      // Required for IES integration - FIRST COLUMN
  'First Name',         // Required
  'Last Name',          // Required
  'Date of Birth',      // Required
  'Email',              // Required
  'Gender',             // Required
  'Phone Number',       // Required
  'Address',            // Required
  'BVN',                // Optional
  'Occupation',         // Optional
  'Nationality',        // Optional
  'NIN'                 // Optional - if already available
];

/**
 * Template headers for Corporate client identity collection
 * Based on Requirements 17.4 and 18.5-18.9
 * Order: Policy Number, Company Name, Registration Date, Company Type, Company Address, Email Address, Phone Number
 * Optional: CAC Number
 */
export const CORPORATE_TEMPLATE_HEADERS = [
  'Policy Number',          // Required for IES integration - FIRST COLUMN
  'Company Name',           // Required
  'Registration Date',      // Required for corporate verification
  'Company Type',           // Required
  'Company Address',        // Required
  'Email Address',          // Required
  'Phone Number',           // Required
  'CAC Number'              // Optional - if already available
];

/**
 * Generate an Excel template file with pre-filled headers
 * @param type - The type of template to generate ('individual' or 'corporate')
 * @returns Blob containing the Excel file
 */
export function generateExcelTemplate(type: 'individual' | 'corporate'): Blob {
  // Select appropriate headers based on template type
  const headers = type === 'individual' 
    ? INDIVIDUAL_TEMPLATE_HEADERS 
    : CORPORATE_TEMPLATE_HEADERS;
  
  // Create worksheet from array of arrays (headers in first row)
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  
  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  // Generate Excel file as array buffer
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  });
  
  // Create and return Blob with proper MIME type
  return new Blob(
    [excelBuffer], 
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
}

/**
 * Trigger download of the generated template file
 * @param type - The type of template to download
 * @param userName - Optional user name to include in filename
 */
export function downloadTemplate(type: 'individual' | 'corporate', userName?: string): void {
  const blob = generateExcelTemplate(type);
  
  // Format date as YYYY-MM-DD
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // Create filename with user name and date if provided
  const userPart = userName ? `${userName.replace(/\s+/g, '_')}_` : '';
  const typeLabel = type === 'individual' ? 'Individual' : 'Corporate';
  const filename = `${userPart}${typeLabel}_Template_${dateStr}.xlsx`;
  
  // Create temporary download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
