

/**
 * Webflow Platform Adapter Usage Example
 * Demonstrates how to use the WebflowAdapter for CMS publishing
 */

import {
  WebflowAdapter,
  MultiPlatformPublisher,
  createPlatformCredentials
} from '../src/index';
import type {
  BlogPost,
  WebflowCredentials,
  WebflowConfig,
  FormattedContent,
  PublishResult
} from '../src/index';

/**
 * Basic Webflow Adapter Setup and Usage
 */
async function basicWebflowExample() {
  console.log('=== Basic Webflow Adapter Example ===');
  
  // 1. Configure Webflow adapter
  const webflowConfig: WebflowConfig = {
    siteId: 'your_webflow_site_id_here',
    apiVersion: 'v1',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  };
  
  const webflowAdapter = new WebflowAdapter(webflowConfig);
  
  // 2. Set up credentials for API token authentication
  const webflowCredentials: WebflowCredentials = {
    type: 'api_token',
    apiToken: 'your_webflow_api_token_here',
    siteId: 'your_webflow_site_id_here',
    collectionId: 'your_blog_collection_id_here' // Optional - will auto-detect
  };
  
  const platformCredentials = createPlatformCredentials('webflow', webflowCredentials);
  
  try {
    // 3. Authenticate with Webflow
    console.log('Authenticating with Webflow...');
    const authResult = await webflowAdapter.authenticate(platformCredentials);
    
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error}`);
    }
    
    console.log('✅ Authentication successful');
    console.log('Site:', authResult.userInfo?.name);
    
    // 4. Create a sample blog post with rich content
    const blogPost: BlogPost = {
      title: "The Future of Web Design: Trends to Watch in 2024",
      content: `
        Web design continues to evolve at a rapid pace. Here are the key trends shaping the industry in 2024:
        
        ## 1. Immersive 3D Experiences
        
        Three-dimensional elements are becoming more accessible and performant. Modern browsers now support advanced 3D graphics that create engaging user experiences without sacrificing performance.
        
        **Key Benefits:**
        - Enhanced user engagement
        - Memorable brand experiences
        - Improved product visualization
        
        ## 2. Sustainable Web Design
        
        Environmental consciousness is driving more efficient web design practices:
        
        - **Optimized Assets**: Smaller file sizes and efficient loading
        - **Green Hosting**: Renewable energy-powered servers
        - **Minimal Design**: Less is more for both aesthetics and sustainability
        
        ## 3. Advanced Typography
        
        Typography is taking center stage with:
        
        1. **Variable Fonts**: More flexibility with smaller file sizes
        2. **Custom Lettering**: Unique brand expressions
        3. **Dynamic Text Effects**: CSS animations and interactions
        
        ## 4. Voice User Interfaces
        
        With the rise of voice assistants, websites are adapting to voice navigation and commands.
        
        > "The future of web design lies in creating experiences that adapt to how users naturally want to interact with technology." - Design Expert
        
        ## Implementation Tips
        
        To stay ahead of these trends:
        
        - Experiment with new technologies in small doses
        - Always prioritize user experience over flashy effects
        - Test across devices and accessibility standards
        - Monitor performance impact of new features
        
        The web design landscape continues to evolve, and staying informed about these trends will help create more effective and engaging digital experiences.
      `,
      excerpt: "Explore the cutting-edge web design trends shaping 2024, from immersive 3D experiences to sustainable design practices.",
      tags: ['web design', 'design trends', '2024', 'UX', 'UI', 'technology'],
      keywords: ['web design trends 2024', 'future web design', '3D web experiences', 'sustainable design'],
      author: 'Design Team',
      authorEmail: 'design@agency.com',
      publishedAt: new Date(),
      status: 'published',
      seoTitle: "Web Design Trends 2024: The Future of Digital Experiences",
      seoDescription: "Discover the top web design trends for 2024, including 3D experiences, sustainable design, and advanced typography. Stay ahead of the curve.",
      focusKeyword: 'web design trends 2024',
      format: 'markdown',
      wordCount: 450
    };
    
    // 5. Format content for Webflow CMS
    console.log('\nFormatting content for Webflow...');
    const formattedContent = await webflowAdapter.formatContent(blogPost);
    
    console.log('✅ Content formatted successfully');
    console.log('Format:', formattedContent.format);
    console.log('Word count:', formattedContent.adaptedWordCount);
    console.log('Adaptation score:', formattedContent.adaptationScore);
    
    // 6. Validate content before publishing
    console.log('\nValidating content...');
    const validation = await webflowAdapter.validateContent(formattedContent);
    
    if (!validation.isValid) {
      console.log('❌ Content validation failed:');
      validation.errors.forEach(error => console.log(`  - ${error.message}`));
      return;
    }
    
    console.log('✅ Content validation passed');
    if (validation.warnings.length > 0) {
      console.log('Warnings:');
      validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning.message}`));
    }
    
    // 7. Publish to Webflow CMS
    console.log('\nPublishing to Webflow...');
    const publishResult = await webflowAdapter.publish(formattedContent, {
      status: 'published'
    });
    
    if (!publishResult.success) {
      throw new Error(`Publishing failed: ${publishResult.error}`);
    }
    
    console.log('✅ Content published successfully!');
    console.log('External ID:', publishResult.externalId);
    console.log('External URL:', publishResult.externalUrl);
    console.log('Published at:', publishResult.publishedAt);
    
    // 8. Get platform analytics (basic stats)
    console.log('\nFetching analytics...');
    const analytics = await webflowAdapter.getAnalytics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date()
    });
    
    console.log('Analytics summary:');
    console.log('- Estimated page views:', analytics.pageViews);
    console.log('- Estimated unique visitors:', analytics.uniqueVisitors);
    console.log('- Average session duration:', analytics.avgSessionDuration, 'seconds');
    console.log('- Total CMS items:', analytics.platformSpecificMetrics.totalItems);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Advanced Webflow Features Example
 */
async function advancedWebflowExample() {
  console.log('\n=== Advanced Webflow Features Example ===');
  
  const webflowConfig: WebflowConfig = {
    siteId: 'advanced_site_id',
    apiVersion: 'v1'
  };
  
  const webflowAdapter = new WebflowAdapter(webflowConfig);
  
  // Using OAuth2 authentication
  const webflowCredentials: WebflowCredentials = {
    type: 'oauth2',
    accessToken: 'your_oauth2_access_token_here',
    siteId: 'advanced_site_id',
    collectionId: 'blog_collection_id'
  };
  
  const platformCredentials = createPlatformCredentials('webflow', webflowCredentials);
  
  try {
    await webflowAdapter.authenticate(platformCredentials);
    
    // 1. Rich content blog post with advanced formatting
    const richContentPost: BlogPost = {
      title: "Mastering Responsive Design: A Complete Guide",
      content: `
        <div class="hero-section">
          <h1>Responsive Design Mastery</h1>
          <p class="lead">Creating websites that work beautifully on every device</p>
        </div>
        
        <div class="content-section">
          <h2>The Foundation of Responsive Design</h2>
          
          <p>Responsive web design is no longer optional—it's essential. With users accessing websites from countless devices, creating flexible layouts is crucial for success.</p>
          
          <div class="highlight-box">
            <h3>Key Principles</h3>
            <ul>
              <li><strong>Fluid Grids:</strong> Use relative units instead of fixed pixels</li>
              <li><strong>Flexible Images:</strong> Scale images proportionally</li>
              <li><strong>Media Queries:</strong> Apply CSS rules based on device characteristics</li>
            </ul>
          </div>
          
          <h2>Advanced Techniques</h2>
          
          <div class="two-column-layout">
            <div class="column">
              <h3>Container Queries</h3>
              <p>The next evolution of responsive design allows components to respond to their container size rather than viewport size.</p>
              
              <code class="code-block">
                @container (min-width: 400px) {
                  .card {
                    display: flex;
                    gap: 1rem;
                  }
                }
              </code>
            </div>
            
            <div class="column">
              <h3>Intrinsic Web Design</h3>
              <p>Move beyond traditional breakpoints to create layouts that adapt naturally to content and context.</p>
              
              <blockquote>
                "Intrinsic web design is about designing with the grain of the web, not against it."
              </blockquote>
            </div>
          </div>
          
          <h2>Testing and Optimization</h2>
          
          <div class="checklist">
            <h3>Responsive Testing Checklist</h3>
            <ul class="checklist-items">
              <li>✅ Test on actual devices, not just browser tools</li>
              <li>✅ Verify touch targets are appropriately sized</li>
              <li>✅ Check loading performance on slower networks</li>
              <li>✅ Validate accessibility across all breakpoints</li>
              <li>✅ Test form usability on mobile devices</li>
            </ul>
          </div>
        </div>
        
        <div class="conclusion">
          <p>Mastering responsive design is an ongoing journey. As new devices and browsing contexts emerge, we must continue adapting our approach while maintaining the core principles of flexibility and user-centered design.</p>
        </div>
      `,
      excerpt: "Learn advanced responsive design techniques and best practices for creating websites that adapt beautifully to any device.",
      tags: ['responsive design', 'web development', 'CSS', 'mobile-first', 'UX'],
      keywords: ['responsive design', 'mobile-first design', 'CSS Grid', 'Flexbox', 'web development'],
      author: 'Development Team',
      publishedAt: new Date(),
      status: 'published',
      images: [
        {
          id: 'hero-image',
          filename: 'responsive-design-hero.jpg',
          url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
          mimeType: 'image/jpeg',
          size: 245760,
          dimensions: { width: 1200, height: 800 },
          altText: 'Multiple devices showing responsive website layouts',
          caption: 'Responsive design adapts to any screen size'
        }
      ]
    };
    
    // 2. Create as draft first
    console.log('Creating draft content...');
    const draftContent = await webflowAdapter.formatContent(richContentPost);
    
    const draftResult = await webflowAdapter.publish(draftContent, {
      status: 'draft'
    });
    
    if (draftResult.success) {
      console.log('✅ Draft created successfully');
      console.log('Draft ID:', draftResult.externalId);
      
      // 3. Update the draft with additional content
      const updatedPost = {
        ...richContentPost,
        title: "Mastering Responsive Design: The Complete 2024 Guide",
        content: richContentPost.content + `
          <div class="update-section">
            <h2>2024 Updates</h2>
            <p>New additions include Container Queries support and enhanced mobile viewport handling.</p>
          </div>
        `
      };
      
      console.log('Updating draft...');
      const updatedContent = await webflowAdapter.formatContent(updatedPost);
      const updateResult = await webflowAdapter.update(
        draftResult.externalId!,
        updatedContent,
        { status: 'published' }
      );
      
      if (updateResult.success) {
        console.log('✅ Content updated and published');
        console.log('Updated URL:', updateResult.externalUrl);
      }
    }
    
    // 4. Get collection information
    console.log('\nFetching collection fields...');
    const customFields = await webflowAdapter.getCustomFields();
    console.log('Available fields in collection:');
    customFields.forEach(field => {
      console.log(`- ${field.name} (${field.type})`);
    });
    
    // 5. Check rate limits
    const rateLimit = await webflowAdapter.getRateLimit();
    console.log('\nRate limit status:');
    console.log('- Limit:', rateLimit.limit, 'requests per minute');
    console.log('- Remaining:', rateLimit.remaining);
    console.log('- Reset time:', rateLimit.resetTime);
    
    // 6. Health check
    const health = await webflowAdapter.healthCheck();
    console.log('\nPlatform health:', health.status);
    console.log('Response time:', health.responseTime, 'ms');
    
  } catch (error) {
    console.error('❌ Error in advanced example:', error.message);
  }
}

/**
 * Multi-Platform Publishing with Webflow
 */
async function multiPlatformWithWebflow() {
  console.log('\n=== Multi-Platform Publishing with Webflow ===');
  
  const multiPublisher = new MultiPlatformPublisher();
  
  // Add Webflow adapter to multi-platform publisher
  const webflowAdapter = new WebflowAdapter({
    siteId: 'multi_platform_site_id',
    apiVersion: 'v1'
  });
  
  const webflowCredentials: WebflowCredentials = {
    type: 'api_token',
    apiToken: 'your_api_token_here',
    siteId: 'multi_platform_site_id'
  };
  
  await multiPublisher.addPlatform(
    webflowAdapter,
    createPlatformCredentials('webflow', webflowCredentials)
  );
  
  // Create content optimized for design-focused platforms
  const designBlogPost: BlogPost = {
    title: "Color Theory in Digital Design: A Practical Guide",
    content: `
      Color is one of the most powerful tools in a designer's toolkit. Understanding color theory can transform your digital designs from good to exceptional.
      
      ## The Color Wheel Foundation
      
      Every color relationship starts with the basic color wheel:
      
      - **Primary Colors**: Red, Blue, Yellow
      - **Secondary Colors**: Green, Orange, Purple  
      - **Tertiary Colors**: Combinations of primary and secondary
      
      ## Psychological Impact of Colors
      
      Colors evoke emotions and influence behavior:
      
      ### Warm Colors (Red, Orange, Yellow)
      - Create energy and excitement
      - Draw attention and encourage action
      - Perfect for call-to-action buttons
      
      ### Cool Colors (Blue, Green, Purple)
      - Convey trust and professionalism
      - Create calming, peaceful feelings
      - Ideal for backgrounds and large areas
      
      ### Neutral Colors (Gray, Brown, Beige)
      - Provide balance and sophistication
      - Serve as excellent supporting colors
      - Allow other colors to stand out
      
      ## Practical Color Schemes
      
      ### 1. Monochromatic
      Using different shades and tints of a single color creates harmony and elegance.
      
      ### 2. Analogous
      Colors next to each other on the color wheel create pleasing, comfortable combinations.
      
      ### 3. Complementary
      Opposite colors create high contrast and vibrant, attention-grabbing designs.
      
      ### 4. Triadic
      Three colors equally spaced on the wheel offer vibrant contrast while maintaining harmony.
      
      ## Digital Design Applications
      
      ### Web Design
      - Use high contrast for accessibility
      - Limit your palette to 3-5 colors
      - Consider dark mode alternatives
      
      ### Brand Identity
      - Choose colors that reflect brand personality
      - Test colors across different mediums
      - Create comprehensive brand guidelines
      
      ### User Interface
      - Maintain consistency across all elements
      - Use color to guide user attention
      - Ensure sufficient contrast for readability
      
      ## Tools and Resources
      
      Professional color tools to enhance your workflow:
      
      - **Adobe Color**: Create and explore color palettes
      - **Coolors**: Generate beautiful color schemes quickly
      - **Contrast Checkers**: Ensure accessibility compliance
      - **Color Hunt**: Discover trending color palettes
      
      ## Best Practices
      
      1. **Start with purpose**: What emotion or action do you want to evoke?
      2. **Consider your audience**: Cultural associations with colors vary
      3. **Test in context**: Colors look different against various backgrounds
      4. **Maintain accessibility**: Ensure sufficient contrast ratios
      5. **Stay consistent**: Use your chosen palette throughout the design
      
      Remember, color theory provides guidelines, not rules. Trust your eye and don't be afraid to experiment while keeping these principles in mind.
    `,
    excerpt: "Master the fundamentals of color theory and learn how to apply them effectively in digital design projects.",
    tags: ['color theory', 'digital design', 'UI/UX', 'branding', 'web design'],
    keywords: ['color theory digital design', 'color psychology', 'design principles', 'web design colors'],
    author: 'Creative Team',
    publishedAt: new Date(),
    status: 'published',
    images: [
      {
        id: 'color-wheel',
        filename: 'color-wheel-guide.png',
        url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
        mimeType: 'image/png',
        size: 156789,
        dimensions: { width: 800, height: 600 },
        altText: 'Traditional color wheel showing primary, secondary, and tertiary colors',
        caption: 'The foundation of all color relationships'
      }
    ]
  };
  
  try {
    // Publish to Webflow with design-optimized settings
    const result = await multiPublisher.publishToSelected(blogPost, ['webflow'], {
      adaptContentPerPlatform: true,
      platformSpecificOptions: {
        webflow: {
          status: 'published',
          customFields: {
            'featured': true,
            'category': 'design-theory',
            'difficulty-level': 'intermediate'
          }
        }
      }
    });
    
    console.log('Multi-platform publishing result:');
    console.log('- Success:', result.success);
    console.log('- Success count:', result.successCount);
    
    if (result.results.webflow) {
      console.log('- Webflow URL:', result.results.webflow.externalUrl);
    }
    
    // Get content-specific analytics
    if (result.results.webflow?.externalId) {
      const contentAnalytics = await webflowAdapter.getContentAnalytics(
        result.results.webflow.externalId,
        {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endDate: new Date()
        }
      );
      
      console.log('\nContent-specific analytics:');
      console.log('- Views:', contentAnalytics.views);
      console.log('- Unique views:', contentAnalytics.uniqueViews);
      console.log('- Published:', contentAnalytics.publishedAt);
    }
    
  } catch (error) {
    console.error('❌ Error in multi-platform publishing:', error.message);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🌐 Webflow Platform Adapter Examples\n');
  
  await basicWebflowExample();
  await advancedWebflowExample();
  await multiPlatformWithWebflow();
  
  console.log('\n✨ All examples completed!');
}

// Export for use in other files
export {
  basicWebflowExample,
  advancedWebflowExample,
  multiPlatformWithWebflow,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

