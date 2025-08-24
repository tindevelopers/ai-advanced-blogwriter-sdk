import type { LanguageModelV2 } from '@ai-sdk/provider';
import { generateText } from 'ai';
import { configurationRepository } from '../database/configuration-repository';
import type { BlogTemplate as PrismaTemplate } from '../generated/prisma-client';

/**
 * Template selection criteria
 */
export interface TemplateSelectionCriteria {
  topic: string;
  contentType?: string;
  audience?: 'beginners' | 'intermediate' | 'experts' | 'general';
  purpose?:
    | 'education'
    | 'entertainment'
    | 'marketing'
    | 'information'
    | 'persuasion';
  tone?:
    | 'professional'
    | 'casual'
    | 'friendly'
    | 'authoritative'
    | 'technical'
    | 'conversational'
    | 'humorous'
    | 'inspirational'
    | 'educational'
    | 'persuasive'
    | 'informative';
  wordCountRange?: { min: number; max: number };
  requiredSections?: string[];
  businessGoals?: string[];
  industry?: string;
}

/**
 * Template selection result
 */
export interface TemplateSelectionResult {
  selectedTemplate: {
    name: string;
    type: string;
    description: string;
    promptTemplate: string;
    structureTemplate?: any;
    variables?: any;
    wordCountRange?: { min: number; max: number };
  };
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    name: string;
    type: string;
    score: number;
    reason: string;
  }>;
  customizations: {
    promptAdjustments: string[];
    structuralChanges: string[];
    variableOverrides: Record<string, any>;
  };
}

/**
 * AI-powered template recommendation result
 */
export interface AITemplateRecommendation {
  recommendedTemplate: string;
  confidence: number;
  reasoning: string;
  customPromptSuggestion?: string;
  structuralRecommendations: string[];
}

/**
 * Intelligent template selector with AI-powered recommendations
 */
export class TemplateSelector {
  /**
   * Select optimal template based on criteria
   */
  async selectTemplate(
    criteria: TemplateSelectionCriteria,
  ): Promise<TemplateSelectionResult> {
    // Get available templates
    const availableTemplates =
      await configurationRepository.getTemplatesByType();

    if (availableTemplates.length === 0) {
      // Seed default templates if none exist
      await configurationRepository.seedDefaultTemplates();
      return this.selectTemplate(criteria); // Retry after seeding
    }

    // Score each template
    const scoredTemplates = await this.scoreTemplates(
      availableTemplates,
      criteria,
    );

    // Select best template
    const bestTemplate = scoredTemplates[0];

    // Generate alternatives
    const alternatives = scoredTemplates.slice(1, 4).map(scored => ({
      name: scored.template.name,
      type: scored.template.type,
      score: scored.score,
      reason: scored.reasoning,
    }));

    // Generate customizations
    const customizations = await this.generateCustomizations(
      bestTemplate.template,
      criteria,
    );

    return {
      selectedTemplate: {
        name: bestTemplate.template.name,
        type: bestTemplate.template.type,
        description: bestTemplate.template.description || '',
        promptTemplate: bestTemplate.template.promptTemplate,
        structureTemplate: bestTemplate.template.structureTemplate,
        variables: bestTemplate.template.variables,
        wordCountRange: bestTemplate.template.wordCountRange as any,
      },
      confidence: bestTemplate.score / 100,
      reasoning: bestTemplate.reasoning,
      alternatives,
      customizations,
    };
  }

  /**
   * Get AI-powered template recommendation
   */
  async getAIRecommendation(
    model: LanguageModelV2,
    criteria: TemplateSelectionCriteria,
  ): Promise<AITemplateRecommendation> {
    const availableTemplates =
      await configurationRepository.getTemplatesByType();

    const templateList = availableTemplates
      .map(
        t => `- ${t.name} (${t.type}): ${t.description || 'Standard template'}`,
      )
      .join('\n');

    const prompt = `
As a content strategy expert, recommend the best blog template for the following requirements:

Topic: ${criteria.topic}
Content Type: ${criteria.contentType || 'Not specified'}
Target Audience: ${criteria.audience || 'General'}
Purpose: ${criteria.purpose || 'Information'}
Tone: ${criteria.tone || 'Professional'}
Word Count: ${criteria.wordCountRange ? `${criteria.wordCountRange.min}-${criteria.wordCountRange.max}` : 'Flexible'}
Business Goals: ${criteria.businessGoals?.join(', ') || 'Not specified'}
Industry: ${criteria.industry || 'General'}

Available Templates:
${templateList}

Analyze the requirements and provide recommendations in this JSON format:
{
  "recommendedTemplate": "template_name",
  "confidence": 0.95,
  "reasoning": "Detailed explanation of why this template is best",
  "customPromptSuggestion": "Optional custom prompt if existing templates need modification",
  "structuralRecommendations": [
    "Specific suggestions for adapting the template structure",
    "Additional sections to consider",
    "Modifications for better audience fit"
  ]
}

Consider factors like:
- Audience engagement patterns
- Content type best practices  
- Business goal alignment
- Industry-specific requirements
- SEO optimization potential
`;

    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.3,
      });

      const parsed = JSON.parse(result.text);

      return {
        recommendedTemplate: parsed.recommendedTemplate,
        confidence: Math.max(0.1, Math.min(1.0, parsed.confidence)),
        reasoning: parsed.reasoning,
        customPromptSuggestion: parsed.customPromptSuggestion,
        structuralRecommendations: parsed.structuralRecommendations || [],
      };
    } catch (error) {
      console.error('AI template recommendation failed:', error);

      // Fall back to rule-based selection
      const fallbackResult = await this.selectTemplate(criteria);
      return {
        recommendedTemplate: fallbackResult.selectedTemplate.name,
        confidence: fallbackResult.confidence,
        reasoning: fallbackResult.reasoning,
        structuralRecommendations:
          fallbackResult.customizations.structuralChanges,
      };
    }
  }

  /**
   * Create custom template based on specific requirements
   */
  async createCustomTemplate(
    name: string,
    criteria: TemplateSelectionCriteria,
    model?: LanguageModelV2,
  ): Promise<{
    template: PrismaTemplate;
    customPrompt: string;
    structureDefinition: any;
  }> {
    let customPrompt = '';
    let structureDefinition: any = {};

    if (model) {
      // Use AI to generate custom template
      const aiResult = await this.generateCustomTemplateWithAI(model, criteria);
      customPrompt = aiResult.promptTemplate;
      structureDefinition = aiResult.structure;
    } else {
      // Generate rule-based custom template
      customPrompt = this.generateRuleBasedPrompt(criteria);
      structureDefinition = this.generateRuleBasedStructure(criteria);
    }

    // Save custom template to database
    const template = await configurationRepository.saveTemplate({
      name,
      type: this.mapContentTypeToPrisma(criteria.contentType),
      description: `Custom template for ${criteria.topic}`,
      promptTemplate: customPrompt,
      structureTemplate: JSON.stringify(structureDefinition),
      variables: this.generateTemplateVariables(criteria),
      wordCountRange: criteria.wordCountRange,
      sections: structureDefinition.sections || [],
    });

    return {
      template,
      customPrompt,
      structureDefinition,
    };
  }

  /**
   * Optimize existing template for specific use case
   */
  async optimizeTemplate(
    templateName: string,
    criteria: TemplateSelectionCriteria,
    optimizationGoals: (
      | 'seo'
      | 'engagement'
      | 'conversion'
      | 'readability'
      | 'authority'
    )[],
  ): Promise<{
    optimizedPrompt: string;
    structuralChanges: string[];
    variableAdjustments: Record<string, any>;
    seoEnhancements: string[];
  }> {
    const template = await configurationRepository.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const optimizations = {
      optimizedPrompt: template.promptTemplate,
      structuralChanges: [],
      variableAdjustments: {},
      seoEnhancements: [],
    };

    // Apply SEO optimizations
    if (optimizationGoals.includes('seo')) {
      optimizations.seoEnhancements.push(
        'Include primary keyword in title and first paragraph',
        'Add meta description with target keywords',
        'Structure content with H2 and H3 headings',
        'Include internal and external links',
        'Optimize for featured snippets',
      );

      optimizations.structuralChanges.push(
        'Add SEO-optimized meta description section',
        'Include keyword density monitoring',
        'Add related keywords section',
      );
    }

    // Apply engagement optimizations
    if (optimizationGoals.includes('engagement')) {
      optimizations.structuralChanges.push(
        'Add compelling hook in introduction',
        'Include interactive elements (polls, questions)',
        'Add visual content suggestions',
        'Include social sharing prompts',
      );

      optimizations.variableAdjustments.engagementLevel = 'high';
    }

    // Apply conversion optimizations
    if (optimizationGoals.includes('conversion')) {
      optimizations.structuralChanges.push(
        'Strategic CTA placement throughout content',
        'Add benefit-focused sections',
        'Include social proof elements',
        'Add urgency and scarcity elements',
      );
    }

    // Apply readability optimizations
    if (optimizationGoals.includes('readability')) {
      optimizations.structuralChanges.push(
        'Use shorter sentences and paragraphs',
        'Add bullet points and numbered lists',
        'Include subheadings every 200-300 words',
        'Add summary sections',
      );

      optimizations.variableAdjustments.readingLevel =
        criteria.audience === 'beginners' ? 6 : 8;
    }

    // Apply authority optimizations
    if (optimizationGoals.includes('authority')) {
      optimizations.structuralChanges.push(
        'Include expert quotes and citations',
        'Add research-backed statistics',
        'Reference authoritative sources',
        'Include author expertise indicators',
      );
    }

    // Update the optimized prompt
    optimizations.optimizedPrompt = this.applyPromptOptimizations(
      template.promptTemplate,
      optimizationGoals,
      criteria,
    );

    return optimizations;
  }

  // Private helper methods
  private async scoreTemplates(
    templates: PrismaTemplate[],
    criteria: TemplateSelectionCriteria,
  ): Promise<
    Array<{ template: PrismaTemplate; score: number; reasoning: string }>
  > {
    const scored = [];

    for (const template of templates) {
      let score = 0;
      const reasons = [];

      // Content type match
      if (
        criteria.contentType &&
        template.type.toLowerCase().includes(criteria.contentType.toLowerCase())
      ) {
        score += 40;
        reasons.push(`Perfect content type match (${template.type})`);
      } else if (criteria.contentType) {
        score += 10;
        reasons.push(`Content type partially compatible`);
      }

      // Word count compatibility
      if (criteria.wordCountRange && template.wordCountRange) {
        const templateRange = template.wordCountRange as any;
        const overlap = this.calculateRangeOverlap(
          criteria.wordCountRange,
          templateRange,
        );
        score += overlap * 20;
        if (overlap > 0.5) {
          reasons.push(`Good word count alignment`);
        }
      }

      // Audience match
      if (criteria.audience) {
        const audienceScore = this.getAudienceCompatibility(
          template,
          criteria.audience,
        );
        score += audienceScore;
        if (audienceScore > 15) {
          reasons.push(`Well-suited for ${criteria.audience} audience`);
        }
      }

      // Purpose alignment
      if (criteria.purpose) {
        const purposeScore = this.getPurposeCompatibility(
          template,
          criteria.purpose,
        );
        score += purposeScore;
        if (purposeScore > 10) {
          reasons.push(`Aligns with ${criteria.purpose} purpose`);
        }
      }

      scored.push({
        template,
        score: Math.min(100, score),
        reasoning: reasons.join(', ') || 'Basic compatibility',
      });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  private async generateCustomizations(
    template: PrismaTemplate,
    criteria: TemplateSelectionCriteria,
  ): Promise<{
    promptAdjustments: string[];
    structuralChanges: string[];
    variableOverrides: Record<string, any>;
  }> {
    const customizations = {
      promptAdjustments: [],
      structuralChanges: [],
      variableOverrides: {},
    };

    // Audience-based adjustments
    if (criteria.audience === 'beginners') {
      customizations.promptAdjustments.push(
        'Use simpler language and define technical terms',
      );
      customizations.structuralChanges.push('Add glossary section');
      customizations.variableOverrides.explanationLevel = 'detailed';
    } else if (criteria.audience === 'experts') {
      customizations.promptAdjustments.push(
        'Include advanced concepts and technical details',
      );
      customizations.structuralChanges.push('Add technical appendix');
      customizations.variableOverrides.technicalDepth = 'advanced';
    }

    // Business goal adjustments
    if (criteria.businessGoals?.includes('lead-generation')) {
      customizations.structuralChanges.push('Add strategically placed CTAs');
      customizations.variableOverrides.ctaFrequency = 'high';
    }

    if (criteria.businessGoals?.includes('seo')) {
      customizations.promptAdjustments.push(
        'Optimize for search engines with keyword integration',
      );
      customizations.structuralChanges.push(
        'Include meta description and keyword sections',
      );
    }

    // Industry-specific adjustments
    if (criteria.industry) {
      customizations.promptAdjustments.push(
        `Adapt language and examples for ${criteria.industry} industry`,
      );
      customizations.variableOverrides.industry = criteria.industry;
    }

    return customizations;
  }

  private async generateCustomTemplateWithAI(
    model: LanguageModelV2,
    criteria: TemplateSelectionCriteria,
  ): Promise<{ promptTemplate: string; structure: any }> {
    const prompt = `
Create a custom blog template for:
Topic: ${criteria.topic}
Content Type: ${criteria.contentType || 'Blog'}
Audience: ${criteria.audience || 'General'}
Purpose: ${criteria.purpose || 'Information'}
Tone: ${criteria.tone || 'Professional'}
Business Goals: ${criteria.businessGoals?.join(', ') || 'Not specified'}

Generate a template with:
1. A detailed prompt template with placeholders for {{variables}}
2. A content structure definition
3. Required and optional sections
4. SEO considerations

Respond in JSON format:
{
  "promptTemplate": "Detailed prompt with {{placeholders}}",
  "structure": {
    "sections": ["section1", "section2"],
    "required": ["title", "intro"],
    "optional": ["advanced_tips"],
    "seoElements": ["meta_description", "keywords"],
    "wordCountGuidance": {"min": 800, "max": 2500}
  }
}
`;

    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.4,
      });

      return JSON.parse(result.text);
    } catch (error) {
      // Fall back to rule-based generation
      return {
        promptTemplate: this.generateRuleBasedPrompt(criteria),
        structure: this.generateRuleBasedStructure(criteria),
      };
    }
  }

  private generateRuleBasedPrompt(criteria: TemplateSelectionCriteria): string {
    const basePrompt = `Create a ${criteria.contentType || 'blog post'} about: {{topic}}

Target Audience: ${criteria.audience || '{{audience}}'}
Tone: ${criteria.tone || '{{tone}}'}
Purpose: ${criteria.purpose || 'provide valuable information'}

Structure:
1. Compelling introduction that hooks the reader
2. Main content organized in logical sections
3. Actionable insights and practical examples
4. Strong conclusion with key takeaways

${criteria.wordCountRange ? `Target word count: ${criteria.wordCountRange.min}-${criteria.wordCountRange.max} words` : ''}

Make it engaging, informative, and optimized for both readers and search engines.`;

    return basePrompt;
  }

  private generateRuleBasedStructure(criteria: TemplateSelectionCriteria): any {
    const structure = {
      sections: ['Introduction', 'Main Content', 'Conclusion'],
      required: ['title', 'introduction', 'body', 'conclusion'],
      optional: ['author_bio', 'related_articles'],
      seoElements: ['meta_description', 'keywords', 'alt_text'],
      wordCountGuidance: criteria.wordCountRange || { min: 800, max: 2500 },
    };

    // Customize based on content type
    if (criteria.contentType?.toLowerCase().includes('tutorial')) {
      structure.sections = [
        'Prerequisites',
        'Step-by-step Guide',
        'Examples',
        'Troubleshooting',
        'Conclusion',
      ];
      structure.required.push('steps', 'examples');
    } else if (criteria.contentType?.toLowerCase().includes('listicle')) {
      structure.sections = ['Introduction', 'List Items', 'Summary'];
      structure.required.push('list_items', 'item_count');
    }

    // Add business-goal specific elements
    if (criteria.businessGoals?.includes('lead-generation')) {
      structure.required.push('call_to_action');
      structure.sections.push('CTA Section');
    }

    return structure;
  }

  private generateTemplateVariables(criteria: TemplateSelectionCriteria): any {
    return {
      topic: { type: 'string', description: 'Main topic of the content' },
      audience: { type: 'string', default: criteria.audience || 'general' },
      tone: { type: 'string', default: criteria.tone || 'professional' },
      keywords: { type: 'array', description: 'Target keywords for SEO' },
      wordCount: { type: 'object', default: criteria.wordCountRange },
      industry: { type: 'string', default: criteria.industry },
    };
  }

  private applyPromptOptimizations(
    originalPrompt: string,
    goals: string[],
    criteria: TemplateSelectionCriteria,
  ): string {
    let optimizedPrompt = originalPrompt;

    if (goals.includes('seo')) {
      optimizedPrompt +=
        '\n\nSEO Requirements:\n- Include target keywords naturally\n- Optimize for search intent\n- Structure with clear headings';
    }

    if (goals.includes('engagement')) {
      optimizedPrompt +=
        '\n\nEngagement Requirements:\n- Use compelling hooks\n- Include interactive elements\n- Add visual content suggestions';
    }

    if (goals.includes('conversion')) {
      optimizedPrompt +=
        '\n\nConversion Requirements:\n- Include strategic CTAs\n- Focus on benefits\n- Add social proof elements';
    }

    return optimizedPrompt;
  }

  // Helper methods for scoring
  private calculateRangeOverlap(
    range1: { min: number; max: number },
    range2: { min: number; max: number },
  ): number {
    const overlapStart = Math.max(range1.min, range2.min);
    const overlapEnd = Math.min(range1.max, range2.max);

    if (overlapStart >= overlapEnd) return 0;

    const overlapSize = overlapEnd - overlapStart;
    const totalRange =
      Math.max(range1.max, range2.max) - Math.min(range1.min, range2.min);

    return overlapSize / totalRange;
  }

  private getAudienceCompatibility(
    template: PrismaTemplate,
    audience: string,
  ): number {
    // Simple heuristic based on template type and audience
    const compatibilityMap: Record<string, Record<string, number>> = {
      TUTORIAL: { beginners: 20, intermediate: 15, experts: 10 },
      HOWTO: { beginners: 15, intermediate: 20, experts: 15 },
      GUIDE: { beginners: 10, intermediate: 15, experts: 20 },
      BLOG: { beginners: 15, intermediate: 15, experts: 15 },
    };

    return compatibilityMap[template.type]?.[audience] || 10;
  }

  private getPurposeCompatibility(
    template: PrismaTemplate,
    purpose: string,
  ): number {
    const compatibilityMap: Record<string, Record<string, number>> = {
      TUTORIAL: { education: 20, information: 15 },
      HOWTO: { education: 15, information: 20 },
      REVIEW: { information: 15, persuasion: 10 },
      COMPARISON: { information: 20, persuasion: 15 },
    };

    return compatibilityMap[template.type]?.[purpose] || 8;
  }

  private mapContentTypeToPrisma(contentType?: string): any {
    const typeMap: Record<string, any> = {
      blog: 'BLOG',
      tutorial: 'TUTORIAL',
      howto: 'HOWTO',
      listicle: 'LISTICLE',
      comparison: 'COMPARISON',
      guide: 'GUIDE',
      review: 'REVIEW',
      news: 'NEWS',
    };

    return typeMap[contentType?.toLowerCase() || 'blog'] || 'BLOG';
  }
}

// Export singleton instance
export const templateSelector = new TemplateSelector();
