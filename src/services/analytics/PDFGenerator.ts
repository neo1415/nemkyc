/**
 * PDF Generator
 * 
 * Generates professional, executive-ready PDF reports with NEM Insurance branding,
 * including logo, color scheme, executive summary, and formatted tables.
 * 
 * Can generate PDFs in two modes:
 * 1. Structured mode: Traditional PDF with sections and tables
 * 2. Visual mode: Captures the exact appearance of the web dashboard
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { NEMBranding } from './BrandingService';
import type {
  AnalyticsSummary,
  UsageDataPoint,
  BrokerUsage,
  AuditLogEntry,
} from '../../types/analytics';

export interface ReportData {
  summary?: AnalyticsSummary;
  usageData?: UsageDataPoint[];
  brokerUsage?: BrokerUsage[];
  auditLogs?: AuditLogEntry[];
}

export interface ReportMetadata {
  title: string;
  generatedAt: Date;
  generatedBy: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    provider?: string;
    status?: string;
  };
}

interface SectionInfo {
  name: string;
  title: string;
  pageNumber: number;
}

interface PDFGeneratorOptions {
  branding: NEMBranding;
  includeTableOfContents: boolean;
  includeCharts: boolean;
  mode?: 'structured' | 'visual'; // New option for PDF generation mode
}

export class PDFGenerator {
  private readonly PAGE_MARGIN = 20;
  private readonly HEADER_HEIGHT = 30;
  
  /**
   * Formats currency for PDF (using NGN instead of ₦ symbol to avoid font issues)
   */
  private formatCurrency(amount: number): string {
    return `NGN ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  /**
   * Formats percentage for PDF
   */
  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Generates PDF from visual capture of dashboard
   * This captures the exact appearance of the web page
   * 
   * Requirements: 2.1, 2.2, 2.8, 2.9
   */
  async generateVisualPDF(
    dashboardElement: HTMLElement,
    metadata: ReportMetadata,
    options: PDFGeneratorOptions
  ): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (2 * this.PAGE_MARGIN);
    const contentHeight = pageHeight - this.HEADER_HEIGHT - 30; // Leave space for header and footer

    // Add cover page
    await this.addCoverPage(doc, { summary: undefined }, metadata, options.branding);

    // Capture all sections of the dashboard
    const sections = dashboardElement.querySelectorAll('[data-pdf-section]');
    
    if (sections.length === 0) {
      // If no sections marked, capture the entire dashboard
      await this.captureDashboardSection(doc, dashboardElement, contentWidth, contentHeight, options.branding, metadata);
    } else {
      // Capture each marked section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        doc.addPage();
        await this.captureDashboardSection(doc, section, contentWidth, contentHeight, options.branding, metadata);
      }
    }

    // Add headers and footers
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      await this.addPageHeader(doc, i, options.branding);
      this.addPageFooter(doc, i, totalPages, metadata.generatedAt);
    }

    return doc.output('blob');
  }

  /**
   * Captures a dashboard section as an image and adds it to PDF
   */
  private async captureDashboardSection(
    doc: jsPDF,
    element: HTMLElement,
    maxWidth: number,
    maxHeight: number,
    branding: NEMBranding,
    metadata: ReportMetadata
  ): Promise<void> {
    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate dimensions to fit page
      const ratio = Math.min(maxWidth / (imgWidth / 3.78), maxHeight / (imgHeight / 3.78)); // Convert px to mm
      const finalWidth = (imgWidth / 3.78) * ratio;
      const finalHeight = (imgHeight / 3.78) * ratio;

      // Add image to PDF
      doc.addImage(
        imgData,
        'PNG',
        this.PAGE_MARGIN,
        this.HEADER_HEIGHT + 10,
        finalWidth,
        finalHeight
      );

      // If content is taller than one page, split it
      if (finalHeight > maxHeight) {
        let remainingHeight = finalHeight - maxHeight;
        let yOffset = maxHeight;

        while (remainingHeight > 0) {
          doc.addPage();
          const nextHeight = Math.min(remainingHeight, maxHeight);
          
          // Create a new canvas with the remaining portion
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = (nextHeight / finalHeight) * canvas.height;
          const ctx = tempCanvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              (yOffset / finalHeight) * canvas.height,
              canvas.width,
              tempCanvas.height,
              0,
              0,
              tempCanvas.width,
              tempCanvas.height
            );

            const partialImgData = tempCanvas.toDataURL('image/png');
            doc.addImage(
              partialImgData,
              'PNG',
              this.PAGE_MARGIN,
              this.HEADER_HEIGHT + 10,
              finalWidth,
              nextHeight
            );
          }

          remainingHeight -= maxHeight;
          yOffset += maxHeight;
        }
      }
    } catch (error) {
      console.error('Error capturing dashboard section:', error);
      // Fallback: add error message
      doc.setFontSize(12);
      doc.setTextColor(255, 0, 0);
      doc.text('Error capturing section. Please try again.', this.PAGE_MARGIN, this.HEADER_HEIGHT + 20);
    }
  }

  /**
   * Generates complete PDF with branding and formatting
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  async generate(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    options: PDFGeneratorOptions
  ): Promise<Blob> {
    const doc = new jsPDF();
    const sectionInfos: SectionInfo[] = [];

    // Page 1: Cover page with logo and executive summary
    await this.addCoverPage(doc, data, metadata, options.branding);

    // Page 2: Table of contents (if multiple sections)
    if (options.includeTableOfContents && sections.length > 1) {
      doc.addPage();
      // We'll update TOC after generating all sections
    }

    // Add sections - each on a new page with proper spacing
    for (const section of sections) {
      // Skip empty sections
      if (section === 'usage-charts' && (!data.usageData || data.usageData.length === 0)) continue;
      if (section === 'broker-attribution' && (!data.brokerUsage || data.brokerUsage.length === 0)) continue;
      if (section === 'audit-logs' && (!data.auditLogs || data.auditLogs.length === 0)) continue;

      doc.addPage();
      const pageNumber = doc.getCurrentPageInfo().pageNumber;
      
      switch (section) {
        case 'overview':
          if (data.summary) {
            sectionInfos.push({ name: section, title: 'Overview Metrics', pageNumber });
            this.addOverviewSection(doc, data.summary, options.branding);
          }
          break;
        
        case 'usage-charts':
          if (data.usageData && data.usageData.length > 0) {
            sectionInfos.push({ name: section, title: 'Usage Data', pageNumber });
            this.addUsageDataSection(doc, data.usageData, options.branding);
          }
          break;
        
        case 'broker-attribution':
          if (data.brokerUsage && data.brokerUsage.length > 0) {
            sectionInfos.push({ name: section, title: 'Broker Attribution', pageNumber });
            this.addBrokerUsageSection(doc, data.brokerUsage, options.branding);
          }
          break;
        
        case 'audit-logs':
          if (data.auditLogs && data.auditLogs.length > 0) {
            sectionInfos.push({ name: section, title: 'Audit Logs', pageNumber });
            this.addAuditLogsSection(doc, data.auditLogs, options.branding);
          }
          break;
      }
    }

    // Add headers and footers to all pages (except cover)
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      await this.addPageHeader(doc, i, options.branding);
      this.addPageFooter(doc, i, totalPages, metadata.generatedAt);
    }

    // Update table of contents if needed
    if (options.includeTableOfContents && sections.length > 1 && sectionInfos.length > 0) {
      doc.setPage(2);
      this.generateTableOfContents(doc, sectionInfos, options.branding);
    }

    return doc.output('blob');
  }

  /**
   * Adds professional cover page with logo and executive summary
   * 
   * Requirements: 2.1, 2.2
   */
  private async addCoverPage(
    doc: jsPDF,
    data: ReportData,
    metadata: ReportMetadata,
    branding: NEMBranding
  ): Promise<void> {
    let yPosition = 40;

    // Add logo centered at top
    if (branding.logo.base64) {
      try {
        const logoWidth = 50;  // Adjusted for better proportion
        const logoHeight = 25; // Maintain 2:1 aspect ratio
        const xPosition = (doc.internal.pageSize.width - logoWidth) / 2;
        doc.addImage(
          branding.logo.base64,
          'JPEG',
          xPosition,
          yPosition,
          logoWidth,
          logoHeight
        );
        yPosition += logoHeight + 20;
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        this.addFallbackLogo(doc, yPosition, branding, true);
        yPosition += 20;
      }
    } else {
      this.addFallbackLogo(doc, yPosition, branding, true);
      yPosition += 20;
    }

    // Add title
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleText = 'API Analytics Report';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (doc.internal.pageSize.width - titleWidth) / 2, yPosition);
    yPosition += 15;

    // Add subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const periodText = `${metadata.dateRange.start.toLocaleDateString()} - ${metadata.dateRange.end.toLocaleDateString()}`;
    const periodWidth = doc.getTextWidth(periodText);
    doc.text(periodText, (doc.internal.pageSize.width - periodWidth) / 2, yPosition);
    yPosition += 30;

    // Add executive summary box if we have summary data
    if (data.summary) {
      // Draw box with burgundy border
      const boxX = this.PAGE_MARGIN;
      const boxY = yPosition;
      const boxWidth = doc.internal.pageSize.width - (2 * this.PAGE_MARGIN);
      const boxHeight = 90;

      // Light gold background
      const lightGoldRGB = this.hexToRGBArray(branding.colors.lightGold);
      doc.setFillColor(lightGoldRGB[0], lightGoldRGB[1], lightGoldRGB[2]);
      doc.setDrawColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
      doc.setLineWidth(1);
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'FD');

      // Executive Summary title
      doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', boxX + 10, boxY + 15);

      // Key metrics in a grid
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const col1X = boxX + 10;
      const col2X = boxX + (boxWidth / 2) + 5;
      let metricY = boxY + 30;
      const lineHeight = 12;

      // Column 1
      doc.setFont('helvetica', 'bold');
      doc.text('Total API Calls:', col1X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.summary.totalCalls.toLocaleString(), col1X + 50, metricY);

      metricY += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('Success Rate:', col1X, metricY);
      doc.setFont('helvetica', 'normal');
      const successColor = data.summary.successRate >= 95 ? [0, 128, 0] : data.summary.successRate >= 80 ? [255, 165, 0] : [255, 0, 0];
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.text(this.formatPercentage(data.summary.successRate), col1X + 50, metricY);
      doc.setTextColor(0, 0, 0);

      metricY += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('Datapro Calls:', col1X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.summary.dataproCalls.toLocaleString(), col1X + 50, metricY);

      metricY += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('VerifyData Calls:', col1X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.summary.verifydataCalls.toLocaleString(), col1X + 50, metricY);

      // Column 2
      metricY = boxY + 30;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Cost:', col2X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(this.formatCurrency(data.summary.totalCost), col2X + 40, metricY);

      metricY += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('Datapro Cost:', col2X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(this.formatCurrency(data.summary.dataproCost), col2X + 40, metricY);

      metricY += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('VerifyData Cost:', col2X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(this.formatCurrency(data.summary.verifydataCost), col2X + 40, metricY);

      metricY += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('Failure Rate:', col2X, metricY);
      doc.setFont('helvetica', 'normal');
      doc.text(this.formatPercentage(data.summary.failureRate), col2X + 40, metricY);

      yPosition += boxHeight + 20;
    }

    // Add metadata at bottom
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    yPosition = doc.internal.pageSize.height - 40;
    doc.text(`Generated: ${metadata.generatedAt.toLocaleString()}`, this.PAGE_MARGIN, yPosition);
    yPosition += 6;
    doc.text(`Generated By: ${metadata.generatedBy}`, this.PAGE_MARGIN, yPosition);
    
    if (metadata.filters?.provider && metadata.filters.provider !== 'all') {
      yPosition += 6;
      doc.text(`Provider Filter: ${metadata.filters.provider}`, this.PAGE_MARGIN, yPosition);
    }
    if (metadata.filters?.status && metadata.filters.status !== 'all') {
      yPosition += 6;
      doc.text(`Status Filter: ${metadata.filters.status}`, this.PAGE_MARGIN, yPosition);
    }
  }

  /**
   * Adds fallback logo text
   * 
   * Requirements: 10.2
   */
  private addFallbackLogo(doc: jsPDF, yPosition: number, branding: NEMBranding, centered: boolean = false): void {
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const text = 'NEM Insurance';
    if (centered) {
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (doc.internal.pageSize.width - textWidth) / 2, yPosition);
    } else {
      doc.text(text, this.PAGE_MARGIN, yPosition);
    }
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  /**
   * Adds branded header to page
   * 
   * Requirements: 2.3
   */
  private async addPageHeader(
    doc: jsPDF,
    pageNumber: number,
    branding: NEMBranding
  ): Promise<void> {
    // Skip header on cover page
    if (pageNumber === 1) return;

    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    
    // Add small logo or text
    if (branding.logo.base64) {
      try {
        doc.addImage(
          branding.logo.base64,
          'JPEG',
          this.PAGE_MARGIN,
          10,
          24,  // Adjusted for better proportion (2:1 ratio)
          12   // Maintain aspect ratio
        );
      } catch (error) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
        doc.text('NEM Insurance', this.PAGE_MARGIN, 20);
      }
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
      doc.text('NEM Insurance', this.PAGE_MARGIN, 20);
    }

    // Add title on right
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const titleText = 'API Analytics Report';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, doc.internal.pageSize.width - this.PAGE_MARGIN - titleWidth, 20);
    
    // Add line
    doc.setDrawColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setLineWidth(0.5);
    doc.line(this.PAGE_MARGIN, this.HEADER_HEIGHT, doc.internal.pageSize.width - this.PAGE_MARGIN, this.HEADER_HEIGHT);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  }

  /**
   * Adds branded footer to page
   * 
   * Requirements: 2.4
   */
  private addPageFooter(
    doc: jsPDF,
    pageNumber: number,
    totalPages: number,
    generatedAt: Date
  ): void {
    const pageHeight = doc.internal.pageSize.height;
    const yPosition = pageHeight - 10;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Page number
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      this.PAGE_MARGIN,
      yPosition
    );
    
    // Generation timestamp
    doc.text(
      `Generated: ${generatedAt.toLocaleDateString()}`,
      doc.internal.pageSize.width - this.PAGE_MARGIN - 40,
      yPosition
    );
    
    doc.setTextColor(0, 0, 0);
  }

  /**
   * Generates table of contents
   * 
   * Requirements: 2.5
   */
  private generateTableOfContents(
    doc: jsPDF,
    sections: SectionInfo[],
    branding: NEMBranding
  ): void {
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    let yPosition = this.HEADER_HEIGHT + 20;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.text('Table of Contents', this.PAGE_MARGIN, yPosition);
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    sections.forEach((section) => {
      doc.text(section.title, this.PAGE_MARGIN + 5, yPosition);
      const pageText = `Page ${section.pageNumber}`;
      const pageWidth = doc.getTextWidth(pageText);
      doc.text(
        pageText,
        doc.internal.pageSize.width - this.PAGE_MARGIN - pageWidth,
        yPosition
      );
      
      // Add dotted line (using multiple short lines to simulate dots)
      doc.setDrawColor(200, 200, 200);
      const textWidth = doc.getTextWidth(section.title);
      const startX = this.PAGE_MARGIN + textWidth + 10;
      const endX = doc.internal.pageSize.width - this.PAGE_MARGIN - pageWidth - 10;
      const lineY = yPosition - 2;
      
      // Draw dots manually
      for (let x = startX; x < endX; x += 3) {
        doc.line(x, lineY, x + 1, lineY);
      }
      
      doc.setDrawColor(0, 0, 0);
      
      yPosition += 12;
    });
  }

  /**
   * Adds overview section
   * 
   * Requirements: 2.6, 2.7, 2.10
   */
  private addOverviewSection(
    doc: jsPDF,
    summary: AnalyticsSummary,
    branding: NEMBranding
  ): void {
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    let yPosition = this.HEADER_HEIGHT + 20;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.text('Overview Metrics', this.PAGE_MARGIN, yPosition);
    yPosition += 5;
    
    // Underline
    doc.setDrawColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setLineWidth(0.5);
    doc.line(this.PAGE_MARGIN, yPosition, this.PAGE_MARGIN + 60, yPosition);
    yPosition += 15;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const overviewData = [
      ['Total Calls', summary.totalCalls.toLocaleString()],
      ['Total Cost', this.formatCurrency(summary.totalCost)],
      ['Success Rate', this.formatPercentage(summary.successRate)],
      ['Failure Rate', this.formatPercentage(summary.failureRate)],
      ['Datapro Calls', summary.dataproCalls.toLocaleString()],
      ['Datapro Cost', this.formatCurrency(summary.dataproCost)],
      ['VerifyData Calls', summary.verifydataCalls.toLocaleString()],
      ['VerifyData Cost', this.formatCurrency(summary.verifydataCost)],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'grid',
      headStyles: {
        fillColor: burgundyRGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: this.hexToRGBArray(branding.colors.lightGold),
      },
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
    });
  }

  /**
   * Adds usage data section
   */
  private addUsageDataSection(
    doc: jsPDF,
    usageData: UsageDataPoint[],
    branding: NEMBranding
  ): void {
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    let yPosition = this.HEADER_HEIGHT + 20;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.text('Usage Data', this.PAGE_MARGIN, yPosition);
    yPosition += 5;
    
    // Underline
    doc.setDrawColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setLineWidth(0.5);
    doc.line(this.PAGE_MARGIN, yPosition, this.PAGE_MARGIN + 40, yPosition);
    yPosition += 15;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const tableData = usageData.map((d) => [
      d.date,
      d.totalCalls.toLocaleString(),
      this.formatCurrency(d.totalCost),
      d.successCount.toLocaleString(),
      d.failureCount.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Total Calls', 'Total Cost', 'Success', 'Failure']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: burgundyRGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: this.hexToRGBArray(branding.colors.lightGold),
      },
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  /**
   * Adds broker usage section
   */
  private addBrokerUsageSection(
    doc: jsPDF,
    brokerUsage: BrokerUsage[],
    branding: NEMBranding
  ): void {
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    let yPosition = this.HEADER_HEIGHT + 20;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.text('Broker Attribution', this.PAGE_MARGIN, yPosition);
    yPosition += 5;
    
    // Underline
    doc.setDrawColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setLineWidth(0.5);
    doc.line(this.PAGE_MARGIN, yPosition, this.PAGE_MARGIN + 60, yPosition);
    yPosition += 15;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const tableData = brokerUsage.map((b) => [
      b.userName,
      b.totalCalls.toLocaleString(),
      this.formatCurrency(b.totalCost),
      this.formatPercentage(b.successRate),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Broker', 'Total Calls', 'Total Cost', 'Success Rate']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: burgundyRGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: this.hexToRGBArray(branding.colors.lightGold),
      },
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  /**
   * Adds audit logs section
   */
  private addAuditLogsSection(
    doc: jsPDF,
    auditLogs: AuditLogEntry[],
    branding: NEMBranding
  ): void {
    const burgundyRGB = this.hexToRGBArray(branding.colors.primary);
    let yPosition = this.HEADER_HEIGHT + 20;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.text('Audit Logs', this.PAGE_MARGIN, yPosition);
    yPosition += 5;
    
    // Underline
    doc.setDrawColor(burgundyRGB[0], burgundyRGB[1], burgundyRGB[2]);
    doc.setLineWidth(0.5);
    doc.line(this.PAGE_MARGIN, yPosition, this.PAGE_MARGIN + 40, yPosition);
    yPosition += 10;
    
    // Add note about showing all records
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text(`Showing all ${auditLogs.length} audit log entries`, this.PAGE_MARGIN, yPosition);
    yPosition += 10;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Show ALL audit logs (no limit)
    const tableData = auditLogs.map((log) => {
      const timestamp = typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toLocaleString();
      return [
        timestamp,
        log.userName || 'N/A',
        log.provider || 'N/A',
        log.status || 'N/A',
        this.formatCurrency(log.cost || 0),
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Timestamp', 'User', 'Provider', 'Status', 'Cost']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: burgundyRGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: this.hexToRGBArray(branding.colors.lightGold),
      },
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
      styles: { fontSize: 8, cellPadding: 3 },
      // Allow table to span multiple pages
      showHead: 'everyPage',
      pageBreak: 'auto',
    });
  }

  /**
   * Converts hex color to RGB array
   */
  private hexToRGBArray(hex: string): [number, number, number] {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();
