import { ServiceContainer, LoggerProvider, ConfigurationProvider } from '../interfaces/base-service';

/**
 * Service registration types
 */
export type ServiceFactory<T> = () => T;
export type ServiceSingletonFactory<T> = () => T;

export interface ServiceRegistration<T = any> {
  readonly name: string;
  readonly type: 'instance' | 'factory' | 'singleton';
  readonly service?: T;
  readonly factory?: ServiceFactory<T>;
  readonly singletonFactory?: ServiceSingletonFactory<T>;
  readonly dependencies: string[];
  readonly initialized: boolean;
}

/**
 * Service Container Implementation
 */
export class ServiceContainerImpl implements ServiceContainer {
  readonly services: Map<string, any> = new Map();
  private readonly registrations: Map<string, ServiceRegistration> = new Map();
  private readonly singletons: Map<string, any> = new Map();
  private readonly lifecycleHooks: Map<string, LifecycleHook[]> = new Map();
  private initialized = false;

  register<T>(name: string, service: T): void {
    this.validateServiceName(name);
    
    this.registrations.set(name, {
      name,
      type: 'instance',
      service,
      dependencies: [],
      initialized: true,
    });
    
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    if (!this.has(name)) {
      throw new Error(`Service '${name}' not registered`);
    }

    const registration = this.registrations.get(name)!;
    
    switch (registration.type) {
      case 'instance':
        return registration.service as T;
      
      case 'factory':
        if (!registration.factory) {
          throw new Error(`Factory for service '${name}' not found`);
        }
        return registration.factory() as T;
      
      case 'singleton':
        if (this.singletons.has(name)) {
          return this.singletons.get(name) as T;
        }
        
        if (!registration.singletonFactory) {
          throw new Error(`Singleton factory for service '${name}' not found`);
        }
        
        const instance = registration.singletonFactory();
        this.singletons.set(name, instance);
        return instance as T;
      
      default:
        throw new Error(`Unknown service type for '${name}'`);
    }
  }

  has(name: string): boolean {
    return this.registrations.has(name);
  }

  remove(name: string): boolean {
    const removed = this.registrations.delete(name);
    if (removed) {
      this.services.delete(name);
      this.singletons.delete(name);
      this.lifecycleHooks.delete(name);
    }
    return removed;
  }

  registerFactory<T>(name: string, factory: ServiceFactory<T>): void {
    this.validateServiceName(name);
    
    this.registrations.set(name, {
      name,
      type: 'factory',
      factory,
      dependencies: this.extractDependencies(factory),
      initialized: false,
    });
  }

  registerSingleton<T>(name: string, factory: ServiceSingletonFactory<T>): void {
    this.validateServiceName(name);
    
    this.registrations.set(name, {
      name,
      type: 'singleton',
      singletonFactory: factory,
      dependencies: this.extractDependencies(factory),
      initialized: false,
    });
  }

  /**
   * Register a service with dependencies
   */
  registerWithDependencies<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies: string[]
  ): void {
    this.validateServiceName(name);
    
    this.registrations.set(name, {
      name,
      type: 'factory',
      factory,
      dependencies,
      initialized: false,
    });
  }

  /**
   * Register a singleton with dependencies
   */
  registerSingletonWithDependencies<T>(
    name: string,
    factory: ServiceSingletonFactory<T>,
    dependencies: string[]
  ): void {
    this.validateServiceName(name);
    
    this.registrations.set(name, {
      name,
      type: 'singleton',
      singletonFactory: factory,
      dependencies,
      initialized: false,
    });
  }

  /**
   * Add lifecycle hook for a service
   */
  addLifecycleHook(serviceName: string, hook: LifecycleHook): void {
    if (!this.lifecycleHooks.has(serviceName)) {
      this.lifecycleHooks.set(serviceName, []);
    }
    
    this.lifecycleHooks.get(serviceName)!.push(hook);
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('info', 'Initializing service container...');
    
    // Resolve dependencies and initialize services
    const initializationOrder = this.resolveInitializationOrder();
    
    for (const serviceName of initializationOrder) {
      await this.initializeService(serviceName);
    }
    
    this.initialized = true;
    this.log('info', 'Service container initialized successfully');
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down service container...');
    
    // Shutdown in reverse initialization order
    const shutdownOrder = Array.from(this.registrations.keys()).reverse();
    
    for (const serviceName of shutdownOrder) {
      await this.shutdownService(serviceName);
    }
    
    this.initialized = false;
    this.log('info', 'Service container shut down successfully');
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get service registration information
   */
  getRegistration(name: string): ServiceRegistration | undefined {
    return this.registrations.get(name);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(name: string): boolean {
    const registration = this.registrations.get(name);
    return registration?.initialized ?? false;
  }

  /**
   * Validate service dependencies
   */
  validateDependencies(): ValidationResult {
    const errors: string[] = [];
    
    for (const [name, registration] of this.registrations) {
      for (const dependency of registration.dependencies) {
        if (!this.has(dependency)) {
          errors.push(`Service '${name}' depends on '${dependency}' which is not registered`);
        }
      }
    }
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies();
    errors.push(...circularDeps);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a child container
   */
  createChildContainer(): ServiceContainer {
    const child = new ServiceContainerImpl();
    
    // Copy registrations that can be shared
    for (const [name, registration] of this.registrations) {
      if (registration.type === 'instance') {
        child.register(name, registration.service);
      }
    }
    
    return child;
  }

  private validateServiceName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    
    if (this.registrations.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }
  }

  private extractDependencies(factory: Function): string[] {
    // This is a simplified dependency extraction
    // In a real implementation, you might use reflection or decorators
    const factoryStr = factory.toString();
    const paramMatch = factoryStr.match(/\(([^)]*)\)/);
    
    if (!paramMatch) {
      return [];
    }
    
    const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
    return params;
  }

  private resolveInitializationOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (serviceName: string): void => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }
      
      if (visited.has(serviceName)) {
        return;
      }
      
      visiting.add(serviceName);
      
      const registration = this.registrations.get(serviceName);
      if (registration) {
        for (const dependency of registration.dependencies) {
          visit(dependency);
        }
      }
      
      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };
    
    for (const serviceName of this.registrations.keys()) {
      visit(serviceName);
    }
    
    return order;
  }

  private async initializeService(serviceName: string): Promise<void> {
    const registration = this.registrations.get(serviceName);
    if (!registration || registration.initialized) {
      return;
    }
    
    this.log('debug', `Initializing service: ${serviceName}`);
    
    try {
      // Execute initialization hooks
      const hooks = this.lifecycleHooks.get(serviceName) || [];
      for (const hook of hooks) {
        if (hook.type === 'beforeInit') {
          await hook.handler(serviceName, this);
        }
      }
      
      // Initialize the service
      if (registration.type === 'singleton' && !this.singletons.has(serviceName)) {
        const instance = registration.singletonFactory!();
        this.singletons.set(serviceName, instance);
      }
      
      registration.initialized = true;
      
      // Execute post-initialization hooks
      for (const hook of hooks) {
        if (hook.type === 'afterInit') {
          await hook.handler(serviceName, this);
        }
      }
      
      this.log('debug', `Service initialized: ${serviceName}`);
    } catch (error) {
      this.log('error', `Failed to initialize service: ${serviceName}`, { error });
      throw error;
    }
  }

  private async shutdownService(serviceName: string): Promise<void> {
    const hooks = this.lifecycleHooks.get(serviceName) || [];
    
    this.log('debug', `Shutting down service: ${serviceName}`);
    
    try {
      // Execute shutdown hooks
      for (const hook of hooks) {
        if (hook.type === 'beforeShutdown') {
          await hook.handler(serviceName, this);
        }
      }
      
      // Clean up singletons
      this.singletons.delete(serviceName);
      
      // Execute post-shutdown hooks
      for (const hook of hooks) {
        if (hook.type === 'afterShutdown') {
          await hook.handler(serviceName, this);
        }
      }
      
      this.log('debug', `Service shut down: ${serviceName}`);
    } catch (error) {
      this.log('error', `Failed to shutdown service: ${serviceName}`, { error });
      throw error;
    }
  }

  private detectCircularDependencies(): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (serviceName: string, path: string[]): void => {
      if (visiting.has(serviceName)) {
        const cycle = [...path, serviceName].join(' -> ');
        errors.push(`Circular dependency detected: ${cycle}`);
        return;
      }
      
      if (visited.has(serviceName)) {
        return;
      }
      
      visiting.add(serviceName);
      path.push(serviceName);
      
      const registration = this.registrations.get(serviceName);
      if (registration) {
        for (const dependency of registration.dependencies) {
          visit(dependency, [...path]);
        }
      }
      
      visiting.delete(serviceName);
      visited.add(serviceName);
    };
    
    for (const serviceName of this.registrations.keys()) {
      visit(serviceName, []);
    }
    
    return errors;
  }

  private log(level: string, message: string, context?: Record<string, any>): void {
    // In a real implementation, this would use the logger service
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [ServiceContainer] ${message}`;
    
    if (context) {
      console.log(logMessage, context);
    } else {
      console.log(logMessage);
    }
  }
}

/**
 * Lifecycle hook types
 */
export interface LifecycleHook {
  readonly type: 'beforeInit' | 'afterInit' | 'beforeShutdown' | 'afterShutdown';
  readonly handler: (serviceName: string, container: ServiceContainer) => Promise<void>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
}

/**
 * Service container builder for fluent configuration
 */
export class ServiceContainerBuilder {
  private container: ServiceContainerImpl;

  constructor() {
    this.container = new ServiceContainerImpl();
  }

  register<T>(name: string, service: T): this {
    this.container.register(name, service);
    return this;
  }

  registerFactory<T>(name: string, factory: ServiceFactory<T>): this {
    this.container.registerFactory(name, factory);
    return this;
  }

  registerSingleton<T>(name: string, factory: ServiceSingletonFactory<T>): this {
    this.container.registerSingleton(name, factory);
    return this;
  }

  addLifecycleHook(serviceName: string, hook: LifecycleHook): this {
    this.container.addLifecycleHook(serviceName, hook);
    return this;
  }

  build(): ServiceContainer {
    return this.container;
  }
}
