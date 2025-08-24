

/**
 * Tone & Style Consistency Service
 * Comprehensive tone analysis, style guide compliance, and brand voice consistency
 */

import { LanguageModel, generateText, generateObject } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import { z } from 'zod';
import {
  ToneAnalysis,
  ToneCategory,
  EmotionalTone,
  ToneDeviation,
  BrandVoiceProfile,
  StyleCheck,
  StyleViolation,
  StyleSuggestion,
  ToneAnalysisRequest,
  StyleCheckRequest,
  StyleCheckType,
  StyleSeverity
} from '../types/advanced-writing';

export interface ToneStyleConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
}

// Zod schemas for structured AI responses
const ToneAnalysisSchema = z.object({
  primaryTone: z.enum([
    'PROFESSIONAL', 'CASUAL', 'AUTHORITATIVE', 'FRIENDLY', 'TECHNICAL', 
    'CONVERSATIONAL', 'ACADEMIC', 'PERSUASIVE', 'INFORMATIVE', 'ENTERTAINING',
    'EMPATHETIC', 'URGENT', 'CONFIDENT', 'HUMBLE'
  ]),
  secondaryTones: z.array(z.enum([
    'PROFESSIONAL', 'CASUAL', 'AUTHORITATIVE', 'FRIENDLY', 'TECHNICAL', 
    'CONVERSATIONAL', 'ACADEMIC', 'PERSUASIVE', 'INFORMATIVE', 'ENTERTAINING',
    'EMPATHETIC', 'URGENT', 'CONFIDENT', 'HUMBLE'
  ])),
  confidence: z.number().min(0).max(1),
  formalityScore: z.number().min(0).max(1),
  emotionalTone: z.enum([
    'NEUTRAL', 'POSITIVE', 'NEGATIVE', 'EXCITED', 'CONCERNED', 
    'OPTIMISTIC', 'CAUTIOUS', 'PASSIONATE', 'ANALYTICAL', 'INSPIRING'
  ]),
  emotionIntensity: z.number().min(0).max(1),
  authorityLevel: z.number().min(0).max(1),
  personalityTraits: z.record(z.number().min(0).max(1))
});

const StyleAnalysisSchema = z.object({
  sentenceLength: z.number(),
  paragraphLength: z.number(),
  readingLevel: z.number(),
  passiveVoiceScore: z.number().min(0).max(1),
  vocabularyLevel: z.enum(['basic', 'intermediate', 'advanced']),
  jargonUsage: z.number().min(0).max(1),
  repetitiveness: z.number().min(0).max(1),
  violations: z.array(z.object({
    type: z.string(),
    position: z.number(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    suggestion: z.string().optional()
  }))
});

export class ToneStyleConsistencyService {
  constructor(private config: ToneStyleConfig) {}

  /**
   * Perform comprehensive tone analysis on content
   */
  async analyzeTone(request: ToneAnalysisRequest): Promise<ToneAnalysis> {
    const content = await this.getContentForAnalysis(request.blogPostId, request.content);
    
    if (request.sectionsToAnalyze && request.sectionsToAnalyze.length > 0) {
      return this.analyzeSectionTones(request.blogPostId, request.sectionsToAnalyze, request);
    }

    const analysis = await this.performToneAnalysis(content, request.brandVoice);
    
    // Save to database if Prisma is available
    if (this.config.prisma) {
      await this.saveToneAnalysisToDatabase(request.blogPostId, analysis);
    }
    
    return analysis;
  }

  /**
   * Analyze tone consistency across multiple sections
   */
  async analyzeSectionTones(
    blogPostId: string,
    sectionIds: string[],
    request: ToneAnalysisRequest
  ): Promise<ToneAnalysis> {
    const sectionAnalyses: ToneAnalysis[] = [];
    
    for (const sectionId of sectionIds) {
      const sectionContent = await this.getSectionContent(sectionId);
      if (sectionContent) {
        const sectionAnalysis = await this.performToneAnalysis(
          sectionContent,
          request.brandVoice,
          sectionId
        );
        sectionAnalyses.push(sectionAnalysis);
      }
    }

    // Calculate overall consistency
    const consistencyScore = this.calculateConsistencyScore(sectionAnalyses);
    const deviations = this.identifyToneDeviations(sectionAnalyses);

    // Create combined analysis
    const combinedAnalysis: ToneAnalysis = {
      id: `tone_analysis_${Date.now()}`,
      blogPostId,
      primaryTone: this.determineDominantTone(sectionAnalyses),
      secondaryTones: this.extractSecondaryTones(sectionAnalyses),
      confidence: sectionAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / sectionAnalyses.length,
      formalityScore: sectionAnalyses.reduce((sum, analysis) => sum + analysis.formalityScore, 0) / sectionAnalyses.length,
      emotionalTone: this.determineDominantEmotion(sectionAnalyses),
      emotionIntensity: sectionAnalyses.reduce((sum, analysis) => sum + analysis.emotionIntensity, 0) / sectionAnalyses.length,
      authorityLevel: sectionAnalyses.reduce((sum, analysis) => sum + analysis.authorityLevel, 0) / sectionAnalyses.length,
      personalityTraits: this.mergePersonalityTraits(sectionAnalyses),
      brandVoiceScore: request.brandVoice ? this.calculateBrandVoiceAlignment(sectionAnalyses, request.brandVoice) : undefined,
      consistencyScore,
      deviations,
      analyzedAt: new Date(),
      modelUsed: typeof this.config.model === 'string' ? this.config.model : 'unknown'
    };

    return combinedAnalysis;
  }

  /**
   * Perform style check and compliance analysis
   */
  async performStyleCheck(request: StyleCheckRequest): Promise<StyleCheck> {
    const content = await this.getContentForAnalysis(request.blogPostId);
    
    // Get tone analysis if available or perform new one
    let toneAnalysis: ToneAnalysis | undefined;
    if (this.config.prisma) {
      toneAnalysis = await this.getLatestToneAnalysis(request.blogPostId);
    }
    
    if (!toneAnalysis) {
      toneAnalysis = await this.performToneAnalysis(content, request.brandVoice);
    }

    const styleAnalysis = await this.performStyleAnalysis(content);
    const complianceCheck = request.styleGuideId 
      ? await this.checkStyleGuideCompliance(content, request.styleGuideId)
      : { score: 0.8, violations: [] };

    const suggestions = await this.generateStyleSuggestions(content, styleAnalysis, request.brandVoice);

    const styleCheck: StyleCheck = {
      id: `style_check_${Date.now()}`,
      blogPostId: request.blogPostId,
      checkType: StyleCheckType.STYLE,
      severity: StyleSeverity.MINOR,
      message: 'Style analysis completed',
      position: 0,
      length: 0,
      toneAnalysisId: toneAnalysis.id,
      styleGuideId: request.styleGuideId,
      complianceScore: complianceCheck.score,
      violations: complianceCheck.violations,
      sentenceLength: styleAnalysis.sentenceLength,
      paragraphLength: styleAnalysis.paragraphLength,
      readingLevel: styleAnalysis.readingLevel,
      passiveVoiceScore: styleAnalysis.passiveVoiceScore,
      vocabularyLevel: styleAnalysis.vocabularyLevel,
      jargonUsage: styleAnalysis.jargonUsage,
      repetitiveness: styleAnalysis.repetitiveness,
      brandVoiceMatch: request.brandVoice ? this.calculateBrandVoiceMatch(toneAnalysis, request.brandVoice) : undefined,
      voicePersonality: toneAnalysis.personalityTraits,
      suggestions,
      criticalIssues: this.identifyCriticalIssues(styleAnalysis, complianceCheck.violations),
      checkedAt: new Date(),
      modelUsed: typeof this.config.model === 'string' ? this.config.model : 'unknown'
    };

    // Save to database
    if (this.config.prisma) {
      await this.saveStyleCheckToDatabase(styleCheck);
    }

    return styleCheck;
  }

  /**
   * Generate brand voice profile from example content
   */
  async createBrandVoiceProfile(examples: string[], profileName: string): Promise<BrandVoiceProfile> {
    const prompt = `Analyze the following content examples to create a brand voice profile:

${examples.map((example, i) => `Example ${i + 1}:\n${example}\n`).join('\n')}

Create a comprehensive brand voice profile by analyzing:
1. Primary and secondary tone categories
2. Personality traits (scale of 0-1 for each trait)
3. Vocabulary level (basic/intermediate/advanced)
4. Formality level (0-1 scale)
5. Common phrases and expressions
6. Words/phrases to avoid

Return the analysis in JSON format:
{
  "primaryTone": "PROFESSIONAL",
  "secondaryTones": ["FRIENDLY", "AUTHORITATIVE"],
  "personalityTraits": {
    "warmth": 0.7,
    "authority": 0.8,
    "approachability": 0.6,
    "expertise": 0.9,
    "enthusiasm": 0.5
  },
  "vocabularyLevel": "intermediate",
  "formalityLevel": 0.7,
  "examples": ["key phrases used", "characteristic expressions"],
  "prohibited": ["words to avoid", "phrases to not use"],
  "guidelines": ["writing guidelines", "tone instructions"]
}`;

    const result = await generateObject({
      model: this.config.model,
      schema: z.object({
        primaryTone: z.enum(['PROFESSIONAL', 'CASUAL', 'AUTHORITATIVE', 'FRIENDLY', 'TECHNICAL', 'CONVERSATIONAL']),
        secondaryTones: z.array(z.enum(['PROFESSIONAL', 'CASUAL', 'AUTHORITATIVE', 'FRIENDLY', 'TECHNICAL', 'CONVERSATIONAL'])),
        personalityTraits: z.record(z.number().min(0).max(1)),
        vocabularyLevel: z.enum(['basic', 'intermediate', 'advanced']),
        formalityLevel: z.number().min(0).max(1),
        examples: z.array(z.string()),
        prohibited: z.array(z.string()),
        guidelines: z.array(z.string())
      }),
      prompt
    });

    const profile: BrandVoiceProfile = {
      id: `brand_voice_${Date.now()}`,
      name: profileName,
      description: `Brand voice profile generated from ${examples.length} examples`,
      primaryTone: result.object.primaryTone as ToneCategory,
      secondaryTones: result.object.secondaryTones as ToneCategory[],
      personalityTraits: result.object.personalityTraits,
      vocabularyLevel: result.object.vocabularyLevel,
      formalityLevel: result.object.formalityLevel,
      examples: result.object.examples,
      prohibited: result.object.prohibited,
      guidelines: result.object.guidelines
    };

    return profile;
  }

  /**
   * Adjust content to match brand voice
   */
  async adjustContentToBrandVoice(
    content: string,
    brandVoice: BrandVoiceProfile,
    preserveStructure: boolean = true
  ): Promise<{
    adjustedContent: string;
    changes: Array<{
      type: string;
      original: string;
      adjusted: string;
      reason: string;
    }>;
    alignmentScore: number;
  }> {
    const currentAnalysis = await this.performToneAnalysis(content, brandVoice);
    const alignmentScore = this.calculateBrandVoiceAlignment([currentAnalysis], brandVoice);

    if (alignmentScore > 0.8) {
      return {
        adjustedContent: content,
        changes: [],
        alignmentScore
      };
    }

    const prompt = `Adjust the following content to match the specified brand voice while ${preserveStructure ? 'preserving the structure' : 'allowing structural changes'}:

Original Content:
${content}

Brand Voice Guidelines:
- Primary Tone: ${brandVoice.toneCharacteristics.primary}
- Secondary Tones: ${brandVoice.toneCharacteristics.secondary?.join(', ') || 'None'}
- Vocabulary Level: ${brandVoice.vocabularyGuidelines.preferredTerms.join(', ')}
- Formality Level: ${brandVoice.toneCharacteristics.formality}
- Personality Traits: ${Object.entries(brandVoice.toneCharacteristics.personality).map(([k, v]) => `${k}: ${v}`).join(', ')}

Guidelines:
${brandVoice.consistencyRules.map(g => `- ${g.description}`).join('\n')}

Words/Phrases to Use:
${brandVoice.exampleTexts.map(e => `- ${e}`).join('\n')}

Words/Phrases to Avoid:
${brandVoice.vocabularyGuidelines.avoidedTerms.map(p => `- ${p}`).join('\n')}

Provide the adjusted content and list the changes made:

{
  "adjustedContent": "...",
  "changes": [
    {
      "type": "tone_adjustment",
      "original": "original phrase",
      "adjusted": "adjusted phrase", 
      "reason": "explanation of change"
    }
  ]
}`;

    const result = await generateObject({
      model: this.config.model,
      schema: z.object({
        adjustedContent: z.string(),
        changes: z.array(z.object({
          type: z.string(),
          original: z.string(),
          adjusted: z.string(),
          reason: z.string()
        }))
      }),
      prompt
    });

    // Calculate new alignment score
    const newAnalysis = await this.performToneAnalysis(result.object.adjustedContent, brandVoice);
    const newAlignmentScore = this.calculateBrandVoiceAlignment([newAnalysis], brandVoice);

    return {
      adjustedContent: result.object.adjustedContent,
      changes: result.object.changes,
      alignmentScore: newAlignmentScore
    };
  }

  /**
   * Generate tone consistency report across content
   */
  async generateConsistencyReport(blogPostId: string): Promise<{
    overallConsistency: number;
    sectionAnalyses: ToneAnalysis[];
    deviations: ToneDeviation[];
    recommendations: string[];
  }> {
    const sections = await this.getAllSections(blogPostId);
    const sectionAnalyses: ToneAnalysis[] = [];

    for (const section of sections) {
      const analysis = await this.performToneAnalysis(section.content);
      analysis.sectionId = section.id;
      sectionAnalyses.push(analysis);
    }

    const overallConsistency = this.calculateConsistencyScore(sectionAnalyses);
    const deviations = this.identifyToneDeviations(sectionAnalyses);
    const recommendations = await this.generateConsistencyRecommendations(sectionAnalyses, deviations);

    return {
      overallConsistency,
      sectionAnalyses,
      deviations,
      recommendations
    };
  }

  // Private helper methods

  private async performToneAnalysis(
    content: string,
    brandVoice?: BrandVoiceProfile,
    sectionId?: string
  ): Promise<ToneAnalysis> {
    const prompt = `Perform a comprehensive tone analysis of the following content:

"${content}"

${brandVoice ? `Compare against this brand voice profile:
- Primary Tone: ${brandVoice.primaryTone}
- Secondary Tones: ${brandVoice.secondaryTones.join(', ')}
- Vocabulary Level: ${brandVoice.vocabularyLevel}
- Formality Level: ${brandVoice.formalityLevel}` : ''}

Analyze and provide:
1. Primary tone category
2. Secondary tone categories (up to 3)
3. Confidence level (0-1)
4. Formality score (0-1, where 0=very informal, 1=very formal)
5. Emotional tone
6. Emotion intensity (0-1)
7. Authority level (0-1)
8. Personality traits (warmth, authority, approachability, expertise, enthusiasm, professionalism, friendliness, confidence - each 0-1)

Provide analysis in the specified JSON format.`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: ToneAnalysisSchema,
        prompt
      });

      const analysis: ToneAnalysis = {
        id: `tone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blogPostId: '', // Will be set by caller
        sectionId,
        primaryTone: this.mapToneFromAI(result.object.primaryTone),
        secondaryTones: result.object.secondaryTones.map(tone => this.mapToneFromAI(tone)),
        confidence: result.object.confidence,
        formalityScore: result.object.formalityScore,
        emotionalTone: result.object.emotionalTone as EmotionalTone,
        emotionIntensity: result.object.emotionIntensity,
        authorityLevel: result.object.authorityLevel,
        personalityTraits: result.object.personalityTraits,
        brandVoiceScore: brandVoice ? this.calculateBrandVoiceAlignment([{...result.object, id: '', blogPostId: ''}] as any, brandVoice) : undefined,
        consistencyScore: 0.8, // Default value - would be calculated based on document consistency
        deviations: [],
        analyzedAt: new Date(),
        modelUsed: typeof this.config.model === 'string' ? this.config.model : 'unknown'
      };

      return analysis;
    } catch (error) {
      console.error('Failed to perform tone analysis:', error);
      // Return fallback analysis
      return {
        id: `tone_${Date.now()}_fallback`,
        blogPostId: '',
        sectionId,
        primaryTone: ToneCategory.PROFESSIONAL,
        secondaryTones: [ToneCategory.INFORMATIVE],
        confidence: 0.7,
        formalityScore: 0.7,
        emotionalTone: EmotionalTone.NEUTRAL,
        emotionIntensity: 0.5,
        authorityLevel: 0.6,
        personalityTraits: { professionalism: 0.7, expertise: 0.6 },
        consistencyScore: 0.8, // Default value
        deviations: [],
        analyzedAt: new Date(),
        modelUsed: typeof this.config.model === 'string' ? this.config.model : 'unknown'
      };
    }
  }

  private async performStyleAnalysis(content: string): Promise<any> {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    const avgSentenceLength = words.length / sentences.length;
    const avgParagraphLength = sentences.length / paragraphs.length;

    // Use AI for more sophisticated analysis
    const prompt = `Analyze the writing style of this content:

"${content.slice(0, 1000)}..."

Provide analysis for:
1. Reading level (Flesch-Kincaid grade level equivalent)
2. Passive voice percentage (0-1)
3. Vocabulary level (basic/intermediate/advanced)
4. Jargon usage (0-1, where 1 = heavy jargon)
5. Repetitiveness (0-1, where 1 = highly repetitive)
6. Style violations (if any)

Focus on objective metrics and specific issues.`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: StyleAnalysisSchema,
        prompt
      });

      return {
        sentenceLength: avgSentenceLength,
        paragraphLength: avgParagraphLength,
        readingLevel: result.object.readingLevel,
        passiveVoiceScore: result.object.passiveVoiceScore,
        vocabularyLevel: result.object.vocabularyLevel,
        jargonUsage: result.object.jargonUsage,
        repetitiveness: result.object.repetitiveness,
        violations: result.object.violations
      };
    } catch (error) {
      console.error('Failed to perform style analysis:', error);
      return {
        sentenceLength: avgSentenceLength,
        paragraphLength: avgParagraphLength,
        readingLevel: 8,
        passiveVoiceScore: 0.2,
        vocabularyLevel: 'intermediate',
        jargonUsage: 0.3,
        repetitiveness: 0.2,
        violations: []
      };
    }
  }

  private mapToneFromAI(aiTone: string): ToneCategory {
    // Map AI uppercase values to our enum values
    const toneMap: Record<string, ToneCategory> = {
      'PROFESSIONAL': ToneCategory.PROFESSIONAL,
      'CASUAL': ToneCategory.CASUAL,
      'AUTHORITATIVE': ToneCategory.AUTHORITATIVE,
      'FRIENDLY': ToneCategory.FRIENDLY,
      'TECHNICAL': ToneCategory.TECHNICAL,
      'CONVERSATIONAL': ToneCategory.CONVERSATIONAL,
      'ACADEMIC': ToneCategory.ACADEMIC,
      'PERSUASIVE': ToneCategory.PERSUASIVE,
      'INFORMATIVE': ToneCategory.INFORMATIVE,
      'ENTERTAINING': ToneCategory.ENTERTAINING,
      'EMPATHETIC': ToneCategory.EMPATHETIC,
      'URGENT': ToneCategory.URGENT,
      'CONFIDENT': ToneCategory.CONFIDENT,
      'HUMBLE': ToneCategory.HUMBLE
    };
    
    return toneMap[aiTone] || ToneCategory.PROFESSIONAL;
  }

  private calculateConsistencyScore(analyses: ToneAnalysis[]): number {
    if (analyses.length < 2) return 1;

    let totalVariance = 0;
    const reference = analyses[0];

    for (let i = 1; i < analyses.length; i++) {
      const current = analyses[i];
      
      // Compare key metrics
      const formalityVariance = Math.abs(reference.formalityScore - current.formalityScore);
      const emotionVariance = Math.abs(reference.emotionIntensity - current.emotionIntensity);
      const authorityVariance = Math.abs(reference.authorityLevel - current.authorityLevel);
      
      const toneConsistency = reference.primaryTone === current.primaryTone ? 0 : 0.3;
      
      totalVariance += (formalityVariance + emotionVariance + authorityVariance + toneConsistency) / 4;
    }

    const avgVariance = totalVariance / (analyses.length - 1);
    return Math.max(0, 1 - avgVariance);
  }

  private identifyToneDeviations(analyses: ToneAnalysis[]): ToneDeviation[] {
    if (analyses.length < 2) return [];

    const deviations: ToneDeviation[] = [];
    const reference = analyses[0];

    for (let i = 1; i < analyses.length; i++) {
      const current = analyses[i];
      
      if (reference.primaryTone !== current.primaryTone) {
        deviations.push({
          sectionId: current.sectionId,
          position: i,
          expectedTone: reference.primaryTone,
          actualTone: current.primaryTone,
          severity: 'high',
          suggestion: `Consider adjusting tone to match ${reference.primaryTone.toLowerCase()} style`
        });
      }

      // Check formality deviation
      const formalityDiff = Math.abs(reference.formalityScore - current.formalityScore);
      if (formalityDiff > 0.3) {
        deviations.push({
          sectionId: current.sectionId,
          position: i,
          expectedTone: reference.primaryTone,
          actualTone: current.primaryTone,
          severity: formalityDiff > 0.5 ? 'high' : 'medium',
          suggestion: `Adjust formality level to maintain consistency`
        });
      }
    }

    return deviations;
  }

  private determineDominantTone(analyses: ToneAnalysis[]): ToneCategory {
    const toneCounts: Record<string, number> = {};
    
    analyses.forEach(analysis => {
      toneCounts[analysis.primaryTone] = (toneCounts[analysis.primaryTone] || 0) + 1;
    });

    const dominant = Object.entries(toneCounts).reduce((a, b) => 
      toneCounts[a[0]] > toneCounts[b[0]] ? a : b
    );

    return dominant[0] as ToneCategory;
  }

  private extractSecondaryTones(analyses: ToneAnalysis[]): ToneCategory[] {
    const toneSet = new Set<ToneCategory>();
    
    analyses.forEach(analysis => {
      analysis.secondaryTones?.forEach(tone => toneSet.add(tone));
    });

    return Array.from(toneSet).slice(0, 3);
  }

  private determineDominantEmotion(analyses: ToneAnalysis[]): EmotionalTone {
    const emotionCounts: Record<string, number> = {};
    
    analyses.forEach(analysis => {
      emotionCounts[analysis.emotionalTone] = (emotionCounts[analysis.emotionalTone] || 0) + 1;
    });

    const dominant = Object.entries(emotionCounts).reduce((a, b) => 
      emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
    );

    return dominant[0] as EmotionalTone;
  }

  private mergePersonalityTraits(analyses: ToneAnalysis[]): Record<string, number> {
    const merged: Record<string, number> = {};
    const allTraits = new Set<string>();

    // Collect all trait names
    analyses.forEach(analysis => {
      Object.keys(analysis.personalityTraits).forEach(trait => allTraits.add(trait));
    });

    // Average each trait
    allTraits.forEach(trait => {
      const values = analyses
        .map(analysis => analysis.personalityTraits[trait])
        .filter(value => value !== undefined);
      
      if (values.length > 0) {
        merged[trait] = values.reduce((sum, value) => sum + value, 0) / values.length;
      }
    });

    return merged;
  }

  private calculateBrandVoiceAlignment(analyses: ToneAnalysis[], brandVoice: BrandVoiceProfile): number {
    let alignmentScore = 0;
    let totalChecks = 0;

    analyses.forEach(analysis => {
      // Primary tone alignment
      if (analysis.primaryTone === brandVoice.toneCharacteristics.primary) {
        alignmentScore += 0.4;
      } else if (brandVoice.toneCharacteristics.secondary?.includes(analysis.primaryTone)) {
        alignmentScore += 0.2;
      }
      totalChecks += 0.4;

      // Personality traits alignment
      Object.entries(brandVoice.personalityTraits).forEach(([trait, expectedValue]) => {
        const actualValue = analysis.personalityTraits[trait];
        if (actualValue !== undefined) {
          const diff = Math.abs(expectedValue - actualValue);
          alignmentScore += Math.max(0, (1 - diff) * 0.1);
          totalChecks += 0.1;
        }
      });

      // Formality alignment
      const formalityDiff = Math.abs(analysis.formalityScore - brandVoice.formalityLevel);
      alignmentScore += Math.max(0, (1 - formalityDiff) * 0.2);
      totalChecks += 0.2;
    });

    return totalChecks > 0 ? alignmentScore / totalChecks : 0;
  }

  private calculateBrandVoiceMatch(analysis: ToneAnalysis, brandVoice: BrandVoiceProfile): number {
    return this.calculateBrandVoiceAlignment([analysis], brandVoice);
  }

  private async checkStyleGuideCompliance(content: string, styleGuideId: string): Promise<{
    score: number;
    violations: StyleViolation[];
  }> {
    // In a real implementation, this would load the style guide from database
    // For now, return mock compliance check
    return {
      score: 0.85,
      violations: [
        {
          type: 'sentence_length',
          position: 150,
          message: 'Sentence exceeds recommended length of 20 words',
          severity: 'medium',
          suggestion: 'Consider breaking into shorter sentences'
        }
      ]
    };
  }

  private async generateStyleSuggestions(
    content: string,
    styleAnalysis: any,
    brandVoice?: BrandVoiceProfile
  ): Promise<StyleSuggestion[]> {
    const suggestions: StyleSuggestion[] = [];

    // Reading level suggestions
    if (styleAnalysis.readingLevel > 12) {
      suggestions.push({
        type: 'readability',
        message: 'Content reading level is quite high. Consider simplifying language.',
        impact: 'medium'
      });
    }

    // Passive voice suggestions
    if (styleAnalysis.passiveVoiceScore > 0.25) {
      suggestions.push({
        type: 'voice',
        message: 'High passive voice usage detected. Use more active voice for engagement.',
        impact: 'medium'
      });
    }

    // Sentence length suggestions
    if (styleAnalysis.sentenceLength > 25) {
      suggestions.push({
        type: 'sentence_length',
        message: 'Average sentence length is quite long. Consider shorter sentences.',
        impact: 'high'
      });
    }

    return suggestions;
  }

  private identifyCriticalIssues(styleAnalysis: any, violations: StyleViolation[]): string[] {
    const critical: string[] = [];

    // Check for critical style issues
    if (styleAnalysis.readingLevel > 16) {
      critical.push('Extremely high reading level may alienate readers');
    }

    if (styleAnalysis.passiveVoiceScore > 0.4) {
      critical.push('Excessive passive voice reduces engagement');
    }

    // Add high-severity violations
    violations
      .filter(v => v.severity === 'high')
      .forEach(v => critical.push(v.message));

    return critical;
  }

  private async generateConsistencyRecommendations(
    analyses: ToneAnalysis[],
    deviations: ToneDeviation[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (deviations.length > 0) {
      recommendations.push('Maintain consistent tone throughout all sections');
      
      const highSeverityDeviations = deviations.filter(d => d.severity === 'high');
      if (highSeverityDeviations.length > 0) {
        recommendations.push(`Address ${highSeverityDeviations.length} critical tone inconsistencies`);
      }
    }

    const consistencyScore = this.calculateConsistencyScore(analyses);
    if (consistencyScore < 0.7) {
      recommendations.push('Review content for better flow and voice consistency');
    }

    return recommendations;
  }

  // Database helper methods

  private async getContentForAnalysis(blogPostId: string, content?: string): Promise<string> {
    if (content) return content;
    
    if (!this.config.prisma) {
      throw new Error('Content not provided and Prisma not available');
    }

    const blogPost = await this.config.prisma.blogPost.findUnique({
      where: { id: blogPostId }
    });

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    return blogPost.content;
  }

  private async getSectionContent(sectionId: string): Promise<string | null> {
    if (!this.config.prisma) return null;

    const section = await this.config.prisma.contentSection.findUnique({
      where: { id: sectionId }
    });

    return section?.content || null;
  }

  private async getAllSections(blogPostId: string): Promise<Array<{id: string; content: string}>> {
    if (!this.config.prisma) return [];

    const sections = await this.config.prisma.contentSection.findMany({
      where: { blogPostId },
      orderBy: { order: 'asc' }
    });

    return sections.map(s => ({ id: s.id, content: s.content }));
  }

  private async getLatestToneAnalysis(blogPostId: string): Promise<ToneAnalysis | null> {
    if (!this.config.prisma) return null;

    const analysis = await this.config.prisma.toneAnalysis.findFirst({
      where: { blogPostId },
      orderBy: { analyzedAt: 'desc' }
    });

    if (!analysis) return null;

    return {
      id: analysis.id,
      blogPostId: analysis.blogPostId,
      sectionId: analysis.sectionId || undefined,
      primaryTone: this.mapPrismaToneToCustom(analysis.primaryTone),
      secondaryTones: analysis.secondaryTones?.map(tone => this.mapPrismaToneToCustom(tone)) || [],
      confidence: analysis.confidence,
      formalityScore: analysis.formalityScore,
      emotionalTone: this.mapPrismaEmotionalToneToCustom(analysis.emotionalTone),
      emotionIntensity: analysis.emotionIntensity,
      authorityLevel: analysis.authorityLevel,
      personalityTraits: analysis.personalityTraits as Record<string, number>,
      brandVoiceScore: analysis.brandVoiceScore || 0,
      consistencyScore: analysis.consistencyScore || 0,
      deviations: analysis.deviations ? JSON.parse(JSON.stringify(analysis.deviations)) : [],
      analyzedAt: analysis.analyzedAt,
      modelUsed: analysis.modelUsed || 'unknown'
    };
  }

  private async saveToneAnalysisToDatabase(blogPostId: string, analysis: ToneAnalysis): Promise<void> {
    if (!this.config.prisma) return;

    try {
      await this.config.prisma.toneAnalysis.create({
        data: {
          blogPostId,
          sectionId: analysis.sectionId,
          primaryTone: analysis.primaryTone,
          secondaryTones: analysis.secondaryTones,
          confidence: analysis.confidence,
          formalityScore: analysis.formalityScore,
          emotionalTone: analysis.emotionalTone,
          emotionIntensity: analysis.emotionIntensity,
          authorityLevel: analysis.authorityLevel,
          personalityTraits: analysis.personalityTraits as any,
          brandVoiceScore: analysis.brandVoiceScore,
          consistencyScore: analysis.consistencyScore,
          deviations: analysis.deviations as any,
          analyzedAt: analysis.analyzedAt,
          modelUsed: analysis.modelUsed
        }
      });
    } catch (error) {
      console.error('Failed to save tone analysis:', error);
    }
  }

  private async saveStyleCheckToDatabase(styleCheck: StyleCheck): Promise<void> {
    if (!this.config.prisma) return;

    try {
      await this.config.prisma.styleCheck.create({
        data: {
          blogPostId: styleCheck.blogPostId,
          toneAnalysisId: styleCheck.toneAnalysisId,
          styleGuideId: styleCheck.styleGuideId,
          complianceScore: styleCheck.complianceScore || 0,
          violations: styleCheck.violations as any,
          sentenceLength: styleCheck.sentenceLength || 0,
          paragraphLength: styleCheck.paragraphLength || 0,
          readingLevel: styleCheck.readingLevel || 0,
          passiveVoiceScore: styleCheck.passiveVoiceScore || 0,
          vocabularyLevel: styleCheck.vocabularyLevel || 'intermediate',
          jargonUsage: styleCheck.jargonUsage || 0,
          repetitiveness: styleCheck.repetitiveness || 0,
          brandVoiceMatch: styleCheck.brandVoiceMatch,
          voicePersonality: styleCheck.voicePersonality as any,
          suggestions: styleCheck.suggestions as any,
          criticalIssues: styleCheck.criticalIssues,
          checkedAt: styleCheck.checkedAt
        }
      });
    } catch (error) {
      console.error('Failed to save style check:', error);
    }
  }

  /**
   * Map Prisma ToneCategory to custom ToneCategory
   */
  private mapPrismaToneToCustom(prismaTone: any): ToneCategory {
    const toneMap: Record<string, ToneCategory> = {
      'PROFESSIONAL': ToneCategory.PROFESSIONAL,
      'CASUAL': ToneCategory.CASUAL,
      'AUTHORITATIVE': ToneCategory.AUTHORITATIVE,
      'FRIENDLY': ToneCategory.FRIENDLY,
      'TECHNICAL': ToneCategory.TECHNICAL,
      'CONVERSATIONAL': ToneCategory.CONVERSATIONAL,
      'ACADEMIC': ToneCategory.ACADEMIC,
      'PERSUASIVE': ToneCategory.PERSUASIVE,
      'INFORMATIVE': ToneCategory.INFORMATIVE,
      'ENTERTAINING': ToneCategory.ENTERTAINING,
      'EMPATHETIC': ToneCategory.EMPATHETIC,
      'URGENT': ToneCategory.URGENT,
      'CONFIDENT': ToneCategory.CONFIDENT,
      'HUMBLE': ToneCategory.HUMBLE
    };
    
    return toneMap[prismaTone] || ToneCategory.PROFESSIONAL;
  }

  /**
   * Map Prisma EmotionalTone to custom EmotionalTone
   */
  private mapPrismaEmotionalToneToCustom(prismaTone: any): EmotionalTone {
    const toneMap: Record<string, EmotionalTone> = {
      'NEUTRAL': EmotionalTone.NEUTRAL,
      'POSITIVE': EmotionalTone.POSITIVE,
      'NEGATIVE': EmotionalTone.NEGATIVE,
      'EXCITED': EmotionalTone.EXCITED,
      'CALM': EmotionalTone.CALM,
      'ANXIOUS': EmotionalTone.ANXIOUS,
      'CONFIDENT': EmotionalTone.CONFIDENT,
      'UNCERTAIN': EmotionalTone.UNCERTAIN
    };
    
    return toneMap[prismaTone] || EmotionalTone.NEUTRAL;
  }
}

