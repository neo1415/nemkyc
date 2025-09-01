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
  'This form should be filled in by the person named as the \'Insured\' on the policy schedule.',
  'Form is to be filled in CAPITAL LETTER and signed by the Insured. All asterisked (*) items must be filled to completion.',
  'The issue of this form does not imply admission of liability.'
];

const CLAIMS_PROCEDURE = [
  'NEM Insurance should be notified immediately.',
  'NEM Insurance may ask for additional documents and /or clarification if any, depending on the requirement of the claim.'
];

const DATA_PRIVACY = [
  'Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.',
  'Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.',
  'Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.'
];

const DECLARATION = [
  'I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.',
  'I/We agree to provide additional information to NEM Insurance, if required.',
  'I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirement.'
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

const BURGUNDY = { r: 128, g: 0, b: 32 };
const BURGUNDY_HEX = '#800020';
const setBurgundyText = (pdf: jsPDF) => pdf.setTextColor(BURGUNDY.r, BURGUNDY.g, BURGUNDY.b);
const setBurgundyDraw = (pdf: jsPDF) => pdf.setDrawColor(BURGUNDY.r, BURGUNDY.g, BURGUNDY.b);

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

  private addImportantNotice(): void {
    // Center the Important Notice box (60% width) with proper padding and dynamic height
    const contentPadding = 5;
    const boxWidth = (this.pageWidth - (this.margin * 2)) * 0.6;
    const boxStartX = this.margin + ((this.pageWidth - (this.margin * 2)) - boxWidth) / 2;

    // Prepare content to measure height
    const contentFontSize = 10;
    const lineHeight = 4.2;

    // Measure content height
    let contentLines: string[] = [];
    IMPORTANT_NOTICE.forEach(item => {
      const lines = this.pdf.splitTextToSize(`* ${item}`, boxWidth - contentPadding * 2);
      contentLines.push(...lines);
    });
    const titleHeight = 6;
    const contentHeight = contentLines.length * lineHeight;
    const boxHeight = contentPadding * 2 + titleHeight + contentHeight + 2;

    // Ensure there's enough space on the page
    this.checkPageBreak(boxHeight + 2);

    const startY = this.yPosition;

    // Draw burgundy border
    setBurgundyDraw(this.pdf);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(boxStartX, startY, boxWidth, boxHeight, 'S');

    // Title
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    this.pdf.text('IMPORTANT', boxStartX + contentPadding, startY + contentPadding + 3);

    // Content
    this.pdf.setFontSize(contentFontSize);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    let textY = startY + contentPadding + 3 + 6;
    IMPORTANT_NOTICE.forEach(item => {
      const lines = this.pdf.splitTextToSize(`* ${item}`, boxWidth - contentPadding * 2);
      this.pdf.text(lines, boxStartX + contentPadding, textY);
      textY += lines.length * lineHeight;
    });

    this.yPosition = startY + boxHeight + 8;
  }

  private async addHeader(): Promise<void> {
    try {
      // Add centered logo - smaller and more rectangular
      const logoWidth = 20;
      const logoHeight = 16;
      const centerX = (this.pageWidth - logoWidth) / 2;
      this.pdf.addImage(logoImage, 'JPEG', centerX, 12, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Failed to add logo:', error);
      // Add text logo as fallback
      this.pdf.setFontSize(14);
      this.pdf.setFont(undefined, 'bold');
      const textWidth = this.pdf.getTextWidth('NEM');
      const centerX = (this.pageWidth - textWidth) / 2;
      this.pdf.text('NEM', centerX, 25);
    }

    // Company identity block - center aligned below logo
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    const companyWidth = this.pdf.getTextWidth(LETTERHEAD.company);
    this.pdf.text(LETTERHEAD.company, (this.pageWidth - companyWidth) / 2, 38);

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    const addressWidth = this.pdf.getTextWidth(LETTERHEAD.address);
    this.pdf.text(LETTERHEAD.address, (this.pageWidth - addressWidth) / 2, 44);
    
    const contactWidth = this.pdf.getTextWidth(LETTERHEAD.contact);
    this.pdf.text(LETTERHEAD.contact, (this.pageWidth - contactWidth) / 2, 49);
    
    const phonesWidth = this.pdf.getTextWidth(LETTERHEAD.phones);
    this.pdf.text(LETTERHEAD.phones, (this.pageWidth - phonesWidth) / 2, 54);
    
    const emailsWidth = this.pdf.getTextWidth(LETTERHEAD.emails);
    this.pdf.text(LETTERHEAD.emails, (this.pageWidth - emailsWidth) / 2, 59);

    this.yPosition = 72;
  }

  private addTitle(): void {
    this.pdf.setFontSize(16);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    const title = this.blueprint.title.toUpperCase();
    const titleWidth = this.pdf.getTextWidth(title);
    const centerX = (this.pageWidth - titleWidth) / 2;
    this.pdf.text(title, centerX, this.yPosition);
    this.yPosition += 10;
    
    // Add Important Notice right after title
    this.addImportantNotice();
  }

  private addPolicyMeta(): void {
    // Remove the policy meta box - this information will be shown in the form data
    this.yPosition += 10;
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
    setBurgundyText(this.pdf);
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
      setBurgundyText(this.pdf);
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
      setBurgundyText(this.pdf);
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
    // Data Privacy (first in order)
    this.addDataPrivacyBlock();
    
    // Declaration and Signature
    this.addDeclarationAndSignature();
    
    // Rent Assurance Special Note (if applicable)
    if (this.blueprint.specialHandling?.rentAssuranceNote) {
      this.addRentAssuranceNote();
    }
    
    // Claims Procedure (last)
    this.addClaimsProcedureBlock();
  }

  private addFooterBlock(title: string, content: string[]): void {
    this.checkPageBreak(content.length * 5 + 15);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
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

  private addDataPrivacyBlock(): void {
    this.checkPageBreak(25);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf); // Burgundy
    this.pdf.text('Data Privacy', this.margin, this.yPosition);
    this.yPosition += 6;

    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    DATA_PRIVACY.forEach((item, index) => {
      this.checkPageBreak(8);
      const lines = this.pdf.splitTextToSize(`${['i', 'ii', 'iii'][index]}. ${item}`, this.pageWidth - (this.margin * 2));
      this.pdf.text(lines, this.margin, this.yPosition);
      this.yPosition += lines.length * 4 + 2; // Reduced spacing
    });
    this.yPosition += 6; // Reduced spacing
  }

  private addDeclarationAndSignature(): void {
    // Ensure declaration stays on same page
    const requiredSpace = 70;
    this.checkPageBreak(requiredSpace, true);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    this.pdf.text('DECLARATION', this.margin, this.yPosition);
    this.yPosition += 6;

    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    DECLARATION.forEach((item, index) => {
      const lines = this.pdf.splitTextToSize(`${index + 1}. ${item}`, this.pageWidth - (this.margin * 2));
      this.pdf.text(lines, this.margin, this.yPosition);
      this.yPosition += lines.length * 4; // tighter spacing
    });

    this.yPosition += 4;

    // Yes/No checkboxes
    const agree = (this.submissionData.agreeToDataPrivacy ?? true) as boolean;
    const decTrue = (this.submissionData.declarationTrue ?? true) as boolean;
    this.drawYesNoRow('Agree to Data Privacy', Boolean(agree));
    this.drawYesNoRow('Declaration True', Boolean(decTrue));

    this.yPosition += 4;

    // Signature line with actual signature text overlay
    const sigLabel = 'Signature:';
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(sigLabel, this.margin, this.yPosition);

    // underline
    const lineStartX = this.margin + this.pdf.getTextWidth(sigLabel) + 3;
    const lineEndX = this.pageWidth - 70;
    const baselineY = this.yPosition + 1;
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(lineStartX, baselineY, lineEndX, baselineY);

    // signature text placed on the underline
    const signatureText = this.getSignatureValue();
    this.pdf.setFont(undefined, 'italic');
    this.pdf.text(signatureText, lineStartX + 1, this.yPosition);

    // Date
    const submissionDate = this.getSubmissionDate();
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(`Date: ${submissionDate}`, this.pageWidth - 60, this.yPosition);

    this.yPosition += 12;
  }

  private getSignatureValue(): string {
    return (
      this.submissionData.signature ||
      this.submissionData.signatureOfPolicyholder ||
      this.submissionData.signatureOfPolicyHolder ||
      this.submissionData.digitalSignature ||
      this.submissionData.signatureName ||
      this.submissionData.fullName ||
      this.submissionData.nameOfInsured ||
      '________________'
    );
  }

  private getSubmissionDate(): string {
    // Try different date fields in the submission
    const dateFields = ['createdAt', 'submittedAt', 'timestamp', 'dateSubmitted'];
    for (const field of dateFields) {
      if (this.submissionData[field]) {
        return this.formatDate(this.submissionData[field]);
      }
    }
    // Fallback to current date
    return new Date().toLocaleDateString('en-GB');
  }

  private addClaimsProcedureBlock(): void {
    this.checkPageBreak(30);
    
    // Center-aligned final section
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(0, 0, 0);
    const fraudText = 'NEM Insurance Plc. reserves the right to refute any fraudulent claims';
    const fraudWidth = this.pdf.getTextWidth(fraudText);
    this.pdf.text(fraudText, (this.pageWidth - fraudWidth) / 2, this.yPosition);
    this.yPosition += 8;
    
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf); // Burgundy
    const procedureTitle = 'CLAIMS PROCEDURE (Please read carefully to understand the claim process)';
    const titleWidth = this.pdf.getTextWidth(procedureTitle);
    this.pdf.text(procedureTitle, (this.pageWidth - titleWidth) / 2, this.yPosition);
    this.yPosition += 8;

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    CLAIMS_PROCEDURE.forEach(item => {
      this.checkPageBreak(5);
      const procedureText = `* ${item}`;
      const procedureWidth = this.pdf.getTextWidth(procedureText);
      this.pdf.text(procedureText, (this.pageWidth - procedureWidth) / 2, this.yPosition);
      this.yPosition += 5;
    });
  }

  // Draw a labeled YES/NO checkbox row with burgundy checkmark
  private drawYesNoRow(label: string, checked: boolean): void {
    const startX = this.margin;
    const boxSize = 4;
    const gap = 3;
    const labelWidth = this.pdf.getTextWidth(`${label}: `);

    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`${label}:`, startX, this.yPosition);

    const yesX = startX + labelWidth + 2;
    const y = this.yPosition - boxSize + 3;

    setBurgundyDraw(this.pdf);
    this.pdf.setLineWidth(0.4);
    // YES box
    this.pdf.rect(yesX, y, boxSize, boxSize);
    // NO box
    const noX = yesX + boxSize + gap + this.pdf.getTextWidth('Yes ') + gap;
    this.pdf.rect(noX, y, boxSize, boxSize);

    // Labels
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Yes', yesX + boxSize + gap, this.yPosition);
    this.pdf.text('No', noX + boxSize + gap, this.yPosition);

    // Check YES if checked, else NO
    const markX = checked ? yesX : noX;
    setBurgundyDraw(this.pdf);
    this.pdf.line(markX + 0.8, y + boxSize / 2, markX + boxSize - 0.8, y + boxSize - 0.8);
    this.pdf.line(markX + 0.8, y + boxSize - 0.8, markX + boxSize - 0.8, y + 0.8);

    this.yPosition += 6;
  }

  private checkPageBreak(requiredSpace: number, keepTogether: boolean = false): void {
    if (this.yPosition + requiredSpace > this.pageHeight - this.margin) {
      this.addPageFooter();
      this.pdf.addPage();
      this.yPosition = this.margin;
      // Reset default body style to avoid footer styles carrying over
      this.pdf.setFontSize(10);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setTextColor(0, 0, 0);
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
      const formType = submissionData.formType || submissionData.collection || 'form';
      const name = submissionData.companyName || submissionData.nameOfInsured || submissionData.insuredName || submissionData.policyHolderName || submissionData.fullName || ((submissionData.firstName && submissionData.lastName) ? `${submissionData.firstName} ${submissionData.lastName}` : undefined) || submissionData.firstName || submissionData.name || 'submission';
      const filename = `${String(name).trim().replace(/\s+/g, '-')}-${String(formType).trim().replace(/\s+/g, '-')}.pdf`;
      
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