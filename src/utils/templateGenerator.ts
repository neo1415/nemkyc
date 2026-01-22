import * as XLSX from 'xlsx';

/**
 * Template headers for Individual client identity collection
 * Based on Requirements 17.3 and 18.1-18.4
 */
export const INDIVIDUAL_TEMPLATE_HEADERS = [
  'Policy Number',      // Required for IES integration - FIRST COLUMN
  'Title',
  'First Name',
  'Last Name',
  'Phone Number',
  'Email',
  'Address',
  'Gender',
  'Date of Birth',      // Optional
  'Occupation',         // Optional
  'Nationality',        // Optional
  'BVN',               // Required for validation
  'NIN'                // Optional - if already available
];

/**
 * Template headers for Corporate client identity collection
 * Based on Requirements 17.4 and 18.5-18.9
 */
export const CORPORATE_TEMPLATE_HEADERS = [
  'Policy Number',          // Required for IES integration - FIRST COLUMN
  'Company Name',
  'Company Address',
  'Email Address',
  'Company Type',
  'Phone Number',
  'Registration Number',    // Required for corporate verification
  'Registration Date',      // Required for corporate verification
  'Business Address',       // Required for corporate verification
  'CAC'                    // Optional - if already available
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
 */
export function downloadTemplate(type: 'individual' | 'corporate'): void {
  const blob = generateExcelTemplate(type);
  const filename = type === 'individual' 
    ? 'NEM_Individual_Template.xlsx' 
    : 'NEM_Corporate_Template.xlsx';
  
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
