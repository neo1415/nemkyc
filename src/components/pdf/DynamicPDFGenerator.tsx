import React from 'react';
import jsPDF from 'jspdf';
import { FORM_MAPPINGS, FormField, FormSection } from '../../config/formMappings';
import logoImage from '../../NEMLogo (2)_page-0001.jpg';

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
  private margin: number = 10; // 28pt ≈ 10mm (corrected)
  private topBottomMargin: number = 8.5; // 24pt ≈ 8.5mm
  private contentWidth: number;
  private leftColumnWidth: number;
  private rightColumnWidth: number;
  private leftColumnX: number;
  private rightColumnX: number;
  private blueprint: PDFBlueprint;
  private submissionData: PDFSubmissionData;

  constructor(submissionData: PDFSubmissionData) {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set up font embedding for copy/paste fidelity - use Helvetica with proper kerning and character spacing
    this.pdf.setFont('helvetica', 'normal');
    // Ensure proper font metrics and character spacing (not typewriter)
    this.pdf.setCharSpace(0);
    
    this.submissionData = submissionData;
    this.blueprint = this.generateBlueprint(submissionData);
    
    // Calculate layout metrics - exact 40%/60% split as specified (28pt margins)
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.leftColumnWidth = this.contentWidth * 0.40;
    this.rightColumnWidth = this.contentWidth * 0.60;
    
    // Calculate exact column positions for consistent layout
    this.leftColumnX = this.margin;
    this.rightColumnX = this.margin + this.leftColumnWidth;
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
    // Check for motor claims by registration number (since other vehicle fields are now commented out)
    if (data.registrationNumber) {
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
        const normalizedLabel = this.formatFieldLabel(key).toLowerCase();
        // Enhanced filtering for "Agree to Data Privacy" field variations
        if ((normalizedLabel.includes('agree') && normalizedLabel.includes('data') && normalizedLabel.includes('privacy')) ||
            normalizedLabel.includes('dataPrivacyAgreement'.toLowerCase()) ||
            normalizedLabel.includes('data_privacy_agreement') ||
            normalizedLabel.includes('privacyAgreement'.toLowerCase()) ||
            key.toLowerCase().includes('agreement') && key.toLowerCase().includes('privacy')) {
          return;
        }
        
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
    // Center the Important Notice box (60% width) with reduced visual weight
    const contentPadding = 3.75; // Reduced by 25%
    const boxWidth = (this.pageWidth - (this.margin * 2)) * 0.6;
    const boxStartX = this.margin + ((this.pageWidth - (this.margin * 2)) - boxWidth) / 2;

    // Prepare content to measure height - reduced font size to 9pt
    const contentFontSize = 9; // Reduced from 10pt
    const lineHeight = 3.6; // Reduced proportionally

    // Measure content height
    let contentLines: string[] = [];
    IMPORTANT_NOTICE.forEach(item => {
      const lines = this.pdf.splitTextToSize(`* ${item}`, boxWidth - contentPadding * 2);
      contentLines.push(...lines);
    });
    const titleHeight = 5;
    const contentHeight = contentLines.length * lineHeight;
    const boxHeight = contentPadding * 2 + titleHeight + contentHeight + 2;

    // Ensure there's enough space on the page
    this.checkPageBreak(boxHeight + 2);

    const startY = this.yPosition;

    // Draw burgundy border
    setBurgundyDraw(this.pdf);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(boxStartX, startY, boxWidth, boxHeight, 'S');

    // Title - reduced font size
    this.pdf.setFontSize(11); // Reduced from 12
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    this.pdf.text('IMPORTANT', boxStartX + contentPadding, startY + contentPadding + 3);

    // Content
    this.pdf.setFontSize(contentFontSize);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    let textY = startY + contentPadding + 3 + titleHeight;
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

    // Section header with background tint
    this.pdf.setFillColor(246, 248, 250);
    this.pdf.rect(this.margin, this.yPosition - 2, this.contentWidth, 10, 'F');
    
    this.pdf.setFontSize(13);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    this.pdf.text(section.title.toUpperCase(), this.margin + 2, this.yPosition + 4);
    this.yPosition += 12;

    this.pdf.setTextColor(0, 0, 0);

    for (const field of section.fields) {
      const normalizedLabel = field.label.toLowerCase();
      // Enhanced filtering for "Agree to Data Privacy" field variations
      if ((normalizedLabel.includes('agree') && normalizedLabel.includes('data') && normalizedLabel.includes('privacy')) ||
          normalizedLabel.includes('dataPrivacyAgreement'.toLowerCase()) ||
          normalizedLabel.includes('data_privacy_agreement') ||
          normalizedLabel.includes('privacyAgreement'.toLowerCase()) ||
          (normalizedLabel.includes('agreement') && normalizedLabel.includes('privacy'))) {
        continue;
      }
      
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

    // Handle complex data structures
    if (this.isComplexArrayData(value)) {
      await this.addComplexDataStructure(field.label, field.key, value);
    } else if (field.type === 'array' && field.key === 'directors') {
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
        
        const displayValue = this.sanitizeAndFormatValue(value, 'text');
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
      const sanitizedText = this.sanitizeText(itemText);
      const lines = this.pdf.splitTextToSize(`${index + 1}. ${sanitizedText}`, 130);
      this.pdf.text(lines, this.margin + 5, this.yPosition);
      this.yPosition += lines.length * 5;
    });
  }

  private async addRegularField(label: string, value: any, type: FormField['type']): Promise<void> {
    this.checkPageBreak(12);
    
    // Sanitize and format the value
    const displayValue = this.sanitizeAndFormatValue(value, type);
    
    // Determine if this is long content requiring full-width layout
    const isLongContent = this.isLongContent(label, displayValue, type);
    
    if (isLongContent) {
      // Full-width layout for long content
      this.pdf.setFontSize(10.5);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text(`${label}:`, this.margin, this.yPosition);
      this.yPosition += 6;
      
      // Full-width value block with background
      const blockHeight = this.calculateTextHeight(displayValue, this.contentWidth - 6) + 6;
      this.pdf.setFillColor(246, 248, 250);
      this.pdf.rect(this.margin, this.yPosition - 3, this.contentWidth, blockHeight, 'F');
      
      this.pdf.setFontSize(10);
      this.pdf.setFont(undefined, 'normal');
      const lines = this.pdf.splitTextToSize(displayValue, this.contentWidth - 6);
      this.pdf.text(lines, this.margin + 3, this.yPosition + 3);
      this.yPosition += blockHeight + 4;
    } else {
      // Two-column layout
      this.renderTwoColumnField(label, displayValue, type);
    }
  }

  private renderTwoColumnField(label: string, value: string, type: FormField['type']): void {
    // Set uniform font with proper spacing and kerning (Helvetica as specified)
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10.5);
    this.pdf.setTextColor(0, 0, 0);
    
    // Split label text to prevent overlap with value column
    const labelLines = this.pdf.splitTextToSize(`${label}:`, this.leftColumnWidth - 5);
    this.pdf.text(labelLines, this.leftColumnX, this.yPosition);
    
    // Left-align value in right column with normal weight
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    if (type === 'boolean') {
      this.renderBooleanCheckboxes(value);
    } else {
      // Proper two-column positioning - value starts exactly at right column boundary
      const valueLines = this.pdf.splitTextToSize(value, this.rightColumnWidth - 2);
      this.pdf.text(valueLines, this.rightColumnX, this.yPosition);
      
      // Calculate vertical spacing based on both label and value lines
      const labelHeight = labelLines.length * 4.4;
      const valueHeight = valueLines.length * 4.4;
      this.yPosition += Math.max(labelHeight, valueHeight, 8);
    }
  }

  private renderBooleanCheckboxes(value: string): void {
    const valueX = this.rightColumnX; // Use exact right column position
    const isYes = value === 'Yes';
    
    this.pdf.setLineWidth(0.5);
    setBurgundyDraw(this.pdf);
    
    // Draw □ Yes □ No format with proper square boxes and solid fill for selected option
    const boxSize = 3;
    const spacing = 1;
    
    // Yes checkbox - solid filled square if selected, empty if not
    this.pdf.rect(valueX, this.yPosition - 3, boxSize, boxSize, 'S');
    if (isYes) {
      this.pdf.setFillColor(0, 0, 0);
      this.pdf.rect(valueX + 0.5, this.yPosition - 2.5, boxSize - 1, boxSize - 1, 'F');
    }
    
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Yes', valueX + boxSize + spacing, this.yPosition);
    
    // No checkbox - position after Yes text with proper spacing  
    const yesWidth = this.pdf.getTextWidth('Yes');
    const noX = valueX + boxSize + spacing + yesWidth + 6;
    this.pdf.rect(noX, this.yPosition - 3, boxSize, boxSize, 'S');
    if (!isYes) {
      this.pdf.setFillColor(0, 0, 0);
      this.pdf.rect(noX + 0.5, this.yPosition - 2.5, boxSize - 1, boxSize - 1, 'F');
    }
    this.pdf.text('No', noX + boxSize + spacing, this.yPosition);
    
    this.yPosition += 8;
  }

  private calculateTextHeight(text: string, width: number): number {
    const lines = this.pdf.splitTextToSize(text, width);
    return lines.length * 4;
  }

  private sanitizeText(text: string): string {
    if (!text) return '';
    
    let sanitized = String(text);
    
    // Step 1: Normalize Unicode (NFC) - exact as user specified
    sanitized = sanitized.normalize('NFC');
    
    // Step 2: Remove control characters [\x00-\x1F\x7F-\x9F] - exact as user specified
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]+/g, ' ');
    
    // Step 3: Remove specific problematic sequences - exact as user specified
    sanitized = sanitized.replace(/[¦�]+/g, '');
    
    // Step 4: Remove HTML entities and currency artifacts
    sanitized = sanitized.replace(/&[a-zA-Z0-9#]*;?/g, '');
    sanitized = sanitized.replace(/\u00A0/g, ' '); // Non-breaking space to regular space
    sanitized = sanitized.replace(/\u00A6/g, ''); // Broken bar character
    sanitized = sanitized.replace(/\uFFFD/g, ''); // Replacement character
    
    // Step 5: Collapse whitespace - exact as user specified
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  private sanitizeAndFormatValue(value: any, type: FormField['type']): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    // Handle boolean-like strings from form submissions first
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === 'y' || lowerValue === '1') {
        return 'Yes';
      }
      if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === 'n' || lowerValue === '0') {
        return 'No';
      }
    }

    let formattedValue: string;
    
    switch (type) {
      case 'date':
        formattedValue = this.formatDate(value);
        break;
      case 'currency':
        formattedValue = this.formatCurrency(value);
        break;
      case 'boolean':
        formattedValue = value ? 'Yes' : 'No';
        break;
      default:
        formattedValue = String(value);
    }
    
    return this.sanitizeText(formattedValue);
  }

  private isLongContent(label: string, value: string, type: FormField['type']): boolean {
    // Always use two-column layout as requested by user
    // All fields should be label on left, value on right
    return false;
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
    if (!amount && amount !== 0) return '₦0.00';
    
    // Handle string inputs that might have currency symbols already
    let cleanValue = String(amount).replace(/[₦,\s¦�]/g, '');
    const num = parseFloat(cleanValue);
    
    if (isNaN(num)) return this.sanitizeText(String(amount));
    
    // Ensure proper ₦ formatting with thousands separators and NO space between ₦ and number
    const formatted = `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return this.sanitizeText(formatted);
  }

  // Check if data is a complex array that needs special formatting
  private isComplexArrayData(value: any): boolean {
    if (!Array.isArray(value) || value.length === 0) return false;
    
    // Check if array contains objects with multiple meaningful properties
    const firstItem = value[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      const keys = Object.keys(firstItem).filter(key => !EXCLUDED_FIELDS.includes(key));
      return keys.length > 1; // More than one meaningful property suggests table format
    }
    return false;
  }

  // Handle complex data structures with tables or sections
  private async addComplexDataStructure(label: string, key: string, value: any[]): Promise<void> {
    if (!Array.isArray(value) || value.length === 0) {
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text(`${label}:`, this.margin, this.yPosition);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text('N/A', this.margin + 70, this.yPosition);
      this.yPosition += 6;
      return;
    }

    // Determine formatting based on field type and content
    if (this.shouldFormatAsTable(key, value)) {
      await this.addDataTable(label, value);
    } else {
      await this.addDataSections(label, value);
    }
  }

  // Determine if data should be formatted as a table
  private shouldFormatAsTable(key: string, value: any[]): boolean {
    const tableFields = [
      'earnings', 'earningsStatement', 'monthlyEarnings', 'salaryDetails',
      'expenses', 'calculations', 'breakdown', 'schedule', 'payments'
    ];
    
    // Check if key suggests tabular data
    if (tableFields.some(field => key.toLowerCase().includes(field))) {
      return true;
    }

    // Check if all objects have similar structure (good for tables)
    const firstItem = value[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      const firstKeys = Object.keys(firstItem).sort();
      return value.every(item => {
        if (typeof item !== 'object' || item === null) return false;
        const itemKeys = Object.keys(item).sort();
        return JSON.stringify(firstKeys) === JSON.stringify(itemKeys);
      });
    }

    return false;
  }

  // Add data as a table with burgundy borders
  private async addDataTable(label: string, data: any[]): Promise<void> {
    this.checkPageBreak(30);

    // Table title
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    this.pdf.text(label, this.margin, this.yPosition);
    this.yPosition += 8;

    // Get table structure from first row
    const firstRow = data[0];
    const columns = Object.keys(firstRow).filter(key => !EXCLUDED_FIELDS.includes(key));
    
    // Calculate dynamic column widths based on content
    const tableWidth = this.pageWidth - (this.margin * 2);
    const columnWidths = this.calculateDynamicColumnWidths(data, columns, tableWidth);

    // Table header
    setBurgundyDraw(this.pdf);
    this.pdf.setLineWidth(0.5);
    this.pdf.setFillColor(BURGUNDY.r, BURGUNDY.g, BURGUNDY.b);
    this.pdf.rect(this.margin, this.yPosition, tableWidth, 8, 'FD');

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(255, 255, 255); // White text on burgundy header

    let currentX = this.margin;
    columns.forEach((col, index) => {
      const colLabel = this.sanitizeText(this.formatFieldLabel(col));
      const cellWidth = columnWidths[index];
      const maxWidth = cellWidth - 2;
      const lines = this.pdf.splitTextToSize(colLabel, maxWidth);
      this.pdf.text(lines[0], currentX + 1, this.yPosition + 5); // Take first line only for header
      currentX += cellWidth;
    });

    this.yPosition += 8;

    // Table rows
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont(undefined, 'normal');

    let grandTotal = 0;
    let hasNumericColumns = false;

    data.forEach((row, rowIndex) => {
      this.checkPageBreak(10);

      // Calculate row height first
      const maxLines = Math.max(1, ...columns.map((col, colIndex) => {
        const cellValue = row[col];
        const displayValue = cellValue ? String(cellValue) : '';
        const maxWidth = columnWidths[colIndex] - 2;
        return this.pdf.splitTextToSize(displayValue, maxWidth).length;
      }));
      
      const rowHeight = Math.max(6, maxLines * 3 + 2);
      (row as any)._rowHeight = rowHeight;
      
      // Row background (alternating) with dynamic height
      if (rowIndex % 2 === 1) {
        this.pdf.setFillColor(248, 249, 250);
        this.pdf.rect(this.margin, this.yPosition, tableWidth, rowHeight, 'F');
      }

      // Cell borders
      setBurgundyDraw(this.pdf);
      this.pdf.setLineWidth(0.3);

      let rowTotal = 0;
      const currentRowHeight = (row as any)._rowHeight || 6;
      
      columns.forEach((col, colIndex) => {
        let cellX = this.margin;
        for (let i = 0; i < colIndex; i++) {
          cellX += columnWidths[i];
        }
        const cellValue = row[col];
        const cellWidth = columnWidths[colIndex];
        const maxWidth = cellWidth - 2;
        
        // Draw cell border with dynamic height
        this.pdf.rect(cellX, this.yPosition, cellWidth, currentRowHeight);

        // Format and display value
        let displayValue = '';
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          if (col.toLowerCase().includes('amount') || col.toLowerCase().includes('value') || typeof cellValue === 'number') {
            displayValue = this.formatCurrency(cellValue);
            if (typeof cellValue === 'number' || !isNaN(parseFloat(cellValue))) {
              rowTotal += parseFloat(cellValue) || 0;
              hasNumericColumns = true;
            }
          } else if (col.toLowerCase().includes('date')) {
            displayValue = this.formatDate(cellValue);
          } else {
            displayValue = this.sanitizeText(String(cellValue));
          }
        } else {
          displayValue = '-';
        }

        // Handle dynamic row height for content wrapping
        const lines = this.pdf.splitTextToSize(displayValue, maxWidth);
        const lineHeight = 3;
        
        // Render all lines of text, wrapping within the cell
        lines.forEach((line: string, lineIndex: number) => {
          if (lineIndex < Math.floor((currentRowHeight - 2) / lineHeight)) {
            this.pdf.text(line, cellX + 1, this.yPosition + 3 + (lineIndex * lineHeight));
          }
        });
      });

      if (hasNumericColumns && rowTotal > 0) {
        grandTotal += rowTotal;
      }

      // Use dynamic row height
      this.yPosition += currentRowHeight;
    });

    // Add total row if there were numeric columns
    if (hasNumericColumns && grandTotal > 0) {
      this.checkPageBreak(8);
      
      setBurgundyDraw(this.pdf);
      this.pdf.setLineWidth(0.5);
      this.pdf.setFillColor(BURGUNDY.r, BURGUNDY.g, BURGUNDY.b);
      this.pdf.rect(this.margin, this.yPosition, tableWidth, 6, 'FD');

      this.pdf.setFont(undefined, 'bold');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text('TOTAL:', this.margin + 1, this.yPosition + 4);
      
      const totalText = this.formatCurrency(grandTotal);
      const totalWidth = this.pdf.getTextWidth(totalText);
      this.pdf.text(totalText, this.margin + tableWidth - totalWidth - 1, this.yPosition + 4);

      this.yPosition += 6;
    }

    this.yPosition += 8;
  }

  private calculateDynamicColumnWidths(data: any[], columns: string[], totalWidth: number): number[] {
    const columnWidths: number[] = new Array(columns.length).fill(0);
    const minWidth = 30; // Minimum column width
    const maxWidth = totalWidth / 2; // Maximum column width (50% of total)
    
    // Calculate content-based widths
    columns.forEach((col, index) => {
      // Start with header width
      const headerWidth = this.pdf.getTextWidth(this.sanitizeText(this.formatFieldLabel(col))) + 10;
      let maxContentWidth = headerWidth;
      
      // Check content width for this column (sample first 10 rows for performance)
      const sampleData = data.slice(0, Math.min(10, data.length));
      sampleData.forEach(row => {
        const cellValue = String(row[col] || '');
        let displayValue = cellValue;
        
        if (col.toLowerCase().includes('amount') || col.toLowerCase().includes('value')) {
          displayValue = this.formatCurrency(cellValue);
        } else if (col.toLowerCase().includes('date')) {
          displayValue = this.formatDate(cellValue);
        } else {
          displayValue = this.sanitizeText(cellValue);
        }
        
        const contentWidth = this.pdf.getTextWidth(displayValue) + 10;
        maxContentWidth = Math.max(maxContentWidth, contentWidth);
      });
      
      // Apply min/max constraints
      columnWidths[index] = Math.max(minWidth, Math.min(maxWidth, maxContentWidth));
    });
    
    // Normalize to fit total width
    const currentTotal = columnWidths.reduce((sum, width) => sum + width, 0);
    if (currentTotal !== totalWidth) {
      const scale = totalWidth / currentTotal;
      return columnWidths.map(width => width * scale);
    }
    
    return columnWidths;
  }

  // Add data as individual sections (for witnesses, etc.)
  private async addDataSections(label: string, data: any[]): Promise<void> {
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    setBurgundyText(this.pdf);
    this.pdf.text(label, this.margin, this.yPosition);
    this.yPosition += 8;

    data.forEach((item, index) => {
      this.checkPageBreak(20);
      
      // Section header (e.g., "Witness 1")
      this.pdf.setFontSize(10);
      this.pdf.setFont(undefined, 'bold');
      setBurgundyText(this.pdf);
      
      const sectionTitle = this.getSectionTitle(label, index + 1);
      this.pdf.text(sectionTitle, this.margin + 5, this.yPosition);
      this.yPosition += 6;

      // Section content
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont(undefined, 'normal');

      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          if (!EXCLUDED_FIELDS.includes(key) && value !== null && value !== undefined && value !== '') {
            this.checkPageBreak(5);
            const fieldLabel = this.formatFieldLabel(key);
            this.pdf.setFont(undefined, 'bold');
            this.pdf.text(`${fieldLabel}:`, this.margin + 10, this.yPosition);
            this.pdf.setFont(undefined, 'normal');
            
            const displayValue = this.sanitizeAndFormatValue(value, this.inferFieldType(key, value));
            const lines = this.pdf.splitTextToSize(displayValue, 100);
            this.pdf.text(lines, this.margin + 80, this.yPosition);
            this.yPosition += Math.max(lines.length * 3.5, 5);
          }
        });
      } else {
        this.pdf.text(String(item), this.margin + 10, this.yPosition);
        this.yPosition += 5;
      }
      
      this.yPosition += 4;
    });

    this.yPosition += 4;
  }

  // Generate appropriate section titles
  private getSectionTitle(label: string, index: number): string {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('witness')) return `Witness ${index}`;
    if (lowerLabel.includes('driver')) return `Driver ${index}`;
    if (lowerLabel.includes('passenger')) return `Passenger ${index}`;
    if (lowerLabel.includes('vehicle')) return `Vehicle ${index}`;
    if (lowerLabel.includes('claimant')) return `Claimant ${index}`;
    if (lowerLabel.includes('injured')) return `Injured Party ${index}`;
    
    return `${label} ${index}`;
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
    
    // Declaration
    this.addDeclaration();
    
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
    setBurgundyText(this.pdf);
    this.pdf.text('Data Privacy', this.margin, this.yPosition);
    this.yPosition += 6;

    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(0, 0, 0);

    DATA_PRIVACY.forEach((item, index) => {
      this.checkPageBreak(8);
      const lines = this.pdf.splitTextToSize(`${['i', 'ii', 'iii'][index]}. ${item}`, this.pageWidth - (this.margin * 2));
      this.pdf.text(lines, this.margin, this.yPosition);
      this.yPosition += lines.length * 3.5 + 1;
    });
    
    this.yPosition += 8;
  }

  private addDeclaration(): void {
    this.checkPageBreak(30);
    
    // Declaration title
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    setBurgundyText(this.pdf);
    this.pdf.text('DECLARATION', this.margin, this.yPosition);
    this.yPosition += 6;

    // Declaration content - keep immutable text unchanged
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(0, 0, 0);

    DECLARATION.forEach((item, index) => {
      const lines = this.pdf.splitTextToSize(`${index + 1}. ${item}`, this.pageWidth - (this.margin * 2));
      this.pdf.text(lines, this.margin, this.yPosition);
      this.yPosition += lines.length * 3.5 + 2;
    });

    this.yPosition += 8;
    
    // Add signature and date row (justify-between layout) - NO "I agree" checkboxes
    this.addSignatureAndDateRow();
  }
  
  private addSignatureAndDateRow(): void {
    this.checkPageBreak(15);
    
    const signatureValue = this.getSignatureValue();
    const dateValue = this.getSubmissionDate();
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(0, 0, 0);
    
    const baseY = this.yPosition;
    
    // Left side - Signature (justify-between layout as specified)
    if (signatureValue && signatureValue !== '________________') {
      // Render signature value centered above the signature line
      const signatureWidth = this.pdf.getTextWidth(signatureValue);
      const signatureCenterX = this.margin + 15; // Center above 30-char underline
      this.pdf.text(signatureValue, signatureCenterX - (signatureWidth / 2), baseY);
    }
    
    // Signature line on the left
    this.pdf.text('Signature: ____________________________', this.margin, baseY + (signatureValue && signatureValue !== '________________' ? 5 : 0));
    
    // Right side - Date (justify-between layout)
    const dateX = this.margin + this.contentWidth - 40; // Right-aligned position for 30-char underline
    
    if (dateValue) {
      // Render date value centered above the date line (DD/MM/YYYY format as specified)
      const dateWidth = this.pdf.getTextWidth(dateValue);
      const dateCenterX = dateX + 15; // Center above 30-char underline  
      this.pdf.text(dateValue, dateCenterX - (dateWidth / 2), baseY);
    }
    
    // Date line on the right
    this.pdf.text('Date: ____________________________', dateX, baseY + (dateValue ? 5 : 0));
    
    this.yPosition = baseY + 12;
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
        const formattedDate = this.formatDate(this.submissionData[field]);
        // Ensure DD/MM/YYYY format as specified
        return formattedDate;
      }
    }
    // Fallback to current date in DD/MM/YYYY format
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

  // Draw a labeled YES/NO checkbox row with clean checkboxes (□ Yes ■ No format)
  private drawYesNoRow(label: string, checked: boolean): void {
    // Two-column layout: label left (40%), checkbox options right (60%)
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10.5);
    this.pdf.setTextColor(0, 0, 0);
    
    // Render label in left column
    this.pdf.text(`${label}:`, this.leftColumnX, this.yPosition);

    // Render checkboxes in right column with proper □ Yes ■ No format
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    const optionsX = this.rightColumnX;
    
    // Draw Yes option
    const yesSymbol = checked ? '■' : '□';
    this.pdf.text(`${yesSymbol} Yes`, optionsX, this.yPosition);
    
    // Draw No option (spaced appropriately)
    const noSymbol = checked ? '□' : '■';
    const noX = optionsX + this.pdf.getTextWidth(`${yesSymbol} Yes   `);
    this.pdf.text(`${noSymbol} No`, noX, this.yPosition);

    this.yPosition += 8;
  }

  private checkPageBreak(requiredSpace: number, keepTogether: boolean = false): void {
    // Increase bottom margin to prevent content overlap with page numbers
    const bottomMargin = 25; // Increased margin for page numbers
    if (this.yPosition + requiredSpace > this.pageHeight - bottomMargin) {
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
