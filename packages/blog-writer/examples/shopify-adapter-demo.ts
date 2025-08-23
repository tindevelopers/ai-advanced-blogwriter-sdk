

/**
 * Shopify Platform Adapter Usage Example
 * Demonstrates how to use the ShopifyAdapter for publishing blog content
 */

import {
  ShopifyAdapter,
  MultiPlatformPublisher,
  createPlatformCredentials
} from '../src/index';
import type {
  BlogPost,
  ShopifyCredentials,
  ShopifyConfig,
  FormattedContent,
  PublishResult
} from '../src/index';

/**
 * Basic Shopify Adapter Setup and Usage
 */
async function basicShopifyExample() {
  console.log('=== Basic Shopify Adapter Example ===');
  
  // 1. Configure Shopify adapter
  const shopifyConfig: ShopifyConfig = {
    storeUrl: 'my-awesome-store.myshopify.com',
    apiVersion: '2024-01',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  };
  
  const shopifyAdapter = new ShopifyAdapter(shopifyConfig);
  
  // 2. Set up credentials for private app
  const shopifyCredentials: ShopifyCredentials = {
    type: 'private_app',
    storeUrl: 'my-awesome-store.myshopify.com',
    accessToken: 'shpat_your_private_app_access_token_here',
    scopes: ['write_content', 'read_content']
  };
  
  const platformCredentials = createPlatformCredentials('shopify', shopifyCredentials);
  
  try {
    // 3. Authenticate with Shopify
    console.log('Authenticating with Shopify...');
    const authResult = await shopifyAdapter.authenticate(platformCredentials);
    
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error}`);
    }
    
    console.log('✅ Authentication successful');
    console.log('Store:', authResult.userInfo?.name);
    
    // 4. Create a sample blog post
    const blogPost: BlogPost = {
      title: "10 Must-Have Products for Spring 2024",
      content: `
        Spring is here, and it's time to refresh your wardrobe and lifestyle! 
        
        Here are our top 10 must-have products for the season:
        
        ## Fashion Forward
        
        1. **Lightweight Blazers** - Perfect for those cool spring mornings
        2. **Floral Dresses** - Embrace the season with beautiful prints
        3. **[product:white-sneakers]** - Comfortable and versatile footwear
        
        ## Home & Garden
        
        4. **Outdoor Planters** - Start your spring garden in style
        5. **[product:patio-furniture-set]** - Create the perfect outdoor space
        
        ## Tech & Accessories
        
        6. **Wireless Earbuds** - Perfect for your morning jogs
        7. **Smartwatch** - Track your fitness goals
        
        Ready to embrace spring? Check out our full collection!
      `,
      excerpt: "Discover the top 10 must-have products for Spring 2024, from fashion to home decor and tech accessories.",
      tags: ['spring', 'fashion', 'lifestyle', 'products', 'shopping'],
      keywords: ['spring products', 'fashion trends', 'lifestyle items', 'shopping guide'],
      author: 'Style Team',
      authorEmail: 'style@mystore.com',
      publishedAt: new Date(),
      status: 'published',
      seoTitle: "Top 10 Must-Have Products for Spring 2024 | My Awesome Store",
      seoDescription: "Discover the latest spring trends and must-have products. Shop our curated collection of fashion, home, and tech items for the season.",
      focusKeyword: 'spring products 2024',
      format: 'markdown',
      wordCount: 250
    };
    
    // 5. Format content for Shopify
    console.log('\nFormatting content for Shopify...');
    const formattedContent = await shopifyAdapter.formatContent(blogPost);
    
    console.log('✅ Content formatted successfully');
    console.log('Word count:', formattedContent.adaptedWordCount);
    console.log('Adaptation score:', formattedContent.adaptationScore);
    
    // 6. Validate content before publishing
    console.log('\nValidating content...');
    const validation = await shopifyAdapter.validateContent(formattedContent);
    
    if (!validation.isValid) {
      console.log('❌ Content validation failed:');
      validation.errors.forEach(error => console.log(`  - ${error.message}`));
      return;
    }
    
    console.log('✅ Content validation passed');
    
    // 7. Publish to Shopify
    console.log('\nPublishing to Shopify...');
    const publishResult = await shopifyAdapter.publish(formattedContent, {
      status: 'published',
      tags: ['spring-2024', 'product-guide']
    });
    
    if (!publishResult.success) {
      throw new Error(`Publishing failed: ${publishResult.error}`);
    }
    
    console.log('✅ Blog post published successfully!');
    console.log('External ID:', publishResult.externalId);
    console.log('External URL:', publishResult.externalUrl);
    console.log('Published at:', publishResult.publishedAt);
    
    // 8. Get platform analytics
    console.log('\nFetching analytics...');
    const analytics = await shopifyAdapter.getAnalytics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date()
    });
    
    console.log('Analytics summary:');
    console.log('- Page views:', analytics.pageViews);
    console.log('- Unique visitors:', analytics.uniqueVisitors);
    console.log('- Top content:', analytics.topContent.slice(0, 3));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Advanced Shopify Features Example
 */
async function advancedShopifyExample() {
  console.log('\n=== Advanced Shopify Features Example ===');
  
  const shopifyConfig: ShopifyConfig = {
    storeUrl: 'advanced-store.myshopify.com',
    apiVersion: '2024-01'
  };
  
  const shopifyAdapter = new ShopifyAdapter(shopifyConfig);
  
  const shopifyCredentials: ShopifyCredentials = {
    type: 'oauth2',
    storeUrl: 'advanced-store.myshopify.com',
    accessToken: 'your_oauth2_access_token_here',
    scopes: ['write_content', 'read_content', 'read_products']
  };
  
  const platformCredentials = createPlatformCredentials('shopify', shopifyCredentials);
  
  try {
    await shopifyAdapter.authenticate(platformCredentials);
    
    // 1. Product-focused blog post with product integration
    const productBlogPost: BlogPost = {
      title: "Style Your Summer Look with Our New Collection",
      content: `
        Summer is all about expressing your unique style! Our new collection has everything you need.
        
        ## Featured Products
        
        Check out our top picks:
        - [product:summer-dress-floral] - Perfect for beach days
        - [product:sandals-leather-brown] - Comfortable and stylish
        - [product:sunglasses-aviator] - Classic protection
        
        ## Styling Tips
        
        1. **Mix and Match**: Don't be afraid to combine different pieces
        2. **Accessorize**: Small details make a big difference
        3. **Comfort First**: Choose pieces you feel confident wearing
        
        Shop the full collection and get 20% off your first order!
      `,
      excerpt: "Discover how to style your summer look with our new collection. Get expert tips and shop our featured products.",
      tags: ['summer', 'fashion', 'style', 'collection'],
      keywords: ['summer fashion', 'style guide', 'new collection'],
      author: 'Fashion Team',
      publishedAt: new Date(),
      status: 'published'
    };
    
    // 2. Schedule content for future publication
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    
    const formattedContent = await shopifyAdapter.formatContent(productBlogPost);
    
    console.log('Scheduling blog post...');
    const scheduleResult = await shopifyAdapter.schedule(
      formattedContent,
      futureDate,
      { status: 'published' }
    );
    
    if (scheduleResult.success) {
      console.log('✅ Content scheduled successfully');
      console.log('Schedule ID:', scheduleResult.scheduleId);
      console.log('Scheduled for:', scheduleResult.scheduledTime);
    }
    
    // 3. Get available tags for content categorization
    console.log('\nFetching available tags...');
    const tags = await shopifyAdapter.getTags();
    console.log('Available tags:', tags.slice(0, 10).map(tag => tag.name));
    
    // 4. Check rate limits
    const rateLimit = await shopifyAdapter.getRateLimit();
    console.log('\nRate limit status:');
    console.log('- Limit:', rateLimit.limit);
    console.log('- Remaining:', rateLimit.remaining);
    console.log('- Reset time:', rateLimit.resetTime);
    
    // 5. Health check
    const health = await shopifyAdapter.healthCheck();
    console.log('\nPlatform health:', health.status);
    if (health.warnings?.length) {
      console.log('Warnings:', health.warnings);
    }
    
  } catch (error) {
    console.error('❌ Error in advanced example:', error.message);
  }
}

/**
 * Multi-Platform Publishing with Shopify
 */
async function multiPlatformWithShopify() {
  console.log('\n=== Multi-Platform Publishing with Shopify ===');
  
  const multiPublisher = new MultiPlatformPublisher();
  
  // Add Shopify adapter to multi-platform publisher
  const shopifyAdapter = new ShopifyAdapter({
    storeUrl: 'multi-store.myshopify.com',
    apiVersion: '2024-01'
  });
  
  const shopifyCredentials: ShopifyCredentials = {
    type: 'private_app',
    storeUrl: 'multi-store.myshopify.com',
    accessToken: 'your_access_token_here'
  };
  
  await multiPublisher.addPlatform(
    shopifyAdapter,
    createPlatformCredentials('shopify', shopifyCredentials)
  );
  
  // Create content optimized for multiple platforms
  const blogPost: BlogPost = {
    title: "The Ultimate Guide to Sustainable Living",
    content: `
      Living sustainably doesn't have to be complicated. Here's how to start:
      
      ## Small Changes, Big Impact
      
      1. **Reduce Single-Use Items**
         - Use reusable water bottles
         - Carry cloth shopping bags
         - Choose products with minimal packaging
      
      2. **Energy Efficiency**
         - Switch to LED bulbs
         - Unplug devices when not in use
         - Use programmable thermostats
      
      3. **Sustainable Shopping**
         - Buy local when possible
         - Choose quality over quantity
         - Support eco-friendly brands
      
      ## Featured Eco-Friendly Products
      
      - [product:bamboo-toothbrush-set] - Biodegradable oral care
      - [product:reusable-water-bottle-steel] - Stay hydrated sustainably
      - [product:organic-cotton-bags] - Perfect for shopping
      
      Every small step counts toward a more sustainable future!
    `,
    excerpt: "Discover practical tips for sustainable living and shop our eco-friendly product collection.",
    tags: ['sustainability', 'eco-friendly', 'lifestyle', 'environment'],
    keywords: ['sustainable living', 'eco-friendly products', 'green lifestyle'],
    author: 'Sustainability Team',
    publishedAt: new Date(),
    status: 'published'
  };
  
  try {
    // Publish to Shopify (and potentially other platforms)
    const result = await multiPublisher.publishToSelected(blogPost, ['shopify'], {
      adaptContentPerPlatform: true,
      platformSpecificOptions: {
        shopify: {
          tags: ['sustainability', 'eco-products'],
          status: 'published'
        }
      }
    });
    
    console.log('Multi-platform publishing result:');
    console.log('- Success:', result.success);
    console.log('- Success count:', result.successCount);
    console.log('- Results:', result.results);
    
    // Get aggregated analytics across platforms
    const aggregatedAnalytics = await multiPublisher.getAggregatedAnalytics(['shopify']);
    console.log('\nAggregated analytics:');
    console.log('- Total views:', aggregatedAnalytics.totalViews);
    console.log('- Total engagements:', aggregatedAnalytics.totalEngagements);
    
  } catch (error) {
    console.error('❌ Error in multi-platform publishing:', error.message);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🛍️  Shopify Platform Adapter Examples\n');
  
  await basicShopifyExample();
  await advancedShopifyExample();
  await multiPlatformWithShopify();
  
  console.log('\n✨ All examples completed!');
}

// Export for use in other files
export {
  basicShopifyExample,
  advancedShopifyExample,
  multiPlatformWithShopify,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

