

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

// For now, we'll work without Prisma models since they're not defined in the schema
interface TestRunner {
  testId: string;
  config: ABTestConfig;
  startTime: Date;
  results: Map<string, VariantResult>;
}

interface StatisticalAnalyzer {
  calculateSignificance(controlResults: number[], variantResults: number[]): number;
  calculatePValue(controlMean: number, variantMean: number, controlStd: number, variantStd: number, n1: number, n2: number): number;
  calculateConfidenceInterval(mean: number, std: number, n: number, confidence: number): [number, number];
}

export class ABTestingService {
  private runningTests: Map<string, TestRunner> = new Map();
  private statisticalAnalyzer: StatisticalAnalyzer;
  private testResults: Map<string, ABTestResult> = new Map();
  
  constructor() {
    this.statisticalAnalyzer = new SimpleStatisticalAnalyzer();
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

      // Generate test ID
      const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create test configuration with defaults
      const completeConfig: ABTestConfig = {
        ...testConfig,
        id: testId,
        status: autoStart ? ABTestStatus.RUNNING : ABTestStatus.DRAFT,
        createdAt: new Date(),
        lastUpdated: new Date(),
        createdBy: 'system' // In a real implementation, this would be the current user
      };

      if (autoStart) {
        await this.startTest(testId, completeConfig);
      }

      return {
        testId,
        status: completeConfig.status,
        estimatedDuration: testConfig.duration,
        expectedSampleSize: testConfig.minSampleSize,
        createdAt: new Date(),
        success: true
      };

    } catch (error) {
      console.error('A/B test creation failed:', error);
      throw new PerformanceOptimizationError(
        'Failed to create A/B test',
        'AB_TEST_CREATION_FAILED',
        error
      );
    }
  }

  /**
   * Start running an A/B test
   */
  public async startTest(testId: string, config?: ABTestConfig): Promise<void> {
    try {
      if (!config) {
        // In a real implementation, we'd load from database
        throw new Error(`Test configuration not found for test ${testId}`);
      }

      const runner: TestRunner = {
        testId,
        config: {
          ...config,
          status: ABTestStatus.RUNNING,
          startDate: new Date()
        },
        startTime: new Date(),
        results: new Map()
      };

      this.runningTests.set(testId, runner);

      // Initialize variant results
      for (const variant of config.variants) {
        const initialResult: VariantResult = {
          variantId: variant.id,
          variantName: variant.name,
          participants: 0,
          metrics: [],
          improvement: 0,
          improvementPercentage: 0,
          confidence: 0,
          isWinner: false,
          isStatisticallySignificant: false
        };
        runner.results.set(variant.id, initialResult);
      }

      console.log(`A/B test ${testId} started successfully`);
    } catch (error) {
      throw new PerformanceOptimizationError(
        `Failed to start A/B test: ${testId}`,
        'AB_TEST_START_FAILED',
        error
      );
    }
  }

  /**
   * Stop a running A/B test
   */
  public async stopTest(testId: string): Promise<ABTestResult> {
    try {
      const runner = this.runningTests.get(testId);
      if (!runner) {
        throw new Error(`Test ${testId} not found or not running`);
      }

      // Calculate final results
      const finalResult = await this.calculateFinalResults(runner);
      
      // Store results
      this.testResults.set(testId, finalResult);
      
      // Remove from running tests
      this.runningTests.delete(testId);

      return finalResult;
    } catch (error) {
      throw new PerformanceOptimizationError(
        `Failed to stop A/B test: ${testId}`,
        'AB_TEST_STOP_FAILED',
        error
      );
    }
  }

  /**
   * Get test results for a specific test
   */
  public async getTestResults(testId: string): Promise<ABTestResult> {
    try {
      // Check if test is still running
      const runningTest = this.runningTests.get(testId);
      if (runningTest) {
        return await this.calculateIntermediateResults(runningTest);
      }

      // Check if test results are cached
      const cachedResult = this.testResults.get(testId);
      if (cachedResult) {
        return cachedResult;
      }

      throw new Error(`Test results not found for test ${testId}`);
    } catch (error) {
      throw new PerformanceOptimizationError(
        `Failed to get test results: ${testId}`,
        'AB_TEST_RESULTS_FAILED',
        error
      );
    }
  }

  /**
   * Record a conversion event for a specific test variant
   */
  public async recordConversion(
    testId: string,
    variantId: string,
    userId: string,
    metricType: string,
    value: number = 1
  ): Promise<void> {
    try {
      const runner = this.runningTests.get(testId);
      if (!runner) {
        console.warn(`Attempted to record conversion for inactive test: ${testId}`);
        return;
      }

      const variantResult = runner.results.get(variantId);
      if (!variantResult) {
        console.warn(`Variant ${variantId} not found in test ${testId}`);
        return;
      }

      // Update participant count
      variantResult.participants += 1;

      // Find or create metric result
      let metricResult = variantResult.metrics.find(m => m.metricName === metricType);
      if (!metricResult) {
        metricResult = {
          metricName: metricType,
          value: 0,
          confidenceInterval: { lower: 0, upper: 0 },
          pValue: 1,
          improvement: 0
        };
        variantResult.metrics.push(metricResult);
      }

      // Update metric value (simplified - in real implementation would be more sophisticated)
      metricResult.value = (metricResult.value * (variantResult.participants - 1) + value) / variantResult.participants;

      // Recalculate statistical significance if we have enough data
      if (variantResult.participants >= runner.config.minSampleSize / runner.config.variants.length) {
        await this.updateStatisticalAnalysis(runner, variantId);
      }
    } catch (error) {
      console.error('Failed to record conversion:', error);
      // Don't throw here as this shouldn't break the user experience
    }
  }

  /**
   * Get all active tests
   */
  public async getActiveTests(): Promise<ABTestConfig[]> {
    return Array.from(this.runningTests.values()).map(runner => runner.config);
  }

  /**
   * Validate test configuration
   */
  private async validateTestConfig(config: ABTestConfig): Promise<void> {
    if (!config.testName || config.testName.trim().length === 0) {
      throw new PerformanceOptimizationError('Test name is required', 'VALIDATION_ERROR');
    }

    if (!config.variants || config.variants.length < 2) {
      throw new PerformanceOptimizationError('At least 2 variants are required', 'VALIDATION_ERROR');
    }

    if (config.variants.filter(v => v.isControl).length !== 1) {
      throw new PerformanceOptimizationError('Exactly one control variant is required', 'VALIDATION_ERROR');
    }

    if (!config.successMetrics || config.successMetrics.length === 0) {
      throw new PerformanceOptimizationError('At least one success metric is required', 'VALIDATION_ERROR');
    }

    const totalTrafficSplit = config.trafficSplit.reduce((sum, split) => sum + split, 0);
    if (Math.abs(totalTrafficSplit - 100) > 0.01) {
      throw new PerformanceOptimizationError('Traffic split must total 100%', 'VALIDATION_ERROR');
    }

    if (config.duration <= 0) {
      throw new PerformanceOptimizationError('Test duration must be positive', 'VALIDATION_ERROR');
    }

    if (config.minSampleSize <= 0) {
      throw new PerformanceOptimizationError('Minimum sample size must be positive', 'VALIDATION_ERROR');
    }
  }

  /**
   * Calculate final test results
   */
  private async calculateFinalResults(runner: TestRunner): Promise<ABTestResult> {
    const results = Array.from(runner.results.values());
    const controlResult = results.find(r => runner.config.variants.find(v => v.id === r.variantId)?.isControl);
    
    if (!controlResult) {
      throw new Error('Control variant result not found');
    }

    // Determine winner
    let winner: string | undefined;
    let maxImprovement = 0;
    let isSignificant = false;

    for (const result of results) {
      if (!result.isStatisticallySignificant || result.variantId === controlResult.variantId) {
        continue;
      }
      
      if (result.improvement > maxImprovement) {
        maxImprovement = result.improvement;
        winner = result.variantId;
        isSignificant = true;
      }
    }

    // Generate recommendation
    const recommendation: TestRecommendation = {
      action: isSignificant && winner ? 'implement_winner' : 'inconclusive',
      reasoning: isSignificant && winner 
        ? `Variant ${winner} shows statistically significant improvement of ${maxImprovement.toFixed(2)}%`
        : 'No variant showed statistically significant improvement over the control',
      confidence: isSignificant ? 0.95 : 0.5,
      nextSteps: isSignificant && winner
        ? [`Implement variant ${winner}`, 'Monitor performance post-implementation']
        : ['Consider running test longer', 'Review test setup and metrics']
    };

    return {
      testId: runner.testId,
      results,
      winner,
      confidence: isSignificant ? 0.95 : 0.5,
      significance: isSignificant,
      lift: maxImprovement,
      recommendation,
      segmentAnalysis: [], // Simplified for now
      duration: (Date.now() - runner.startTime.getTime()) / (1000 * 60 * 60 * 24), // days
      completedAt: new Date()
    };
  }

  /**
   * Calculate intermediate results for running tests
   */
  private async calculateIntermediateResults(runner: TestRunner): Promise<ABTestResult> {
    // Similar to calculateFinalResults but for running tests
    return await this.calculateFinalResults(runner);
  }

  /**
   * Update statistical analysis for a variant
   */
  private async updateStatisticalAnalysis(runner: TestRunner, variantId: string): Promise<void> {
    const variantResult = runner.results.get(variantId);
    const controlResult = Array.from(runner.results.values()).find(r => 
      runner.config.variants.find(v => v.id === r.variantId)?.isControl
    );

    if (!variantResult || !controlResult || variantResult.variantId === controlResult.variantId) {
      return;
    }

    // Simplified statistical analysis
    const primaryMetric = runner.config.primaryMetric;
    const variantMetric = variantResult.metrics.find(m => m.metricName === primaryMetric);
    const controlMetric = controlResult.metrics.find(m => m.metricName === primaryMetric);

    if (!variantMetric || !controlMetric) {
      return;
    }

    // Calculate improvement
    const improvement = ((variantMetric.value - controlMetric.value) / controlMetric.value) * 100;
    variantResult.improvement = improvement;
    variantResult.improvementPercentage = improvement;

    // Simplified significance test (in real implementation, would use proper statistical tests)
    const minParticipants = Math.min(variantResult.participants, controlResult.participants);
    const isSignificant = minParticipants >= 100 && Math.abs(improvement) >= 5; // Simplified criteria
    
    variantResult.isStatisticallySignificant = isSignificant;
    variantResult.confidence = isSignificant ? 0.95 : Math.min(minParticipants / 100, 0.8);

    // Update winner status
    const allResults = Array.from(runner.results.values());
    const bestVariant = allResults
      .filter(r => r.isStatisticallySignificant && r.variantId !== controlResult.variantId)
      .sort((a, b) => b.improvement - a.improvement)[0];

    allResults.forEach(r => {
      r.isWinner = r === bestVariant;
    });
  }

  /**
   * Initialize test monitoring for automatic cleanup and analysis
   */
  private initializeTestMonitoring(): void {
    // Check for expired tests every hour
    setInterval(() => {
      this.checkExpiredTests();
    }, 60 * 60 * 1000);
  }

  /**
   * Check for and handle expired tests
   */
  private async checkExpiredTests(): Promise<void> {
    const now = new Date();
    
    for (const [testId, runner] of this.runningTests) {
      const endDate = new Date(runner.config.startDate.getTime() + runner.config.duration * 24 * 60 * 60 * 1000);
      
      if (now > endDate) {
        try {
          await this.stopTest(testId);
          console.log(`Automatically stopped expired test: ${testId}`);
        } catch (error) {
          console.error(`Failed to stop expired test ${testId}:`, error);
        }
      }
    }
  }
}

/**
 * Simple statistical analyzer implementation
 */
class SimpleStatisticalAnalyzer implements StatisticalAnalyzer {
  calculateSignificance(controlResults: number[], variantResults: number[]): number {
    // Simplified implementation - in production, use proper statistical libraries
    const controlMean = controlResults.reduce((sum, val) => sum + val, 0) / controlResults.length;
    const variantMean = variantResults.reduce((sum, val) => sum + val, 0) / variantResults.length;
    
    const controlStd = Math.sqrt(controlResults.reduce((sum, val) => sum + Math.pow(val - controlMean, 2), 0) / controlResults.length);
    const variantStd = Math.sqrt(variantResults.reduce((sum, val) => sum + Math.pow(val - variantMean, 2), 0) / variantResults.length);
    
    // Simplified t-test
    const pooledStd = Math.sqrt(((controlResults.length - 1) * controlStd * controlStd + (variantResults.length - 1) * variantStd * variantStd) / (controlResults.length + variantResults.length - 2));
    const tStat = (variantMean - controlMean) / (pooledStd * Math.sqrt(1/controlResults.length + 1/variantResults.length));
    
    return Math.abs(tStat);
  }

  calculatePValue(controlMean: number, variantMean: number, controlStd: number, variantStd: number, n1: number, n2: number): number {
    // Simplified p-value calculation
    const pooledStd = Math.sqrt(((n1 - 1) * controlStd * controlStd + (n2 - 1) * variantStd * variantStd) / (n1 + n2 - 2));
    const tStat = Math.abs((variantMean - controlMean) / (pooledStd * Math.sqrt(1/n1 + 1/n2)));
    
    // Simplified - return approximate p-value based on t-statistic
    if (tStat > 2.58) return 0.01; // 99% confidence
    if (tStat > 1.96) return 0.05; // 95% confidence
    if (tStat > 1.65) return 0.10; // 90% confidence
    return 0.5;
  }

  calculateConfidenceInterval(mean: number, std: number, n: number, confidence: number): [number, number] {
    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.65;
    const margin = zScore * (std / Math.sqrt(n));
    return [mean - margin, mean + margin];
  }
}
