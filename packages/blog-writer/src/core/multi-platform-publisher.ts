
/**
 * Multi-Platform Publisher Service
 * Coordinates content publishing across multiple platforms
 */

import { PrismaClient } from '../generated/prisma-client';
import { BasePlatformAdapter, platformRegistry } from './base-platform-adapter';

import type {
  MultiPlatformPublisher,
  PlatformAdapter,
  PlatformCredentials,
  MultiPlatformPublishOptions,
  MultiPlatformPublishResult,
  MultiPlatformScheduleResult,
  AggregatedAnalytics,
  ComparativeAnalytics,
  PlatformHealthReport,
  BulkPublishOptions,
  BulkPublishResult,
  PublishSchedule,
  DateRange,
  PlatformAnalytics,
  PublishResult,
  ScheduleResult,
  HealthCheckResult,
  HealthIssue,
  HealthRecommendation,
  CrossPlatformInsight,
  PlatformRecommendation,
  PlatformComparison,
  PlatformRanking,
  AnalyticsInsight,
  PublishingError,
  AuthenticationError,
  ContentValidationError,
  RateLimitError
} from '../types/platform-integration';
import type { BlogPost } from '../types/blog-post';

export interface MultiPlatformPublisherConfig {
  prisma?: PrismaClient;
  defaultRetryAttempts?: number;
  defaultRetryDelay?: number;
  maxConcurrentPublishes?: number;
  enableAnalytics?: boolean;
  enableHealthMonitoring?: boolean;
}

/**
 * Multi-Platform Publisher Implementation
 * Manages content distribution across multiple platforms
 */
export class MultiPlatformPublisherService implements MultiPlatformPublisher {
  private adapters = new Map<string, BasePlatformAdapter>();
  private connectionStatus = new Map<string, boolean>();
  private lastHealthCheck = new Map<string, HealthCheckResult>();
  private publishHistory: Array<{
    timestamp: Date;
    platform: string;
    success: boolean;
    contentId: string;
  }> = [];
  
  constructor(
    private config: MultiPlatformPublisherConfig = {},
    private prisma?: PrismaClient
  ) {
    this.prisma = config.prisma || this.prisma;
    
    if (config.enableHealthMonitoring) {
      // Start health monitoring
      this.startHealthMonitoring();
    }
  }
  
  // ===== PLATFORM MANAGEMENT =====
  
  public async addPlatform(adapter: PlatformAdapter, credentials: PlatformCredentials): Promise<void> {
    try {
      // Authenticate the adapter
      const authResult = await adapter.authenticate(credentials);
      
      if (!authResult.success) {
        throw new AuthenticationError(adapter.name, authResult.error || 'Authentication failed');
      }
      
      // Store the adapter
      this.adapters.set(adapter.name, adapter as BasePlatformAdapter);
      this.connectionStatus.set(adapter.name, true);
      
      // Store connection in database if available
      if (this.prisma) {
        await this.storePlatformConnection(adapter, credentials, authResult);
      }
      
      console.log(`Successfully added platform: ${adapter.displayName}`);
      
    } catch (error) {
      console.error(`Failed to add platform ${adapter.name}:`, error.message);
      throw error;
    }
  }
  
  public async removePlatform(platformName: string): Promise<void> {
    const adapter = this.adapters.get(platformName);
    
    if (adapter) {
      // Disconnect the adapter
      await adapter.disconnect();
      
      // Remove from internal storage
      this.adapters.delete(platformName);
      this.connectionStatus.delete(platformName);
      this.lastHealthCheck.delete(platformName);
      
      // Update database if available
      if (this.prisma) {
        await this.removePlatformConnection(platformName);
      }
      
      console.log(`Removed platform: ${platformName}`);
    }
  }
  
  public getPlatforms(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  public getPlatform(name: string): BasePlatformAdapter | undefined {
    return this.adapters.get(name);
  }
  
  public getConnectedPlatforms(): string[] {
    return Array.from(this.connectionStatus.entries())
      .filter(([, isConnected]) => isConnected)
      .map(([name]) => name);
  }
  
  // ===== CROSS-PLATFORM PUBLISHING =====
  
  public async publishToAll(
    content: BlogPost, 
    platforms?: string[], 
    options?: MultiPlatformPublishOptions
  ): Promise<MultiPlatformPublishResult> {
    const targetPlatforms = platforms || this.getConnectedPlatforms();
    
    return this.publishToSelected(content, targetPlatforms, options);
  }
  
  public async publishToSelected(
    content: BlogPost, 
    platforms: string[], 
    options?: MultiPlatformPublishOptions
  ): Promise<MultiPlatformPublishResult> {
    const startTime = Date.now();
    const results: Record<string, PublishResult> = {};
    const errors: Record<string, string> = {};
    let successCount = 0;
    let failureCount = 0;
    
    // Validate platforms
    const validPlatforms = platforms.filter(name => {
      if (!this.adapters.has(name)) {
        errors[name] = `Platform ${name} not found or not connected`;
        failureCount++;
        return false;
      }
      return true;
    });
    
    if (validPlatforms.length === 0) {
      return {
        success: false,
        results: {},
        errors,
        successCount: 0,
        failureCount: platforms.length,
        totalDuration: (Date.now() - startTime) / 1000
      };
    }
    
    // Store publish session in database
    let publishSessions: string[] = [];
    if (this.prisma) {
      publishSessions = await this.createPublishSessions(content.id, validPlatforms, options);
    }
    
    // Determine publishing order
    const publishOrder = options?.publishOrder || validPlatforms;
    const orderedPlatforms = this.orderPlatforms(validPlatforms, publishOrder);
    
    // Execute publishing
    if (options?.requireAllSuccess) {
      // All-or-nothing approach
      return this.publishAllOrNothing(content, orderedPlatforms, options, results, errors);
    } else {
      // Best effort approach
      return this.publishBestEffort(content, orderedPlatforms, options, results, errors, publishSessions);
    }
  }
  
  private async publishBestEffort(
    content: BlogPost,
    platforms: string[],
    options?: MultiPlatformPublishOptions,
    results: Record<string, PublishResult> = {},
    errors: Record<string, string> = {},
    publishSessions: string[] = []
  ): Promise<MultiPlatformPublishResult> {
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    
    // Execute publishing in parallel or sequentially
    const maxConcurrent = this.config.maxConcurrentPublishes || 3;
    const batches = this.createBatches(platforms, maxConcurrent);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (platformName) => {
        try {
          const result = await this.publishToPlatform(content, platformName, options);
          results[platformName] = result;
          
          if (result.success) {
            successCount++;
            this.trackPublishSuccess(platformName, content.id);
          } else {
            failureCount++;
            errors[platformName] = result.error || 'Unknown error';
            this.trackPublishFailure(platformName, content.id, result.error);
          }
          
          // Update database
          if (this.prisma && publishSessions.length > 0) {
            await this.updatePublishSession(publishSessions[0], platformName, result);
          }
          
        } catch (error) {
          failureCount++;
          errors[platformName] = error.message;
          results[platformName] = { success: false, error: error.message };
          this.trackPublishFailure(platformName, content.id, error.message);
          
          // Stop on first failure if configured
          if (options?.stopOnFirstFailure) {
            throw error;
          }
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Add delay between batches if configured
      if (options?.platformSpecificOptions?.delayBetweenBatches) {
        await this.delay(options.platformSpecificOptions.delayBetweenBatches as number);
      }
    }
    
    const totalDuration = (Date.now() - startTime) / 1000;
    
    return {
      success: successCount > 0,
      results,
      errors,
      successCount,
      failureCount,
      totalDuration
    };
  }
  
  private async publishAllOrNothing(
    content: BlogPost,
    platforms: string[],
    options?: MultiPlatformPublishOptions,
    results: Record<string, PublishResult> = {},
    errors: Record<string, string> = {}
  ): Promise<MultiPlatformPublishResult> {
    const startTime = Date.now();
    const publishedPlatforms: string[] = [];
    
    try {
      // Try to publish to all platforms
      for (const platformName of platforms) {
        const result = await this.publishToPlatform(content, platformName, options);
        results[platformName] = result;
        
        if (result.success) {
          publishedPlatforms.push(platformName);
          this.trackPublishSuccess(platformName, content.id);
        } else {
          errors[platformName] = result.error || 'Unknown error';
          throw new PublishingError(platformName, result.error || 'Publishing failed');
        }
      }
      
      return {
        success: true,
        results,
        errors,
        successCount: platforms.length,
        failureCount: 0,
        totalDuration: (Date.now() - startTime) / 1000
      };
      
    } catch (error) {
      // Rollback published content
      console.warn(`Rolling back published content due to failure on ${error.platform}`);
      await this.rollbackPublishedContent(content, publishedPlatforms);
      
      return {
        success: false,
        results,
        errors: { ...errors, [error.platform]: error.message },
        successCount: 0,
        failureCount: platforms.length,
        totalDuration: (Date.now() - startTime) / 1000
      };
    }
  }
  
  private async publishToPlatform(
    content: BlogPost, 
    platformName: string, 
    options?: MultiPlatformPublishOptions
  ): Promise<PublishResult> {
    const adapter = this.adapters.get(platformName);
    
    if (!adapter) {
      throw new Error(`Platform ${platformName} not found`);
    }
    
    // Get platform-specific options
    const platformOptions = options?.platformSpecificOptions?.[platformName] || options;
    
    // Format content for this platform
    const formatOptions = options?.adaptContentPerPlatform 
      ? options.adaptationRules?.[platformName]
      : undefined;
      
    const formattedContent = await adapter.formatContent(content, formatOptions);
    
    // Publish to platform
    return adapter.publish(formattedContent, platformOptions);
  }
  
  // ===== SCHEDULING =====
  
  public async scheduleAcrossPlatforms(
    content: BlogPost, 
    schedule: PublishSchedule
  ): Promise<MultiPlatformScheduleResult> {
    const results: Record<string, ScheduleResult> = {};
    const errors: Record<string, string> = {};
    
    for (const platformName of schedule.platforms) {
      const adapter = this.adapters.get(platformName);
      
      if (!adapter) {
        errors[platformName] = `Platform ${platformName} not found`;
        continue;
      }
      
      try {
        const formattedContent = await adapter.formatContent(content);
        const result = await adapter.schedule(formattedContent, schedule.scheduledTime);
        results[platformName] = result;
        
        if (!result.success) {
          errors[platformName] = result.error || 'Scheduling failed';
        }
        
      } catch (error) {
        errors[platformName] = error.message;
        results[platformName] = {
          success: false,
          scheduledTime: schedule.scheduledTime,
          error: error.message
        };
      }
    }
    
    const successCount = Object.values(results).filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      scheduleResults: results,
      errors
    };
  }
  
  // ===== ANALYTICS AGGREGATION =====
  
  public async getAggregatedAnalytics(
    platforms?: string[], 
    timeRange?: DateRange
  ): Promise<AggregatedAnalytics> {
    const targetPlatforms = platforms || this.getConnectedPlatforms();
    const defaultTimeRange = timeRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date()
    };
    
    const platformBreakdown: Record<string, PlatformAnalytics> = {};
    const platformData: PlatformAnalytics[] = [];
    
    // Collect analytics from all platforms
    for (const platformName of targetPlatforms) {
      const adapter = this.adapters.get(platformName);
      
      if (!adapter || !adapter.capabilities.supportsAnalytics) {
        continue;
      }
      
      try {
        const analytics = await adapter.getAnalytics(defaultTimeRange);
        platformBreakdown[platformName] = analytics;
        platformData.push(analytics);
      } catch (error) {
        console.warn(`Failed to get analytics for ${platformName}:`, error.message);
      }
    }
    
    // Aggregate metrics
    const aggregated = this.aggregateMetrics(platformData, targetPlatforms, defaultTimeRange);
    
    // Generate insights and recommendations
    const insights = this.generateCrossPlatformInsights(platformData);
    const recommendations = this.generatePlatformRecommendations(platformData);
    const topPlatform = this.findTopPerformingPlatform(platformData);
    
    return {
      platforms: targetPlatforms,
      timeRange: defaultTimeRange,
      ...aggregated,
      platformBreakdown,
      crossPlatformInsights: insights,
      topPerformingPlatform: topPlatform,
      recommendations
    };
  }
  
  public async getComparativeAnalytics(
    platforms: string[], 
    timeRange: DateRange
  ): Promise<ComparativeAnalytics> {
    const platformAnalytics: PlatformAnalytics[] = [];
    
    // Collect analytics data
    for (const platformName of platforms) {
      const adapter = this.adapters.get(platformName);
      
      if (adapter && adapter.capabilities.supportsAnalytics) {
        try {
          const analytics = await adapter.getAnalytics(timeRange);
          platformAnalytics.push(analytics);
        } catch (error) {
          console.warn(`Failed to get analytics for ${platformName}:`, error.message);
        }
      }
    }
    
    // Generate comparisons
    const comparisons = this.generatePlatformComparisons(platformAnalytics);
    const rankings = this.generatePlatformRankings(platformAnalytics);
    const insights = this.generateAnalyticsInsights(platformAnalytics);
    const winners = this.determineWinnerByMetric(platformAnalytics);
    
    return {
      platforms,
      timeRange,
      comparisons,
      rankings,
      insights,
      winnerByMetric: winners
    };
  }
  
  // ===== BULK OPERATIONS =====
  
  public async bulkPublish(
    contents: BlogPost[], 
    platforms: string[], 
    options?: BulkPublishOptions
  ): Promise<BulkPublishResult> {
    const startTime = Date.now();
    const results: PublishResult[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    const batchSize = options?.batchSize || 5;
    const batches = this.createContentBatches(contents, batchSize);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (content) => {
        try {
          const result = await this.publishToSelected(content, platforms, options);
          
          // Convert MultiPlatformPublishResult to individual PublishResults
          for (const [platform, publishResult] of Object.entries(result.results)) {
            results.push(publishResult);
            if (publishResult.success) {
              successCount++;
            } else {
              failureCount++;
              if (publishResult.error) {
                errors.push(`${platform}: ${publishResult.error}`);
              }
            }
          }
          
        } catch (error) {
          failureCount++;
          errors.push(error.message);
          
          if (options?.stopOnError) {
            throw error;
          }
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Add delay between batches
      if (options?.delayBetweenPublishes && batches.indexOf(batch) < batches.length - 1) {
        await this.delay(options.delayBetweenPublishes);
      }
    }
    
    return {
      totalItems: contents.length * platforms.length,
      successCount,
      failureCount,
      results,
      errors,
      duration: (Date.now() - startTime) / 1000
    };
  }
  
  // ===== HEALTH MONITORING =====
  
  public async checkPlatformHealth(): Promise<PlatformHealthReport> {
    const platformHealth: Record<string, HealthCheckResult> = {};
    const issues: HealthIssue[] = [];
    const recommendations: HealthRecommendation[] = [];
    
    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    for (const [platformName, adapter] of this.adapters.entries()) {
      try {
        const health = await adapter.healthCheck();
        platformHealth[platformName] = health;
        this.lastHealthCheck.set(platformName, health);
        
        // Collect issues
        if (health.errors.length > 0) {
          health.errors.forEach(error => {
            issues.push({
              platform: platformName,
              severity: 'error',
              message: error,
              since: health.lastChecked
            });
          });
        }
        
        if (health.warnings.length > 0) {
          health.warnings.forEach(warning => {
            issues.push({
              platform: platformName,
              severity: 'warning',
              message: warning,
              since: health.lastChecked
            });
          });
        }
        
        // Update overall health status
        if (health.status === 'unhealthy') {
          overallHealth = 'critical';
        } else if (health.status === 'degraded' && overallHealth !== 'critical') {
          overallHealth = 'degraded';
        }
        
      } catch (error) {
        platformHealth[platformName] = {
          status: 'unhealthy',
          responseTime: -1,
          errors: [error.message],
          warnings: [],
          lastChecked: new Date()
        };
        
        issues.push({
          platform: platformName,
          severity: 'critical',
          message: `Health check failed: ${error.message}`,
          since: new Date()
        });
        
        overallHealth = 'critical';
      }
    }
    
    // Generate recommendations
    recommendations.push(...this.generateHealthRecommendations(issues, platformHealth));
    
    return {
      overall: overallHealth,
      platforms: platformHealth,
      issues,
      recommendations
    };
  }
  
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    setInterval(async () => {
      try {
        await this.checkPlatformHealth();
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 5 * 60 * 1000);
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private orderPlatforms(platforms: string[], publishOrder?: string[]): string[] {
    if (!publishOrder) return platforms;
    
    const ordered: string[] = [];
    const remaining = [...platforms];
    
    // Add platforms in specified order
    for (const platform of publishOrder) {
      if (remaining.includes(platform)) {
        ordered.push(platform);
        remaining.splice(remaining.indexOf(platform), 1);
      }
    }
    
    // Add any remaining platforms
    ordered.push(...remaining);
    
    return ordered;
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  private createContentBatches(contents: BlogPost[], batchSize: number): BlogPost[][] {
    return this.createBatches(contents, batchSize);
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private trackPublishSuccess(platform: string, contentId: string): void {
    this.publishHistory.push({
      timestamp: new Date(),
      platform,
      success: true,
      contentId
    });
    
    // Keep only recent history (last 1000 entries)
    if (this.publishHistory.length > 1000) {
      this.publishHistory = this.publishHistory.slice(-1000);
    }
  }
  
  private trackPublishFailure(platform: string, contentId: string, error?: string): void {
    this.publishHistory.push({
      timestamp: new Date(),
      platform,
      success: false,
      contentId
    });
    
    console.warn(`Publish failed for ${platform}:`, error);
  }
  
  private async rollbackPublishedContent(content: BlogPost, platforms: string[]): Promise<void> {
    console.log(`Rolling back content from ${platforms.length} platforms...`);
    
    const rollbackPromises = platforms.map(async (platformName) => {
      const adapter = this.adapters.get(platformName);
      
      if (adapter && adapter.capabilities.supportsDeleting) {
        try {
          // This would require storing the external ID from the publish result
          // For now, we'll just log the intention
          console.log(`Would rollback content from ${platformName}`);
        } catch (error) {
          console.error(`Failed to rollback from ${platformName}:`, error);
        }
      }
    });
    
    await Promise.allSettled(rollbackPromises);
  }
  
  // ===== ANALYTICS HELPER METHODS =====
  
  private aggregateMetrics(
    platformData: PlatformAnalytics[], 
    platforms: string[], 
    timeRange: DateRange
  ) {
    const totals = platformData.reduce((acc, analytics) => ({
      totalViews: acc.totalViews + analytics.pageViews,
      totalEngagements: acc.totalEngagements + analytics.totalEngagements,
      totalShares: acc.totalShares + analytics.shares,
      totalConversions: acc.totalConversions + analytics.conversions,
      totalRevenue: acc.totalRevenue + (analytics.revenue || 0)
    }), {
      totalViews: 0,
      totalEngagements: 0,
      totalShares: 0,
      totalConversions: 0,
      totalRevenue: 0
    });
    
    const averages = {
      avgEngagementRate: platformData.length > 0 
        ? platformData.reduce((acc, a) => acc + a.engagementRate, 0) / platformData.length
        : 0,
      avgConversionRate: platformData.length > 0
        ? platformData.reduce((acc, a) => acc + a.conversionRate, 0) / platformData.length
        : 0,
      avgBounceRate: platformData.length > 0
        ? platformData.reduce((acc, a) => acc + a.bounceRate, 0) / platformData.length
        : 0
    };
    
    return { ...totals, ...averages };
  }
  
  private generateCrossPlatformInsights(platformData: PlatformAnalytics[]): CrossPlatformInsight[] {
    const insights: CrossPlatformInsight[] = [];
    
    // Find performance anomalies
    if (platformData.length > 1) {
      const avgEngagement = platformData.reduce((acc, p) => acc + p.engagementRate, 0) / platformData.length;
      
      platformData.forEach(platform => {
        if (platform.engagementRate > avgEngagement * 1.5) {
          insights.push({
            type: 'opportunity',
            title: `High Performance Detected`,
            description: `${platform.platformName} is performing significantly better than average`,
            platforms: [platform.platformName],
            impact: 'high',
            actionable: true,
            action: `Consider replicating ${platform.platformName} strategy on other platforms`
          });
        }
      });
    }
    
    return insights;
  }
  
  private generatePlatformRecommendations(platformData: PlatformAnalytics[]): PlatformRecommendation[] {
    const recommendations: PlatformRecommendation[] = [];
    
    platformData.forEach(platform => {
      if (platform.engagementRate < 0.02) { // Less than 2% engagement
        recommendations.push({
          platform: platform.platformName,
          type: 'content',
          recommendation: 'Focus on creating more engaging content to improve interaction rates',
          expectedImpact: 'Increase engagement by 50-100%',
          effort: 'medium',
          priority: 7
        });
      }
      
      if (platform.bounceRate > 0.7) { // High bounce rate
        recommendations.push({
          platform: platform.platformName,
          type: 'content',
          recommendation: 'Improve content quality and relevance to reduce bounce rate',
          expectedImpact: 'Reduce bounce rate by 20-30%',
          effort: 'high',
          priority: 8
        });
      }
    });
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
  
  private findTopPerformingPlatform(platformData: PlatformAnalytics[]): string {
    if (platformData.length === 0) return '';
    
    return platformData.reduce((best, current) => {
      const bestScore = best.pageViews + best.totalEngagements;
      const currentScore = current.pageViews + current.totalEngagements;
      return currentScore > bestScore ? current : best;
    }).platformName;
  }
  
  private generatePlatformComparisons(platformData: PlatformAnalytics[]): PlatformComparison[] {
    const comparisons: PlatformComparison[] = [];
    const metrics = ['pageViews', 'totalEngagements', 'shares', 'conversions'];
    
    for (const metric of metrics) {
      const platformMetrics: Record<string, number> = {};
      let winner = '';
      let maxValue = 0;
      
      platformData.forEach(platform => {
        const value = (platform as any)[metric] || 0;
        platformMetrics[platform.platformName] = value;
        
        if (value > maxValue) {
          maxValue = value;
          winner = platform.platformName;
        }
      });
      
      const secondMax = Math.max(...Object.values(platformMetrics).filter(v => v !== maxValue));
      const difference = secondMax > 0 ? ((maxValue - secondMax) / secondMax) * 100 : 0;
      
      comparisons.push({
        metric,
        platforms: platformMetrics,
        winner,
        difference
      });
    }
    
    return comparisons;
  }
  
  private generatePlatformRankings(platformData: PlatformAnalytics[]): PlatformRanking[] {
    const rankings: PlatformRanking[] = [];
    const metrics = ['pageViews', 'engagementRate', 'conversionRate'];
    
    for (const metric of metrics) {
      const platformValues = platformData.map(p => ({
        platform: p.platformName,
        value: (p as any)[metric] || 0
      })).sort((a, b) => b.value - a.value);
      
      const rankedPlatforms = platformValues.map((p, index) => ({
        ...p,
        rank: index + 1
      }));
      
      rankings.push({
        metric,
        rankings: rankedPlatforms
      });
    }
    
    return rankings;
  }
  
  private generateAnalyticsInsights(platformData: PlatformAnalytics[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    
    // Identify top performers
    const avgEngagement = platformData.reduce((acc, p) => acc + p.engagementRate, 0) / platformData.length;
    
    platformData.forEach(platform => {
      if (platform.engagementRate > avgEngagement * 1.2) {
        insights.push({
          type: 'positive',
          metric: 'engagementRate',
          platforms: [platform.platformName],
          description: `${platform.platformName} has above-average engagement rates`,
          significance: 'medium'
        });
      }
    });
    
    return insights;
  }
  
  private determineWinnerByMetric(platformData: PlatformAnalytics[]): Record<string, string> {
    const winners: Record<string, string> = {};
    const metrics = ['pageViews', 'totalEngagements', 'shares', 'conversions'];
    
    for (const metric of metrics) {
      let winner = '';
      let maxValue = 0;
      
      platformData.forEach(platform => {
        const value = (platform as any)[metric] || 0;
        if (value > maxValue) {
          maxValue = value;
          winner = platform.platformName;
        }
      });
      
      winners[metric] = winner;
    }
    
    return winners;
  }
  
  private generateHealthRecommendations(
    issues: HealthIssue[], 
    platformHealth: Record<string, HealthCheckResult>
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];
    
    issues.forEach(issue => {
      if (issue.severity === 'error' || issue.severity === 'critical') {
        recommendations.push({
          platform: issue.platform,
          issue: issue.message,
          recommendation: 'Check platform credentials and connection status',
          urgency: 'high'
        });
      }
    });
    
    return recommendations;
  }
  
  // ===== DATABASE OPERATIONS =====
  
  private async storePlatformConnection(
    adapter: PlatformAdapter, 
    credentials: PlatformCredentials, 
    authResult: AuthenticationResult
  ): Promise<void> {
    if (!this.prisma) return;
    
    try {
      // This would interact with the database schema we defined
      // Implementation depends on specific requirements
      console.log(`Storing connection for ${adapter.name}`);
    } catch (error) {
      console.error('Failed to store platform connection:', error);
    }
  }
  
  private async removePlatformConnection(platformName: string): Promise<void> {
    if (!this.prisma) return;
    
    try {
      console.log(`Removing connection for ${platformName}`);
    } catch (error) {
      console.error('Failed to remove platform connection:', error);
    }
  }
  
  private async createPublishSessions(
    contentId: string, 
    platforms: string[], 
    options?: MultiPlatformPublishOptions
  ): Promise<string[]> {
    if (!this.prisma) return [];
    
    const sessions: string[] = [];
    
    try {
      // Create publish session records
      // Implementation would depend on the exact database schema
      console.log(`Creating publish sessions for content ${contentId}`);
    } catch (error) {
      console.error('Failed to create publish sessions:', error);
    }
    
    return sessions;
  }
  
  private async updatePublishSession(
    sessionId: string, 
    platform: string, 
    result: PublishResult
  ): Promise<void> {
    if (!this.prisma) return;
    
    try {
      console.log(`Updating publish session ${sessionId} for ${platform}`);
    } catch (error) {
      console.error('Failed to update publish session:', error);
    }
  }
}

// Export factory function
export function createMultiPlatformPublisher(
  config?: MultiPlatformPublisherConfig
): MultiPlatformPublisherService {
  return new MultiPlatformPublisherService(config);
}

// Export utility functions
export function createPlatformAdapter(name: string, config?: any): BasePlatformAdapter {
  return platformRegistry.create(name, config);
}
