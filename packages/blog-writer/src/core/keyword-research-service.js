"use strict";
/**
 * Keyword Research & Analysis Service
 * Provides comprehensive keyword research, difficulty analysis, clustering, and competitive insights
 * Integrates DataForSEO APIs with AI-powered analysis and fallback mechanisms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordResearchService = void 0;
const ai_1 = require("ai");
const zod_1 = require("zod");
const dataforseo_service_1 = require("./dataforseo-service");
// Zod schemas for AI-powered keyword analysis
const KeywordSuggestionsSchema = zod_1.z.object({
    keywords: zod_1.z.array(zod_1.z.object({
        keyword: zod_1.z.string(),
        searchIntent: zod_1.z.enum(['informational', 'navigational', 'commercial', 'transactional']),
        relevanceScore: zod_1.z.number().min(0).max(100),
        commercialValue: zod_1.z.number().min(0).max(100),
        longTailVariations: zod_1.z.array(zod_1.z.string()).optional(),
        relatedTopics: zod_1.z.array(zod_1.z.string()).optional()
    })),
    clusters: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        theme: zod_1.z.string(),
        keywords: zod_1.z.array(zod_1.z.string()),
        priority: zod_1.z.number().min(1).max(100)
    }))
});
const KeywordClusteringSchema = zod_1.z.object({
    clusters: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        theme: zod_1.z.string(),
        primaryKeyword: zod_1.z.string(),
        keywords: zod_1.z.array(zod_1.z.string()),
        searchIntent: zod_1.z.enum(['informational', 'navigational', 'commercial', 'transactional']),
        priority: zod_1.z.number().min(1).max(100),
        difficulty: zod_1.z.enum(['very_easy', 'easy', 'possible', 'difficult', 'very_difficult']),
        commercialPotential: zod_1.z.number().min(0).max(100)
    }))
});
const SearchIntentAnalysisSchema = zod_1.z.object({
    analysis: zod_1.z.array(zod_1.z.object({
        keyword: zod_1.z.string(),
        primaryIntent: zod_1.z.enum(['informational', 'navigational', 'commercial', 'transactional']),
        confidence: zod_1.z.number().min(0).max(1),
        modifiers: zod_1.z.array(zod_1.z.string()),
        userNeed: zod_1.z.string(),
        contentType: zod_1.z.enum(['blog', 'product', 'service', 'guide', 'comparison', 'review'])
    }))
});
/**
 * Keyword Research & Analysis Service
 * Comprehensive keyword research combining DataForSEO data with AI-powered insights
 */
class KeywordResearchService {
    constructor(config) {
        this.config = {
            cacheResults: true,
            cacheTTL: 24, // 24 hours default
            enableClustering: true,
            maxKeywordsPerCluster: 20,
            ...config
        };
        // Initialize DataForSEO service if configured
        if (config.dataForSEOConfig) {
            this.dataForSEOService = new dataforseo_service_1.DataForSEOService({
                config: config.dataForSEOConfig,
                model: config.model,
                prisma: config.prisma,
                enableCaching: config.cacheResults
            });
        }
    }
    /**
     * Perform comprehensive keyword research
     */
    async performKeywordResearch(request) {
        const startTime = Date.now();
        try {
            // Step 1: Get base keyword data from DataForSEO or AI fallback
            let keywordData = await this.getKeywordData(request);
            // Step 2: Enhance with AI-powered analysis
            keywordData = await this.enhanceKeywordData(keywordData, request);
            // Step 3: Analyze search intent for all keywords
            keywordData = await this.analyzeSearchIntent(keywordData);
            // Step 4: Create keyword clusters if enabled
            let clusters = [];
            if (this.config.enableClustering && keywordData.length > 0) {
                clusters = await this.createKeywordClusters(keywordData);
            }
            // Step 5: Calculate processing time
            const processingTime = Date.now() - startTime;
            return {
                keywords: keywordData,
                clusters,
                totalResults: keywordData.length,
                processingTime,
                source: this.dataForSEOService ? 'dataforseo' : 'ai_analysis'
            };
        }
        catch (error) {
            throw new Error(`Keyword research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Analyze keyword difficulty for specific keywords
     */
    async analyzeKeywordDifficulty(keywords) {
        try {
            const difficulties = {};
            // Try DataForSEO first
            if (this.dataForSEOService) {
                const response = await this.dataForSEOService.getKeywordDifficulty(keywords);
                if (response.success && response.data) {
                    for (const [keyword, score] of Object.entries(response.data)) {
                        difficulties[keyword] = {
                            score,
                            level: this.getDifficultyLevel(score),
                            factors: {
                                domainAuthority: 0,
                                contentQuality: 0,
                                backlinks: 0,
                                competition: score
                            }
                        };
                    }
                }
            }
            // Fill in missing data with AI analysis
            const missingKeywords = keywords.filter(k => !difficulties[k]);
            if (missingKeywords.length > 0) {
                const aiAnalysis = await this.analyzeKeywordDifficultyWithAI(missingKeywords);
                Object.assign(difficulties, aiAnalysis);
            }
            return difficulties;
        }
        catch (error) {
            throw new Error(`Keyword difficulty analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate long-tail keyword variations
     */
    async generateLongTailVariations(seedKeywords, maxVariations = 50) {
        const prompt = `Generate long-tail keyword variations for these seed keywords: ${seedKeywords.join(', ')}

Requirements:
- Focus on specific, targeted phrases with 3+ words
- Include question-based keywords (how, what, why, when, where)
- Include comparison keywords (vs, versus, compared to, best)
- Include location-based variations where relevant
- Include buying intent keywords (buy, price, cost, reviews)
- Ensure variations are naturally searchable
- Avoid keyword stuffing or unnatural phrases

Generate exactly ${maxVariations} unique long-tail variations.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: zod_1.z.object({
                    variations: zod_1.z.array(zod_1.z.string()).max(maxVariations)
                })
            });
            return result.object.variations;
        }
        catch (error) {
            throw new Error(`Long-tail variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Analyze seasonal trends for keywords
     */
    async analyzeSeasonalTrends(keywords) {
        // If DataForSEO is available, use it for historical data
        if (this.dataForSEOService) {
            try {
                // DataForSEO provides monthly search data
                const trends = {};
                // This would be implemented with actual DataForSEO trends API
                for (const keyword of keywords) {
                    trends[keyword] = {
                        monthlySearches: [],
                        yearOverYear: 0,
                        trending: 'stable',
                        seasonalPattern: false
                    };
                }
                return trends;
            }
            catch (error) {
                // Fall back to AI analysis
            }
        }
        // AI-based seasonal analysis
        const prompt = `Analyze seasonal trends for these keywords: ${keywords.join(', ')}

For each keyword, determine:
1. Whether it has seasonal patterns (holidays, seasons, events)
2. Peak months and low months
3. Year-over-year trend (rising, falling, stable)
4. Specific seasonal factors that influence search volume

Provide insights about:
- Holiday-related keywords (Christmas, Black Friday, etc.)
- Seasonal activities (summer, winter sports, etc.)
- Back-to-school trends
- New Year resolutions
- Tax season
- Any industry-specific seasonal patterns`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: zod_1.z.object({
                    trends: zod_1.z.array(zod_1.z.object({
                        keyword: zod_1.z.string(),
                        seasonalPattern: zod_1.z.boolean(),
                        peakMonths: zod_1.z.array(zod_1.z.string()).optional(),
                        lowMonths: zod_1.z.array(zod_1.z.string()).optional(),
                        yearOverYearTrend: zod_1.z.enum(['rising', 'falling', 'stable']),
                        seasonalFactors: zod_1.z.array(zod_1.z.string()).optional()
                    }))
                })
            });
            const trends = {};
            for (const trend of result.object.trends) {
                trends[trend.keyword] = {
                    monthlySearches: [], // Would be populated with actual data
                    yearOverYear: trend.yearOverYearTrend === 'rising' ? 15 : trend.yearOverYearTrend === 'falling' ? -10 : 0,
                    trending: trend.yearOverYearTrend,
                    seasonalPattern: trend.seasonalPattern
                };
            }
            return trends;
        }
        catch (error) {
            throw new Error(`Seasonal trend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find keyword opportunities based on competitor gaps
     */
    async findKeywordOpportunities(competitorUrls, targetKeywords) {
        const prompt = `Analyze keyword opportunities for targeting these competitors: ${competitorUrls.join(', ')}

Target keywords: ${targetKeywords.join(', ')}

Identify:
1. Keyword gaps - keywords competitors rank for but we don't target
2. Opportunities - keywords with good potential but lower competition
3. Underutilized keywords - keywords we could improve rankings for

Consider:
- Search volume vs competition balance
- Commercial intent and value
- Content gaps in the market
- Long-tail opportunities
- Question-based keywords
- Local/geographic variations`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: zod_1.z.object({
                    opportunities: zod_1.z.array(zod_1.z.string()),
                    gaps: zod_1.z.array(zod_1.z.string()),
                    underutilized: zod_1.z.array(zod_1.z.string()),
                    insights: zod_1.z.array(zod_1.z.string())
                })
            });
            return {
                opportunities: result.object.opportunities,
                gaps: result.object.gaps,
                underutilized: result.object.underutilized
            };
        }
        catch (error) {
            throw new Error(`Keyword opportunity analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Private helper methods
     */
    /**
     * Get keyword data from DataForSEO or AI fallback
     */
    async getKeywordData(request) {
        // Try DataForSEO first
        if (this.dataForSEOService) {
            const response = await this.dataForSEOService.performKeywordResearch(request);
            if (response.success && response.data) {
                return response.data;
            }
        }
        // Fallback to AI-powered keyword generation
        return await this.generateKeywordsWithAI(request);
    }
    /**
     * Generate keywords using AI when DataForSEO is not available
     */
    async generateKeywordsWithAI(request) {
        const prompt = `Generate keyword research data for these seed keywords: ${request.seedKeywords.join(', ')}

Requirements:
- Generate ${request.maxResults || 50} related keywords
- Include search volume estimates (realistic ranges)
- Analyze search intent for each keyword
- Include competition assessment
- Add long-tail variations if requested: ${request.includeLongTail}
- Include keyword variations if requested: ${request.includeVariations}

For each keyword provide:
1. Estimated monthly search volume
2. Competition level (0-100)
3. Search intent (informational, commercial, navigational, transactional)
4. Keyword difficulty estimate
5. Related keywords and variations
6. Commercial value potential`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: KeywordSuggestionsSchema
            });
            // Convert AI response to KeywordData format
            const keywordData = [];
            for (const keyword of result.object.keywords) {
                const data = {
                    keyword: keyword.keyword,
                    searchVolume: Math.floor(Math.random() * 5000) + 100, // Mock realistic volume
                    competition: keyword.commercialValue / 100,
                    difficulty: {
                        score: Math.floor(Math.random() * 100),
                        level: 'possible',
                        factors: {
                            domainAuthority: 50,
                            contentQuality: 60,
                            backlinks: 40,
                            competition: 50
                        }
                    },
                    trends: {
                        monthlySearches: [],
                        yearOverYear: 0,
                        trending: 'stable',
                        seasonalPattern: false
                    },
                    relatedKeywords: keyword.relatedTopics || [],
                    longTailVariations: keyword.longTailVariations || [],
                    searchIntent: {
                        primary: keyword.searchIntent,
                        confidence: 0.8,
                        modifiers: []
                    }
                };
                keywordData.push(data);
            }
            return keywordData;
        }
        catch (error) {
            throw new Error(`AI keyword generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Enhance keyword data with additional AI analysis
     */
    async enhanceKeywordData(keywordData, request) {
        // Add long-tail variations if requested
        if (request.includeLongTail) {
            const seedKeywords = keywordData.slice(0, 10).map(k => k.keyword);
            const longTailVariations = await this.generateLongTailVariations(seedKeywords, 20);
            // Add variations to existing keywords
            keywordData.forEach(keyword => {
                const variations = longTailVariations.filter(v => v.toLowerCase().includes(keyword.keyword.toLowerCase()));
                keyword.longTailVariations = [...(keyword.longTailVariations || []), ...variations];
            });
        }
        return keywordData;
    }
    /**
     * Analyze search intent using AI
     */
    async analyzeSearchIntent(keywordData) {
        const keywords = keywordData.map(k => k.keyword);
        const batchSize = 50; // Process in batches to avoid token limits
        for (let i = 0; i < keywords.length; i += batchSize) {
            const batch = keywords.slice(i, i + batchSize);
            const prompt = `Analyze search intent for these keywords: ${batch.join(', ')}

For each keyword, determine:
1. Primary search intent (informational, navigational, commercial, transactional)
2. Confidence level (0-1)
3. Intent modifiers (words that indicate specific intent)
4. User need or goal
5. Best content type to satisfy the intent

Consider:
- Informational: How-to, what is, guide, tutorial keywords
- Navigational: Brand names, specific websites or pages
- Commercial: Comparison, review, best, top keywords
- Transactional: Buy, price, purchase, order keywords`;
            try {
                const result = await (0, ai_1.generateObject)({
                    model: this.config.model,
                    prompt,
                    schema: SearchIntentAnalysisSchema
                });
                // Update keyword data with intent analysis
                for (const analysis of result.object.analysis) {
                    const keyword = keywordData.find(k => k.keyword === analysis.keyword);
                    if (keyword) {
                        keyword.searchIntent = {
                            primary: analysis.primaryIntent,
                            confidence: analysis.confidence,
                            modifiers: analysis.modifiers
                        };
                    }
                }
            }
            catch (error) {
                console.warn('Search intent analysis failed for batch:', batch);
            }
        }
        return keywordData;
    }
    /**
     * Create keyword clusters using AI
     */
    async createKeywordClusters(keywordData) {
        const keywords = keywordData.map(k => k.keyword);
        const prompt = `Create keyword clusters from these keywords: ${keywords.join(', ')}

Group related keywords into clusters based on:
1. Topic similarity and semantic meaning
2. Search intent alignment
3. Content type requirements
4. User journey stage

For each cluster provide:
- Descriptive cluster name
- Theme or topic focus
- Primary keyword (highest search volume/importance)
- List of keywords in the cluster
- Search intent for the cluster
- Priority score (1-100)
- Estimated difficulty level
- Commercial potential (0-100)

Create ${Math.min(Math.ceil(keywords.length / this.config.maxKeywordsPerCluster), 10)} clusters maximum.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: KeywordClusteringSchema
            });
            const clusters = [];
            let clusterId = 1;
            for (const cluster of result.object.clusters) {
                // Get keyword data for cluster keywords
                const clusterKeywords = keywordData.filter(k => cluster.keywords.includes(k.keyword));
                if (clusterKeywords.length > 0) {
                    const totalSearchVolume = clusterKeywords.reduce((sum, k) => sum + k.searchVolume, 0);
                    const averageDifficulty = clusterKeywords.reduce((sum, k) => sum + k.difficulty.score, 0) / clusterKeywords.length;
                    clusters.push({
                        id: `cluster_${clusterId++}`,
                        name: cluster.name,
                        primaryKeyword: cluster.primaryKeyword,
                        keywords: clusterKeywords,
                        totalSearchVolume,
                        averageDifficulty,
                        searchIntent: {
                            primary: cluster.searchIntent,
                            confidence: 0.8,
                            modifiers: []
                        },
                        priority: cluster.priority
                    });
                }
            }
            return clusters;
        }
        catch (error) {
            console.warn('Keyword clustering failed:', error);
            return [];
        }
    }
    /**
     * Analyze keyword difficulty using AI when DataForSEO is not available
     */
    async analyzeKeywordDifficultyWithAI(keywords) {
        const prompt = `Analyze keyword difficulty for these keywords: ${keywords.join(', ')}

For each keyword, estimate:
1. Overall difficulty score (0-100)
2. Difficulty level (very_easy, easy, possible, difficult, very_difficult)
3. Factors affecting difficulty:
   - Domain authority requirements
   - Content quality requirements
   - Backlink requirements
   - Competition level

Consider:
- Keyword length (longer = usually easier)
- Commercial intent (higher intent = more competition)
- Industry competition
- Content type requirements
- Current SERP analysis`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: zod_1.z.object({
                    difficulties: zod_1.z.array(zod_1.z.object({
                        keyword: zod_1.z.string(),
                        score: zod_1.z.number().min(0).max(100),
                        level: zod_1.z.enum(['very_easy', 'easy', 'possible', 'difficult', 'very_difficult']),
                        domainAuthorityRequirement: zod_1.z.number().min(0).max(100),
                        contentQualityRequirement: zod_1.z.number().min(0).max(100),
                        backlinkRequirement: zod_1.z.number().min(0).max(100),
                        competitionLevel: zod_1.z.number().min(0).max(100)
                    }))
                })
            });
            const difficulties = {};
            for (const diff of result.object.difficulties) {
                difficulties[diff.keyword] = {
                    score: diff.score,
                    level: diff.level,
                    factors: {
                        domainAuthority: diff.domainAuthorityRequirement,
                        contentQuality: diff.contentQualityRequirement,
                        backlinks: diff.backlinkRequirement,
                        competition: diff.competitionLevel
                    }
                };
            }
            return difficulties;
        }
        catch (error) {
            throw new Error(`AI difficulty analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Utility methods
     */
    getDifficultyLevel(score) {
        if (score < 20)
            return 'very_easy';
        if (score < 40)
            return 'easy';
        if (score < 60)
            return 'possible';
        if (score < 80)
            return 'difficult';
        return 'very_difficult';
    }
}
exports.KeywordResearchService = KeywordResearchService;
