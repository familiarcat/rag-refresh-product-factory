/**
 * Vision-capable AI client for image analysis and OCR
 *
 * Extends the base AlexAiClient with vision model support for:
 * - Image analysis
 * - Screenshot understanding
 * - OCR text extraction
 * - Code screenshot interpretation
 */

import * as vscode from 'vscode';

export interface VisionModel {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  vision: true;
  maxImageSize: number; // bytes
  supportedFormats: string[];
}

export const VISION_MODELS: VisionModel[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Vision)',
    provider: 'anthropic',
    vision: true,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Vision)',
    provider: 'openai',
    vision: true,
    maxImageSize: 20 * 1024 * 1024, // 20MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'google/gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'google',
    vision: true,
    maxImageSize: 4 * 1024 * 1024, // 4MB
    supportedFormats: ['image/jpeg', 'image/png']
  }
];

export interface ImageAnalysisRequest {
  image: string; // base64 encoded
  prompt: string;
  crewMember?: string;
  extractText?: boolean; // Enable OCR
}

export interface ImageAnalysisResult {
  analysis: string;
  extractedText?: string;
  crewMember: string;
  model: string;
}

export class VisionClient {
  private getConfig() {
    const config = vscode.workspace.getConfiguration('alexAi');
    return {
      apiKey: config.get<string>('openRouterApiKey') || '',
      baseUrl: config.get<string>('baseUrl') || 'http://localhost:3001',
      preferredVisionModel: config.get<string>('visionModel') || 'anthropic/claude-3.5-sonnet'
    };
  }

  /**
   * Analyze an image with AI
   */
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    const config = this.getConfig();

    if (!config.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Select vision model
    const model = this.selectVisionModel(request.crewMember);

    // Build prompt
    let fullPrompt = request.prompt;

    if (request.extractText) {
      fullPrompt += `\n\nPlease also extract any visible text from the image (OCR).`;
    }

    // Add crew-specific guidance
    if (request.crewMember) {
      fullPrompt = this.addCrewGuidance(request.crewMember, fullPrompt);
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://alex-ai.dev',
          'X-Title': 'Alex AI VS Code Extension - Vision'
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: fullPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${request.image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vision API error: ${error}`);
      }

      const data = await response.json() as any;
      const analysis = data.choices?.[0]?.message?.content || 'No analysis received';

      // Extract OCR text if requested
      let extractedText: string | undefined;
      if (request.extractText) {
        extractedText = this.extractOCRFromResponse(analysis);
      }

      return {
        analysis,
        extractedText,
        crewMember: request.crewMember || 'data',
        model: model.id
      };

    } catch (error) {
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze a code screenshot and extract code
   */
  async analyzeCodeScreenshot(imageBase64: string, crewMember: string = 'data'): Promise<{
    code: string;
    language: string;
    analysis: string;
  }> {
    const result = await this.analyzeImage({
      image: imageBase64,
      prompt: `This is a screenshot of code. Please:
1. Extract the exact code text (OCR)
2. Identify the programming language
3. Analyze the code and provide insights
4. Suggest improvements if any

Format your response as:
LANGUAGE: [language]
CODE:
\`\`\`[language]
[extracted code]
\`\`\`
ANALYSIS:
[your analysis]`,
      crewMember,
      extractText: true
    });

    // Parse response
    const language = result.analysis.match(/LANGUAGE:\s*(\w+)/i)?.[1] || 'plaintext';
    const codeMatch = result.analysis.match(/CODE:\s*```[\w]*\n([\s\S]*?)```/i);
    const code = codeMatch?.[1] || result.extractedText || '';
    const analysisMatch = result.analysis.match(/ANALYSIS:\s*([\s\S]*)/i);
    const analysis = analysisMatch?.[1] || result.analysis;

    return {
      code: code.trim(),
      language: language.toLowerCase(),
      analysis: analysis.trim()
    };
  }

  /**
   * Analyze UI/UX screenshot
   */
  async analyzeUIScreenshot(imageBase64: string): Promise<string> {
    const result = await this.analyzeImage({
      image: imageBase64,
      prompt: `Analyze this UI/UX screenshot. Consider:
- Design principles
- User experience
- Accessibility
- Visual hierarchy
- Potential improvements

Provide constructive feedback from a UX perspective.`,
      crewMember: 'troi' // Counselor Troi for UX analysis
    });

    return result.analysis;
  }

  /**
   * Analyze diagram or architecture screenshot
   */
  async analyzeDiagram(imageBase64: string): Promise<string> {
    const result = await this.analyzeImage({
      image: imageBase64,
      prompt: `Analyze this diagram or architecture visualization. Explain:
- What the diagram represents
- Key components and relationships
- Architectural patterns identified
- Potential issues or improvements

Be thorough and technical.`,
      crewMember: 'data' // Commander Data for technical analysis
    });

    return result.analysis;
  }

  /**
   * Select best vision model for crew member
   */
  private selectVisionModel(crewMember?: string): VisionModel {
    const config = this.getConfig();

    // Use configured model if available
    const configured = VISION_MODELS.find(m => m.id === config.preferredVisionModel);
    if (configured) {
      return configured;
    }

    // Default to Claude 3.5 Sonnet for most crew members
    // Use GPT-4o for crew members that prefer OpenAI
    const openAICrewMembers = ['data', 'worf', 'obrien', 'quark'];
    const useOpenAI = crewMember && openAICrewMembers.includes(crewMember.toLowerCase());

    if (useOpenAI) {
      return VISION_MODELS.find(m => m.id === 'openai/gpt-4o') || VISION_MODELS[0];
    }

    return VISION_MODELS[0]; // Default to Claude 3.5 Sonnet
  }

  /**
   * Add crew-specific guidance to image analysis
   */
  private addCrewGuidance(crewMember: string, prompt: string): string {
    const guidance: Record<string, string> = {
      picard: 'Analyze from a strategic and leadership perspective.',
      riker: 'Focus on tactical implications and actionable insights.',
      data: 'Provide precise technical analysis with attention to detail.',
      geordi: 'Focus on engineering and infrastructure aspects.',
      troi: 'Consider user experience, accessibility, and emotional impact.',
      worf: 'Assess security implications, potential vulnerabilities, and testing needs.',
      obrien: 'Focus on practical implementation and real-world debugging.',
      quark: 'Evaluate from a business value and cost-effectiveness angle.'
    };

    const crewGuidance = guidance[crewMember.toLowerCase()];
    if (crewGuidance) {
      return `${crewGuidance}\n\n${prompt}`;
    }

    return prompt;
  }

  /**
   * Extract OCR text from analysis response
   */
  private extractOCRFromResponse(analysis: string): string {
    // Look for code blocks
    const codeMatch = analysis.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1];
    }

    // Look for quoted text
    const quoteMatch = analysis.match(/"([^"]+)"/g);
    if (quoteMatch) {
      return quoteMatch.map(q => q.slice(1, -1)).join('\n');
    }

    // Return full analysis if no specific text found
    return analysis;
  }

  /**
   * Validate image data
   */
  validateImage(base64Data: string, model: VisionModel): { valid: boolean; error?: string } {
    // Check if base64 encoded
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return { valid: false, error: 'Invalid base64 encoding' };
    }

    // Estimate size
    const sizeBytes = (base64Data.length * 3) / 4;
    if (sizeBytes > model.maxImageSize) {
      return {
        valid: false,
        error: `Image too large (${(sizeBytes / 1024 / 1024).toFixed(2)}MB). Max: ${(model.maxImageSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Get supported vision models
   */
  getSupportedModels(): VisionModel[] {
    return VISION_MODELS;
  }
}

// Export singleton instance
export const visionClient = new VisionClient();
