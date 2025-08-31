import React from 'react';
import jsPDF from 'jspdf';
import { FORM_MAPPINGS, FormField, FormSection } from '../../config/formMappings';
import logoImage from '../../../public/Nem-insurance-Logo.jpg';

export interface PDFSubmissionData {
  [key: string]: any;
  formType?: string;
  policyNumber?: string;
  periodOfCoverFrom?: string;
  periodOfCoverTo?: string;
  collection?: string;
}

export interface PDFBlueprintField {
  key: string;
  label: string;
  type: FormField['type'];
  section: string;
  conditional?: {
    dependsOn: string;
    value: string;
  };
}

export interface PDFBlueprintSection {
  title: string;
  fields: PDFBlueprintField[];
}

export interface PDFBlueprint {
  title: string;
  sections: PDFBlueprintSection[];
  specialHandling?: {
    rentAssuranceNote?: boolean;
    directorHandling?: boolean;
  };
}

// Immutable letterhead content
const LETTERHEAD = {
  company: 'NEM Insurance Plc',
  address: '199, IKORODU ROAD, OBANIKORO, LAGOS',
  contact: 'PO Box 654 Marina • Tel: 01-448956-09; 01 4489570',
  phones: '+2348023509846 • +2348035629237',
  emails: 'Email: nem@nem-insurance.com • claims@nem-insurance.com'
};

const IMPORTANT_NOTICE = [
  'Filled by the "Insured" named on the policy schedule.',
  'Use CAPITAL LETTERS; must be signed by the Insured; all * items required.',
  'Issue of this form does not imply admission of liability.'
];

const CLAIMS_PROCEDURE = [
  'Notify NEM Insurance immediately.',
  'Additional documents/clarifications may be requested depending on claim requirements.',
  'For claim status enquiries call 01 448 9570.',
  'NEM Insurance Plc. is regulated by NAICOM.',
  'NEM Insurance Plc. reserves the right to refute any fraudulent claims.'
];

const DATA_PRIVACY = [
  'Personal data is used solely for the business contract and to send product/service updates.',
  'Data is handled per Nigeria Data Protection Regulation 2019 with appropriate security.',
  'Data isn\'t shared/sold to third parties without consent unless required by law/regulator.'
];

const DECLARATION = [
  'Information provided is true; false/fraudulent statements can cancel policy/forfeit claim.',
  'Insured agrees to provide additional information if required.',
  'Insured agrees to submit all requested documents; delays due to non-fulfillment are not NEM\'s responsibility.'
];

// System fields to exclude from PDF
const EXCLUDED_FIELDS = [
  'id', '_id', 'formId', 'status', 'createdAt', 'updatedAt', 'submittedAt', 
  'timestamp', '__v', 'collection', 'queueId', 'requestId'
];

// File fields to handle as attachments only
const FILE_FIELDS = [
  'identificationUrl', 'cacCertificateUrl', 'memoOfAssociationUrl', 
  'articlesOfAssociationUrl', 'certificateOfIncorporationUrl', 'taxClearanceUrl',
  'auditedAccountsUrl', 'boardResolutionUrl', 'signatureCardUrl', 'rentAgreement',
  'demandNote', 'quitNotice', 'fireBrigadeReport', 'picturesOfLoss', 'policeReport',
  'additionalDocuments'
];

export class DynamicPDFGenerator {
  private pdf: jsPDF;
  private yPosition: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private pageWidth: number = 210; // A4 width in mm
  private margin: number = 20;
  private blueprint: PDFBlueprint;
  private submissionData: PDFSubmissionData;

  constructor(submissionData: PDFSubmissionData) {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.submissionData = submissionData;
    this.blueprint = this.generateBlueprint(submissionData);
  }

  private generateBlueprint(data: PDFSubmissionData): PDFBlueprint {
    // Detect form type from data
    const formType = this.detectFormType(data);
    console.log('PDF Generator: Detected form type:', formType);

    // Try to get mapping from form mappings
    const mapping = FORM_MAPPINGS[formType];
    if (mapping) {
      return this.convertMappingToBlueprint(mapping, formType);
    }

    // Fallback to generic blueprint
    return this.generateGenericBlueprint(data);
  }

  private detectFormType(data: PDFSubmissionData): string {
    // Check explicit form type fields
    if (data.formType) {
      const formType = data.formType.toLowerCase();
      if (formType.includes('money insurance') || formType.includes('money-insurance')) {
        return 'money-insurance-claims';
      }
      if (formType.includes('rent assurance') || formType.includes('rent-assurance')) {
        return 'rent-assurance-claims';
      }
    }

    // Check collection name
    if (data.collection) {
      return data.collection;
    }

    // Heuristic detection based on field presence
    if (data.moneyLocation || data.amountInSafe || data.discovererName) {
      return 'money-insurance-claims';
    }
    if (data.rentDueDate || data.nameOfLandlord || data.amountDefaulted) {
      return 'rent-assurance-claims';
    }
    if (data.registrationNumber || data.vehicleUsage) {
      return 'motor-claims';
    }
    if (data.premisesAddress && data.dateOfTheft) {
      return 'burglary-claims';
    }

    return 'generic-form';
  }

  private convertMappingToBlueprint(mapping: any, formType: string): PDFBlueprint {
    const blueprint: PDFBlueprint = {
      title: mapping.title || formType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      sections: mapping.sections.map((section: any) => ({
        title: section.title,
        fields: section.fields
          .filter((field: FormField) => !EXCLUDED_FIELDS.includes(field.key))
          .map((field: FormField) => ({
            key: field.key,
            label: field.label,
            type: field.type,
            section: section.title,
            conditional: field.conditional
          }))
      })).filter((section: PDFBlueprintSection) => section.fields.length > 0),
      specialHandling: {
        rentAssuranceNote: formType === 'rent-assurance-claims',
        directorHandling: formType.includes('corporate') || formType.includes('cdd')
      }
    };

    return blueprint;
  }

  private generateGenericBlueprint(data: PDFSubmissionData): PDFBlueprint {
    const fields: PDFBlueprintField[] = [];
    
    Object.keys(data).forEach(key => {
      if (!EXCLUDED_FIELDS.includes(key) && !FILE_FIELDS.includes(key)) {
        fields.push({
          key,
          label: this.formatFieldLabel(key),
          type: this.inferFieldType(key, data[key]),
          section: 'Form Data'
        });
      }
    });

    return {
      title: 'NEM Insurance Form',
      sections: [
        {
          title: 'Form Data',
          fields
        }
      ]
    };
  }

  private formatFieldLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private inferFieldType(key: string, value: any): FormField['type'] {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (key.toLowerCase().includes('email')) return 'email';
    if (key.toLowerCase().includes('date')) return 'date';
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('value')) return 'currency';
    if (typeof value === 'string' && value.length > 100) return 'textarea';
    return 'text';
  }

  public async generatePDF(): Promise<Blob> {
    try {
      await this.addHeader();
      this.addTitle();
      this.addPolicyMeta();
      await this.addFormContent();
      this.addFooterBlocks();
      return this.pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  private async addHeader(): Promise<void> {
    try {
      // Add logo - convert to base64 if needed
      this.pdf.addImage(logoImage, 'JPEG', this.margin, 10, 25, 20);
    } catch (error) {
      console.warn('Failed to add logo:', error);
      // Add text logo as fallback
      this.pdf.setFontSize(14);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('NEM', this.margin, 15);
    }

    // Company identity block
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(139, 69, 19); // Burgundy
    this.pdf.text(LETTERHEAD.company, 55, 15);

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(LETTERHEAD.address, 55, 20);
    this.pdf.text(LETTERHEAD.contact, 55, 24);
    this.pdf.text(LETTERHEAD.phones, 55, 28);
    this.pdf.text(LETTERHEAD.emails, 55, 32);

    this.yPosition = 45;
  }

  private addTitle(): void {
    this.pdf.setFontSize(16);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(139, 69, 19);
    const title = this.blueprint.title.toUpperCase();
    const titleWidth = this.pdf.getTextWidth(title);
    const centerX = (this.pageWidth - titleWidth) / 2;
    this.pdf.text(title, centerX, this.yPosition);
    this.yPosition += 15;
  }

  private addPolicyMeta(): void {
    const policyNumber = this.submissionData.policyNumber || '';
    const fromDate = this.formatDate(this.submissionData.periodOfCoverFrom);
    const toDate = this.formatDate(this.submissionData.periodOfCoverTo);

    // Policy meta box (top-right)
    const boxX = this.pageWidth - 80;
    const boxY = this.yPosition - 5;
    
    this.pdf.setDrawColor(139, 69, 19);
    this.pdf.rect(boxX, boxY, 70, 25);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Policy Number:', boxX + 2, boxY + 6);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(policyNumber || '_____________________', boxX + 2, boxY + 10);
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Period of Cover:', boxX + 2, boxY + 16);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(`${fromDate} — ${toDate}`, boxX + 2, boxY + 20);

    this.yPosition += 30;
  }

  private async addFormContent(): Promise<void> {
    this.pdf.setTextColor(0, 0, 0);

    for (const section of this.blueprint.sections) {
      // Skip system sections in PDF
      if (section.title.toLowerCase().includes('system') || 
          section.title.toLowerCase().includes('file upload')) {
        continue;
      }

      await this.addSection(section);
    }

    // Add attachments if any file fields exist
    await this.addAttachments();
  }

  private async addSection(section: PDFBlueprintSection): Promise<void> {
    this.checkPageBreak(20);

    // Section header
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(139, 69, 19);
    this.pdf.text(section.title, this.margin, this.yPosition);
    this.yPosition += 8;

    // Section background
    this.pdf.setFillColor(248, 249, 250);
    this.pdf.rect(this.margin - 2, this.yPosition - 6, this.pageWidth - (this.margin * 2) + 4, section.fields.length * 8 + 10, 'F');

    this.pdf.setTextColor(0, 0, 0);

    for (const field of section.fields) {
      if (this.shouldShowField(field)) {
        await this.addField(field);
      }
    }

    this.yPosition += 8;
  }

  private shouldShowField(field: PDFBlueprintField): boolean {
    if (!field.conditional) return true;
    
    const dependentValue = this.submissionData[field.conditional.dependsOn];
    return dependentValue === field.conditional.value || 
           (field.conditional.value === 'true' && dependentValue === true) ||
           (field.conditional.value === 'false' && dependentValue === false);
  }

  private async addField(field: PDFBlueprintField): Promise<void> {
    this.checkPageBreak(12);

    const value = this.submissionData[field.key];

    if (field.type === 'array' && field.key === 'directors') {
      await this.addDirectorsArray(value);
    } else if (field.type === 'array') {
      await this.addArrayField(field.label, value);
    } else {
      await this.addRegularField(field.label, value, field.type);
    }
  }

  private async addDirectorsArray(directors: any[]): Promise<void> {
    if (!Array.isArray(directors) || directors.length === 0) {
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('Directors:', this.margin, this.yPosition);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text('N/A', this.margin + 70, this.yPosition);
      this.yPosition += 6;
      return;
    }

    directors.forEach((director, index) => {
      this.checkPageBreak(20);
      
      this.pdf.setFontSize(11);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.setTextColor(139, 69, 19);
      this.pdf.text(`Director ${index + 1}`, this.margin, this.yPosition);
      this.yPosition += 8;

      this.pdf.setFontSize(10);
      this.pdf.setTextColor(0, 0, 0);

      Object.entries(director).forEach(([key, value]) => {
        this.checkPageBreak(6);
        const label = this.formatFieldLabel(key);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.text(`${label}:`, this.margin + 5, this.yPosition);
        this.pdf.setFont(undefined, 'normal');
        
        const displayValue = this.formatValue(value, 'text');
        const lines = this.pdf.splitTextToSize(displayValue, 90);
        this.pdf.text(lines, this.margin + 75, this.yPosition);
        this.yPosition += Math.max(lines.length * 4, 6);
      });
      this.yPosition += 6;
    });
  }

  private async addArrayField(label: string, value: any[]): Promise<void> {
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(`${label}:`, this.margin, this.yPosition);
    
    if (!Array.isArray(value) || value.length === 0) {
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text('N/A', this.margin + 70, this.yPosition);
      this.yPosition += 6;
      return;
    }

    this.yPosition += 6;

    value.forEach((item, index) => {
      this.checkPageBreak(8);
      this.pdf.setFont(undefined, 'normal');
      const itemText = typeof item === 'object' ? JSON.stringify(item) : String(item);
      const lines = this.pdf.splitTextToSize(`${index + 1}. ${itemText}`, 130);
      this.pdf.text(lines, this.margin + 5, this.yPosition);
      this.yPosition += lines.length * 5;
    });
  }

  private async addRegularField(label: string, value: any, type: FormField['type']): Promise<void> {
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(`${label}:`, this.margin, this.yPosition);
    this.pdf.setFont(undefined, 'normal');

    const displayValue = this.formatValue(value, type);
    
    if (type === 'textarea' || displayValue.length > 50) {
      this.yPosition += 5;
      const lines = this.pdf.splitTextToSize(displayValue, 150);
      this.pdf.text(lines, this.margin + 5, this.yPosition);
      this.yPosition += lines.length * 5;
    } else {
      const lines = this.pdf.splitTextToSize(displayValue, 90);
      this.pdf.text(lines, this.margin + 70, this.yPosition);
      this.yPosition += Math.max(lines.length * 4, 6);
    }
  }

  private formatValue(value: any, type: FormField['type']): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    switch (type) {
      case 'date':
        return this.formatDate(value);
      case 'currency':
        return this.formatCurrency(value);
      case 'boolean':
        return value ? '☑ Yes ☐ No' : '☐ Yes ☑ No';
      default:
        return String(value);
    }
  }

  private formatDate(date: any): string {
    if (!date) return '';
    try {
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString('en-GB');
      }
      if (date instanceof Date) {
        return date.toLocaleDateString('en-GB');
      }
      if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-GB');
        }
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
    }
    return String(date);
  }

  private formatCurrency(amount: any): string {
    if (!amount && amount !== 0) return '₦ 0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return String(amount);
    return `₦ ${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private async addAttachments(): Promise<void> {
    const attachments: string[] = [];
    
    FILE_FIELDS.forEach(field => {
      const value = this.submissionData[field];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            attachments.push(`${this.formatFieldLabel(field)} ${index + 1}`);
          });
        } else {
          attachments.push(this.formatFieldLabel(field));
        }
      }
    });

    if (attachments.length > 0) {
      this.checkPageBreak(20);
      
      this.pdf.setFontSize(12);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.setTextColor(139, 69, 19);
      this.pdf.text('Attachments', this.margin, this.yPosition);
      this.yPosition += 8;

      this.pdf.setFontSize(10);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont(undefined, 'normal');

      attachments.forEach(attachment => {
        this.checkPageBreak(6);
        this.pdf.text(`• ${attachment}`, this.margin + 5, this.yPosition);
        this.yPosition += 6;
      });
      this.yPosition += 8;
    }
  }

  private addFooterBlocks(): void {
    // Important Notice
    this.addFooterBlock('Important Notice', IMPORTANT_NOTICE);
    
    // Claims Procedure  
    this.addFooterBlock('Claims Procedure', CLAIMS_PROCEDURE);
    
    // Data Privacy
    this.addFooterBlock('Data Privacy Statement', DATA_PRIVACY);
    
    // Rent Assurance Special Note
    if (this.blueprint.specialHandling?.rentAssuranceNote) {
      this.addRentAssuranceNote();
    }
    
    // Declaration and Signature
    this.addDeclarationAndSignature();
  }

  private addFooterBlock(title: string, content: string[]): void {
    this.checkPageBreak(content.length * 5 + 15);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(139, 69, 19);
    this.pdf.text(title, this.margin, this.yPosition);
    this.yPosition += 6;

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    content.forEach(item => {
      this.checkPageBreak(5);
      this.pdf.text(`• ${item}`, this.margin + 3, this.yPosition);
      this.yPosition += 5;
    });
    this.yPosition += 8;
  }

  private addRentAssuranceNote(): void {
    this.checkPageBreak(20);
    
    const insuredName = this.submissionData.nameOfInsured || '_____________';
    const address = this.submissionData.address || '_____________';
    const claimAmount = this.formatCurrency(this.submissionData.amountDefaulted);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    const noteText = `I ${insuredName} of ${address} do hereby warrant the truth of the answers given above and claim for loss amounting in all to ${claimAmount}. Dated this _____ day of _____ 20___.`;
    
    const lines = this.pdf.splitTextToSize(noteText, this.pageWidth - (this.margin * 2));
    this.pdf.text(lines, this.margin, this.yPosition);
    this.yPosition += lines.length * 5 + 10;
    
    this.pdf.text('Signature of Insured: _________________________________', this.margin, this.yPosition);
    this.yPosition += 10;
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Note: attach a copy of the rent agreement and demand note on renewal and/or quit notice.', this.margin, this.yPosition);
    this.yPosition += 10;
  }

  private addDeclarationAndSignature(): void {
    // Ensure declaration stays on same page
    const requiredSpace = 60;
    this.checkPageBreak(requiredSpace, true);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(139, 69, 19);
    this.pdf.text('Declaration', this.margin, this.yPosition);
    this.yPosition += 8;

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    DECLARATION.forEach((item, index) => {
      this.pdf.text(`${index + 1}. ${item}`, this.margin, this.yPosition);
      this.yPosition += 6;
    });

    this.yPosition += 10;

    // Signature lines
    this.pdf.setFontSize(10);
    this.pdf.text('Signature of Policyholder: _________________________________', this.margin, this.yPosition);
    this.pdf.text('Date: _______________', this.pageWidth - 60, this.yPosition);
    this.yPosition += 15;
  }

  private checkPageBreak(requiredSpace: number, keepTogether: boolean = false): void {
    if (this.yPosition + requiredSpace > this.pageHeight - this.margin) {
      this.addPageFooter();
      this.pdf.addPage();
      this.yPosition = this.margin;
    }
  }

  private addPageFooter(): void {
    const pageNum = this.pdf.getNumberOfPages();
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Page ${pageNum}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
    this.pdf.text('NEM Insurance Plc', this.pageWidth / 2, this.pageHeight - 6, { align: 'center' });
  }
}

// React component wrapper
export const PDFGeneratorComponent: React.FC<{ submissionData: PDFSubmissionData }> = ({ submissionData }) => {
  const generateAndDownload = async () => {
    try {
      const generator = new DynamicPDFGenerator(submissionData);
      const pdfBlob = await generator.generatePDF();
      
      // Generate filename
      const formType = submissionData.formType || 'form';
      const name = submissionData.companyName || submissionData.nameOfInsured || submissionData.fullName || 'submission';
      const filename = `${name.replace(/\s+/g, '-')}-${formType.replace(/\s+/g, '-')}.pdf`;
      
      // Download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  };

  return null; // This is a utility component
};

export default DynamicPDFGenerator;