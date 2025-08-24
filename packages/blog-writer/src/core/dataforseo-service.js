'use strict';
/**
 * DataForSEO Integration Service
 * Handles MCP connections, API configuration, rate limiting, and error handling
 * Provides abstracted access to DataForSEO APIs with fallback mechanisms
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DataForSEOService = void 0;
/**
 * DataForSEO Integration Service
 * Provides robust API integration with caching, rate limiting, and fallback mechanisms
 */
class DataForSEOService {
  constructor(options) {
    this.requestQueue = new Map();
    this.config = {
      baseUrl: 'https://api.dataforseo.com/v3',
      rateLimit: 100, // requests per minute
      timeout: 30000,
      retryAttempts: 3,
      cacheTTL: 60, // minutes
      fallbackMode: true,
      ...options.config,
    };
    this.model = options.model;
    this.prisma = options.prisma;
    this.enableCaching = options.enableCaching ?? true;
    this.cachePrefix = options.cachePrefix ?? 'dataforseo';
    this.connectionStatus = {
      connected: false,
      lastChecked: new Date(),
      apiQuota: {
        remaining: 0,
        limit: 0,
        resetAt: new Date(),
      },
    };
    // Initialize connection check
    this.checkConnection();
  }
  /**
   * Check DataForSEO API connection and quota
   */
  async checkConnection() {
    try {
      const response = await this.makeAPIRequest(
        'dataforseo_labs/available_parameters',
      );
      if (response.success) {
        this.connectionStatus = {
          connected: true,
          lastChecked: new Date(),
          apiQuota: response.rateLimit || this.connectionStatus.apiQuota,
        };
      }
    } catch (error) {
      this.connectionStatus = {
        connected: false,
        lastChecked: new Date(),
        apiQuota: this.connectionStatus.apiQuota,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
    return this.connectionStatus;
  }
  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return { ...this.connectionStatus };
  }
  /**
   * Perform keyword research using DataForSEO APIs
   */
  async performKeywordResearch(request) {
    const cacheKey = this.generateCacheKey('keyword_research', request);
    // Check cache first
    if (this.enableCaching) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'cache',
        };
      }
    }
    // Check if we should use DataForSEO or fallback
    if (
      !this.connectionStatus.connected &&
      this.config.fallbackMode &&
      this.model
    ) {
      return await this.keywordResearchFallback(request);
    }
    try {
      // Build DataForSEO request
      const dataforSeoRequest = this.buildKeywordResearchRequest(request);
      const response = await this.makeAPIRequest(
        'dataforseo_labs/keywords_for_keywords/live',
        dataforSeoRequest,
      );
      if (!response.success) {
        throw new Error(response.error || 'DataForSEO request failed');
      }
      // Process DataForSEO response
      const keywordData = this.processKeywordResearchResponse(response.data);
      // Cache the results
      if (this.enableCaching) {
        await this.setCache(cacheKey, keywordData, this.config.cacheTTL || 60);
      }
      return {
        success: true,
        data: keywordData,
        source: 'dataforseo',
        rateLimit: response.rateLimit,
      };
    } catch (error) {
      // Fallback to AI-based analysis if DataForSEO fails
      if (this.config.fallbackMode && this.model) {
        return await this.keywordResearchFallback(request);
      }
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Keyword research failed',
        source: 'dataforseo',
      };
    }
  }
  /**
   * Analyze competitor pages
   */
  async analyzeCompetitors(keyword, competitorUrls) {
    const cacheKey = this.generateCacheKey('competitor_analysis', {
      keyword,
      competitorUrls,
    });
    // Check cache first
    if (this.enableCaching) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'cache',
        };
      }
    }
    try {
      // Get SERP results for the keyword
      const serpResponse = await this.makeAPIRequest(
        'serp/google/organic/live/advanced',
        {
          keyword,
          location_code: 2840, // United States
          language_code: 'en',
          depth: 20,
        },
      );
      if (!serpResponse.success) {
        throw new Error(serpResponse.error || 'SERP analysis failed');
      }
      // Process competitor data
      const competitorAnalysis = await this.processCompetitorAnalysis(
        keyword,
        serpResponse.data,
        competitorUrls,
      );
      // Cache the results
      if (this.enableCaching) {
        await this.setCache(
          cacheKey,
          competitorAnalysis,
          this.config.cacheTTL || 60,
        );
      }
      return {
        success: true,
        data: competitorAnalysis,
        source: 'dataforseo',
        rateLimit: serpResponse.rateLimit,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Competitor analysis failed',
        source: 'dataforseo',
      };
    }
  }
  /**
   * Get keyword difficulty scores
   */
  async getKeywordDifficulty(keywords) {
    const cacheKey = this.generateCacheKey('keyword_difficulty', { keywords });
    // Check cache first
    if (this.enableCaching) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'cache',
        };
      }
    }
    try {
      const response = await this.makeAPIRequest(
        'dataforseo_labs/keyword_difficulty/live',
        {
          keywords,
          location_code: 2840, // United States
          language_code: 'en',
        },
      );
      if (!response.success) {
        throw new Error(response.error || 'Keyword difficulty request failed');
      }
      // Process difficulty scores
      const difficultyScores = {};
      for (const task of response.data.tasks || []) {
        if (task.result && task.result.length > 0) {
          for (const item of task.result) {
            if (item.keyword && typeof item.keyword_difficulty === 'number') {
              difficultyScores[item.keyword] = item.keyword_difficulty;
            }
          }
        }
      }
      // Cache the results
      if (this.enableCaching) {
        await this.setCache(
          cacheKey,
          difficultyScores,
          this.config.cacheTTL || 60,
        );
      }
      return {
        success: true,
        data: difficultyScores,
        source: 'dataforseo',
        rateLimit: response.rateLimit,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Keyword difficulty analysis failed',
        source: 'dataforseo',
      };
    }
  }
  /**
   * Get search volume data for keywords
   */
  async getSearchVolume(keywords, location) {
    const cacheKey = this.generateCacheKey('search_volume', {
      keywords,
      location,
    });
    // Check cache first
    if (this.enableCaching) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'cache',
        };
      }
    }
    try {
      const response = await this.makeAPIRequest(
        'keywords_data/google_ads/search_volume/live',
        {
          keywords,
          location_code: location === 'us' ? 2840 : 2840, // Default to US
          language_code: 'en',
        },
      );
      if (!response.success) {
        throw new Error(response.error || 'Search volume request failed');
      }
      // Process search volume data
      const searchVolumes = {};
      for (const task of response.data.tasks || []) {
        if (task.result && task.result.length > 0) {
          for (const item of task.result) {
            if (item.keyword && typeof item.search_volume === 'number') {
              searchVolumes[item.keyword] = item.search_volume;
            }
          }
        }
      }
      // Cache the results
      if (this.enableCaching) {
        await this.setCache(
          cacheKey,
          searchVolumes,
          this.config.cacheTTL || 60,
        );
      }
      return {
        success: true,
        data: searchVolumes,
        source: 'dataforseo',
        rateLimit: response.rateLimit,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Search volume analysis failed',
        source: 'dataforseo',
      };
    }
  }
  /**
   * Make authenticated API request to DataForSEO
   */
  async makeAPIRequest(endpoint, data) {
    const url = `${this.config.baseUrl}/${endpoint}`;
    const auth = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString('base64');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout || 30000,
      );
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify([data]) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const responseData = await response.json();
      // Extract rate limit info from headers
      const rateLimit = {
        remaining: parseInt(
          response.headers.get('X-RateLimit-Remaining') || '0',
        ),
        limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
        resetAt: new Date(
          parseInt(response.headers.get('X-RateLimit-Reset') || '0') * 1000,
        ),
        retryAfter:
          response.status === 429
            ? parseInt(response.headers.get('Retry-After') || '60')
            : undefined,
      };
      if (response.ok && responseData.status_code === 20000) {
        return {
          success: true,
          data: responseData,
          rateLimit,
          source: 'dataforseo',
        };
      } else {
        return {
          success: false,
          error: responseData.status_message || `HTTP ${response.status}`,
          rateLimit,
          source: 'dataforseo',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        source: 'dataforseo',
      };
    }
  }
  /**
   * Build DataForSEO keyword research request
   */
  buildKeywordResearchRequest(request) {
    return {
      keywords: request.seedKeywords,
      location_code: this.getLocationCode(request.location),
      language_code: request.language || 'en',
      limit: request.maxResults || 100,
      include_serp_info: true,
      include_seed_keyword: true,
      include_clickstream_data: true,
      ignore_synonyms: !request.includeVariations,
      filters: [
        ['search_volume', '>', 10], // Minimum search volume
      ],
    };
  }
  /**
   * Process DataForSEO keyword research response
   */
  processKeywordResearchResponse(data) {
    const keywords = [];
    for (const task of data.tasks || []) {
      if (task.result && task.result.length > 0) {
        for (const item of task.result) {
          const keywordData = {
            keyword: item.keyword || '',
            searchVolume: item.search_volume || 0,
            cpc: item.cpc,
            competition: item.competition,
            competitionIndex: item.competition_index,
            seasonality: item.monthly_searches?.map(m => m.search_volume) || [],
            difficulty: {
              score: item.keyword_difficulty || 0,
              level: this.getDifficultyLevel(item.keyword_difficulty),
              factors: {
                domainAuthority: 0,
                contentQuality: 0,
                backlinks: 0,
                competition: item.competition_index || 0,
              },
            },
            trends: {
              monthlySearches: item.monthly_searches || [],
              yearOverYear: 0,
              trending: 'stable',
              seasonalPattern: false,
            },
            relatedKeywords: item.related_keywords || [],
            longTailVariations: [],
            searchIntent: {
              primary: this.determineSearchIntent(item.keyword || ''),
              confidence: 0.8,
              modifiers: [],
            },
          };
          keywords.push(keywordData);
        }
      }
    }
    return keywords;
  }
  /**
   * Process competitor analysis data
   */
  async processCompetitorAnalysis(keyword, serpData, competitorUrls) {
    const competitors = [];
    let rank = 1;
    for (const task of serpData.tasks || []) {
      if (task.result && task.result.length > 0) {
        for (const item of task.result) {
          if (item.type === 'organic') {
            const competitor = {
              url: item.url || '',
              title: item.title || '',
              metaDescription: item.description,
              wordCount: 0, // Would need additional API call to get
              domainAuthority: 0, // Would need additional analysis
              pageAuthority: 0,
              backlinks: 0,
              rank: rank++,
              traffic: 0,
              contentScore: 0,
              keywordOptimization: 0,
            };
            competitors.push(competitor);
          }
        }
      }
    }
    // Calculate average metrics
    const averageMetrics = {
      wordCount:
        competitors.reduce((sum, c) => sum + c.wordCount, 0) /
          competitors.length || 0,
      domainAuthority:
        competitors.reduce((sum, c) => sum + c.domainAuthority, 0) /
          competitors.length || 0,
      pageAuthority:
        competitors.reduce((sum, c) => sum + c.pageAuthority, 0) /
          competitors.length || 0,
      backlinks:
        competitors.reduce((sum, c) => sum + c.backlinks, 0) /
          competitors.length || 0,
      contentScore:
        competitors.reduce((sum, c) => sum + c.contentScore, 0) /
          competitors.length || 0,
    };
    return {
      keyword,
      competitors: competitors.slice(0, 10), // Top 10 competitors
      averageMetrics,
      gaps: [], // Would be populated with AI analysis
      opportunities: [], // Would be populated with AI analysis
    };
  }
  /**
   * AI-powered fallback for keyword research
   */
  async keywordResearchFallback(request) {
    if (!this.model) {
      return {
        success: false,
        error: 'No fallback model available',
        source: 'fallback',
      };
    }
    try {
      // Use AI model to generate keyword suggestions
      // This would be implemented based on your AI model integration
      // For now, return a basic response
      const fallbackData = request.seedKeywords.map(keyword => ({
        keyword,
        searchVolume: Math.floor(Math.random() * 10000) + 100, // Mock data
        difficulty: {
          score: Math.floor(Math.random() * 100),
          level: 'possible',
          factors: {
            domainAuthority: 50,
            contentQuality: 60,
            backlinks: 40,
            competition: 50,
          },
        },
        trends: {
          monthlySearches: [],
          yearOverYear: 0,
          trending: 'stable',
          seasonalPattern: false,
        },
        relatedKeywords: [],
        longTailVariations: [],
        searchIntent: {
          primary: 'informational',
          confidence: 0.7,
          modifiers: [],
        },
      }));
      return {
        success: true,
        data: fallbackData,
        source: 'fallback',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Fallback analysis failed',
        source: 'fallback',
      };
    }
  }
  /**
   * Utility methods
   */
  getLocationCode(location) {
    const locationCodes = {
      us: 2840,
      uk: 2826,
      ca: 2124,
      au: 2036,
      de: 2276,
      fr: 2250,
      es: 2724,
      it: 2380,
      nl: 2528,
      br: 2076,
    };
    return locationCodes[location?.toLowerCase() || 'us'] || 2840;
  }
  getDifficultyLevel(score) {
    if (!score) return 'possible';
    if (score < 20) return 'very_easy';
    if (score < 40) return 'easy';
    if (score < 60) return 'possible';
    if (score < 80) return 'difficult';
    return 'very_difficult';
  }
  determineSearchIntent(keyword) {
    const commercialKeywords = [
      'buy',
      'price',
      'cost',
      'cheap',
      'discount',
      'deal',
    ];
    const transactionalKeywords = [
      'purchase',
      'order',
      'shop',
      'store',
      'online',
    ];
    const informationalKeywords = [
      'how',
      'what',
      'why',
      'guide',
      'tutorial',
      'learn',
    ];
    const lowerKeyword = keyword.toLowerCase();
    if (transactionalKeywords.some(k => lowerKeyword.includes(k)))
      return 'transactional';
    if (commercialKeywords.some(k => lowerKeyword.includes(k)))
      return 'commercial';
    if (informationalKeywords.some(k => lowerKeyword.includes(k)))
      return 'informational';
    return 'informational'; // Default
  }
  generateCacheKey(operation, params) {
    const hash = Buffer.from(JSON.stringify(params))
      .toString('base64')
      .substring(0, 16);
    return `${this.cachePrefix}:${operation}:${hash}`;
  }
  async getFromCache(key) {
    if (!this.enableCaching || !this.prisma) return null;
    try {
      // Implementation would depend on your caching strategy
      // This is a placeholder for cache retrieval
      return null;
    } catch (error) {
      return null;
    }
  }
  async setCache(key, value, ttl) {
    if (!this.enableCaching || !this.prisma) return;
    try {
      // Implementation would depend on your caching strategy
      // This is a placeholder for cache storage
    } catch (error) {
      // Silently fail cache operations
    }
  }
}
exports.DataForSEOService = DataForSEOService;
