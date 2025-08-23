"use strict";
/**
 * Meta Tag & Schema Markup Generation Service
 * Dynamic meta tag generation, Open Graph tags, Twitter Cards, and JSON-LD schema markup
 * for articles, breadcrumbs, FAQ, How-to, and rich snippet optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaSchemaService = void 0;
const ai_1 = require("ai");
const zod_1 = require("zod");
// Zod schemas for structured AI responses
const MetaTagGenerationSchema = zod_1.z.object({
    metaTags: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        keywords: zod_1.z.string().optional(),
        robots: zod_1.z.string(),
        canonical: zod_1.z.string().optional(),
        openGraph: zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            image: zod_1.z.string(),
            url: zod_1.z.string(),
            type: zod_1.z.string(),
            siteName: zod_1.z.string().optional(),
            locale: zod_1.z.string().optional()
        }),
        twitterCard: zod_1.z.object({
            card: zod_1.z.enum(['summary', 'summary_large_image', 'app', 'player']),
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            image: zod_1.z.string(),
            site: zod_1.z.string().optional(),
            creator: zod_1.z.string().optional()
        }),
        additional: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().optional(),
            property: zod_1.z.string().optional(),
            content: zod_1.z.string()
        }))
    }),
    recommendations: zod_1.z.array(zod_1.z.string()),
    seoScore: zod_1.z.number().min(0).max(100)
});
const FAQExtractionSchema = zod_1.z.object({
    faqs: zod_1.z.array(zod_1.z.object({
        question: zod_1.z.string(),
        answer: zod_1.z.string(),
        relevance: zod_1.z.number().min(0).max(100)
    }))
});
const HowToExtractionSchema = zod_1.z.object({
    howToSteps: zod_1.z.array(zod_1.z.object({
        stepNumber: zod_1.z.number(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        image: zod_1.z.string().optional()
    })),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    totalTime: zod_1.z.string().optional(),
    supplies: zod_1.z.array(zod_1.z.string()).optional(),
    tools: zod_1.z.array(zod_1.z.string()).optional()
});
const BreadcrumbExtractionSchema = zod_1.z.object({
    breadcrumbs: zod_1.z.array(zod_1.z.object({
        position: zod_1.z.number(),
        name: zod_1.z.string(),
        url: zod_1.z.string()
    }))
});
const SchemaAnalysisSchema = zod_1.z.object({
    analysis: zod_1.z.object({
        present: zod_1.z.array(zod_1.z.string()),
        missing: zod_1.z.array(zod_1.z.string()),
        errors: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.string(),
            property: zod_1.z.string(),
            message: zod_1.z.string(),
            severity: zod_1.z.enum(['error', 'warning'])
        })),
        suggestions: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.string(),
            description: zod_1.z.string(),
            impact: zod_1.z.enum(['low', 'medium', 'high']),
            implementation: zod_1.z.string()
        })),
        score: zod_1.z.number().min(0).max(100)
    })
});
/**
 * Meta Tag & Schema Markup Generation Service
 * Comprehensive meta tag and structured data generation for SEO optimization
 */
class MetaSchemaService {
    constructor(config) {
        this.config = {
            cacheResults: true,
            cacheTTL: 24, // 24 hours default
            defaultSite: {
                name: 'My Website',
                url: 'https://example.com'
            },
            ...config
        };
    }
    /**
     * Generate comprehensive meta tags
     */
    async generateMetaTags(request) {
        const prompt = `Generate optimized meta tags for this content:

Title: ${request.title}
Content: ${request.content.substring(0, 1500)}...
Author: ${request.author?.name || 'Not specified'}
Keywords: ${request.keywords?.join(', ') || 'Not specified'}
Category: ${request.category || 'Not specified'}
URL: ${request.url || 'Not specified'}

Generate:
1. SEO-optimized title (30-60 characters)
2. Compelling meta description (150-160 characters)
3. Keywords meta tag if relevant
4. Robots directive
5. Canonical URL if needed
6. Open Graph tags for social sharing
7. Twitter Card tags
8. Additional relevant meta tags

Ensure all tags are optimized for search engines and social media sharing.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: MetaTagGenerationSchema
            });
            const metaTags = result.object.metaTags;
            return {
                title: metaTags.title,
                description: metaTags.description,
                keywords: metaTags.keywords,
                robots: metaTags.robots,
                canonical: metaTags.canonical,
                openGraph: {
                    title: metaTags.openGraph.title,
                    description: metaTags.openGraph.description,
                    image: metaTags.openGraph.image || request.image || '',
                    url: metaTags.openGraph.url || request.url || '',
                    type: metaTags.openGraph.type,
                    siteName: metaTags.openGraph.siteName || this.config.defaultSite?.name,
                    locale: metaTags.openGraph.locale || 'en_US'
                },
                twitterCard: {
                    card: metaTags.twitterCard.card,
                    title: metaTags.twitterCard.title,
                    description: metaTags.twitterCard.description,
                    image: metaTags.twitterCard.image || request.image || '',
                    site: metaTags.twitterCard.site || this.config.defaultSite?.twitterHandle,
                    creator: metaTags.twitterCard.creator
                },
                other: metaTags.additional.map(tag => ({
                    name: tag.name,
                    property: tag.property,
                    content: tag.content
                }))
            };
        }
        catch (error) {
            // Fallback to basic meta tag generation
            return this.generateBasicMetaTags(request);
        }
    }
    /**
     * Generate comprehensive schema markup
     */
    async generateSchemaMarkup(request) {
        const articleSchema = await this.generateArticleSchema(request);
        const breadcrumbSchema = await this.generateBreadcrumbSchema(request.url || '');
        const faqSchema = await this.extractFAQSchema(request.title, '');
        const howToSchema = await this.extractHowToSchema(request.title, '');
        const schema = {
            article: articleSchema
        };
        if (breadcrumbSchema && breadcrumbSchema.itemListElement.length > 0) {
            schema.breadcrumb = breadcrumbSchema;
        }
        if (faqSchema && faqSchema.mainEntity.length > 0) {
            schema.faq = faqSchema;
        }
        if (howToSchema && howToSchema.step.length > 0) {
            schema.howTo = howToSchema;
        }
        // Add organization schema if configured
        if (this.config.defaultOrganization) {
            schema.organization = {
                '@type': 'Organization',
                name: this.config.defaultOrganization.name,
                url: this.config.defaultOrganization.url,
                logo: this.config.defaultOrganization.logo
            };
        }
        // Add website schema
        if (this.config.defaultSite) {
            schema.website = {
                '@type': 'WebSite',
                name: this.config.defaultSite.name,
                url: this.config.defaultSite.url
            };
        }
        return schema;
    }
    /**
     * Generate Article schema markup
     */
    async generateArticleSchema(request) {
        const schemaType = this.determineArticleType(request.contentType);
        const author = {
            '@type': 'Person',
            name: request.author || 'Anonymous'
        };
        const publisher = {
            '@type': 'Organization',
            name: this.config.defaultOrganization?.name || this.config.defaultSite?.name || 'Publisher',
            logo: {
                '@type': 'ImageObject',
                url: this.config.defaultOrganization?.logo || ''
            }
        };
        return {
            '@type': schemaType,
            headline: request.title,
            description: request.description,
            author,
            publisher,
            datePublished: request.publishDate || new Date().toISOString(),
            dateModified: request.modifiedDate || new Date().toISOString(),
            image: request.image ? [request.image] : [],
            mainEntityOfPage: request.url || '',
            wordCount: this.countWords(request.description),
            keywords: request.additionalData?.keywords || []
        };
    }
    /**
     * Extract FAQ schema from content
     */
    async extractFAQSchema(title, content) {
        if (!content.includes('?') || content.length < 500) {
            return null; // Not likely to contain FAQs
        }
        const prompt = `Extract FAQ-style questions and answers from this content:

Title: ${title}
Content: ${content.substring(0, 2000)}...

Look for:
1. Explicit FAQ sections
2. Q&A patterns
3. Questions followed by answers
4. "What is...", "How to...", "Why does..." patterns

Extract only clear, well-formed question-answer pairs that would be valuable for FAQ schema.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: FAQExtractionSchema
            });
            const faqs = result.object.faqs.filter(faq => faq.relevance > 70);
            if (faqs.length === 0) {
                return null;
            }
            return {
                '@type': 'FAQPage',
                mainEntity: faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer
                    }
                }))
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Extract How-to schema from content
     */
    async extractHowToSchema(title, content) {
        const howToKeywords = ['how to', 'step by step', 'tutorial', 'guide', 'instructions'];
        const hasHowToContent = howToKeywords.some(keyword => title.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword));
        if (!hasHowToContent) {
            return null;
        }
        const prompt = `Extract step-by-step instructions from this how-to content:

Title: ${title}
Content: ${content.substring(0, 2000)}...

Extract:
1. Clear, actionable steps in order
2. Step names and descriptions
3. Total time if mentioned
4. Required supplies or tools
5. Any mentioned images for steps

Only extract if there are clear, sequential steps (minimum 3 steps).`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: HowToExtractionSchema
            });
            if (result.object.howToSteps.length < 3) {
                return null;
            }
            return {
                '@type': 'HowTo',
                name: result.object.title,
                description: result.object.description,
                step: result.object.howToSteps.map(step => ({
                    '@type': 'HowToStep',
                    name: step.name,
                    text: step.description,
                    image: step.image
                })),
                totalTime: result.object.totalTime,
                supply: result.object.supplies,
                tool: result.object.tools
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Generate breadcrumb schema
     */
    async generateBreadcrumbSchema(url) {
        if (!url || url.split('/').length < 4) {
            return null; // Not enough path segments for meaningful breadcrumbs
        }
        const prompt = `Generate breadcrumb navigation for this URL: ${url}

Create logical breadcrumb items based on the URL structure:
- Start with the home page
- Include logical category/section pages
- End with the current page
- Use descriptive names, not just URL segments

Example: /blog/seo/keyword-research/ might become:
1. Home
2. Blog
3. SEO
4. Keyword Research

Only include 2-5 breadcrumb items total.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: BreadcrumbExtractionSchema
            });
            if (result.object.breadcrumbs.length < 2) {
                return null;
            }
            return {
                '@type': 'BreadcrumbList',
                itemListElement: result.object.breadcrumbs.map(crumb => ({
                    '@type': 'ListItem',
                    position: crumb.position,
                    name: crumb.name,
                    item: crumb.url
                }))
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Analyze existing schema markup
     */
    async analyzeSchemaMarkup(existingSchema) {
        const schemaTypes = existingSchema.map(schema => schema['@type']).filter(Boolean);
        const prompt = `Analyze this existing schema markup for completeness and errors:

Existing schema types: ${schemaTypes.join(', ')}
Schema data: ${JSON.stringify(existingSchema, null, 2).substring(0, 2000)}...

Analyze:
1. What schema types are present and working correctly
2. What schema types are missing for this content type
3. Any errors or warnings in the existing markup
4. Suggestions for improvement
5. Overall schema SEO score (0-100)

Focus on Article, FAQ, HowTo, Breadcrumb, Organization, and WebSite schemas.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: SchemaAnalysisSchema
            });
            return result.object.analysis;
        }
        catch (error) {
            return {
                present: schemaTypes,
                missing: ['Article', 'Organization', 'WebSite'],
                errors: [],
                suggestions: [{
                        type: 'Article',
                        description: 'Add Article schema for better content understanding',
                        impact: 'high',
                        implementation: 'Add JSON-LD script with Article schema'
                    }],
                score: 30
            };
        }
    }
    /**
     * Generate rich snippet optimized meta tags
     */
    async generateRichSnippetTags(content, targetKeywords) {
        const richSnippetTags = [];
        // Article specific tags
        richSnippetTags.push({
            property: 'article:published_time',
            content: new Date().toISOString()
        }, {
            property: 'article:modified_time',
            content: new Date().toISOString()
        }, {
            property: 'article:section',
            content: this.extractPrimaryCategory(content, targetKeywords)
        });
        // Add reading time estimate
        const wordCount = this.countWords(content);
        const readingTime = Math.ceil(wordCount / 200); // Assuming 200 WPM
        richSnippetTags.push({
            name: 'twitter:label1',
            content: 'Reading time'
        }, {
            name: 'twitter:data1',
            content: `${readingTime} min read`
        });
        // Add word count for rich snippets
        richSnippetTags.push({
            name: 'twitter:label2',
            content: 'Word count'
        }, {
            name: 'twitter:data2',
            content: `${wordCount} words`
        });
        return richSnippetTags;
    }
    /**
     * Validate schema markup
     */
    validateSchemaMarkup(schema) {
        const errors = [];
        try {
            // Basic validation
            if (!schema['@type']) {
                errors.push('Missing @type property');
            }
            // Article schema validation
            if (schema['@type'] === 'Article' || schema['@type'] === 'BlogPosting') {
                if (!schema.headline)
                    errors.push('Article missing headline');
                if (!schema.author)
                    errors.push('Article missing author');
                if (!schema.datePublished)
                    errors.push('Article missing datePublished');
                if (!schema.image)
                    errors.push('Article missing image');
            }
            // FAQ schema validation
            if (schema['@type'] === 'FAQPage') {
                if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
                    errors.push('FAQ missing mainEntity array');
                }
                else {
                    schema.mainEntity.forEach((item, index) => {
                        if (item['@type'] !== 'Question') {
                            errors.push(`FAQ item ${index + 1} is not a Question`);
                        }
                        if (!item.name) {
                            errors.push(`FAQ question ${index + 1} missing name`);
                        }
                        if (!item.acceptedAnswer || item.acceptedAnswer['@type'] !== 'Answer') {
                            errors.push(`FAQ question ${index + 1} missing valid acceptedAnswer`);
                        }
                    });
                }
            }
            // HowTo schema validation
            if (schema['@type'] === 'HowTo') {
                if (!schema.name)
                    errors.push('HowTo missing name');
                if (!schema.step || !Array.isArray(schema.step)) {
                    errors.push('HowTo missing step array');
                }
            }
            return {
                valid: errors.length === 0,
                errors
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: ['Schema validation failed: Invalid JSON structure']
            };
        }
    }
    /**
     * Private helper methods
     */
    generateBasicMetaTags(request) {
        // Generate basic meta tags as fallback
        const title = request.title.length > 60 ?
            request.title.substring(0, 57) + '...' : request.title;
        const description = request.excerpt ||
            request.content.substring(0, 155).replace(/\s+\S*$/, '') + '...';
        return {
            title,
            description,
            keywords: request.keywords?.slice(0, 10).join(', '),
            robots: 'index, follow',
            canonical: request.url,
            openGraph: {
                title,
                description,
                image: request.image || '',
                url: request.url || '',
                type: 'article',
                siteName: this.config.defaultSite?.name,
                locale: 'en_US'
            },
            twitterCard: {
                card: 'summary_large_image',
                title,
                description,
                image: request.image || '',
                site: this.config.defaultSite?.twitterHandle,
                creator: request.author?.name
            },
            other: []
        };
    }
    determineArticleType(contentType) {
        if (!contentType)
            return 'Article';
        switch (contentType.toLowerCase()) {
            case 'blog_post':
            case 'blog':
                return 'BlogPosting';
            case 'news':
                return 'NewsArticle';
            default:
                return 'Article';
        }
    }
    countWords(text) {
        if (!text)
            return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    extractPrimaryCategory(content, keywords) {
        // Simple heuristic to extract primary category
        if (keywords && keywords.length > 0) {
            return keywords[0].split(' ')[0];
        }
        // Fallback to common categories
        const categories = ['technology', 'business', 'health', 'education', 'lifestyle', 'finance', 'marketing', 'seo'];
        const lowerContent = content.toLowerCase();
        for (const category of categories) {
            if (lowerContent.includes(category)) {
                return category.charAt(0).toUpperCase() + category.slice(1);
            }
        }
        return 'General';
    }
    /**
     * Generate meta tag HTML
     */
    generateMetaTagHTML(metaTags) {
        const html = [];
        // Basic meta tags
        html.push(`<title>${metaTags.title}</title>`);
        html.push(`<meta name="description" content="${metaTags.description}">`);
        if (metaTags.keywords) {
            html.push(`<meta name="keywords" content="${metaTags.keywords}">`);
        }
        html.push(`<meta name="robots" content="${metaTags.robots}">`);
        if (metaTags.canonical) {
            html.push(`<link rel="canonical" href="${metaTags.canonical}">`);
        }
        // Open Graph tags
        const og = metaTags.openGraph;
        html.push(`<meta property="og:title" content="${og.title}">`);
        html.push(`<meta property="og:description" content="${og.description}">`);
        html.push(`<meta property="og:type" content="${og.type}">`);
        html.push(`<meta property="og:url" content="${og.url}">`);
        if (og.image) {
            html.push(`<meta property="og:image" content="${og.image}">`);
        }
        if (og.siteName) {
            html.push(`<meta property="og:site_name" content="${og.siteName}">`);
        }
        if (og.locale) {
            html.push(`<meta property="og:locale" content="${og.locale}">`);
        }
        // Twitter Card tags
        const twitter = metaTags.twitterCard;
        html.push(`<meta name="twitter:card" content="${twitter.card}">`);
        html.push(`<meta name="twitter:title" content="${twitter.title}">`);
        html.push(`<meta name="twitter:description" content="${twitter.description}">`);
        if (twitter.image) {
            html.push(`<meta name="twitter:image" content="${twitter.image}">`);
        }
        if (twitter.site) {
            html.push(`<meta name="twitter:site" content="${twitter.site}">`);
        }
        if (twitter.creator) {
            html.push(`<meta name="twitter:creator" content="${twitter.creator}">`);
        }
        // Additional meta tags
        for (const tag of metaTags.other) {
            if (tag.name) {
                html.push(`<meta name="${tag.name}" content="${tag.content}">`);
            }
            else if (tag.property) {
                html.push(`<meta property="${tag.property}" content="${tag.content}">`);
            }
        }
        return html.join('\n');
    }
    /**
     * Generate schema markup HTML
     */
    generateSchemaHTML(schema) {
        const schemaArray = [];
        // Add Article schema
        if (schema.article) {
            schemaArray.push({
                '@context': 'https://schema.org',
                ...schema.article
            });
        }
        // Add Breadcrumb schema
        if (schema.breadcrumb) {
            schemaArray.push({
                '@context': 'https://schema.org',
                ...schema.breadcrumb
            });
        }
        // Add FAQ schema
        if (schema.faq) {
            schemaArray.push({
                '@context': 'https://schema.org',
                ...schema.faq
            });
        }
        // Add HowTo schema
        if (schema.howTo) {
            schemaArray.push({
                '@context': 'https://schema.org',
                ...schema.howTo
            });
        }
        // Add Organization schema
        if (schema.organization) {
            schemaArray.push({
                '@context': 'https://schema.org',
                ...schema.organization
            });
        }
        // Add Website schema
        if (schema.website) {
            schemaArray.push({
                '@context': 'https://schema.org',
                ...schema.website
            });
        }
        // Add custom schemas
        if (schema.custom) {
            schemaArray.push(...schema.custom.map(customSchema => ({
                '@context': 'https://schema.org',
                ...customSchema
            })));
        }
        return `<script type="application/ld+json">
${JSON.stringify(schemaArray, null, 2)}
</script>`;
    }
}
exports.MetaSchemaService = MetaSchemaService;
