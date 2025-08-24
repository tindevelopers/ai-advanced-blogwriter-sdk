import {
  ConfigurationProvider,
  ValidationResult,
  ValidationError,
} from '../interfaces/base-service';
import { z } from 'zod';

/**
 * Configuration schema definitions
 */
export const DatabaseConfigSchema = z.object({
  provider: z.enum(['postgresql', 'mysql', 'mongodb', 'sqlite']),
  host: z.string(),
  port: z.number().positive(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  connectionPool: z
    .object({
      min: z.number().positive().default(1),
      max: z.number().positive().default(10),
    })
    .default({}),
});

export const AIModelConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'azure']),
  model: z.string(),
  apiKey: z.string(),
  baseUrl: z.string().url().optional(),
  maxTokens: z.number().positive().default(4000),
  temperature: z.number().min(0).max(2).default(0.7),
  timeout: z.number().positive().default(30000),
  retryAttempts: z.number().positive().default(3),
});

export const CacheConfigSchema = z.object({
  provider: z.enum(['redis', 'memory', 'file']),
  host: z.string().optional(),
  port: z.number().positive().optional(),
  password: z.string().optional(),
  database: z.number().min(0).max(15).optional(),
  ttl: z.number().positive().default(3600),
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'text']).default('json'),
  destination: z.enum(['console', 'file', 'remote']).default('console'),
  filePath: z.string().optional(),
  maxFileSize: z.number().positive().optional(),
  maxFiles: z.number().positive().optional(),
});

export const ServiceConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  debug: z.boolean().default(false),
  timeout: z.number().positive().default(30000),
  retryAttempts: z.number().positive().default(3),
  retryDelay: z.number().positive().default(1000),
});

export const BlogWriterConfigSchema = z.object({
  service: ServiceConfigSchema,
  database: DatabaseConfigSchema,
  aiModel: AIModelConfigSchema,
  cache: CacheConfigSchema.optional(),
  logging: LoggingConfigSchema,
  features: z
    .object({
      seoAnalysis: z.boolean().default(true),
      factChecking: z.boolean().default(true),
      plagiarismDetection: z.boolean().default(true),
      contentOptimization: z.boolean().default(true),
      multiPlatformPublishing: z.boolean().default(true),
    })
    .default({}),
  limits: z
    .object({
      maxWordCount: z.number().positive().default(10000),
      maxConcurrentRequests: z.number().positive().default(10),
      maxRetryAttempts: z.number().positive().default(3),
      rateLimitPerMinute: z.number().positive().default(60),
    })
    .default({}),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AIModelConfig = z.infer<typeof AIModelConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;
export type BlogWriterConfig = z.infer<typeof BlogWriterConfigSchema>;

/**
 * Configuration Manager Implementation
 */
export class ConfigurationManager implements ConfigurationProvider {
  readonly environment: string;
  private readonly config: Map<string, any> = new Map();
  private readonly environmentConfigs: Map<string, Map<string, any>> =
    new Map();
  private readonly schemas: Map<string, z.ZodSchema> = new Map();

  constructor(environment: string = 'development') {
    this.environment = environment;
    this.initializeDefaultSchemas();
  }

  private initializeDefaultSchemas(): void {
    this.schemas.set('database', DatabaseConfigSchema);
    this.schemas.set('aiModel', AIModelConfigSchema);
    this.schemas.set('cache', CacheConfigSchema);
    this.schemas.set('logging', LoggingConfigSchema);
    this.schemas.set('service', ServiceConfigSchema);
    this.schemas.set('blogWriter', BlogWriterConfigSchema);
  }

  get<T>(key: string, defaultValue?: T): T {
    const value = this.config.get(key);
    if (value === undefined && defaultValue !== undefined) {
      return defaultValue;
    }
    if (value === undefined) {
      throw new Error(`Configuration key '${key}' not found`);
    }
    return value as T;
  }

  set<T>(key: string, value: T): void {
    this.config.set(key, value);
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  delete(key: string): boolean {
    return this.config.delete(key);
  }

  getSection(section: string): ConfigurationProvider {
    return new SectionConfigurationProvider(this, section);
  }

  getForEnvironment<T>(key: string, environment?: string): T {
    const env = environment || this.environment;
    const envConfig = this.environmentConfigs.get(env);

    if (envConfig && envConfig.has(key)) {
      return envConfig.get(key) as T;
    }

    return this.get<T>(key);
  }

  validate(schema: any): ValidationResult {
    const errors: ValidationError[] = [];

    try {
      if (schema instanceof z.ZodSchema) {
        schema.parse(this.config);
      } else if (typeof schema === 'string' && this.schemas.has(schema)) {
        const zodSchema = this.schemas.get(schema)!;
        zodSchema.parse(this.config);
      } else {
        throw new Error('Invalid schema provided');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(
          ...error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        );
      } else {
        errors.push({
          path: '',
          message:
            error instanceof Error ? error.message : 'Unknown validation error',
          code: 'UNKNOWN',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment(): void {
    const envVars = process.env;

    // Database configuration
    if (envVars.DATABASE_URL) {
      this.set('database.url', envVars.DATABASE_URL);
    }
    if (envVars.DATABASE_HOST) {
      this.set('database.host', envVars.DATABASE_HOST);
    }
    if (envVars.DATABASE_PORT) {
      this.set('database.port', parseInt(envVars.DATABASE_PORT, 10));
    }
    if (envVars.DATABASE_NAME) {
      this.set('database.database', envVars.DATABASE_NAME);
    }
    if (envVars.DATABASE_USER) {
      this.set('database.username', envVars.DATABASE_USER);
    }
    if (envVars.DATABASE_PASSWORD) {
      this.set('database.password', envVars.DATABASE_PASSWORD);
    }

    // AI Model configuration
    if (envVars.AI_PROVIDER) {
      this.set('aiModel.provider', envVars.AI_PROVIDER);
    }
    if (envVars.AI_MODEL) {
      this.set('aiModel.model', envVars.AI_MODEL);
    }
    if (envVars.AI_API_KEY) {
      this.set('aiModel.apiKey', envVars.AI_API_KEY);
    }
    if (envVars.AI_BASE_URL) {
      this.set('aiModel.baseUrl', envVars.AI_BASE_URL);
    }
    if (envVars.AI_MAX_TOKENS) {
      this.set('aiModel.maxTokens', parseInt(envVars.AI_MAX_TOKENS, 10));
    }
    if (envVars.AI_TEMPERATURE) {
      this.set('aiModel.temperature', parseFloat(envVars.AI_TEMPERATURE));
    }

    // Service configuration
    if (envVars.NODE_ENV) {
      this.set('service.environment', envVars.NODE_ENV);
    }
    if (envVars.SERVICE_TIMEOUT) {
      this.set('service.timeout', parseInt(envVars.SERVICE_TIMEOUT, 10));
    }
    if (envVars.SERVICE_RETRY_ATTEMPTS) {
      this.set(
        'service.retryAttempts',
        parseInt(envVars.SERVICE_RETRY_ATTEMPTS, 10),
      );
    }

    // Logging configuration
    if (envVars.LOG_LEVEL) {
      this.set('logging.level', envVars.LOG_LEVEL);
    }
    if (envVars.LOG_FORMAT) {
      this.set('logging.format', envVars.LOG_FORMAT);
    }
  }

  /**
   * Load configuration from JSON file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(content);

      this.mergeConfig(config);
    } catch (error) {
      throw new Error(
        `Failed to load configuration from file: ${filePath} - ${error}`,
      );
    }
  }

  /**
   * Load configuration from remote source (e.g., API, database)
   */
  async loadFromRemote(
    url: string,
    options?: { headers?: Record<string, string> },
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      this.mergeConfig(config);
    } catch (error) {
      throw new Error(
        `Failed to load configuration from remote: ${url} - ${error}`,
      );
    }
  }

  /**
   * Set environment-specific configuration
   */
  setEnvironmentConfig(environment: string, config: Record<string, any>): void {
    if (!this.environmentConfigs.has(environment)) {
      this.environmentConfigs.set(environment, new Map());
    }

    const envConfig = this.environmentConfigs.get(environment)!;
    Object.entries(config).forEach(([key, value]) => {
      envConfig.set(key, value);
    });
  }

  /**
   * Merge configuration object
   */
  private mergeConfig(config: Record<string, any>, prefix: string = ''): void {
    Object.entries(config).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        this.mergeConfig(value, fullKey);
      } else {
        this.set(fullKey, value);
      }
    });
  }

  /**
   * Export current configuration
   */
  export(): Record<string, any> {
    const result: Record<string, any> = {};

    this.config.forEach((value, key) => {
      const keys = key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    });

    return result;
  }

  /**
   * Validate all configuration sections
   */
  validateAll(): ValidationResult {
    const errors: ValidationError[] = [];

    this.schemas.forEach((schema, name) => {
      const sectionConfig = this.getSection(name);
      const sectionData = sectionConfig.export();

      try {
        schema.parse(sectionData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(
            ...error.errors.map(err => ({
              path: `${name}.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            })),
          );
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Section-specific configuration provider
 */
class SectionConfigurationProvider implements ConfigurationProvider {
  readonly environment: string;
  private readonly parent: ConfigurationManager;
  private readonly section: string;

  constructor(parent: ConfigurationManager, section: string) {
    this.parent = parent;
    this.section = section;
    this.environment = parent.environment;
  }

  get<T>(key: string, defaultValue?: T): T {
    const fullKey = `${this.section}.${key}`;
    return this.parent.get<T>(fullKey, defaultValue);
  }

  set<T>(key: string, value: T): void {
    const fullKey = `${this.section}.${key}`;
    this.parent.set<T>(fullKey, value);
  }

  has(key: string): boolean {
    const fullKey = `${this.section}.${key}`;
    return this.parent.has(fullKey);
  }

  delete(key: string): boolean {
    const fullKey = `${this.section}.${key}`;
    return this.parent.delete(fullKey);
  }

  getSection(section: string): ConfigurationProvider {
    return new SectionConfigurationProvider(
      this.parent,
      `${this.section}.${section}`,
    );
  }

  getForEnvironment<T>(key: string, environment?: string): T {
    const fullKey = `${this.section}.${key}`;
    return this.parent.getForEnvironment<T>(fullKey, environment);
  }

  validate(schema: any): ValidationResult {
    const sectionData = this.export();

    try {
      if (schema instanceof z.ZodSchema) {
        schema.parse(sectionData);
      } else {
        throw new Error('Invalid schema provided');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        };
      }
    }

    return { isValid: true, errors: [] };
  }

  export(): Record<string, any> {
    const result: Record<string, any> = {};

    this.parent.config.forEach((value, key) => {
      if (key.startsWith(`${this.section}.`)) {
        const sectionKey = key.substring(this.section.length + 1);
        const keys = sectionKey.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
      }
    });

    return result;
  }
}
