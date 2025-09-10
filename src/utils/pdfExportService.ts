/**
 * PDF Export Service
 * 
 * Handles generating PDF reports for premium users.
 * This is a mock implementation - in production you would use a library like
 * react-native-print or expo-print to generate actual PDFs.
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface AssessmentResults {
  personalityScores: Record<string, number>;
  twinDynamics: Record<string, number>;
  recommendations: string[];
  timestamp: string;
  userProfile: {
    name: string;
    twinType: string;
  };
  twinProfile?: {
    name: string;
  };
}

interface PDFExportOptions {
  includeCharts?: boolean;
  includeRecommendations?: boolean;
  includeTwinComparison?: boolean;
  format?: 'detailed' | 'summary';
  branding?: boolean;
}

class PDFExportService {
  /**
   * Generate PDF report from assessment results
   */
  async generateAssessmentPDF(
    results: AssessmentResults,
    options: PDFExportOptions = {}
  ): Promise<string> {
    try {
      const {
        includeCharts = true,
        includeRecommendations = true,
        includeTwinComparison = true,
        format = 'detailed',
        branding = true
      } = options;

      // In production, this would use a proper PDF generation library
      // For now, we'll create an HTML representation that could be converted to PDF
      
      const htmlContent = this.generateHTMLReport(results, {
        includeCharts,
        includeRecommendations,
        includeTwinComparison,
        format,
        branding
      });

      // Mock PDF generation - in production use expo-print or similar
      const filename = `twinship-assessment-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // This would normally convert HTML to PDF
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);
      
      return fileUri;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Share PDF file
   */
  async shareAssessmentPDF(
    results: AssessmentResults,
    options?: PDFExportOptions
  ): Promise<void> {
    try {
      const pdfUri = await this.generateAssessmentPDF(results, options);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Twin Assessment Report'
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('PDF sharing failed:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for PDF conversion
   */
  private generateHTMLReport(
    results: AssessmentResults,
    options: PDFExportOptions
  ): string {
    const { userProfile, twinProfile, personalityScores, twinDynamics, recommendations } = results;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Twinship Assessment Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #8a2be2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8a2be2;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border-radius: 10px;
            background: #f9f9f9;
        }
        .section h2 {
            color: #8a2be2;
            border-bottom: 2px solid #8a2be2;
            padding-bottom: 10px;
        }
        .score-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .score-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #8a2be2;
        }
        .score-label {
            font-weight: bold;
            color: #333;
        }
        .score-value {
            font-size: 24px;
            color: #8a2be2;
            font-weight: bold;
        }
        .recommendations {
            list-style: none;
            padding: 0;
        }
        .recommendations li {
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00bfff;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
        .twin-info {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    ${options.branding ? `
    <div class="header">
        <div class="logo">Twinship</div>
        <div class="subtitle">Sacred Twin Bond Assessment Report</div>
        <p>Generated on ${new Date(results.timestamp).toLocaleDateString()}</p>
    </div>
    ` : ''}
    
    <div class="section">
        <h2>Twin Profile Information</h2>
        <div class="twin-info">
            <strong>Primary Twin:</strong> ${userProfile.name}<br>
            <strong>Twin Type:</strong> ${userProfile.twinType}<br>
            ${twinProfile ? `<strong>Twin Partner:</strong> ${twinProfile.name}<br>` : ''}
        </div>
    </div>

    ${options.format === 'detailed' ? `
    <div class="section">
        <h2>Personality Dimensions</h2>
        <div class="score-grid">
            ${Object.entries(personalityScores).map(([trait, score]) => `
                <div class="score-item">
                    <div class="score-label">${trait.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                    <div class="score-value">${score}/100</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Twin Dynamics</h2>
        <div class="score-grid">
            ${Object.entries(twinDynamics).map(([dynamic, score]) => `
                <div class="score-item">
                    <div class="score-label">${dynamic.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                    <div class="score-value">${score}/100</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : `
    <div class="section">
        <h2>Assessment Summary</h2>
        <p>This summary report contains key insights from your twin assessment. For detailed breakdowns of all personality dimensions and twin dynamics, please access the full digital report.</p>
    </div>
    `}

    ${options.includeRecommendations ? `
    <div class="section">
        <h2>Personalized Recommendations</h2>
        <ul class="recommendations">
            ${recommendations.slice(0, options.format === 'detailed' ? recommendations.length : 3).map(rec => `
                <li>${rec}</li>
            `).join('')}
        </ul>
        ${options.format === 'summary' && recommendations.length > 3 ? '<p><em>Additional recommendations available in your premium dashboard.</em></p>' : ''}
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Important Note:</strong> This assessment is for personal development purposes only and is not a diagnostic tool. For professional relationship counseling, please consult with a qualified therapist.</p>
        <p>© ${new Date().getFullYear()} Twinship - Strengthening Twin Bonds</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Check if PDF generation is supported
   */
  isSupported(): boolean {
    return Platform.OS !== 'web'; // PDF generation typically not supported in web
  }

  /**
   * Get estimated file size for PDF
   */
  getEstimatedFileSize(options: PDFExportOptions = {}): string {
    const { format = 'detailed', includeCharts = true } = options;
    
    if (format === 'detailed' && includeCharts) {
      return '2-4 MB';
    } else if (format === 'detailed') {
      return '1-2 MB';
    } else {
      return '500 KB - 1 MB';
    }
  }
}

export const pdfExportService = new PDFExportService();