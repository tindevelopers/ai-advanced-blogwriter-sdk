/**
 * Base service interface for dependency injection
 */
export interface BaseService {
  readonly serviceName: string;
  readonly version: string;
}

/**
 * Configuration interface for all services
 */
export interface ServiceConfig {
  readonly serviceName: string;
  readonly version: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly debug: boolean;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

/**
 * AI Model abstraction interface
 */
export interface AIModelProvider {
  readonly providerName: string;
  readonly modelName: string;
  readonly maxTokens: number;
  readonly temperature: number;
  
  generateText(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult>;
  generateObject<T>(prompt: string, schema: any, options?: GenerateObjectOptions): Promise<T>;
  validateResponse(response: any): boolean;
}

export interface GenerateTextOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface GenerateTextResult {
  text: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface GenerateObjectOptions extends GenerateTextOptions {
  schema: any;
  validation?: boolean;
}

/**
 * Database abstraction interface
 */
export interface DatabaseProvider {
  readonly providerName: string;
  readonly connectionString: string;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Generic CRUD operations
  create<T>(collection: string, data: T): Promise<T>;
  findById<T>(collection: string, id: string): Promise<T | null>;
  findMany<T>(collection: string, filter?: any, options?: QueryOptions): Promise<T[]>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
  
  // Transaction support
  beginTransaction(): Promise<Transaction>;
  commitTransaction(transaction: Transaction): Promise<void>;
  rollbackTransaction(transaction: Transaction): Promise<void>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 0 | 1>;
}

export interface Transaction {
  readonly id: string;
  readonly status: 'active' | 'committed' | 'rolled_back';
}

/**
 * Cache abstraction interface
 */
export interface CacheProvider {
  readonly providerName: string;
  readonly defaultTTL: number;
  
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  
  // Batch operations
  getMany<T>(keys: string[]): Promise<Record<string, T | null>>;
  setMany<T>(entries: Record<string, T>, ttl?: number): Promise<void>;
  deleteMany(keys: string[]): Promise<number>;
}

/**
 * Logger abstraction interface
 */
export interface LoggerProvider {
  readonly level: LogLevel;
  
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  
  // Structured logging
  log(level: LogLevel, message: string, context?: Record<string, any>): void;
  setLevel(level: LogLevel): void;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Event bus abstraction interface
 */
export interface EventBusProvider {
  readonly providerName: string;
  
  publish(event: string, data: any, options?: PublishOptions): Promise<void>;
  subscribe(event: string, handler: EventHandler): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
  
  // Pattern matching
  subscribePattern(pattern: string, handler: EventHandler): Promise<Subscription>;
}

export interface PublishOptions {
  priority?: 'low' | 'normal' | 'high';
  delay?: number;
  retryAttempts?: number;
}

export interface EventHandler {
  (event: string, data: any, metadata: EventMetadata): Promise<void>;
}

export interface EventMetadata {
  readonly eventId: string;
  readonly timestamp: Date;
  readonly source: string;
  readonly correlationId?: string;
}

export interface Subscription {
  readonly id: string;
  readonly event: string;
  readonly handler: EventHandler;
}

/**
 * Configuration management interface
 */
export interface ConfigurationProvider {
  readonly environment: string;
  
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  
  // Nested configuration
  getSection(section: string): ConfigurationProvider;
  
  // Environment-specific configuration
  getForEnvironment<T>(key: string, environment?: string): T;
  
  // Validation
  validate(schema: any): ValidationResult;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
}

export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Service container for dependency injection
 */
export interface ServiceContainer {
  readonly services: Map<string, any>;
  
  register<T>(name: string, service: T): void;
  get<T>(name: string): T;
  has(name: string): boolean;
  remove(name: string): boolean;
  
  // Factory registration
  registerFactory<T>(name: string, factory: () => T): void;
  
  // Singleton registration
  registerSingleton<T>(name: string, factory: () => T): void;
  
  // Lifecycle management
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Base service implementation
 */
export abstract class BaseServiceClass implements BaseService {
  abstract readonly serviceName: string;
  abstract readonly version: string;
  
  protected readonly config: ServiceConfig;
  protected readonly logger: LoggerProvider;
  protected readonly container: ServiceContainer;
  
  constructor(config: ServiceConfig, logger: LoggerProvider, container: ServiceContainer) {
    this.config = config;
    this.logger = logger;
    this.container = container;
  }
  
  protected log(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.logger.log(level, `[${this.serviceName}] ${message}`, {
      serviceName: this.serviceName,
      version: this.version,
      ...context,
    });
  }
  
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retryAttempts?: number,
    retryDelay?: number
  ): Promise<T> {
    const attempts = retryAttempts ?? this.config.retryAttempts;
    const delay = retryDelay ?? this.config.retryDelay;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === attempts) {
          throw error;
        }
        
        this.log('warn', `Operation failed, retrying in ${delay}ms (attempt ${attempt}/${attempts})`, {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          attempts,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retry attempts exceeded');
  }
  
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeout?: number
  ): Promise<T> {
    const timeoutMs = timeout ?? this.config.timeout;
    
    return Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }
}
