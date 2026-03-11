// Mismatch Analyzer Service - provides detailed analysis and reporting of verification mismatches

import { 
  FieldMismatch, 
  MismatchCategory, 
  MismatchAnalysis,
  SimilarityScore 
} from '../types/geminiDocumentVerification';

interface MismatchPattern {
  pattern: RegExp;
  category: MismatchCategory;
  severity: 'critical' | 'major' | 'minor';
  userFriendlyDescription: string;
  suggestedAction: string;
}

interface FieldAnalysis {
  field: string;
  category: MismatchCategory;
  severity: 'critical' | 'major' | 'minor';
  confidence: number;
  explanation: string;
  suggestedResolution: string;
  examples?: string[];
}

export class MismatchAnalyzer {
  private readonly mismatchPatterns: MismatchPattern[] = [
    // Name variations
    {
      pattern: /name|fullname|companyname/i,
      category: 'name_variation',
      severity: 'major',
      userFriendlyDescription: 'Name differences detected',
      suggestedAction: 'Verify the correct spelling and format of the name'
    },
    
    // Address variations
    {
      pattern: /address|location|street/i,
      category: 'address_variation',
      severity: 'minor',
      userFriendlyDescription: 'Address format differences',
      suggestedAction: 'Check for abbreviations, spelling variations, or formatting differences'
    },
    
    // Date mismatches
    {
      pattern: /date|birth|registration/i,
      category: 'date_mismatch',
      severity: 'critical',
      userFriendlyDescription: 'Date information does not match',
      suggestedAction: 'Verify the date format and ensure accuracy'
    },
    
    // ID number mismatches
    {
      pattern: /nin|bvn|rc|number|id/i,
      category: 'id_mismatch',
      severity: 'critical',
      userFriendlyDescription: 'Identification number mismatch',
      suggestedAction: 'Double-check the identification number for accuracy'
    },
    
    // Director mismatches
    {
      pattern: /director|officer|signatory/i,
      category: 'director_mismatch',
      severity: 'major',
      userFriendlyDescription: 'Director information differences',
      suggestedAction: 'Verify current director information and check for recent changes'
    }
  ];

  /**
   * Analyze mismatches and provide detailed reporting
   */
  analyzeMismatches(mismatches: FieldMismatch[]): MismatchAnalysis {
    const fieldAnalyses: FieldAnalysis[] = [];
    let overallSeverity: 'critical' | 'major' | 'minor' = 'minor';
    let totalConfidence = 0;

    for (const mismatch of mismatches) {
      const analysis = this.analyzeFieldMismatch(mismatch);
      fieldAnalyses.push(analysis);

      // Update overall severity
      if (analysis.severity === 'critical') {
        overallSeverity = 'critical';
      } else if (analysis.severity === 'major' && overallSeverity !== 'critical') {
        overallSeverity = 'major';
      }

      totalConfidence += analysis.confidence;
    }

    const averageConfidence = mismatches.length > 0 ? totalConfidence / mismatches.length : 100;

    return {
      totalMismatches: mismatches.length,
      criticalMismatches: fieldAnalyses.filter(f => f.severity === 'critical').length,
      majorMismatches: fieldAnalyses.filter(f => f.severity === 'major').length,
      minorMismatches: fieldAnalyses.filter(f => f.severity === 'minor').length,
      overallSeverity,
      confidence: Math.round(averageConfidence),
      fieldAnalyses,
      summary: this.generateSummary(fieldAnalyses, overallSeverity),
      recommendations: this.generateRecommendations(fieldAnalyses),
      canProceed: overallSeverity !== 'critical',
      requiresManualReview: overallSeverity === 'critical' || fieldAnalyses.length > 3
    };
  }

  /**
   * Analyze a single field mismatch
   */
  private analyzeFieldMismatch(mismatch: FieldMismatch): FieldAnalysis {
    const pattern = this.findMatchingPattern(mismatch.field);
    const category = pattern?.category || this.inferCategory(mismatch);
    const severity = this.determineSeverity(mismatch, pattern);
    
    return {
      field: mismatch.field,
      category,
      severity,
      confidence: this.calculateAnalysisConfidence(mismatch),
      explanation: this.generateExplanation(mismatch, category),
      suggestedResolution: this.generateResolution(mismatch, category),
      examples: this.generateExamples(mismatch, category)
    };
  }

  /**
   * Find matching pattern for field
   */
  private findMatchingPattern(fieldName: string): MismatchPattern | undefined {
    return this.mismatchPatterns.find(pattern => pattern.pattern.test(fieldName));
  }

  /**
   * Infer category from mismatch data
   */
  private inferCategory(mismatch: FieldMismatch): MismatchCategory {
    const field = mismatch.field.toLowerCase();
    const extractedValue = mismatch.extractedValue?.toLowerCase() || '';
    const expectedValue = mismatch.expectedValue?.toLowerCase() || '';

    // Check for common patterns
    if (field.includes('name')) {
      return this.analyzeNameMismatch(extractedValue, expectedValue);
    }
    
    if (field.includes('address')) {
      return 'address_variation';
    }
    
    if (field.includes('date') || field.includes('birth') || field.includes('registration')) {
      return 'date_mismatch';
    }
    
    if (field.includes('nin') || field.includes('bvn') || field.includes('rc')) {
      return 'id_mismatch';
    }
    
    if (field.includes('director') || field.includes('officer')) {
      return 'director_mismatch';
    }

    return 'format_difference';
  }

  /**
   * Analyze name mismatch type
   */
  private analyzeNameMismatch(extracted: string, expected: string): MismatchCategory {
    // Check for common name variations
    const extractedWords = extracted.split(/\s+/);
    const expectedWords = expected.split(/\s+/);
    
    // Check for abbreviations
    if (this.hasAbbreviations(extractedWords, expectedWords)) {
      return 'abbreviation';
    }
    
    // Check for ordering differences
    if (this.hasSameWordsReordered(extractedWords, expectedWords)) {
      return 'name_variation';
    }
    
    // Check for spelling variations
    if (this.hasSpellingVariations(extractedWords, expectedWords)) {
      return 'spelling_variation';
    }
    
    return 'name_variation';
  }

  /**
   * Determine severity of mismatch
   */
  private determineSeverity(mismatch: FieldMismatch, pattern?: MismatchPattern): 'critical' | 'major' | 'minor' {
    // Critical fields are always critical regardless of similarity
    if (mismatch.isCritical) {
      return 'critical';
    }
    
    // For non-critical fields, consider similarity score first
    if (mismatch.similarity >= 80) {
      return 'minor';
    } else if (mismatch.similarity >= 50) {
      return pattern?.severity === 'critical' ? 'major' : 'minor';
    } else if (mismatch.similarity >= 30) {
      return 'major';
    } else {
      // Very low similarity - use pattern severity or default to major
      return pattern?.severity === 'minor' ? 'major' : (pattern?.severity || 'major');
    }
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateAnalysisConfidence(mismatch: FieldMismatch): number {
    let confidence = 100;

    // Reduce confidence for very low similarity
    if (mismatch.similarity < 20) {
      confidence -= 30;
    } else if (mismatch.similarity < 50) {
      confidence -= 15;
    }

    // Reduce confidence for missing values
    if (!mismatch.extractedValue || !mismatch.expectedValue) {
      confidence -= 20;
    }

    // Reduce confidence for very short values (likely incomplete)
    if ((mismatch.extractedValue?.length || 0) < 3 || (mismatch.expectedValue?.length || 0) < 3) {
      confidence -= 10;
    }

    return Math.max(confidence, 0);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(mismatch: FieldMismatch, category: MismatchCategory): string {
    const field = this.formatFieldName(mismatch.field);
    const similarity = mismatch.similarity;

    switch (category) {
      case 'name_variation':
        return `The ${field} shows ${similarity}% similarity. This could be due to different name formats, middle names, or spelling variations.`;
      
      case 'address_variation':
        return `The ${field} shows ${similarity}% similarity. This is often caused by abbreviations, different formatting, or minor spelling differences.`;
      
      case 'date_mismatch':
        return `The ${field} does not match exactly. Date fields require precise matching for verification.`;
      
      case 'id_mismatch':
        return `The ${field} does not match the official records. Identification numbers must be exact.`;
      
      case 'director_mismatch':
        return `The ${field} information differs from official records. This could indicate recent changes or data entry variations.`;
      
      case 'abbreviation':
        return `The ${field} appears to use different abbreviations or shortened forms.`;
      
      case 'spelling_variation':
        return `The ${field} has spelling differences that may be due to transcription errors or alternative spellings.`;
      
      case 'format_difference':
        return `The ${field} has formatting differences but may contain the same core information.`;
      
      default:
        return `The ${field} shows ${similarity}% similarity to the expected value.`;
    }
  }

  /**
   * Generate resolution suggestions
   */
  private generateResolution(mismatch: FieldMismatch, category: MismatchCategory): string {
    switch (category) {
      case 'name_variation':
        return 'Check if the names refer to the same person/entity. Look for middle names, nicknames, or alternative spellings.';
      
      case 'address_variation':
        return 'Verify if the addresses refer to the same location. Check for abbreviations like "St." vs "Street" or "Ltd." vs "Limited".';
      
      case 'date_mismatch':
        return 'Double-check the date format and ensure the correct date is entered. Verify the source document for accuracy.';
      
      case 'id_mismatch':
        return 'Verify the identification number from the original document. Ensure no transcription errors occurred.';
      
      case 'director_mismatch':
        return 'Check for recent changes in company directors. Verify against the most current CAC records.';
      
      case 'abbreviation':
        return 'Expand abbreviations or use the full form consistently. For example, use "Limited" instead of "Ltd.".';
      
      case 'spelling_variation':
        return 'Use the official spelling from government records. Check for common spelling variations or typos.';
      
      case 'format_difference':
        return 'Standardize the format to match official records. Remove extra spaces, punctuation, or formatting.';
      
      default:
        return 'Review the field carefully and ensure it matches the official documentation exactly.';
    }
  }

  /**
   * Generate examples for common issues
   */
  private generateExamples(mismatch: FieldMismatch, category: MismatchCategory): string[] {
    switch (category) {
      case 'name_variation':
        return [
          'John Smith vs John A. Smith',
          'ABC Ltd vs ABC Limited',
          'Mohammed vs Muhammad'
        ];
      
      case 'address_variation':
        return [
          '123 Main St vs 123 Main Street',
          'Lagos State vs Lagos',
          'Plot 456, Block A vs Plot 456 Block A'
        ];
      
      case 'abbreviation':
        return [
          'Co. vs Company',
          'Ltd vs Limited',
          'St. vs Street'
        ];
      
      case 'spelling_variation':
        return [
          'Centre vs Center',
          'Mohammed vs Muhammad',
          'Colour vs Color'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Generate overall summary
   */
  private generateSummary(analyses: FieldAnalysis[], severity: 'critical' | 'major' | 'minor'): string {
    const total = analyses.length;
    const critical = analyses.filter(a => a.severity === 'critical').length;
    const major = analyses.filter(a => a.severity === 'major').length;
    const minor = analyses.filter(a => a.severity === 'minor').length;

    if (total === 0) {
      return 'All fields match successfully. No issues detected.';
    }

    let summary = `Found ${total} mismatch${total > 1 ? 'es' : ''}`;
    
    if (critical > 0) {
      summary += ` including ${critical} critical issue${critical > 1 ? 's' : ''}`;
    }
    
    if (major > 0) {
      summary += `${critical > 0 ? ' and' : ' including'} ${major} major issue${major > 1 ? 's' : ''}`;
    }

    switch (severity) {
      case 'critical':
        summary += '. Manual review required before proceeding.';
        break;
      case 'major':
        summary += '. Review recommended to ensure accuracy.';
        break;
      case 'minor':
        summary += '. Minor formatting differences detected.';
        break;
    }

    return summary;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(analyses: FieldAnalysis[]): string[] {
    const recommendations: string[] = [];
    const criticalFields = analyses.filter(a => a.severity === 'critical');
    const majorFields = analyses.filter(a => a.severity === 'major');

    // Handle empty case first
    if (analyses.length === 0) {
      recommendations.push('✅ All checks passed');
      return recommendations;
    }

    if (criticalFields.length > 0) {
      recommendations.push('🔴 Critical: Resolve all critical mismatches before proceeding with verification.');
      
      criticalFields.forEach(field => {
        recommendations.push(`   • ${this.formatFieldName(field.field)}: ${field.suggestedResolution}`);
      });
    }

    if (majorFields.length > 0) {
      recommendations.push('🟡 Major: Review and correct major mismatches for better accuracy.');
      
      majorFields.forEach(field => {
        recommendations.push(`   • ${this.formatFieldName(field.field)}: ${field.suggestedResolution}`);
      });
    }

    if (analyses.length > 3) {
      recommendations.push('📋 Consider manual verification due to multiple mismatches.');
    }

    // Ensure we always have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push('Review all mismatches and ensure data accuracy.');
    }

    return recommendations;
  }

  /**
   * Format field name for display
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Check if words contain abbreviations
   */
  private hasAbbreviations(words1: string[], words2: string[]): boolean {
    const abbreviations = new Map([
      ['ltd', 'limited'],
      ['co', 'company'],
      ['corp', 'corporation'],
      ['inc', 'incorporated'],
      ['st', 'street'],
      ['ave', 'avenue'],
      ['dr', 'drive'],
      ['rd', 'road']
    ]);

    for (const word1 of words1) {
      for (const word2 of words2) {
        const lower1 = word1.toLowerCase().replace(/[.,]/g, '');
        const lower2 = word2.toLowerCase().replace(/[.,]/g, '');
        
        if (abbreviations.get(lower1) === lower2 || abbreviations.get(lower2) === lower1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if words are the same but reordered
   */
  private hasSameWordsReordered(words1: string[], words2: string[]): boolean {
    if (words1.length !== words2.length) return false;
    
    const sorted1 = words1.map(w => w.toLowerCase()).sort();
    const sorted2 = words2.map(w => w.toLowerCase()).sort();
    
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
  }

  /**
   * Check for spelling variations
   */
  private hasSpellingVariations(words1: string[], words2: string[]): boolean {
    if (words1.length !== words2.length) return false;
    
    for (let i = 0; i < words1.length; i++) {
      const word1 = words1[i].toLowerCase();
      const word2 = words2[i].toLowerCase();
      
      // Simple Levenshtein distance check
      const distance = this.levenshteinDistance(word1, word2);
      const maxLength = Math.max(word1.length, word2.length);
      const similarity = (maxLength - distance) / maxLength;
      
      if (similarity < 0.7) return false; // Too different
    }
    
    return true;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

// Export singleton instance
export const mismatchAnalyzer = new MismatchAnalyzer();