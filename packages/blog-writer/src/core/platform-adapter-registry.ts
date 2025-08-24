/**
 * Platform Adapter Registry
 * Centralized registry for all platform adapters
 */

import { BasePlatformAdapter, PlatformRegistry } from './base-platform-adapter';

// Import all platform adapters
import { WordPressAdapter } from './platform-adapters/wordpress-adapter';
import { MediumAdapter } from './platform-adapters/medium-adapter';
import { LinkedInAdapter } from './platform-adapters/linkedin-adapter';
import { ShopifyAdapter } from './platform-adapters/shopify-adapter';
import { WebflowAdapter } from './platform-adapters/webflow-adapter';

/**
 * Global platform registry with all available adapters
 */
export const globalPlatformRegistry = new PlatformRegistry();

// Register all available platform adapters
globalPlatformRegistry.register('wordpress', WordPressAdapter as any);
globalPlatformRegistry.register('medium', MediumAdapter as any);
globalPlatformRegistry.register('linkedin', LinkedInAdapter as any);
globalPlatformRegistry.register('shopify', ShopifyAdapter as any);
globalPlatformRegistry.register('webflow', WebflowAdapter as any);

/**
 * Available platform names
 */
export const AVAILABLE_PLATFORMS = [
  'wordpress',
  'medium',
  'linkedin',
  'shopify',
  'webflow',
] as const;

export type SupportedPlatform = (typeof AVAILABLE_PLATFORMS)[number];

/**
 * Platform display information
 */
export const PLATFORM_INFO = {
  wordpress: {
    name: 'WordPress',
    description: 'WordPress.com and self-hosted WordPress sites',
    supportsScheduling: true,
    supportsAnalytics: false,
    requiresAuth: ['application_password', 'oauth2'],
  },
  medium: {
    name: 'Medium',
    description: 'Medium publishing platform',
    supportsScheduling: false,
    supportsAnalytics: true,
    requiresAuth: ['integration_token'],
  },
  linkedin: {
    name: 'LinkedIn',
    description: 'LinkedIn articles and posts',
    supportsScheduling: true,
    supportsAnalytics: true,
    requiresAuth: ['oauth2'],
  },
  shopify: {
    name: 'Shopify',
    description: 'Shopify store blog publishing',
    supportsScheduling: true,
    supportsAnalytics: true,
    requiresAuth: ['private_app', 'oauth2'],
  },
  webflow: {
    name: 'Webflow',
    description: 'Webflow CMS publishing',
    supportsScheduling: false,
    supportsAnalytics: false,
    requiresAuth: ['api_token', 'oauth2'],
  },
} as const;

/**
 * Create a platform adapter instance
 */
export function createPlatformAdapter(
  platform: SupportedPlatform,
  config?: any,
): BasePlatformAdapter {
  return globalPlatformRegistry.create(platform, config);
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(
  platform: string,
): platform is SupportedPlatform {
  return globalPlatformRegistry.has(platform);
}

/**
 * Get information about a platform
 */
export function getPlatformInfo(platform: SupportedPlatform) {
  return PLATFORM_INFO[platform];
}

/**
 * Get all supported platforms with their info
 */
export function getAllPlatforms() {
  return AVAILABLE_PLATFORMS.map(platform => ({
    key: platform,
    ...PLATFORM_INFO[platform],
  }));
}

/**
 * Platform-specific configuration interfaces
 */
export interface PlatformConfigurations {
  wordpress: {
    siteUrl?: string;
    apiVersion?: string;
    isWordPressCom?: boolean;
  };
  medium: {
    publicationId?: string;
  };
  linkedin: {
    organizationId?: string;
  };
  shopify: {
    storeUrl: string;
    apiVersion?: string;
  };
  webflow: {
    siteId: string;
    apiVersion?: string;
  };
}

/**
 * Factory function for creating configured platform adapters
 */
export class PlatformAdapterFactory {
  static create(
    platform: SupportedPlatform,
    config?: PlatformConfigurations[typeof platform],
  ): BasePlatformAdapter {
    const adapterConfig = {
      ...config,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
    };

    return createPlatformAdapter(platform, adapterConfig);
  }

  static createMultiple(
    platforms: Array<{
      name: SupportedPlatform;
      config?: PlatformConfigurations[SupportedPlatform];
    }>,
  ): Record<SupportedPlatform, BasePlatformAdapter> {
    const adapters = {} as Record<SupportedPlatform, BasePlatformAdapter>;

    for (const { name, config } of platforms) {
      adapters[name] = this.create(name, config as any);
    }

    return adapters;
  }
}
