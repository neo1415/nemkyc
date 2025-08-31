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
 * Generate and download PDF from submission data
 * @param submissionData - The form submission data object
 * @param customFilename - Optional custom filename
 */
export const downloadDynamicPDF = async (
  submissionData: PDFSubmissionData, 
  customFilename?: string
): Promise<void> => {
  try {
    const pdfBlob = await generateDynamicPDF(submissionData);
    
    // Generate filename if not provided - include form type
    let filename = customFilename;
    if (!filename) {
      const name = submissionData.companyName || 
                   submissionData.nameOfInsured || 
                   submissionData.fullName || 
                   submissionData.firstName ||
                   'submission';
      const formType = submissionData.formType || 
                      submissionData.collection || 
                      'form';
      filename = `${name.replace(/\s+/g, '-')}-${formType.replace(/\s+/g, '-')}.pdf`;
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