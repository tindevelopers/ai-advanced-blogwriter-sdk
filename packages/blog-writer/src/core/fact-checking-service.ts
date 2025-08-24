

/**
 * Fact-Checking & Source Verification Service
 * AI-powered fact verification, source credibility analysis, and citation management
 */

import { LanguageModel, generateText, generateObject } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import { z } from 'zod';
import {
  FactCheck,
  VerificationStatus,
  SourceCitation,
  SourceType,
  BiasRating,
  ExpertiseLevel,
  FactCheckRequest
} from '../types/advanced-writing';

export interface FactCheckConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
  enableRealTimeChecking?: boolean;
  apiKeys?: {
    newsApi?: string;
    serpApi?: string;
    factCheckApi?: string;
  };
}

// Zod schemas for structured AI responses
const ClaimExtractionSchema = z.object({
  claims: z.array(z.object({
    text: z.string(),
    type: z.enum(['factual', 'statistical', 'historical', 'scientific', 'opinion']),
    confidence: z.number().min(0).max(1),
    importance: z.enum(['low', 'medium', 'high', 'critical']),
    startPosition: z.number().optional(),
    endPosition: z.number().optional(),
    context: z.string().optional()
  }))
});

const FactVerificationSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'DISPUTED', 'FALSE', 'PARTIALLY_TRUE', 'UNVERIFIABLE']),
  confidence: z.number().min(0).max(1),
  evidenceQuality: z.number().min(0).max(1),
  reasoning: z.string(),
  supportingEvidence: z.array(z.string()),
  contradictingEvidence: z.array(z.string()),
  caveats: z.array(z.string()).optional()
});

const SourceCredibilitySchema = z.object({
  credibilityScore: z.number().min(0).max(1),
  authorityScore: z.number().min(0).max(1),
  biasRating: z.enum(['LEFT', 'LEAN_LEFT', 'CENTER', 'LEAN_RIGHT', 'RIGHT', 'MIXED', 'UNKNOWN']),
  expertiseLevel: z.enum(['EXPERT', 'PRACTITIONER', 'ACADEMIC', 'JOURNALIST', 'GENERAL_PUBLIC', 'UNKNOWN']),
  qualityIndicators: z.object({
    isPeerReviewed: z.boolean(),
    isGovernment: z.boolean(),
    isAcademic: z.boolean(),
    isRecent: z.boolean(),
    hasAuthor: z.boolean(),
    hasReferences: z.boolean()
  }),
  concerns: z.array(z.string()).optional()
});

export class FactCheckingService {
  constructor(private config: FactCheckConfig) {}

  /**
   * Extract and verify factual claims from content
   */
  async performFactCheck(request: FactCheckRequest): Promise<FactCheck[]> {
    const content = await this.getContentForAnalysis(request.blogPostId);
    
    // Extract claims from content
    const claims = request.claims || await this.extractClaims(content, request.autoDetectClaims !== false);
    
    const factChecks: FactCheck[] = [];
    
    for (const claim of claims) {
      const factCheck = await this.verifyClaim(
        claim,
        request.blogPostId,
        request.verificationThreshold || 0.7,
        request.includeSourceAnalysis !== false,
        request.requireReliableSources !== false
      );
      
      factChecks.push(factCheck);
    }

    // Save to database
    if (this.config.prisma) {
      await this.saveFactChecksToDatabase(factChecks);
    }

    return factChecks;
  }

  /**
   * Alias for performFactCheck for backward compatibility
   */
  async verifyFacts(request: FactCheckRequest): Promise<FactCheck[]> {
    return this.performFactCheck(request);
  }

  /**
   * Verify a single claim against reliable sources
   */
  async verifyClaim(
    claim: string,
    blogPostId: string,
    confidenceThreshold: number = 0.7,
    includeSourceAnalysis: boolean = true,
    requireReliableSources: boolean = true
  ): Promise<FactCheck> {
    // Search for relevant sources
    const sources = await this.findRelevantSources(claim);
    
    // Analyze source credibility
    const citationsWithCredibility = includeSourceAnalysis 
      ? await this.analyzeSourceCredibility(sources)
      : sources.map(s => ({ ...s, credibilityScore: 0.5 }));

    // Filter for reliable sources if required
    const reliableSources = requireReliableSources
      ? citationsWithCredibility.filter(s => (s.credibilityScore || 0.5) >= 0.6)
      : citationsWithCredibility;

    // Verify claim using AI analysis
    const verification = await this.performAIVerification(claim, reliableSources);
    
    const factCheck: FactCheck = {
      id: `fact_check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blogPostId,
      claim,
      verificationStatus: verification.status,
      confidenceScore: verification.confidence,
      evidenceQuality: verification.evidenceQuality,
      sourceUrls: reliableSources.map(s => s.url),
      sourcesVerified: reliableSources.length,
      sourcesReliable: reliableSources.filter(s => (s.credibilityScore || 0) >= 0.7).length,
      sourceCredibility: this.calculateAverageCredibility(reliableSources),
      verificationMethod: 'AI + Source Analysis',
      verificationNotes: verification.reasoning,
      verifiedAt: new Date(),
      requiresAttention: verification.confidence < confidenceThreshold || verification.status === VerificationStatus.DISPUTED,
      flagReason: verification.confidence < confidenceThreshold ? 'Low confidence verification' : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      citations: reliableSources
    };

    return factCheck;
  }

  /**
   * Analyze credibility of a source URL
   */
  async analyzeSourceCredibility(sources: Partial<SourceCitation>[]): Promise<SourceCitation[]> {
    const analyzedSources: SourceCitation[] = [];

    for (const source of sources) {
      if (!source.url || !source.title) continue;

      const credibilityAnalysis = await this.performCredibilityAnalysis(source.url, source.title);
      
      const citation: SourceCitation = {
        id: `citation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blogPostId: source.blogPostId || '',
        factCheckId: source.factCheckId,
        title: source.title,
        url: source.url,
        author: source.author,
        publishedDate: source.publishedDate,
        accessedDate: new Date(),
        sourceType: this.determineSourceType(source.url),
        domain: this.extractDomain(source.url),
        language: source.language || 'en',
        credibilityScore: credibilityAnalysis.credibilityScore,
        authorityScore: credibilityAnalysis.authorityScore,
        biasRating: credibilityAnalysis.biasRating as BiasRating,
        expertiseLevel: credibilityAnalysis.expertiseLevel as ExpertiseLevel,
        citationContext: source.citationContext,
        quote: source.quote,
        pageNumber: source.pageNumber,
        isPeerReviewed: credibilityAnalysis.qualityIndicators.isPeerReviewed,
        isGovernment: credibilityAnalysis.qualityIndicators.isGovernment,
        isAcademic: credibilityAnalysis.qualityIndicators.isAcademic,
        isRecent: credibilityAnalysis.qualityIndicators.isRecent,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      analyzedSources.push(citation);
    }

    return analyzedSources;
  }

  /**
   * Generate source recommendations for a topic
   */
  async recommendSources(
    topic: string,
    sourceTypes: SourceType[] = [SourceType.ACADEMIC_PAPER, SourceType.GOVERNMENT_DOCUMENT, SourceType.OFFICIAL_WEBSITE],
    maxSources: number = 10
  ): Promise<SourceCitation[]> {
    const searchResults = await this.searchReliableSources(topic, sourceTypes, maxSources);
    return this.analyzeSourceCredibility(searchResults);
  }

  /**
   * Validate existing citations for accuracy and availability
   */
  async validateCitations(citations: SourceCitation[]): Promise<{
    validCitations: SourceCitation[];
    invalidCitations: Array<{
      citation: SourceCitation;
      issues: string[];
    }>;
    summary: {
      total: number;
      valid: number;
      invalid: number;
      averageCredibility: number;
    };
  }> {
    const validCitations: SourceCitation[] = [];
    const invalidCitations: Array<{ citation: SourceCitation; issues: string[] }> = [];

    for (const citation of citations) {
      const validation = await this.validateSingleCitation(citation);
      
      if (validation.isValid) {
        validCitations.push({
          ...citation,
          credibilityScore: validation.updatedCredibility
        });
      } else {
        invalidCitations.push({
          citation,
          issues: validation.issues
        });
      }
    }

    const averageCredibility = validCitations.length > 0
      ? validCitations.reduce((sum, c) => sum + (c.credibilityScore || 0), 0) / validCitations.length
      : 0;

    return {
      validCitations,
      invalidCitations,
      summary: {
        total: citations.length,
        valid: validCitations.length,
        invalid: invalidCitations.length,
        averageCredibility
      }
    };
  }

  /**
   * Detect potential plagiarism or unoriginal content
   */
  async checkOriginality(
    content: string,
    excludeDomains: string[] = []
  ): Promise<{
    originalityScore: number; // 0-1, where 1 = completely original
    matches: Array<{
      text: string;
      source: string;
      similarity: number;
      startPosition: number;
      endPosition: number;
    }>;
    summary: {
      totalMatches: number;
      highSimilarityMatches: number;
      suspiciousPatterns: string[];
    };
  }> {
    // In a real implementation, this would use specialized plagiarism detection APIs
    // For now, return mock results based on content analysis
    
    const mockMatches = await this.performMockPlagiarismCheck(content, excludeDomains);
    
    const highSimilarityMatches = mockMatches.filter(m => m.similarity > 0.8);
    const originalityScore = Math.max(0, 1 - (mockMatches.reduce((sum, m) => sum + m.similarity, 0) / Math.max(mockMatches.length, 1)));

    return {
      originalityScore,
      matches: mockMatches,
      summary: {
        totalMatches: mockMatches.length,
        highSimilarityMatches: highSimilarityMatches.length,
        suspiciousPatterns: highSimilarityMatches.length > 3 ? ['Multiple high-similarity matches found'] : []
      }
    };
  }

  /**
   * Generate comprehensive fact-checking report
   */
  async generateFactCheckReport(blogPostId: string): Promise<{
    overallScore: number;
    totalClaims: number;
    verifiedClaims: number;
    disputedClaims: number;
    unverifiableClaims: number;
    sourcesUsed: number;
    reliableSources: number;
    averageCredibility: number;
    factChecks: FactCheck[];
    recommendations: string[];
  }> {
    const factChecks = await this.getFactChecksByBlogPost(blogPostId);
    
    const totalClaims = factChecks.length;
    const verifiedClaims = factChecks.filter(fc => fc.verificationStatus === VerificationStatus.VERIFIED).length;
    const disputedClaims = factChecks.filter(fc => fc.verificationStatus === VerificationStatus.DISPUTED || fc.verificationStatus === VerificationStatus.FALSE).length;
    const unverifiableClaims = factChecks.filter(fc => fc.verificationStatus === VerificationStatus.UNVERIFIABLE).length;
    
    const sourcesUsed = factChecks.reduce((sum, fc) => sum + fc.sourcesVerified, 0);
    const reliableSources = factChecks.reduce((sum, fc) => sum + fc.sourcesReliable, 0);
    const averageCredibility = this.calculateOverallCredibility(factChecks);
    
    const overallScore = totalClaims > 0 
      ? (verifiedClaims * 1.0 + unverifiableClaims * 0.5 - disputedClaims * 0.5) / totalClaims 
      : 1.0;

    const recommendations = this.generateRecommendations(factChecks);

    return {
      overallScore: Math.max(0, Math.min(1, overallScore)),
      totalClaims,
      verifiedClaims,
      disputedClaims,
      unverifiableClaims,
      sourcesUsed,
      reliableSources,
      averageCredibility,
      factChecks,
      recommendations
    };
  }

  // Private helper methods

  private async extractClaims(content: string, autoDetect: boolean): Promise<string[]> {
    if (!autoDetect) return [];

    const prompt = `Extract factual claims from the following content that can be fact-checked:

"${content}"

Focus on:
1. Specific factual statements (not opinions)
2. Statistical claims and numbers
3. Historical facts and dates
4. Scientific claims
5. Quotes and attributions

Exclude:
1. Personal opinions
2. Subjective statements
3. Future predictions
4. Hypothetical scenarios

Return the claims analysis:`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: ClaimExtractionSchema,
        prompt
      });

      return result.object.claims
        .filter(claim => claim.importance !== 'low' && claim.confidence > 0.6)
        .map(claim => claim.text);
    } catch (error) {
      console.error('Failed to extract claims:', error);
      return [];
    }
  }

  private async findRelevantSources(claim: string): Promise<Partial<SourceCitation>[]> {
    // In a real implementation, this would use search APIs (Google, Bing, specialized fact-checking APIs)
    // For now, return mock sources based on claim analysis
    
    const searchKeywords = this.extractKeywords(claim);
    const mockSources = await this.generateMockSources(claim, searchKeywords);
    
    return mockSources;
  }

  private async performAIVerification(
    claim: string,
    sources: SourceCitation[]
  ): Promise<{
    status: VerificationStatus;
    confidence: number;
    evidenceQuality: number;
    reasoning: string;
  }> {
    const sourceContext = sources.map(s => 
      `Source: ${s.title} (${s.url})\nCredibility: ${s.credibilityScore || 'Unknown'}\nType: ${s.sourceType}`
    ).join('\n\n');

    const prompt = `Verify the following claim against the provided sources:

Claim: "${claim}"

Available Sources:
${sourceContext}

Analyze the claim and provide:
1. Verification status (VERIFIED/DISPUTED/FALSE/PARTIALLY_TRUE/UNVERIFIABLE)
2. Confidence level (0-1)
3. Evidence quality (0-1)
4. Detailed reasoning

Consider:
- Source credibility and authority
- Consistency across multiple sources
- Recency and relevance of information
- Potential bias or conflicts of interest

Provide objective, evidence-based analysis:`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: FactVerificationSchema,
        prompt
      });

      return {
        status: result.object.verificationStatus as VerificationStatus,
        confidence: result.object.confidence,
        evidenceQuality: result.object.evidenceQuality,
        reasoning: result.object.reasoning
      };
    } catch (error) {
      console.error('Failed to perform AI verification:', error);
      return {
        status: VerificationStatus.UNVERIFIABLE,
        confidence: 0.3,
        evidenceQuality: 0.3,
        reasoning: 'Unable to complete verification analysis'
      };
    }
  }

  private async performCredibilityAnalysis(url: string, title: string): Promise<any> {
    const domain = this.extractDomain(url);
    
    const prompt = `Analyze the credibility of this source:

URL: ${url}
Title: ${title}
Domain: ${domain}

Evaluate:
1. Credibility score (0-1) - Overall trustworthiness
2. Authority score (0-1) - Expertise in subject matter
3. Bias rating (LEFT/LEAN_LEFT/CENTER/LEAN_RIGHT/RIGHT/MIXED/UNKNOWN)
4. Expertise level (EXPERT/PRACTITIONER/ACADEMIC/JOURNALIST/GENERAL_PUBLIC/UNKNOWN)

Quality indicators:
- Is this peer-reviewed content?
- Is this from a government source?
- Is this from an academic institution?
- Is this recent (within 2 years)?
- Does it have identifiable authors?
- Does it cite references?

Consider domain reputation, content quality, editorial standards, and known biases.

Provide objective assessment:`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: SourceCredibilitySchema,
        prompt
      });

      return result.object;
    } catch (error) {
      console.error('Failed to analyze source credibility:', error);
      // Return conservative defaults
      return {
        credibilityScore: 0.5,
        authorityScore: 0.5,
        biasRating: 'UNKNOWN',
        expertiseLevel: 'UNKNOWN',
        qualityIndicators: {
          isPeerReviewed: false,
          isGovernment: domain.includes('.gov'),
          isAcademic: domain.includes('.edu'),
          isRecent: true,
          hasAuthor: true,
          hasReferences: false
        },
        concerns: []
      };
    }
  }

  private determineSourceType(url: string): SourceType {
    const domain = this.extractDomain(url).toLowerCase();
    
    if (domain.includes('.gov')) return SourceType.GOVERNMENT_DOCUMENT;
    if (domain.includes('.edu')) return SourceType.ACADEMIC_PAPER;
    if (domain.includes('arxiv') || domain.includes('pubmed') || domain.includes('scholar')) return SourceType.ACADEMIC_PAPER;
    if (domain.includes('reuters') || domain.includes('ap.org') || domain.includes('bbc')) return SourceType.NEWS_ARTICLE;
    if (domain.includes('youtube') || domain.includes('vimeo')) return SourceType.VIDEO;
    if (domain.includes('twitter') || domain.includes('facebook') || domain.includes('linkedin')) return SourceType.SOCIAL_MEDIA;
    if (domain.includes('podcast') || domain.includes('spotify') || domain.includes('apple.com/podcasts')) return SourceType.PODCAST;
    
    return SourceType.OFFICIAL_WEBSITE;
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url.split('/')[0] || url;
    }
  }

  private extractKeywords(claim: string): string[] {
    // Simple keyword extraction - in practice, use NLP library
    return claim
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !['that', 'this', 'with', 'from', 'they', 'were', 'been', 'have', 'said'].includes(word))
      .slice(0, 10);
  }

  private async generateMockSources(claim: string, keywords: string[]): Promise<Partial<SourceCitation>[]> {
    // Mock source generation for development
    return [
      {
        title: `Research Study on ${keywords[0] || 'topic'}`,
        url: `https://example-academic.edu/study/${keywords[0] || 'research'}`,
        author: 'Dr. Jane Smith',
        sourceType: SourceType.ACADEMIC_PAPER,
        publishedDate: new Date(Date.now() - 86400000 * 30) // 30 days ago
      },
      {
        title: `Government Report: ${keywords[1] || 'findings'}`,
        url: `https://example.gov/reports/${keywords[1] || 'data'}`,
        sourceType: SourceType.GOVERNMENT_DOCUMENT,
        publishedDate: new Date(Date.now() - 86400000 * 7) // 7 days ago
      },
      {
        title: `News Article: ${keywords[0] || 'topic'} Analysis`,
        url: `https://example-news.com/articles/${keywords[0] || 'story'}`,
        author: 'John Reporter',
        sourceType: SourceType.NEWS_ARTICLE,
        publishedDate: new Date(Date.now() - 86400000 * 2) // 2 days ago
      }
    ];
  }

  private async searchReliableSources(
    topic: string,
    sourceTypes: SourceType[],
    maxSources: number
  ): Promise<Partial<SourceCitation>[]> {
    // Mock implementation - in practice, integrate with search APIs
    const mockSources: Partial<SourceCitation>[] = [];
    
    for (const sourceType of sourceTypes) {
      for (let i = 0; i < Math.min(maxSources / sourceTypes.length, 3); i++) {
        mockSources.push({
          title: `${sourceType} source about ${topic} - ${i + 1}`,
          url: `https://example-${sourceType.toLowerCase()}.com/article-${i + 1}`,
          sourceType,
          publishedDate: new Date(Date.now() - Math.random() * 86400000 * 365) // Random date within last year
        });
      }
    }
    
    return mockSources.slice(0, maxSources);
  }

  private async validateSingleCitation(citation: SourceCitation): Promise<{
    isValid: boolean;
    issues: string[];
    updatedCredibility: number;
  }> {
    const issues: string[] = [];
    let updatedCredibility = citation.credibilityScore || 0.5;

    // Check URL accessibility (mock implementation)
    if (!citation.url || !citation.url.startsWith('http')) {
      issues.push('Invalid or inaccessible URL');
    }

    // Check for recent publication
    if (citation.publishedDate && citation.publishedDate < new Date(Date.now() - 86400000 * 365 * 3)) {
      issues.push('Source is older than 3 years');
      updatedCredibility *= 0.9;
    }

    // Check for author information
    if (!citation.author && citation.sourceType === SourceType.ACADEMIC_PAPER) {
      issues.push('Academic source lacks author information');
      updatedCredibility *= 0.8;
    }

    return {
      isValid: issues.length === 0,
      issues,
      updatedCredibility
    };
  }

  private async performMockPlagiarismCheck(
    content: string,
    excludeDomains: string[]
  ): Promise<Array<{
    text: string;
    source: string;
    similarity: number;
    startPosition: number;
    endPosition: number;
  }>> {
    // Mock plagiarism detection
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
    const matches: Array<any> = [];

    // Simulate finding some potential matches
    if (sentences.length > 5) {
      matches.push({
        text: sentences[1].trim(),
        source: 'https://example-source.com/article1',
        similarity: 0.85,
        startPosition: content.indexOf(sentences[1]),
        endPosition: content.indexOf(sentences[1]) + sentences[1].length
      });
    }

    return matches;
  }

  private calculateAverageCredibility(sources: SourceCitation[]): number {
    if (sources.length === 0) return 0;
    
    const totalCredibility = sources.reduce((sum, source) => sum + (source.credibilityScore || 0), 0);
    return totalCredibility / sources.length;
  }

  private calculateOverallCredibility(factChecks: FactCheck[]): number {
    if (factChecks.length === 0) return 0;
    
    const totalCredibility = factChecks.reduce((sum, fc) => sum + (fc.sourceCredibility || 0), 0);
    return totalCredibility / factChecks.length;
  }

  private generateRecommendations(factChecks: FactCheck[]): string[] {
    const recommendations: string[] = [];
    
    const disputedChecks = factChecks.filter(fc => fc.verificationStatus === VerificationStatus.DISPUTED || fc.verificationStatus === VerificationStatus.FALSE);
    const unverifiableChecks = factChecks.filter(fc => fc.verificationStatus === VerificationStatus.UNVERIFIABLE);
    const lowConfidenceChecks = factChecks.filter(fc => (fc.confidenceScore || 0) < 0.6);

    if (disputedChecks.length > 0) {
      recommendations.push(`Review and correct ${disputedChecks.length} disputed or false claims`);
    }

    if (unverifiableChecks.length > 0) {
      recommendations.push(`Find additional sources for ${unverifiableChecks.length} unverifiable claims`);
    }

    if (lowConfidenceChecks.length > 0) {
      recommendations.push(`Strengthen evidence for ${lowConfidenceChecks.length} low-confidence claims`);
    }

    const avgCredibility = this.calculateOverallCredibility(factChecks);
    if (avgCredibility < 0.6) {
      recommendations.push('Consider using more authoritative and credible sources');
    }

    if (factChecks.length === 0) {
      recommendations.push('Consider adding fact-checking for key claims in the content');
    }

    return recommendations;
  }

  // Database helper methods

  private async getContentForAnalysis(blogPostId: string): Promise<string> {
    if (!this.config.prisma) {
      throw new Error('Prisma not available');
    }

    const blogPost = await this.config.prisma.blogPost.findUnique({
      where: { id: blogPostId }
    });

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    return blogPost.content;
  }

  private async getFactChecksByBlogPost(blogPostId: string): Promise<FactCheck[]> {
    if (!this.config.prisma) return [];

    const factChecks = await this.config.prisma.factCheck.findMany({
      where: { blogPostId },
      include: {
        citations: true
      }
    });

    return factChecks.map(fc => ({
      id: fc.id,
      blogPostId: fc.blogPostId,
      claim: fc.claim,
      sectionId: fc.sectionId,
      startPosition: fc.startPosition,
      endPosition: fc.endPosition,
      verificationStatus: fc.verificationStatus as VerificationStatus,
      confidenceScore: fc.confidenceScore,
      evidenceQuality: fc.evidenceQuality,
      sourceUrls: fc.sourceUrls,
      sourcesVerified: fc.sourcesVerified,
      sourcesReliable: fc.sourcesReliable,
      sourceCredibility: fc.sourceCredibility,
      verificationMethod: fc.verificationMethod,
      verificationNotes: fc.verificationNotes,
      verifiedAt: fc.verifiedAt,
      verifiedBy: fc.verifiedBy,
      requiresAttention: fc.requiresAttention,
      flagReason: fc.flagReason,
      createdAt: fc.createdAt,
      updatedAt: fc.updatedAt,
      citations: fc.citations.map(c => ({
        id: c.id,
        blogPostId: c.blogPostId,
        factCheckId: c.factCheckId,
        title: c.title,
        url: c.url,
        author: c.author,
        publishedDate: c.publishedDate,
        accessedDate: c.accessedDate,
        sourceType: c.sourceType as SourceType,
        domain: c.domain,
        language: c.language,
        credibilityScore: c.credibilityScore,
        authorityScore: c.authorityScore,
        biasRating: c.biasRating as BiasRating,
        expertiseLevel: c.expertiseLevel as ExpertiseLevel,
        citationContext: c.citationContext,
        quote: c.quote,
        pageNumber: c.pageNumber,
        isPeerReviewed: c.isPeerReviewed,
        isGovernment: c.isGovernment,
        isAcademic: c.isAcademic,
        isRecent: c.isRecent,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    }));
  }

  private async saveFactChecksToDatabase(factChecks: FactCheck[]): Promise<void> {
    if (!this.config.prisma) return;

    for (const factCheck of factChecks) {
      try {
        // Save fact check
        await this.config.prisma.factCheck.create({
          data: {
            blogPostId: factCheck.blogPostId,
            claim: factCheck.claim,
            sectionId: factCheck.sectionId,
            startPosition: factCheck.startPosition,
            endPosition: factCheck.endPosition,
            verificationStatus: factCheck.verificationStatus,
            confidenceScore: factCheck.confidenceScore,
            evidenceQuality: factCheck.evidenceQuality,
            sourceUrls: factCheck.sourceUrls,
            sourcesVerified: factCheck.sourcesVerified,
            sourcesReliable: factCheck.sourcesReliable,
            sourceCredibility: factCheck.sourceCredibility,
            verificationMethod: factCheck.verificationMethod,
            verificationNotes: factCheck.verificationNotes,
            verifiedAt: factCheck.verifiedAt,
            verifiedBy: factCheck.verifiedBy,
            requiresAttention: factCheck.requiresAttention,
            flagReason: factCheck.flagReason
          }
        });

        // Save citations
        for (const citation of factCheck.citations) {
          await this.config.prisma.sourceCitation.create({
            data: {
              blogPostId: citation.blogPostId,
              factCheckId: factCheck.id,
              title: citation.title,
              url: citation.url,
              author: citation.author,
              publishedDate: citation.publishedDate,
              accessedDate: citation.accessedDate,
              sourceType: citation.sourceType,
              domain: citation.domain,
              language: citation.language,
              credibilityScore: citation.credibilityScore,
              authorityScore: citation.authorityScore,
              biasRating: citation.biasRating,
              expertiseLevel: citation.expertiseLevel,
              citationContext: citation.citationContext,
              quote: citation.quote,
              pageNumber: citation.pageNumber,
              isPeerReviewed: citation.isPeerReviewed,
              isGovernment: citation.isGovernment,
              isAcademic: citation.isAcademic,
              isRecent: citation.isRecent
            }
          });
        }
      } catch (error) {
        console.error('Failed to save fact check:', error);
      }
    }
  }
}

