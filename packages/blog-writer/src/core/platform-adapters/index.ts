/**
 * Platform Adapters Export Index
 * Week 13-14 Platform Integration Framework
 */

// Base adapter
export * from '../base-platform-adapter';

// Specific platform adapters
export * from './wordpress-adapter';
export * from './medium-adapter';
export * from './linkedin-adapter';
export * from './shopify-adapter';
export * from './webflow-adapter';

// Re-export registry for convenience
export { platformRegistry } from '../base-platform-adapter';

// Adapter creation utility
export function createAdapter(platformName: string, config?: any) {
  const { platformRegistry } = require('../base-platform-adapter');
  return platformRegistry.create(platformName, config);
}

// Available adapters list
export const AVAILABLE_ADAPTERS = [
  'wordpress',
  'medium',
  'linkedin',
  'shopify',
  'webflow',
] as const;

export type AvailableAdapter = (typeof AVAILABLE_ADAPTERS)[number];

// Adapter metadata
export const ADAPTER_METADATA = {
  wordpress: {
    name: 'WordPress',
    description: 'WordPress.com and self-hosted WordPress sites',
    authTypes: ['application_password', 'oauth2'],
    capabilities: {
      scheduling: true,
      analytics: false,
      categories: true,
      tags: true,
      media: true,
    },
  },
  medium: {
    name: 'Medium',
    description: 'Medium publishing platform',
    authTypes: ['integration_token'],
    capabilities: {
      scheduling: false,
      analytics: true,
      categories: false,
      tags: true,
      media: true,
    },
  },
  linkedin: {
    name: 'LinkedIn',
    description: 'LinkedIn articles and posts',
    authTypes: ['oauth2'],
    capabilities: {
      scheduling: false,
      analytics: true,
      categories: false,
      tags: false,
      media: true,
    },
  },
  shopify: {
    name: 'Shopify',
    description: 'Shopify store blog publishing',
    authTypes: ['private_app', 'oauth2', 'api_key'],
    capabilities: {
      scheduling: true,
      analytics: true,
      categories: false,
      tags: true,
      media: true,
      products: true,
    },
  },
  webflow: {
    name: 'Webflow',
    description: 'Webflow CMS publishing',
    authTypes: ['api_token', 'oauth2'],
    capabilities: {
      scheduling: false,
      analytics: false,
      categories: true,
      tags: true,
      media: true,
      richText: true,
    },
  },
} as const;

// Helper to get adapter info
export function getAdapterInfo(platformName: string) {
  return ADAPTER_METADATA[platformName as keyof typeof ADAPTER_METADATA];
}

// Helper to check if adapter is available
export function isAdapterAvailable(
  platformName: string,
): platformName is AvailableAdapter {
  return AVAILABLE_ADAPTERS.includes(platformName as AvailableAdapter);
}
