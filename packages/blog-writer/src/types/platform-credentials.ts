/**
 * Platform-specific credential types
 * Extension of the platform integration framework
 */

import type { PlatformCredentials } from './platform-integration';

// ===== SHOPIFY CREDENTIALS =====

export interface ShopifyCredentials {
  type: 'private_app' | 'oauth2' | 'api_key';
  storeUrl: string;
  accessToken?: string; // For private apps and OAuth2
  apiKey?: string;
  apiSecret?: string;
  scopes?: string[];
}

export interface ShopifyConfig {
  storeUrl: string; // e.g., mystore.myshopify.com
  apiVersion?: string; // Default: '2024-01'
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// ===== WEBFLOW CREDENTIALS =====

export interface WebflowCredentials {
  type: 'api_token' | 'oauth2';
  apiToken?: string;
  accessToken?: string;
  siteId: string;
  collectionId?: string;
}

export interface WebflowConfig {
  siteId: string;
  apiVersion?: string; // Default: 'v1'
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// ===== EXISTING PLATFORM CREDENTIALS =====

export interface WordPressCredentials {
  type: 'api_key' | 'oauth2' | 'application_password';
  username?: string;
  password?: string; // Application password
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  siteUrl?: string;
}

export interface MediumCredentials {
  type: 'integration_token';
  integrationToken: string;
  authorId?: string;
}

export interface LinkedInCredentials {
  type: 'oauth2';
  accessToken: string;
  personId?: string;
  organizationId?: string;
  expiresAt?: Date;
}

// ===== UNIFIED CREDENTIAL FACTORY =====

export type PlatformSpecificCredentials =
  | ShopifyCredentials
  | WebflowCredentials
  | WordPressCredentials
  | MediumCredentials
  | LinkedInCredentials;

export function createPlatformCredentials(
  platform: string,
  credentialData: PlatformSpecificCredentials,
): PlatformCredentials {
  return {
    type: getAuthenticationType(credentialData.type as string),
    data: credentialData,
    scopes: 'scopes' in credentialData ? credentialData.scopes : undefined,
    expiresAt:
      'expiresAt' in credentialData ? credentialData.expiresAt : undefined,
  };
}

function getAuthenticationType(
  type: string,
): 'api_key' | 'oauth2' | 'token' | 'basic_auth' | 'jwt' | 'custom' {
  switch (type) {
    case 'private_app':
    case 'api_key':
    case 'api_token':
    case 'integration_token':
    case 'application_password':
      return 'api_key';
    case 'oauth2':
      return 'oauth2';
    case 'token':
      return 'token';
    case 'basic_auth':
      return 'basic_auth';
    case 'jwt':
      return 'jwt';
    default:
      return 'custom';
  }
}

// ===== CREDENTIAL VALIDATION =====

export interface CredentialValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CredentialValidator {
  static validateShopifyCredentials(
    credentials: ShopifyCredentials,
  ): CredentialValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!credentials.storeUrl) {
      errors.push('Store URL is required');
    } else if (!credentials.storeUrl.includes('.myshopify.com')) {
      warnings.push('Store URL should be in format: store.myshopify.com');
    }

    if (credentials.type === 'private_app' || credentials.type === 'oauth2') {
      if (!credentials.accessToken) {
        errors.push(
          'Access token is required for private app and OAuth2 authentication',
        );
      }
    }

    if (credentials.type === 'api_key') {
      if (!credentials.apiKey || !credentials.apiSecret) {
        errors.push(
          'API key and secret are required for API key authentication',
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateWebflowCredentials(
    credentials: WebflowCredentials,
  ): CredentialValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!credentials.siteId) {
      errors.push('Site ID is required');
    }

    if (credentials.type === 'api_token') {
      if (!credentials.apiToken) {
        errors.push('API token is required for token authentication');
      }
    }

    if (credentials.type === 'oauth2') {
      if (!credentials.accessToken) {
        errors.push('Access token is required for OAuth2 authentication');
      }
    }

    if (!credentials.collectionId) {
      warnings.push(
        'Collection ID not specified - will attempt to find blog collection automatically',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateWordPressCredentials(
    credentials: WordPressCredentials,
  ): CredentialValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (credentials.type === 'application_password') {
      if (!credentials.username || !credentials.password) {
        errors.push('Username and application password are required');
      }
    }

    if (credentials.type === 'oauth2') {
      if (!credentials.clientId || !credentials.clientSecret) {
        errors.push('Client ID and secret are required for OAuth2');
      }
    }

    if (!credentials.siteUrl) {
      errors.push('Site URL is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
