
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  data: Record<string, any>;
  attachments?: Array<{ name: string; url: string }>;
  mapping?: any;
}

// System fields to exclude from PDF
const EXCLUDED_FIELDS = [
  'formId', 'id', 'collection', 'timestamp', 'createdAt', 'updatedAt', 'submittedAt', 
  'sn', 'S/N', 'serialNumber', 'rowNumber'
];

// File upload fields to exclude from PDF
const FILE_FIELDS = [
  'identificationUrl', 'cacCertificateUrl', 'memoOfAssociationUrl', 
  'articlesOfAssociationUrl', 'certificateOfIncorporationUrl', 'taxClearanceUrl',
  'auditedAccountsUrl', 'boardResolutionUrl', 'signatureCardUrl'
];

// Generate filename from form data
const generateFilename = (data: Record<string, any>, formType: string): string => {
  const name = data.companyName || data.fullName || data.firstName + ' ' + data.lastName || 'Unknown';
  return `${name}-${formType}.pdf`;
};

export const generateFormPDF = async (options: PDFOptions): Promise<Blob> => {
  const pdf = new jsPDF();
  
  // Fix font configuration to prevent number spacing issues
  pdf.setFont('helvetica', 'normal');
  
  // Add logo
  if (options.logoUrl) {
    try {
      pdf.addImage(options.logoUrl, 'PNG', 15, 10, 30, 15);
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }
  
  // Add company header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(139, 69, 19); // burgundy
  pdf.text('NEM Insurance', 55, 18);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('NEM Insurance Plc', 55, 24);
  pdf.text('199, Ikorodu Road, Obanikoro Lagos', 55, 28);
  
  // Add title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(139, 69, 19);
  pdf.text(options.title, 15, 45);
  
  if (options.subtitle) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(options.subtitle, 15, 55);
  }
  
  // Add form data
  let yPosition = options.subtitle ? 65 : 55;
  pdf.setFontSize(10);
  
  // Use mapping if available for structured PDF generation
  if (options.mapping) {
    options.mapping.sections.forEach((section: any) => {
      // Skip system information sections in PDF
      if (section.title && section.title.toLowerCase().includes('system')) {
        return;
      }
      
      // Section header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(139, 69, 19);
      const sectionName = String(section.title || section.name || 'Section');
      pdf.text(sectionName, 15, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      section.fields.forEach((field: any) => {
        // Skip excluded fields, file fields, and S/N type fields
        if (EXCLUDED_FIELDS.includes(field.key) || 
            FILE_FIELDS.includes(field.key) || 
            field.type === 'file' ||
            field.key.toLowerCase().includes('sn') ||
            field.key.toLowerCase().includes('serial') ||
            field.label?.toLowerCase().includes('s/n') ||
            field.label?.toLowerCase().includes('serial')) {
          return;
        }
        
        const value = options.data[field.key];
        
        if (field.type === 'array' && field.key === 'directors') {
          // Handle directors array with proper section titles
          if (Array.isArray(value) && value.length > 0) {
            value.forEach((director: any, index: number) => {
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(139, 69, 19);
              pdf.text(`Director ${index + 1}`, 15, yPosition);
              yPosition += 10;
              
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(0, 0, 0);
              
              Object.entries(director).forEach(([dirKey, dirValue]) => {
                const dirLabel = dirKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${dirLabel}:`, 15, yPosition);
                pdf.setFont('helvetica', 'normal');
                
                let displayValue = dirValue ? String(dirValue) : 'N/A';
                // Fix number formatting by ensuring proper string conversion
                if (typeof dirValue === 'number') {
                  displayValue = dirValue.toString();
                }
                const maxWidth = 130;
                const textLines = pdf.splitTextToSize(displayValue, maxWidth);
                pdf.text(textLines, 70, yPosition);
                yPosition += Math.max(textLines.length * 5, 6);
                
                if (yPosition > 270) {
                  pdf.addPage();
                  yPosition = 20;
                }
              });
              yPosition += 5;
            });
          } else {
            // Show N/A for empty directors array
            pdf.setFont('helvetica', 'bold');
            pdf.text('Directors:', 15, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text('N/A', 70, yPosition);
            yPosition += 6;
          }
        } else if (field.type === 'array') {
          // Handle other arrays
          pdf.setFont('helvetica', 'bold');
          const fieldLabel = String(field.label || field.key || 'Field');
          pdf.text(`${fieldLabel}:`, 15, yPosition);
          pdf.setFont('helvetica', 'normal');
          
          if (Array.isArray(value) && value.length > 0) {
            yPosition += 6;
            value.forEach((item: any, index: number) => {
              const itemText = typeof item === 'object' ? JSON.stringify(item) : String(item);
              const maxWidth = 130;
              const textLines = pdf.splitTextToSize(`${index + 1}. ${itemText}`, maxWidth);
              pdf.text(textLines, 20, yPosition);
              yPosition += textLines.length * 5;
            });
          } else {
            pdf.text('N/A', 70, yPosition);
            yPosition += 6;
          }
        } else {
          // Handle regular fields - show all fields, use N/A for empty values
          pdf.setFont('helvetica', 'bold');
          const fieldLabel = String(field.label || field.key || 'Field');
          pdf.text(`${fieldLabel}:`, 15, yPosition);
          pdf.setFont('helvetica', 'normal');
          
          // Format value - use N/A for empty values
          let displayValue = 'N/A';
          if (value !== null && value !== undefined && value !== '') {
            if (field.key.toLowerCase().includes('date') && value instanceof Date) {
              displayValue = value.toLocaleDateString();
            } else if (field.key.toLowerCase().includes('date') && typeof value === 'string' && value.includes('T')) {
              try {
                displayValue = new Date(value).toLocaleDateString();
              } catch {
                displayValue = String(value);
              }
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            } else if (typeof value === 'number') {
              // Fix number formatting to prevent spacing issues
              displayValue = value.toString();
            } else {
              displayValue = String(value);
            }
          }
          
          const maxWidth = 130;
          const textLines = pdf.splitTextToSize(displayValue, maxWidth);
          pdf.text(textLines, 70, yPosition);
          yPosition += Math.max(textLines.length * 5, 6);
        }
        
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      yPosition += 10;
    });
  } else {
    // Fallback to original logic
    Object.entries(options.data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Handle different data types
      if (Array.isArray(value)) {
        // Handle arrays (like witnesses, items, etc.)
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        pdf.setFont(undefined, 'bold');
        pdf.text(`${label}:`, 15, yPosition);
        yPosition += 8;
        
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            pdf.setFont(undefined, 'normal');
            pdf.text(`${index + 1}.`, 20, yPosition);
            yPosition += 6;
            
            Object.entries(item).forEach(([itemKey, itemValue]) => {
              if (itemValue !== undefined && itemValue !== null && itemValue !== '') {
                const itemLabel = itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                pdf.text(`   ${itemLabel}: ${String(itemValue)}`, 25, yPosition);
                yPosition += 5;
              }
            });
            yPosition += 3;
          } else {
            pdf.setFont('helvetica', 'normal');
            let itemText = String(item);
            if (typeof item === 'number') {
              itemText = item.toString();
            }
            pdf.text(`• ${itemText}`, 20, yPosition);
            yPosition += 6;
          }
          
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
        yPosition += 5;
      } else if (typeof value === 'object' && value !== null) {
        // Handle objects
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        pdf.setFont(undefined, 'bold');
        pdf.text(`${label}:`, 15, yPosition);
        yPosition += 8;
        
        Object.entries(value).forEach(([objKey, objValue]) => {
          if (objValue !== undefined && objValue !== null && objValue !== '') {
            const objLabel = objKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            pdf.setFont(undefined, 'normal');
            pdf.text(`   ${objLabel}: ${String(objValue)}`, 20, yPosition);
            yPosition += 6;
          }
        });
        yPosition += 5;
      } else {
        // Handle simple values
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, 15, yPosition);
        pdf.setFont('helvetica', 'normal');
        
        // Format value based on type
        let displayValue = String(value);
        if (key.toLowerCase().includes('date') && value instanceof Date) {
          displayValue = value.toLocaleDateString();
        } else if (key.toLowerCase().includes('date') && typeof value === 'string' && value.includes('T')) {
          displayValue = new Date(value).toLocaleDateString();
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'Yes' : 'No';
        } else if (typeof value === 'number') {
          // Fix number formatting to prevent spacing issues
          displayValue = value.toString();
        }
        
        // Wrap long text
        const maxWidth = 130;
        const textLines = pdf.splitTextToSize(displayValue, maxWidth);
        pdf.text(textLines, 70, yPosition);
        yPosition += textLines.length * 6;
      }
      
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
    }
    });
  }
  
  // Add attachments list
  if (options.attachments && options.attachments.length > 0) {
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Attachments:', 15, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += 8;
    
    options.attachments.forEach(attachment => {
      pdf.text(`• ${attachment.name}`, 20, yPosition);
      yPosition += 6;
      
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
    });
  }
  
  // Add Data Privacy Statement as footer
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  } else {
    yPosition += 20;
  }
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(139, 69, 19);
  pdf.text('Data Privacy Statement', 15, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  const privacyText = 'This form contains personal and confidential information. All data collected is processed in accordance with applicable data protection laws and NEM Insurance privacy policy. The information provided will be used solely for insurance purposes and will be kept confidential.';
  const privacyLines = pdf.splitTextToSize(privacyText, 170);
  pdf.text(privacyLines, 15, yPosition);
  
  return pdf.output('blob');
};

export const downloadPDF = (blob: Blob, filename: string, data: Record<string, any>, formType: string) => {
  const finalFilename = filename || generateFilename(data, formType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
