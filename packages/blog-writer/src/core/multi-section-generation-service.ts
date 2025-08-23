

/**
 * Multi-Section Content Generation Service
 * Intelligent content structuring and section-by-section generation with context awareness
 */

import { LanguageModel, generateText, streamText } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import {
  ContentOutline,
  OutlineSection,
  ContentSection,
  SectionType,
  SectionGenerationContext,
  ContentFlowMap,
  ContentConnection,
  ConnectionType,
  MultiSectionGenerationRequest,
  SectionGenerationOptions,
  BrandVoiceProfile
} from '../types/advanced-writing';

export interface MultiSectionConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
}

export class MultiSectionGenerationService {
  constructor(private config: MultiSectionConfig) {}

  /**
   * Create an intelligent content outline from a topic and requirements
   */
  async createOutline(request: {
    topic: string;
    targetLength?: number; // words
    contentType?: string;
    targetAudience?: string;
    keyPoints?: string[];
    seoKeywords?: string[];
    tone?: string;
    style?: string;
    objectives?: string[];
  }): Promise<ContentOutline> {
    const prompt = this.buildOutlinePrompt(request);
    
    const result = await generateText({
      model: this.config.model,
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    const outline = this.parseOutlineResponse(result.text);
    
    // Enhance outline with flow analysis
    outline.contentFlow = await this.analyzeContentFlow(outline);
    
    return outline;
  }

  /**
   * Generate content for all sections with context awareness
   */
  async generateMultiSectionContent(request: MultiSectionGenerationRequest): Promise<{
    sections: ContentSection[];
    contentFlow: ContentFlowMap;
    metrics: {
      totalGenerationTime: number;
      averageSectionTime: number;
      coherenceScore: number;
    };
  }> {
    const startTime = Date.now();
    const sections: ContentSection[] = [];
    let totalSectionTime = 0;

    // Sort sections by order for sequential generation
    const sortedSections = request.outline.sections.sort((a, b) => a.order - b.order);
    
    for (const outlineSection of sortedSections) {
      const sectionStartTime = Date.now();
      
      // Build context for this section
      const context = this.buildSectionContext(
        outlineSection,
        sections,
        sortedSections,
        request
      );
      
      const generatedSection = await this.generateSection(outlineSection, context, request.generationOptions);
      sections.push(generatedSection);
      
      const sectionTime = Date.now() - sectionStartTime;
      totalSectionTime += sectionTime;
      
      // Save section to database if Prisma is available
      if (this.config.prisma && request.blogPostId) {
        await this.saveSectionToDatabase(request.blogPostId, generatedSection);
      }
    }

    const totalTime = Date.now() - startTime;
    const averageTime = totalSectionTime / sections.length;

    // Analyze content flow
    const contentFlow = await this.analyzeGeneratedContentFlow(sections);
    const coherenceScore = await this.calculateCoherenceScore(sections);

    return {
      sections,
      contentFlow,
      metrics: {
        totalGenerationTime: totalTime,
        averageSectionTime: averageTime,
        coherenceScore
      }
    };
  }

  /**
   * Generate a single section with full context awareness
   */
  async generateSection(
    outlineSection: OutlineSection,
    context: SectionGenerationContext,
    options: SectionGenerationOptions
  ): Promise<ContentSection> {
    const prompt = this.buildSectionPrompt(outlineSection, context, options);
    
    const result = await generateText({
      model: this.config.model,
      prompt,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokensPerSection || 1000,
    });

    const section: ContentSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blogPostId: context.previousSections[0]?.blogPostId || '',
      title: outlineSection.title,
      content: result.text.trim(),
      sectionType: outlineSection.type,
      order: outlineSection.order,
      level: outlineSection.level,
      parentId: outlineSection.parentId,
      wordCount: this.countWords(result.text),
      keyPoints: outlineSection.keyPoints || [],
      contextTags: outlineSection.contextTags || [],
      promptUsed: prompt,
      modelUsed: this.config.model.modelId,
      generationContext: {
        previousSectionsCount: context.previousSections.length,
        mainTopic: context.mainTopic,
        tone: context.tone,
        style: context.style
      },
      generatedAt: new Date(),
      readabilityScore: await this.calculateReadabilityScore(result.text),
      coherenceScore: await this.calculateSectionCoherence(result.text, context),
      relevanceScore: await this.calculateRelevanceScore(result.text, context),
      children: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return section;
  }

  /**
   * Optimize section transitions and flow
   */
  async optimizeSectionFlow(sections: ContentSection[]): Promise<{
    optimizedSections: ContentSection[];
    transitions: string[];
    flowScore: number;
  }> {
    const transitions: string[] = [];
    const optimizedSections = [...sections];

    for (let i = 0; i < sections.length - 1; i++) {
      const currentSection = sections[i];
      const nextSection = sections[i + 1];
      
      const transition = await this.generateTransition(currentSection, nextSection);
      transitions.push(transition);
      
      // Add transition to the end of current section
      optimizedSections[i] = {
        ...currentSection,
        content: currentSection.content + '\n\n' + transition
      };
    }

    const flowScore = await this.calculateFlowScore(optimizedSections);

    return {
      optimizedSections,
      transitions,
      flowScore
    };
  }

  /**
   * Expand an existing outline with additional sections
   */
  async expandOutline(
    existingOutline: ContentOutline,
    expansionRequest: {
      targetLength?: number;
      additionalKeyPoints?: string[];
      focusAreas?: string[];
      insertionPoints?: number[];
    }
  ): Promise<ContentOutline> {
    const prompt = this.buildOutlineExpansionPrompt(existingOutline, expansionRequest);
    
    const result = await generateText({
      model: this.config.model,
      prompt,
      temperature: 0.6,
      maxTokens: 1500,
    });

    const expandedSections = this.parseOutlineResponse(result.text);
    
    // Merge with existing outline
    const mergedOutline: ContentOutline = {
      ...existingOutline,
      sections: this.mergeOutlineSections(existingOutline.sections, expandedSections.sections),
      totalWordCount: (existingOutline.totalWordCount || 0) + (expansionRequest.targetLength || 0)
    };

    // Recalculate content flow
    mergedOutline.contentFlow = await this.analyzeContentFlow(mergedOutline);

    return mergedOutline;
  }

  // Private helper methods

  private buildOutlinePrompt(request: any): string {
    return `Create a comprehensive content outline for the following topic:

Topic: ${request.topic}
${request.targetLength ? `Target Length: ${request.targetLength} words` : ''}
${request.contentType ? `Content Type: ${request.contentType}` : ''}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}
${request.tone ? `Tone: ${request.tone}` : ''}
${request.style ? `Style: ${request.style}` : ''}

${request.keyPoints ? `Key Points to Cover:
${request.keyPoints.map((point: string, i: number) => `${i + 1}. ${point}`).join('\n')}` : ''}

${request.seoKeywords ? `SEO Keywords to Include:
${request.seoKeywords.join(', ')}` : ''}

${request.objectives ? `Content Objectives:
${request.objectives.map((obj: string, i: number) => `${i + 1}. ${obj}`).join('\n')}` : ''}

Create a detailed outline with:
1. Logical section hierarchy (headings, subheadings)
2. Estimated word count for each section
3. Key points to cover in each section
4. Natural flow between sections
5. Engaging introduction and conclusion

Return the outline in the following JSON format:
{
  "title": "Main Title",
  "sections": [
    {
      "title": "Section Title",
      "type": "HEADING",
      "level": 1,
      "order": 1,
      "estimatedWordCount": 200,
      "keyPoints": ["point1", "point2"],
      "contextTags": ["tag1", "tag2"]
    }
  ]
}`;
  }

  private buildSectionContext(
    outlineSection: OutlineSection,
    previousSections: ContentSection[],
    allSections: OutlineSection[],
    request: MultiSectionGenerationRequest
  ): SectionGenerationContext {
    const currentIndex = allSections.findIndex(s => s.order === outlineSection.order);
    const followingSections = allSections.slice(currentIndex + 1, currentIndex + 3); // Next 2 sections

    return {
      previousSections,
      followingSections,
      mainTopic: request.outline.title,
      targetKeywords: [], // Could be extracted from request
      tone: request.generationOptions.tone || 'professional',
      style: request.generationOptions.style || 'informative',
      targetAudience: request.generationOptions.targetAudience,
      brandVoice: request.brandVoice,
      contentObjective: 'Provide valuable, engaging content that flows naturally'
    };
  }

  private buildSectionPrompt(
    outlineSection: OutlineSection,
    context: SectionGenerationContext,
    options: SectionGenerationOptions
  ): string {
    const previousContent = context.previousSections.length > 0 
      ? context.previousSections.slice(-2).map(s => `${s.title}: ${s.content.slice(0, 200)}...`).join('\n')
      : 'This is the first section.';

    const followingContext = context.followingSections 
      ? context.followingSections.map(s => s.title).join(', ')
      : 'No following sections.';

    return `Write a comprehensive section for a blog post about "${context.mainTopic}".

Section Details:
- Title: ${outlineSection.title}
- Type: ${outlineSection.type}
- Level: ${outlineSection.level}
- Target Words: ${outlineSection.estimatedWordCount || 300}
- Order: ${outlineSection.order}

Key Points to Cover:
${outlineSection.keyPoints?.map((point, i) => `${i + 1}. ${point}`).join('\n') || 'Cover the topic thoroughly and engagingly'}

Context Tags: ${outlineSection.contextTags?.join(', ') || 'None'}

Writing Guidelines:
- Tone: ${context.tone}
- Style: ${context.style}
- Target Audience: ${context.targetAudience || 'General audience'}
- Maintain consistency with previous sections
- Create natural flow to following sections

Previous Section Context:
${previousContent}

Following Sections: ${followingContext}

${context.brandVoice ? `Brand Voice Guidelines:
- Primary Tone: ${context.brandVoice.primaryTone}
- Personality: ${Object.entries(context.brandVoice.personalityTraits).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Vocabulary Level: ${context.brandVoice.vocabularyLevel}` : ''}

${options.seoOptimized ? `SEO Requirements:
- Include target keywords naturally: ${context.targetKeywords?.join(', ')}
- Use semantic variations
- Maintain keyword density of 1-2%` : ''}

Requirements:
1. Write engaging, informative content
2. Use clear, scannable formatting
3. Include relevant examples or analogies
4. Maintain consistent tone and style
5. Create smooth transitions
6. Add value for the target audience
7. Be factually accurate and well-researched

Write the section content now:`;
  }

  private async analyzeContentFlow(outline: ContentOutline): Promise<ContentFlowMap> {
    const connections: ContentConnection[] = [];
    const sections = outline.sections.sort((a, b) => a.order - b.order);

    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      
      const connectionType = this.determineConnectionType(current, next);
      const strength = await this.calculateConnectionStrength(current, next);
      
      connections.push({
        fromSectionId: current.id || `section_${i}`,
        toSectionId: next.id || `section_${i + 1}`,
        connectionType,
        strength,
        transitionText: await this.generateTransitionPreview(current, next)
      });
    }

    const coherenceScore = connections.reduce((sum, conn) => sum + conn.strength, 0) / connections.length;

    return {
      sections: sections.map(s => s.id || `section_${s.order}`),
      connections,
      coherenceScore,
      logicalFlow: coherenceScore > 0.7
    };
  }

  private determineConnectionType(current: OutlineSection, next: OutlineSection): ConnectionType {
    // Simple heuristic based on section types and titles
    if (current.type === SectionType.INTRODUCTION) return ConnectionType.SEQUENTIAL;
    if (next.type === SectionType.CONCLUSION) return ConnectionType.SUMMARY;
    if (current.title.includes('example') || next.title.includes('example')) return ConnectionType.EXAMPLE;
    if (current.title.includes('vs') || next.title.includes('comparison')) return ConnectionType.COMPARISON;
    
    return ConnectionType.SEQUENTIAL;
  }

  private async calculateConnectionStrength(current: OutlineSection, next: OutlineSection): Promise<number> {
    // Use AI to analyze logical connection strength
    const prompt = `Analyze the logical connection between these two sections:

Section 1: ${current.title}
Key Points: ${current.keyPoints?.join(', ') || 'None'}

Section 2: ${next.title} 
Key Points: ${next.keyPoints?.join(', ') || 'None'}

Rate the logical connection strength from 0.0 to 1.0, where:
- 1.0 = Perfect logical flow, naturally follows
- 0.8 = Strong connection, good flow
- 0.6 = Moderate connection, acceptable flow  
- 0.4 = Weak connection, might need transition
- 0.2 = Poor connection, requires significant transition
- 0.0 = No logical connection, should be reordered

Return only the numerical score (e.g., 0.7):`;

    try {
      const result = await generateText({
        model: this.config.model,
        prompt,
        temperature: 0.3,
        maxTokens: 10
      });

      const score = parseFloat(result.text.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.warn('Failed to calculate connection strength:', error);
      return 0.5;
    }
  }

  private async generateTransition(current: ContentSection, next: ContentSection): Promise<string> {
    const prompt = `Create a smooth transition between these two content sections:

Current Section: "${current.title}"
Content ending: "${current.content.slice(-200)}"

Next Section: "${next.title}"
Key points: ${next.keyPoints.join(', ')}

Write a 1-2 sentence transition that:
1. Naturally bridges the topics
2. Maintains flow and readability  
3. Guides the reader to the next section
4. Uses appropriate connecting words/phrases

Transition:`;

    const result = await generateText({
      model: this.config.model,
      prompt,
      temperature: 0.6,
      maxTokens: 100
    });

    return result.text.trim();
  }

  private async generateTransitionPreview(current: OutlineSection, next: OutlineSection): Promise<string> {
    // Simplified version for outline analysis
    const transitions = [
      `Moving from ${current.title.toLowerCase()} to ${next.title.toLowerCase()}`,
      `Building on this foundation, let's explore ${next.title.toLowerCase()}`,
      `Now that we've covered ${current.title.toLowerCase()}, let's examine ${next.title.toLowerCase()}`,
      `This brings us to our next important topic: ${next.title.toLowerCase()}`
    ];
    
    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  private parseOutlineResponse(response: string): ContentOutline {
    try {
      const parsed = JSON.parse(response);
      return {
        id: `outline_${Date.now()}`,
        title: parsed.title || 'Untitled',
        sections: parsed.sections?.map((section: any, index: number) => ({
          id: `section_${index}`,
          title: section.title || `Section ${index + 1}`,
          type: section.type || SectionType.PARAGRAPH,
          level: section.level || 1,
          order: section.order || index + 1,
          parentId: section.parentId,
          estimatedWordCount: section.estimatedWordCount || 300,
          keyPoints: section.keyPoints || [],
          contextTags: section.contextTags || []
        })) || [],
        totalWordCount: parsed.sections?.reduce((sum: number, s: any) => sum + (s.estimatedWordCount || 300), 0) || 0
      };
    } catch (error) {
      console.warn('Failed to parse outline response, using fallback');
      return {
        id: `outline_${Date.now()}`,
        title: 'Generated Outline',
        sections: [{
          id: 'section_1',
          title: 'Introduction',
          type: SectionType.INTRODUCTION,
          level: 1,
          order: 1,
          estimatedWordCount: 300,
          keyPoints: [],
          contextTags: []
        }]
      };
    }
  }

  private buildOutlineExpansionPrompt(outline: ContentOutline, request: any): string {
    return `Expand the following content outline with additional sections:

Current Outline:
${outline.sections.map(s => `${s.order}. ${s.title} (${s.type})`).join('\n')}

Expansion Requirements:
${request.targetLength ? `Additional Target Length: ${request.targetLength} words` : ''}
${request.additionalKeyPoints ? `Additional Key Points: ${request.additionalKeyPoints.join(', ')}` : ''}
${request.focusAreas ? `Focus Areas: ${request.focusAreas.join(', ')}` : ''}

Create additional sections that:
1. Enhance the existing outline
2. Fill content gaps
3. Provide more depth and value
4. Maintain logical flow

Return additional sections in JSON format:
{
  "sections": [
    {
      "title": "New Section Title",
      "type": "HEADING",
      "level": 2,
      "order": 5,
      "estimatedWordCount": 250,
      "keyPoints": ["point1", "point2"],
      "contextTags": ["tag1"]
    }
  ]
}`;
  }

  private mergeOutlineSections(existing: OutlineSection[], additional: OutlineSection[]): OutlineSection[] {
    // Simple merge - in practice, would need more sophisticated logic
    const merged = [...existing];
    
    additional.forEach(newSection => {
      newSection.order = merged.length + 1;
      merged.push(newSection);
    });
    
    return merged.sort((a, b) => a.order - b.order);
  }

  private async calculateReadabilityScore(text: string): Promise<number> {
    // Simplified readability calculation - in practice, use Flesch-Kincaid or similar
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Higher score for 15-20 words per sentence (optimal readability)
    const idealRange = avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20;
    return idealRange ? 0.8 + Math.random() * 0.2 : 0.6 + Math.random() * 0.2;
  }

  private async calculateSectionCoherence(text: string, context: SectionGenerationContext): Promise<number> {
    // Simplified coherence calculation
    const keywordMatches = context.targetKeywords?.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length || 0;
    
    const baseScore = 0.7;
    const keywordBonus = (keywordMatches / (context.targetKeywords?.length || 1)) * 0.2;
    const lengthFactor = text.length > 200 ? 0.1 : 0;
    
    return Math.min(1, baseScore + keywordBonus + lengthFactor);
  }

  private async calculateRelevanceScore(text: string, context: SectionGenerationContext): Promise<number> {
    // Check relevance to main topic and section purpose
    const topicWords = context.mainTopic.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    const topicMatches = topicWords.filter(word => textLower.includes(word)).length;
    const relevanceScore = topicMatches / topicWords.length;
    
    return Math.min(1, relevanceScore + 0.3); // Base relevance + topic matching
  }

  private async analyzeGeneratedContentFlow(sections: ContentSection[]): Promise<ContentFlowMap> {
    const connections: ContentConnection[] = [];
    
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      
      connections.push({
        fromSectionId: current.id,
        toSectionId: next.id,
        connectionType: ConnectionType.SEQUENTIAL, // Could be enhanced with AI analysis
        strength: 0.8, // Could be calculated based on actual content
        transitionText: `Transition from ${current.title} to ${next.title}`
      });
    }

    return {
      sections: sections.map(s => s.id),
      connections,
      coherenceScore: 0.8, // Could be calculated from actual content analysis
      logicalFlow: true
    };
  }

  private async calculateCoherenceScore(sections: ContentSection[]): Promise<number> {
    // Analyze overall coherence across all sections
    let totalScore = 0;
    
    for (const section of sections) {
      totalScore += section.coherenceScore || 0.7;
    }
    
    return sections.length > 0 ? totalScore / sections.length : 0;
  }

  private async calculateFlowScore(sections: ContentSection[]): Promise<number> {
    // Calculate how well sections flow together
    let flowScore = 0;
    
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      
      // Simple flow analysis based on content endings and beginnings
      const currentEnd = current.content.slice(-100).toLowerCase();
      const nextStart = next.content.slice(0, 100).toLowerCase();
      
      // Check for connecting words/phrases
      const hasConnector = /\b(however|therefore|furthermore|additionally|meanwhile|consequently|thus|hence)\b/.test(nextStart);
      const sectionScore = hasConnector ? 0.8 : 0.6;
      
      flowScore += sectionScore;
    }
    
    return sections.length > 1 ? flowScore / (sections.length - 1) : 1;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private async saveSectionToDatabase(blogPostId: string, section: ContentSection): Promise<void> {
    if (!this.config.prisma) return;
    
    try {
      await this.config.prisma.contentSection.create({
        data: {
          blogPostId,
          title: section.title,
          content: section.content,
          sectionType: section.sectionType as any,
          order: section.order,
          level: section.level,
          parentId: section.parentId,
          wordCount: section.wordCount,
          keyPoints: section.keyPoints,
          contextTags: section.contextTags,
          promptUsed: section.promptUsed,
          modelUsed: section.modelUsed,
          generationContext: section.generationContext as any,
          generatedAt: section.generatedAt,
          readabilityScore: section.readabilityScore,
          coherenceScore: section.coherenceScore,
          relevanceScore: section.relevanceScore
        }
      });
    } catch (error) {
      console.error('Failed to save section to database:', error);
    }
  }
}

