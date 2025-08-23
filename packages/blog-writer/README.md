
# AI SDK Blog Writer

> Intelligent blog content generation and optimization for the AI SDK ecosystem.

The AI SDK Blog Writer extends the [Vercel AI SDK](https://sdk.vercel.ai/) with specialized capabilities for creating high-quality, SEO-optimized blog content. Built on the same architecture and patterns as the core AI SDK, it provides a seamless experience for generating, optimizing, and managing blog content.

## Features

### 🚀 Intelligent Content Generation
- **Template-based generation** with 10+ pre-built blog templates
- **Smart content structure** with automated heading organization
- **Context-aware writing** that adapts tone and style to your audience
- **Research integration** for data-driven content creation

### 🎯 SEO Optimization Engine
- **Comprehensive SEO analysis** with 100-point scoring system
- **Keyword optimization** with density analysis and placement recommendations
- **Meta tag generation** for titles, descriptions, and social media
- **Content structure optimization** for better search visibility

### 🔍 Content Research Tools
- **Topic research** with competitive analysis
- **Keyword discovery** including long-tail and trending keywords
- **Content gap analysis** to identify opportunities
- **Audience insight generation** for targeted content

### 📊 Quality Assurance
- **Content validation** with detailed error reporting
- **Readability analysis** with grade-level scoring
- **Performance suggestions** for engagement optimization
- **Version management** with change tracking

## Installation

```bash
npm install @ai-sdk/blog-writer ai
```

## Quick Start

```typescript
import { openai } from '@ai-sdk/openai';
import { generateBlog } from '@ai-sdk/blog-writer';

// Generate a complete blog post
const result = await generateBlog({
  model: openai('gpt-4'),
  topic: 'How to Build a Personal Brand Online',
  template: 'howto',
  keywords: ['personal branding', 'online presence', 'digital marketing'],
  wordCount: { min: 1500, max: 2500 },
  tone: 'professional',
  audience: 'entrepreneurs and professionals',
});

console.log(result.blogPost.metadata.title);
console.log(`Generated ${result.metadata.wordCount} words`);
```

## Blog Templates

The library includes 10 pre-built templates optimized for different content types:

| Template | Use Case | Typical Length |
|----------|----------|----------------|
| `howto` | Step-by-step guides | 800-2500 words |
| `listicle` | List-based articles | 1000-3000 words |
| `comparison` | Product/service comparisons | 1200-2500 words |
| `tutorial` | In-depth educational content | 1500-3500 words |
| `news` | News and announcements | 600-2000 words |
| `review` | Product/service reviews | 800-2000 words |
| `guide` | Comprehensive guides | 2000-5000 words |
| `case-study` | Success stories and analysis | 1200-2500 words |
| `opinion` | Editorial and opinion pieces | 1000-2500 words |
| `interview` | Q&A format content | 1200-3000 words |

## Content Research

```typescript
import { researchTopic } from '@ai-sdk/blog-writer';

// Research a topic before writing
const research = await researchTopic(openai('gpt-4'), {
  topic: 'Artificial Intelligence in Healthcare',
  depth: 'comprehensive',
  audience: 'healthcare professionals',
  includeTrends: true,
  includeCompetitors: true,
});

// Use research data in blog generation
const blog = await generateBlog({
  model: openai('gpt-4'),
  topic: research.topic,
  keywords: research.keywords.primary.slice(0, 5).map(k => k.keyword),
  research: research,
});
```

## SEO Optimization

```typescript
import { analyzeSEO, optimizeSEO } from '@ai-sdk/blog-writer';

// Analyze SEO performance
const analysis = await analyzeSEO(openai('gpt-4'), blogPost);
console.log(`SEO Score: ${analysis.score}/100`);

// Get optimization recommendations
analysis.recommendations.forEach(rec => {
  console.log(`${rec.type.toUpperCase()}: ${rec.message}`);
});

// Auto-optimize content
const optimized = await optimizeSEO(openai('gpt-4'), blogPost, {
  keywords: { primary: 'target keyword' },
  meta: { title: true, description: true },
  content: { optimizeHeadings: true },
});
```

## Advanced Usage

### Custom Templates

```typescript
import { generateBlog } from '@ai-sdk/blog-writer';

const customBlog = await generateBlog({
  model: openai('gpt-4'),
  topic: 'Your Topic Here',
  template: 'guide',
  templateVariables: {
    productName: 'Your Product',
    targetAudience: 'developers',
    keyFeatures: ['feature1', 'feature2', 'feature3'],
  },
  seo: {
    focusKeyword: 'main keyword',
    metaDescription: 'Custom meta description',
  },
});
```

### Batch Processing

```typescript
import { generateBlog } from '@ai-sdk/blog-writer';

const topics = [
  'Topic 1',
  'Topic 2', 
  'Topic 3',
];

const blogs = await Promise.all(
  topics.map(topic => 
    generateBlog({
      model: openai('gpt-4'),
      topic,
      template: 'howto',
    })
  )
);
```

### Content Series Generation

```typescript
const seriesTopics = [
  { topic: 'Introduction to Digital Marketing', template: 'guide' },
  { topic: 'How to Create a Marketing Strategy', template: 'howto' },
  { topic: '10 Essential Marketing Tools', template: 'listicle' },
];

const series = [];
for (const item of seriesTopics) {
  const blog = await generateBlog({
    model: openai('gpt-4'),
    topic: item.topic,
    template: item.template,
    context: `Part ${series.length + 1} of ${seriesTopics.length} in Digital Marketing series`,
  });
  series.push(blog);
}
```

## API Reference

### Core Functions

#### `generateBlog(options)`
Generates a complete blog post with the specified options.

**Options:**
- `model` - Language model to use
- `topic` - Blog post topic
- `template` - Template type (optional, defaults to 'howto')
- `keywords` - Target keywords array
- `wordCount` - Word count range `{ min, max }`
- `tone` - Writing tone
- `audience` - Target audience
- `seo` - SEO optimization options

**Returns:** `GenerateBlogResult` with blog post, metadata, and suggestions.

#### `researchTopic(model, config)`
Conducts comprehensive research on a given topic.

**Parameters:**
- `model` - Language model to use
- `config` - Research configuration object

**Returns:** `ContentResearchResult` with research insights.

#### `analyzeSEO(model, blogPost)`
Analyzes SEO performance of a blog post.

**Parameters:**
- `model` - Language model to use  
- `blogPost` - Blog post to analyze

**Returns:** `SEOAnalysis` with scores and recommendations.

### Types

The library exports comprehensive TypeScript types:

- `BlogPost` - Complete blog post structure
- `BlogAIConfig` - Configuration for blog generation
- `SEOAnalysis` - SEO analysis results
- `ContentResearchResult` - Research findings
- `BlogTemplate` - Available template types

## Integration with Existing AI SDK

The Blog Writer seamlessly integrates with your existing AI SDK setup:

```typescript
// Use with any AI SDK provider
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { generateBlog } from '@ai-sdk/blog-writer';

// Works with Anthropic
const claudeBlog = await generateBlog({
  model: anthropic('claude-3-haiku'),
  topic: 'Your topic',
});

// Works with Google
const gemini = await generateBlog({
  model: google('models/gemini-pro'),
  topic: 'Your topic',
});
```

## Examples

See the `/examples` directory for comprehensive usage examples:

- `basic-usage.ts` - Simple blog generation
- `advanced-usage.ts` - Complex workflows and batch processing
- `custom-templates.ts` - Creating and using custom templates
- `seo-optimization.ts` - SEO analysis and optimization workflows

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Support

- [Documentation](https://ai-sdk.dev/docs/blog-writer)
- [GitHub Issues](https://github.com/tindevelopers/ai-blog-writer-sdk/issues)
- [Discord Community](https://discord.gg/ai-sdk)

---

Built with ❤️ by the AI SDK team
