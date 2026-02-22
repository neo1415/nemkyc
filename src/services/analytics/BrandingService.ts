/**
 * Branding Service
 * 
 * Manages NEM Insurance branding assets including logo and color palette.
 * Provides utilities for loading and caching the NEM logo and converting
 * colors for different report formats.
 * 
 * Requirements: 2.1, 2.2, 10.1, 10.2
 */

export interface NEMBranding {
  logo: {
    path: string;
    width: number;
    height: number;
    base64?: string;
  };
  colors: {
    primary: string;      // Burgundy #800020
    secondary: string;    // Gold #FFD700
    accent1: string;      // Brown #8B4513
    accent2: string;      // Golden #DAA520
    lightGold: string;    // Light Gold #FFF8DC
  };
  title: string;
}

export class BrandingService {
  private logoCache: string | null = null;
  private readonly LOGO_PATH = '/Nem-insurance-Logo.jpg';
  
  private readonly branding: NEMBranding = {
    logo: {
      path: this.LOGO_PATH,
      width: 120,  // Normal size in pixels
      height: 60,  // Maintain aspect ratio
    },
    colors: {
      primary: '#800020',    // Burgundy
      secondary: '#FFD700',  // Gold
      accent1: '#8B4513',    // Brown
      accent2: '#DAA520',    // Golden
      lightGold: '#FFF8DC',  // Light Gold
    },
    title: 'NEM Insurance - API Analytics Report',
  };

  /**
   * Loads NEM logo from file system and converts to base64
   * 
   * Requirements: 2.1, 10.1
   */
  async loadLogo(): Promise<string | null> {
    // Return cached logo if available
    if (this.logoCache) {
      return this.logoCache;
    }

    try {
      // Fetch the logo file
      const response = await fetch(this.LOGO_PATH);
      
      if (!response.ok) {
        console.warn(`Logo not found at ${this.LOGO_PATH}, using fallback`);
        return null;
      }

      // Convert to blob
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);
      
      // Cache the result
      this.logoCache = base64;
      
      return base64;
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  }

  /**
   * Gets NEM color palette
   * 
   * Requirements: 2.2
   */
  getColors(): NEMBranding['colors'] {
    return { ...this.branding.colors };
  }

  /**
   * Gets formatted report title
   * 
   * Requirements: 2.2
   */
  getReportTitle(): string {
    return this.branding.title;
  }

  /**
   * Gets logo dimensions
   */
  getLogoDimensions(): { width: number; height: number } {
    return {
      width: this.branding.logo.width,
      height: this.branding.logo.height,
    };
  }

  /**
   * Gets complete branding object
   */
  async getBranding(): Promise<NEMBranding> {
    const logo = await this.loadLogo();
    
    return {
      ...this.branding,
      logo: {
        ...this.branding.logo,
        base64: logo || undefined,
      },
    };
  }

  /**
   * Converts hex color to RGB for PDF
   * 
   * Requirements: 2.2
   */
  hexToRGB(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Converts hex color to RGB array for jsPDF
   */
  hexToRGBArray(hex: string): [number, number, number] {
    const { r, g, b } = this.hexToRGB(hex);
    return [r, g, b];
  }

  /**
   * Gets fallback text for when logo is not available
   * 
   * Requirements: 10.2
   */
  getFallbackText(): string {
    return 'NEM Insurance';
  }

  /**
   * Gets fallback text color (burgundy)
   * 
   * Requirements: 10.2
   */
  getFallbackTextColor(): string {
    return this.branding.colors.primary;
  }

  /**
   * Clears logo cache (useful for testing)
   */
  clearCache(): void {
    this.logoCache = null;
  }

  /**
   * Converts blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to convert blob to base64'));
      };
      
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
export const brandingService = new BrandingService();
