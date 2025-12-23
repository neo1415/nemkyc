import { DynamicPDFGenerator, PDFSubmissionData } from '../components/pdf/DynamicPDFGenerator';

/**
 * Generate PDF from submission data
 * @param submissionData - The form submission data object
 * @returns Promise<Blob> - The generated PDF as a blob
 */
export const generateDynamicPDF = async (submissionData: PDFSubmissionData): Promise<Blob> => {
  const generator = new DynamicPDFGenerator(submissionData);
  return await generator.generatePDF();
};

/**
 * Generate and download PDF from submission data with backend logging
 * @param submissionData - The form submission data object
 * @param customFilename - Optional custom filename
 */
export const downloadDynamicPDF = async (
  submissionData: PDFSubmissionData, 
  customFilename?: string
): Promise<void> => {
  try {
    // Log the download action to backend first
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const csrfResponse = await fetch(`${API_BASE_URL}/csrf-token`, {
        credentials: 'include',
      });
      const { csrfToken } = await csrfResponse.json();

      const timestamp = Date.now().toString();
      const nonce = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

      await fetch(`${API_BASE_URL}/api/pdf/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken,
          'x-timestamp': timestamp,
          'x-nonce': nonce,
        },
        credentials: 'include',
        body: JSON.stringify({
          formData: submissionData,
          formType: submissionData.formType || submissionData.collection || 'form',
          downloaderUid: 'current-user', // Should be actual user UID from auth context
          fileName: customFilename
        })
      });
    } catch (logError) {
      console.warn('Failed to log PDF download:', logError);
      // Continue with download even if logging fails
    }

    const pdfBlob = await generateDynamicPDF(submissionData);
    
    // Generate filename if not provided - include form type
    let filename = customFilename;
    if (!filename) {
      const primaryName = submissionData.companyName || 
                          submissionData.nameOfInsured || 
                          submissionData.insuredName ||
                          submissionData.policyHolderName ||
                          submissionData.fullName || 
                          ((submissionData.firstName && submissionData.lastName) ? `${submissionData.firstName} ${submissionData.lastName}` : undefined) ||
                          submissionData.firstName ||
                          submissionData.name ||
                          'submission';
      const formType = submissionData.formType || 
                      submissionData.collection || 
                      'form';
      filename = `${String(primaryName).trim().replace(/\s+/g, '-')}-${String(formType).trim().replace(/\s+/g, '-')}.pdf`;
    }
    
    // Ensure .pdf extension
    if (!filename.endsWith('.pdf')) {
      filename += '.pdf';
    }
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('PDF downloaded successfully:', filename);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw new Error('PDF download failed');
  }
};

/**
 * Create a PDF preview URL (for viewing in browser)
 * @param submissionData - The form submission data object
 * @returns Promise<string> - URL for the PDF blob
 */
export const createPDFPreviewURL = async (submissionData: PDFSubmissionData): Promise<string> => {
  const pdfBlob = await generateDynamicPDF(submissionData);
  return URL.createObjectURL(pdfBlob);
};

export default {
  generateDynamicPDF,
  downloadDynamicPDF,
  createPDFPreviewURL
};