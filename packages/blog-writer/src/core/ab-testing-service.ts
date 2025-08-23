
/**
 * Week 11-12 A/B Testing Service
 * Comprehensive A/B testing framework for headlines, content variations,
 * statistical significance analysis, and automated optimization
 */

import {
  ABTestConfig,
  ABTestRequest,
  ABTestResponse,
  ContentVariant,
  ABTestResult,
  VariantResult,
  TestRecommendation,
  ABTestStatus,
  SuccessMetric,
  PerformanceOptimizationError
} from '../types/performance-optimization';
import { PrismaClient } from '../generated/prisma-client';

export class ABTestingService {
  private prisma: PrismaClient;
  private runningTests: Map<string, TestRunner> = new Map();
  private statisticalAnalyzer: StatisticalAnalyzer;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.statisticalAnalyzer = new StatisticalAnalyzer();
    this.initializeTestMonitoring();
  }

  /**
   * Create and configure a new A/B test
   */
  public async createABTest(request: ABTestRequest): Promise<ABTestResponse> {
    try {
      const { testConfig, autoStart = false } = request;

      // Validate test configuration
      await this.validateTestConfig(testConfig);

      // Save test to database
      const test = await this.prisma.aBTest.create({
        data: {
          testName: testConfig.testName,
          description: testConfig.description,
          blogPostId: testConfig.blogPostId,
          trafficSplit: testConfig.trafficSplit,
          duration: testConfig.duration,
          primaryMetric: testConfig.primaryMetric,
          successMetrics: testConfig.successMetrics,
          significanceLevel: testConfig.significanceLevel,
          minimumSampleSize: testConfig.minimumSampleSize,
          minimumDetectableEffect: testConfig.minimumDetectableEffect,
          targetingRules: testConfig.targeting ? JSON.stringify(testConfig.targeting) : null,
          excludeReturning: testConfig.excludeReturningVisitors || false,
          deviceRestrictions: testConfig.deviceRestrictions ? JSON.stringify(testConfig.deviceRestrictions) : null,
          geoRestrictions: testConfig.geographicRestrictions ? JSON.stringify(testConfig.geographicRestrictions) : null,
          status: autoStart ? 'running' : 'draft',
          startDate: autoStart ? new Date() : testConfig.startDate,
          endDate: testConfig.startDate ? new Date(testConfig.startDate.getTime() + testConfig.duration * 24 * 60 * 60 * 1000) : undefined,
          createdBy: 'system' // Replace with actual user ID
        }
      });

      // Create test variants
      for (const variant of testConfig.variants) {
        await this.prisma.aBTestVariant.create({
          data: {
            abTestId: test.id,
            variantName: variant.name,
            description: variant.description,
            isControl: variant.isControl,
            trafficAllocation: variant.trafficAllocation,
            headline: variant.headline,
            subheadline: variant.subheadline,
            content: variant.content,
            callToAction: variant.callToAction,
            featuredImage: variant.featuredImage,
            layout: variant.layout,
            template: variant.template,
            colorScheme: variant.colorScheme ? JSON.stringify(variant.colorScheme) : null,
            seoTitle: variant.seoElements?.title,
            metaDescription: variant.seoElements?.metaDescription,
            focusKeyword: variant.seoElements?.focusKeyword,
            keywords: variant.seoElements?.keywords ? JSON.stringify(variant.seoElements.keywords) : null,
            schemaMarkup: variant.seoElements?.schema ? JSON.stringify(variant.seoElements.schema) : null,
            contentStructure: variant.contentStructure ? JSON.stringify(variant.contentStructure) : null,
            wordCount: variant.contentStructure?.wordCount,
            tone: variant.contentStructure?.tone,
            style: variant.contentStructure?.style,
            readingLevel: variant.contentStructure?.readingLevel
          }
        });
      }

      if (autoStart) {
        await this.startTest(test.id);
      }

      return {
        success: true,
        testId: test.id,
        status: test.status as ABTestStatus,
        message: `A/B test "${testConfig.testName}" created successfully${autoStart ? ' and started' : ''}`
      };

    } catch (error) {
      console.error('A/B test creation failed:', error);
      return {
        success: false,
        testId: '',
        status: 'draft',
        message: 'Failed to create A/B test',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Start a configured A/B test
   */
  public async startTest(testId: string): Promise<ABTestResponse> {
    try {
      const test = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true }
      });

      if (!test) {
        throw new PerformanceOptimizationError(
          'A/B test not found',
          'TEST_NOT_FOUND',
          'ab_testing',
          { testId }
        );
      }

      if (test.status !== 'draft' && test.status !== 'scheduled') {
        throw new PerformanceOptimizationError(
          'Test cannot be started in current status',
          'INVALID_STATUS',
          'ab_testing',
          { testId, currentStatus: test.status }
        );
      }

      // Update test status
      await this.prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'running',
          startDate: new Date(),
          endDate: new Date(Date.now() + test.duration * 24 * 60 * 60 * 1000)
        }
      });

      // Initialize test runner
      const testRunner = new TestRunner(test, test.variants);
      this.runningTests.set(testId, testRunner);

      // Set up traffic allocation
      await this.configureTrafficAllocation(testId, test.variants);

      console.log(`A/B test started: ${testId}`);

      return {
        success: true,
        testId,
        status: 'running',
        message: 'A/B test started successfully'
      };

    } catch (error) {
      console.error('Failed to start A/B test:', error);
      throw new PerformanceOptimizationError(
        'Failed to start A/B test',
        'START_TEST_FAILED',
        'ab_testing',
        { testId, error }
      );
    }
  }

  /**
   * Stop a running A/B test
   */
  public async stopTest(testId: string, reason?: string): Promise<ABTestResponse> {
    try {
      const test = await this.prisma.aBTest.findUnique({
        where: { id: testId }
      });

      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'running') {
        throw new Error('Test is not currently running');
      }

      // Stop test runner
      const testRunner = this.runningTests.get(testId);
      if (testRunner) {
        testRunner.stop();
        this.runningTests.delete(testId);
      }

      // Update test status
      await this.prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'stopped',
          actualEndDate: new Date()
        }
      });

      // Analyze final results
      const results = await this.analyzeTestResults(testId);
      
      console.log(`A/B test stopped: ${testId}. Reason: ${reason || 'Manual stop'}`);

      return {
        success: true,
        testId,
        status: 'stopped',
        message: `Test stopped successfully. ${reason ? `Reason: ${reason}` : ''}`
      };

    } catch (error) {
      throw new PerformanceOptimizationError(
        'Failed to stop A/B test',
        'STOP_TEST_FAILED',
        'ab_testing',
        { testId, reason, error }
      );
    }
  }

  /**
   * Get test results and statistical analysis
   */
  public async getTestResults(testId: string): Promise<ABTestResult> {
    try {
      const test = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          results: true
        }
      });

      if (!test) {
        throw new Error('Test not found');
      }

      return await this.analyzeTestResults(testId);

    } catch (error) {
      throw new PerformanceOptimizationError(
        'Failed to get test results',
        'RESULTS_FAILED',
        'ab_testing',
        { testId, error }
      );
    }
  }

  /**
   * Record a conversion event for A/B test tracking
   */
  public async recordConversion(
    testId: string,
    variantId: string,
    userId: string,
    conversionType: string,
    value?: number
  ): Promise<void> {
    try {
      const testRunner = this.runningTests.get(testId);
      if (testRunner) {
        await testRunner.recordConversion(variantId, userId, conversionType, value);
      }

      // Update database with conversion data
      await this.updateVariantResults(testId, variantId, {
        conversion: {
          type: conversionType,
          value: value || 1,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Failed to record conversion:', error);
      throw new PerformanceOptimizationError(
        'Failed to record conversion',
        'CONVERSION_RECORD_FAILED',
        'ab_testing',
        { testId, variantId, conversionType, error }
      );
    }
  }

  /**
   * Record visitor assignment to variant
   */
  public async recordVisitorAssignment(
    testId: string,
    variantId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const testRunner = this.runningTests.get(testId);
      if (testRunner) {
        await testRunner.assignVisitor(variantId, userId, metadata);
      }

    } catch (error) {
      console.error('Failed to record visitor assignment:', error);
      throw new PerformanceOptimizationError(
        'Failed to record visitor assignment',
        'ASSIGNMENT_RECORD_FAILED',
        'ab_testing',
        { testId, variantId, error }
      );
    }
  }

  /**
   * Get variant assignment for a user
   */
  public async getVariantAssignment(testId: string, userId: string): Promise<string | null> {
    try {
      const testRunner = this.runningTests.get(testId);
      if (testRunner) {
        return testRunner.getAssignment(userId);
      }

      // Fallback to database lookup
      const assignment = await this.getStoredAssignment(testId, userId);
      return assignment;

    } catch (error) {
      console.error('Failed to get variant assignment:', error);
      return null;
    }
  }

  /**
   * Analyze test results and determine winner
   */
  public async analyzeTestResults(testId: string): Promise<ABTestResult> {
    try {
      const test = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          results: true
        }
      });

      if (!test) {
        throw new Error('Test not found');
      }

      const variantResults = await this.calculateVariantResults(test);
      const statisticalAnalysis = await this.performStatisticalAnalysis(variantResults, test.significanceLevel);
      
      const result: ABTestResult = {
        totalParticipants: variantResults.reduce((sum, variant) => sum + variant.participants, 0),
        variantResults,
        statisticalSignificance: statisticalAnalysis.isSignificant,
        confidenceInterval: statisticalAnalysis.confidence,
        pValue: statisticalAnalysis.pValue,
        effectSize: statisticalAnalysis.effectSize,
        recommendation: this.generateRecommendation(variantResults, statisticalAnalysis),
        nextSteps: this.generateNextSteps(variantResults, statisticalAnalysis)
      };

      // Update test with results
      await this.prisma.aBTest.update({
        where: { id: testId },
        data: {
          totalParticipants: result.totalParticipants,
          statisticalSignificance: result.statisticalSignificance,
          confidence: result.confidenceInterval,
          pValue: result.pValue,
          effectSize: result.effectSize,
          winner: this.determineWinner(result)
        }
      });

      return result;

    } catch (error) {
      throw new PerformanceOptimizationError(
        'Failed to analyze test results',
        'ANALYSIS_FAILED',
        'ab_testing',
        { testId, error }
      );
    }
  }

  /**
   * Generate optimization recommendations based on test results
   */
  public async generateOptimizationRecommendations(testId: string): Promise<any[]> {
    try {
      const results = await this.analyzeTestResults(testId);
      const test = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true }
      });

      if (!test) {
        throw new Error('Test not found');
      }

      const recommendations = [];

      // Winner implementation recommendation
      if (results.statisticalSignificance && results.recommendation === 'implement_winner') {
        const winner = this.findWinnerVariant(results.variantResults);
        if (winner) {
          recommendations.push({
            type: 'implement_winner',
            title: `Implement Winning Variant: ${winner.variantId}`,
            description: `The winning variant shows a ${winner.improvement?.toFixed(2)}% improvement in ${test.primaryMetric}`,
            priority: 'high',
            confidence: results.confidenceInterval,
            expectedImpact: winner.improvementPercentage || 0
          });
        }
      }

      // Insights from losing variants
      for (const variant of results.variantResults) {
        if (variant.improvement && variant.improvement < 0) {
          recommendations.push({
            type: 'avoid_pattern',
            title: `Avoid Pattern from ${variant.variantId}`,
            description: `This variant performed ${Math.abs(variant.improvement).toFixed(2)}% worse`,
            priority: 'medium',
            confidence: 0.8
          });
        }
      }

      // Further testing recommendations
      if (results.recommendation === 'continue_testing') {
        recommendations.push({
          type: 'extend_test',
          title: 'Extend Test Duration',
          description: 'Current results are inconclusive. Consider extending the test duration or increasing sample size.',
          priority: 'medium',
          confidence: 0.6
        });
      }

      return recommendations;

    } catch (error) {
      throw new PerformanceOptimizationError(
        'Failed to generate optimization recommendations',
        'RECOMMENDATIONS_FAILED',
        'ab_testing',
        { testId, error }
      );
    }
  }

  /**
   * Create multivariate test (multiple factors)
   */
  public async createMultivariateTest(
    testName: string,
    factors: MultivariateTestFactor[],
    config: Partial<ABTestConfig>
  ): Promise<ABTestResponse> {
    try {
      // Generate all combinations of factors
      const variants = this.generateMultivariateVariants(factors);

      // Create test configuration
      const testConfig: ABTestConfig = {
        testName,
        description: `Multivariate test with ${factors.length} factors`,
        variants,
        trafficSplit: this.calculateEqualTrafficSplit(variants.length),
        duration: config.duration || 14,
        successMetrics: config.successMetrics || [
          { name: 'conversion_rate', type: 'conversion_rate', goal: 0.1, direction: 'increase', weight: 1 }
        ],
        primaryMetric: config.primaryMetric || 'conversion_rate',
        significanceLevel: config.significanceLevel || 0.05,
        minimumSampleSize: config.minimumSampleSize || 1000,
        minimumDetectableEffect: config.minimumDetectableEffect || 0.05,
        status: 'draft',
        startDate: config.startDate || new Date(),
        createdBy: 'system'
      };

      return await this.createABTest({ testConfig });

    } catch (error) {
      throw new PerformanceOptimizationError(
        'Failed to create multivariate test',
        'MULTIVARIATE_CREATION_FAILED',
        'ab_testing',
        { testName, factors, error }
      );
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Validate test configuration
   */
  private async validateTestConfig(config: ABTestConfig): Promise<void> {
    // Validate traffic split
    const totalTrafficSplit = config.trafficSplit.reduce((sum, split) => sum + split, 0);
    if (Math.abs(totalTrafficSplit - 100) > 0.01) {
      throw new Error('Traffic split must sum to 100%');
    }

    // Validate variants
    if (config.variants.length !== config.trafficSplit.length) {
      throw new Error('Number of variants must match traffic split array length');
    }

    // Ensure one control variant
    const controlVariants = config.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one variant must be marked as control');
    }

    // Validate sample size
    if (config.minimumSampleSize < 100) {
      throw new Error('Minimum sample size must be at least 100');
    }

    // Validate duration
    if (config.duration < 1 || config.duration > 90) {
      throw new Error('Test duration must be between 1 and 90 days');
    }
  }

  /**
   * Configure traffic allocation for test variants
   */
  private async configureTrafficAllocation(testId: string, variants: any[]): Promise<void> {
    // Implementation would set up traffic routing logic
    // This could integrate with CDN, load balancer, or application-level routing
    console.log(`Configured traffic allocation for test ${testId} with ${variants.length} variants`);
  }

  /**
   * Initialize test monitoring and automated checks
   */
  private initializeTestMonitoring(): void {
    // Set up periodic checks for running tests
    setInterval(async () => {
      await this.monitorRunningTests();
    }, 300000); // Every 5 minutes

    // Set up daily analysis for all running tests
    setInterval(async () => {
      await this.performDailyAnalysis();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Monitor running tests for automatic stopping conditions
   */
  private async monitorRunningTests(): Promise<void> {
    const runningTestIds = Array.from(this.runningTests.keys());
    
    for (const testId of runningTestIds) {
      try {
        const test = await this.prisma.aBTest.findUnique({
          where: { id: testId }
        });

        if (!test || test.status !== 'running') {
          continue;
        }

        // Check if test should end due to time
        if (test.endDate && new Date() > test.endDate) {
          await this.stopTest(testId, 'Test duration completed');
          continue;
        }

        // Check for early stopping conditions
        const results = await this.analyzeTestResults(testId);
        
        if (results.statisticalSignificance && results.confidenceInterval >= 95) {
          // Auto-stop if we have statistical significance with high confidence
          await this.stopTest(testId, 'Statistical significance achieved');
        }

      } catch (error) {
        console.error(`Monitoring failed for test ${testId}:`, error);
      }
    }
  }

  /**
   * Perform daily analysis of all running tests
   */
  private async performDailyAnalysis(): Promise<void> {
    const runningTests = await this.prisma.aBTest.findMany({
      where: { status: 'running' }
    });

    for (const test of runningTests) {
      try {
        await this.analyzeTestResults(test.id);
      } catch (error) {
        console.error(`Daily analysis failed for test ${test.id}:`, error);
      }
    }
  }

  /**
   * Calculate variant results from raw data
   */
  private async calculateVariantResults(test: any): Promise<VariantResult[]> {
    const results: VariantResult[] = [];

    for (const variant of test.variants) {
      const storedResult = await this.prisma.aBTestResult.findUnique({
        where: {
          abTestId_variantId: {
            abTestId: test.id,
            variantId: variant.id
          }
        }
      });

      if (storedResult) {
        results.push({
          variantId: variant.id,
          participants: storedResult.participants,
          conversionRate: storedResult.conversionRate,
          metrics: JSON.parse(storedResult.metricResults as string),
          confidenceInterval: JSON.parse(storedResult.confidenceInterval as string) as [number, number],
          standardError: storedResult.standardError || 0,
          zScore: storedResult.zScore,
          improvement: storedResult.improvement,
          improvementPercentage: storedResult.improvementPercent,
          significance: storedResult.significance
        });
      }
    }

    return results;
  }

  /**
   * Perform statistical analysis on variant results
   */
  private async performStatisticalAnalysis(
    results: VariantResult[],
    significanceLevel: number
  ): Promise<StatisticalAnalysis> {
    return this.statisticalAnalyzer.analyze(results, significanceLevel);
  }

  /**
   * Generate recommendation based on test results
   */
  private generateRecommendation(
    results: VariantResult[],
    analysis: StatisticalAnalysis
  ): TestRecommendation {
    if (analysis.isSignificant && analysis.confidence >= 95) {
      return 'implement_winner';
    } else if (analysis.confidence >= 80) {
      return 'continue_testing';
    } else if (results.length > 0 && results[0].participants < 100) {
      return 'continue_testing';
    } else {
      return 'inconclusive';
    }
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(
    results: VariantResult[],
    analysis: StatisticalAnalysis
  ): string[] {
    const steps: string[] = [];

    if (analysis.isSignificant) {
      steps.push('Implement the winning variant');
      steps.push('Monitor performance after implementation');
    } else {
      steps.push('Continue test to gather more data');
      steps.push('Consider extending test duration or increasing traffic');
    }

    if (analysis.effectSize < 0.02) {
      steps.push('Consider testing more dramatic variations');
    }

    return steps;
  }

  /**
   * Determine the winning variant
   */
  private determineWinner(result: ABTestResult): string | null {
    if (!result.statisticalSignificance) {
      return null;
    }

    const bestVariant = result.variantResults.reduce((best, current) => {
      return (current.improvement || 0) > (best.improvement || 0) ? current : best;
    });

    return bestVariant.variantId;
  }

  /**
   * Find the winning variant from results
   */
  private findWinnerVariant(results: VariantResult[]): VariantResult | null {
    return results.reduce((best, current) => {
      if (!best) return current;
      return (current.improvement || 0) > (best.improvement || 0) ? current : best;
    }, null as VariantResult | null);
  }

  /**
   * Generate multivariate test variants from factors
   */
  private generateMultivariateVariants(factors: MultivariateTestFactor[]): ContentVariant[] {
    const combinations = this.generateCombinations(factors);
    
    return combinations.map((combo, index) => ({
      id: `variant_${index}`,
      name: `Variant ${index + 1}`,
      description: this.describeVariantCombination(combo),
      isControl: index === 0, // First combination is control
      trafficAllocation: 0, // Will be calculated later
      ...this.combineFactors(combo)
    }));
  }

  /**
   * Generate all combinations of multivariate factors
   */
  private generateCombinations(factors: MultivariateTestFactor[]): any[] {
    if (factors.length === 0) return [{}];
    
    const [first, ...rest] = factors;
    const restCombinations = this.generateCombinations(rest);
    
    const combinations: any[] = [];
    
    for (const value of first.values) {
      for (const restCombo of restCombinations) {
        combinations.push({
          [first.name]: value,
          ...restCombo
        });
      }
    }
    
    return combinations;
  }

  /**
   * Calculate equal traffic split for variants
   */
  private calculateEqualTrafficSplit(numVariants: number): number[] {
    const splitPercentage = 100 / numVariants;
    return Array(numVariants).fill(splitPercentage);
  }

  /**
   * Update variant results in database
   */
  private async updateVariantResults(
    testId: string,
    variantId: string,
    data: any
  ): Promise<void> {
    await this.prisma.aBTestResult.upsert({
      where: {
        abTestId_variantId: {
          abTestId: testId,
          variantId
        }
      },
      update: {
        // Update logic based on data
        recordedAt: new Date()
      },
      create: {
        abTestId: testId,
        variantId,
        participants: 0,
        conversionRate: 0,
        metricResults: JSON.stringify({}),
        confidenceInterval: JSON.stringify([0, 0]),
        significance: false
      }
    });
  }

  /**
   * Get stored assignment from database
   */
  private async getStoredAssignment(testId: string, userId: string): Promise<string | null> {
    // Implementation would look up stored user assignments
    // This is a mock implementation
    return null;
  }

  /**
   * Describe variant combination for multivariate tests
   */
  private describeVariantCombination(combo: any): string {
    return Object.entries(combo)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  /**
   * Combine factor values into variant properties
   */
  private combineFactors(combo: any): Partial<ContentVariant> {
    const variant: Partial<ContentVariant> = {};
    
    // Map factor combinations to variant properties
    if (combo.headline) variant.headline = combo.headline;
    if (combo.callToAction) variant.callToAction = combo.callToAction;
    if (combo.color) {
      variant.colorScheme = { primary: combo.color };
    }
    
    return variant;
  }
}

// ===== SUPPORTING CLASSES =====

class TestRunner {
  private test: any;
  private variants: any[];
  private assignments: Map<string, string> = new Map();
  private conversions: Map<string, any[]> = new Map();
  private isRunning: boolean = true;

  constructor(test: any, variants: any[]) {
    this.test = test;
    this.variants = variants;
  }

  async assignVisitor(variantId: string, userId: string, metadata?: any): Promise<void> {
    if (!this.isRunning) return;
    
    this.assignments.set(userId, variantId);
    // Implementation would persist assignment
  }

  async recordConversion(
    variantId: string,
    userId: string,
    conversionType: string,
    value?: number
  ): Promise<void> {
    if (!this.isRunning) return;
    
    const conversions = this.conversions.get(variantId) || [];
    conversions.push({
      userId,
      type: conversionType,
      value: value || 1,
      timestamp: new Date()
    });
    this.conversions.set(variantId, conversions);
  }

  getAssignment(userId: string): string | null {
    return this.assignments.get(userId) || null;
  }

  stop(): void {
    this.isRunning = false;
  }
}

class StatisticalAnalyzer {
  async analyze(results: VariantResult[], significanceLevel: number): Promise<StatisticalAnalysis> {
    const controlVariant = results.find(r => r.variantId.includes('control')) || results[0];
    
    let maxImprovement = 0;
    let isSignificant = false;
    let pValue = 1;
    let effectSize = 0;
    
    for (const variant of results) {
      if (variant.variantId === controlVariant.variantId) continue;
      
      // Calculate statistical significance using z-test
      const zScore = this.calculateZScore(controlVariant, variant);
      const currentPValue = this.calculatePValue(zScore);
      
      if (currentPValue < significanceLevel) {
        isSignificant = true;
        if (currentPValue < pValue) {
          pValue = currentPValue;
        }
      }
      
      const improvement = variant.improvement || 0;
      if (Math.abs(improvement) > Math.abs(maxImprovement)) {
        maxImprovement = improvement;
        effectSize = this.calculateEffectSize(controlVariant, variant);
      }
    }
    
    return {
      isSignificant,
      confidence: (1 - pValue) * 100,
      pValue,
      effectSize,
      maxImprovement
    };
  }

  private calculateZScore(control: VariantResult, variant: VariantResult): number {
    const p1 = control.conversionRate;
    const p2 = variant.conversionRate;
    const n1 = control.participants;
    const n2 = variant.participants;
    
    if (n1 === 0 || n2 === 0) return 0;
    
    const pPooled = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
    
    return standardError === 0 ? 0 : (p2 - p1) / standardError;
  }

  private calculatePValue(zScore: number): number {
    // Simplified p-value calculation using normal distribution approximation
    return 2 * (1 - this.normalCDF(Math.abs(zScore)));
  }

  private calculateEffectSize(control: VariantResult, variant: VariantResult): number {
    // Cohen's d calculation
    const mean1 = control.conversionRate;
    const mean2 = variant.conversionRate;
    const pooledStd = Math.sqrt((Math.pow(control.standardError, 2) + Math.pow(variant.standardError, 2)) / 2);
    
    return pooledStd === 0 ? 0 : (mean2 - mean1) / pooledStd;
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  }
}

// ===== SUPPORTING INTERFACES =====

interface MultivariateTestFactor {
  name: string;
  values: any[];
}

interface StatisticalAnalysis {
  isSignificant: boolean;
  confidence: number;
  pValue: number;
  effectSize: number;
  maxImprovement: number;
}

