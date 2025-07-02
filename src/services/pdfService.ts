
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  data: Record<string, any>;
  attachments?: Array<{ name: string; url: string }>;
}

export const generateFormPDF = async (options: PDFOptions): Promise<Blob> => {
  const pdf = new jsPDF();
  
  // Add logo
  if (options.logoUrl) {
    try {
      pdf.addImage(options.logoUrl, 'PNG', 10, 10, 30, 15);
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }
  
  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(139, 69, 19); // burgundy
  pdf.text(options.title, 10, 35);
  
  if (options.subtitle) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(options.subtitle, 10, 45);
  }
  
  // Add form data
  let yPosition = options.subtitle ? 55 : 45;
  pdf.setFontSize(12);
  
  Object.entries(options.data).forEach(([key, value]) => {
    if (value && typeof value !== 'object') {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      pdf.setFont(undefined, 'bold');
      pdf.text(`${label}:`, 10, yPosition);
      pdf.setFont(undefined, 'normal');
      pdf.text(String(value), 60, yPosition);
      yPosition += 8;
      
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }
    }
  });
  
  // Add attachments list
  if (options.attachments && options.attachments.length > 0) {
    yPosition += 10;
    pdf.setFont(undefined, 'bold');
    pdf.text('Attachments:', 10, yPosition);
    pdf.setFont(undefined, 'normal');
    yPosition += 8;
    
    options.attachments.forEach(attachment => {
      pdf.text(`• ${attachment.name}`, 15, yPosition);
      yPosition += 6;
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
