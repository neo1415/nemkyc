
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

export const generateFormPDF = async (options: PDFOptions): Promise<Blob> => {
  const pdf = new jsPDF();
  
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
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(139, 69, 19); // burgundy
  pdf.text('NEM Insurance', 55, 18);
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('NEM Insurance Plc', 55, 24);
  pdf.text('199, Ikorodu Road, Obanikoro Lagos', 55, 28);
  
  // Add title
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(139, 69, 19);
  pdf.text(options.title, 15, 45);
  
  if (options.subtitle) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(options.subtitle, 15, 55);
  }
  
  // Add form data
  let yPosition = options.subtitle ? 65 : 55;
  pdf.setFontSize(10);
  
  // Use mapping if available, otherwise fallback to original logic
  if (options.mapping) {
    options.mapping.sections.forEach((section: any) => {
      // Section header
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(139, 69, 19);
      pdf.text(section.name || 'Section', 15, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      section.fields.forEach((field: any) => {
        const value = options.data[field.key];
        if (value !== undefined && value !== null && value !== '') {
          if (field.type === 'array' && field.key === 'directors') {
            // Handle directors array
            if (Array.isArray(value) && value.length > 0) {
              pdf.setFont(undefined, 'bold');
              pdf.text('Directors:', 15, yPosition);
              yPosition += 8;
              
              value.forEach((director: any, index: number) => {
                pdf.setFont(undefined, 'bold');
                pdf.text(`Director ${index + 1}:`, 20, yPosition);
                yPosition += 6;
                
                Object.entries(director).forEach(([dirKey, dirValue]) => {
                  if (dirValue) {
                    const dirLabel = dirKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    pdf.setFont(undefined, 'normal');
                    pdf.text(`   ${dirLabel}: ${String(dirValue)}`, 25, yPosition);
                    yPosition += 5;
                  }
                });
                yPosition += 3;
              });
            }
          } else {
            // Handle regular fields
            pdf.setFont(undefined, 'bold');
            pdf.text(`${field.label}:`, 15, yPosition);
            pdf.setFont(undefined, 'normal');
            
            let displayValue = String(value);
            if (field.key.toLowerCase().includes('date') && value instanceof Date) {
              displayValue = value.toLocaleDateString();
            } else if (field.key.toLowerCase().includes('date') && typeof value === 'string' && value.includes('T')) {
              displayValue = new Date(value).toLocaleDateString();
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            } else if (field.type === 'file' && typeof value === 'string') {
              displayValue = value.includes('firebase') ? 'File Attached' : displayValue;
            }
            
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
            pdf.setFont(undefined, 'normal');
            pdf.text(`• ${String(item)}`, 20, yPosition);
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
        pdf.setFont(undefined, 'bold');
        pdf.text(`${label}:`, 15, yPosition);
        pdf.setFont(undefined, 'normal');
        
        // Format value based on type
        let displayValue = String(value);
        if (key.toLowerCase().includes('date') && value instanceof Date) {
          displayValue = value.toLocaleDateString();
        } else if (key.toLowerCase().includes('date') && typeof value === 'string' && value.includes('T')) {
          displayValue = new Date(value).toLocaleDateString();
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'Yes' : 'No';
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
    pdf.setFont(undefined, 'bold');
    pdf.text('Attachments:', 15, yPosition);
    pdf.setFont(undefined, 'normal');
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
  
  return pdf.output('blob');
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
