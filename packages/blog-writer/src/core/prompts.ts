
import type { BlogTemplateConfig, BlogTemplateContext } from '../types/templates';

/**
 * Blog prompt creation options
 */
export interface BlogPromptOptions {
  /** Blog topic */
  topic: string;
  
  /** Template configuration */
  template: BlogTemplateConfig;
  
  /** Template variables */
  variables?: Record<string, any>;
  
  /** Target keywords */
  keywords?: string[];
  
  /** Content constraints */
  constraints?: {
    wordCount?: { min?: number; max?: number };
    tone?: string;
    style?: string;
  };
  
  /** Target audience */
  audience?: string;
  
  /** Additional context */
  context?: string;
}

/**
 * Create a comprehensive blog generation prompt
 */
export function createBlogPrompt(options: BlogPromptOptions): string {
  const {
    topic,
    template,
    variables = {},
    keywords = [],
    constraints = {},
    audience,
    context,
  } = options;
  
  let prompt = `You are an expert content writer tasked with creating a comprehensive ${template.name.toLowerCase()} about "${topic}".

## Content Requirements

**Template**: ${template.name}
**Description**: ${template.description}

**Topic**: ${topic}
${audience ? `**Target Audience**: ${audience}` : ''}
${keywords.length > 0 ? `**Keywords to Include**: ${keywords.join(', ')}` : ''}
${constraints.tone ? `**Tone**: ${constraints.tone}` : ''}
${constraints.style ? `**Style**: ${constraints.style}` : ''}
${context ? `**Additional Context**: ${context}` : ''}

## Content Structure

Follow this structure for the ${template.name}:

`;

  // Add template structure details
  template.structure.forEach((section, index) => {
    prompt += `${index + 1}. **${section.title}**${section.required ? ' (Required)' : ' (Optional)'}
   - ${section.description || section.prompt || 'No description provided'}
   - Content Type: ${section.contentType}
   ${section.wordCount ? `- Word Count: ${section.wordCount.min}-${section.wordCount.max} words` : ''}

`;
  });
  
  // Add word count constraints
  if (constraints.wordCount?.min || constraints.wordCount?.max) {
    prompt += `## Word Count Requirements
`;
    if (constraints.wordCount.min) {
      prompt += `- Minimum: ${constraints.wordCount.min} words\n`;
    }
    if (constraints.wordCount.max) {
      prompt += `- Maximum: ${constraints.wordCount.max} words\n`;
    }
  } else if (template.seoSettings?.wordCount) {
    prompt += `## Word Count Requirements
- Target Range: ${template.seoSettings.wordCount.min}-${template.seoSettings.wordCount.max} words

`;
  }
  
  // Add SEO guidelines
  if (keywords.length > 0) {
    prompt += `## SEO Guidelines
- Naturally incorporate the following keywords: ${keywords.join(', ')}
- Aim for keyword density between ${template.seoSettings?.keywordDensity?.min || 0.01} and ${template.seoSettings?.keywordDensity?.max || 0.03}
- Use keywords in headings, first paragraph, and throughout the content
- Create SEO-friendly headings (H1, H2, H3) with keywords when appropriate

`;
  }
  
  // Add quality guidelines
  if (template.guidelines) {
    prompt += `## Quality Guidelines
${template.guidelines.tone ? `- **Tone**: ${template.guidelines.tone}` : ''}
${template.guidelines.style ? `- **Style**: ${template.guidelines.style}` : ''}
${template.guidelines.requiredSections?.length ? `- **Must Include**: ${template.guidelines.requiredSections.join(', ')}` : ''}
${template.guidelines.optionalSections?.length ? `- **Optional Sections**: ${template.guidelines.optionalSections.join(', ')}` : ''}

`;
  }
  
  // Add template variables if provided
  if (Object.keys(variables).length > 0) {
    prompt += `## Template Variables
Use these specific values in your content:
`;
    Object.entries(variables).forEach(([key, value]) => {
      prompt += `- **${key}**: ${value}\n`;
    });
    prompt += '\n';
  }
  
  // Add final instructions
  prompt += `## Output Requirements

Create a comprehensive, engaging, and well-structured blog post that:

1. **Follows the template structure** outlined above
2. **Incorporates all keywords naturally** without keyword stuffing
3. **Provides genuine value** to the target audience
4. **Uses clear, engaging headings** that guide readers through the content
5. **Includes practical examples** and actionable advice where appropriate
6. **Maintains consistent tone and style** throughout
7. **Has a compelling introduction** that hooks the reader
8. **Ends with a strong conclusion** and call-to-action

## Content Format

Return the content as a JSON object with:
- **title**: An engaging, keyword-optimized title
- **excerpt**: A compelling 2-3 sentence summary
- **content**: Full blog post content in markdown format with proper headings
- **tableOfContents**: Array of heading objects with title, anchor, and level

Make sure the content is original, informative, and engaging while following SEO best practices.`;

  return prompt;
}

/**
 * Create SEO optimization prompt
 */
export function createSEOPrompt(options: {
  content: string;
  title: string;
  keywords?: string[];
  focusKeyword?: string;
}): string {
  return `Analyze and provide SEO recommendations for this blog post:

**Title**: ${options.title}
**Focus Keyword**: ${options.focusKeyword || 'Not specified'}
**Target Keywords**: ${options.keywords?.join(', ') || 'None specified'}

**Content Preview**: ${options.content.substring(0, 1000)}...

Please analyze the content and provide:

1. **SEO Score** (0-100) with breakdown by category:
   - Title optimization
   - Meta description quality
   - Keyword usage and density
   - Heading structure
   - Content length and quality
   - Internal linking opportunities

2. **Specific Recommendations** prioritized by impact:
   - Critical issues that must be fixed
   - Important improvements for better ranking
   - Minor optimizations for enhancement

3. **Keyword Analysis**:
   - Keyword density analysis
   - Keyword placement assessment
   - Related keyword suggestions

4. **Content Improvements**:
   - Structure and readability suggestions
   - Missing topics or sections
   - Engagement optimization tips

Return detailed, actionable recommendations that will improve search engine visibility and user experience.`;
}

/**
 * Create content research prompt
 */
export function createResearchPrompt(options: {
  topic: string;
  keywords?: string[];
  audience?: string;
  depth?: 'basic' | 'detailed' | 'comprehensive';
}): string {
  const depth = options.depth || 'detailed';
  
  return `Conduct ${depth} research for the following topic: "${options.topic}"

**Research Parameters**:
- **Topic**: ${options.topic}
- **Keywords**: ${options.keywords?.join(', ') || 'Not specified'}
- **Target Audience**: ${options.audience || 'General audience'}
- **Research Depth**: ${depth}

**Research Requirements**:

1. **Topic Overview**:
   - Comprehensive summary of the topic
   - Key concepts and terminology
   - Current relevance and importance
   - Related subtopics worth exploring

2. **Keyword Research**:
   - Primary keyword opportunities
   - Long-tail keyword suggestions
   - Related search terms
   - Search intent analysis

3. **Content Opportunities**:
   - Content gaps in existing material
   - Unique angles and perspectives
   - Frequently asked questions
   - Trending aspects of the topic

4. **Audience Insights**:
   - Target audience characteristics
   - Pain points and challenges
   - Information needs and preferences
   - Content consumption patterns

${depth === 'comprehensive' ? `
5. **Competitive Analysis**:
   - Top-performing content in this space
   - Common content structures
   - Missing elements in competitor content
   - Opportunities for differentiation

6. **Expert Perspectives**:
   - Industry expert viewpoints
   - Authoritative sources to reference
   - Current debates or discussions
   - Future trends and predictions
` : ''}

Provide comprehensive research that will inform the creation of high-quality, competitive content on this topic.`;
}

/**
 * Create content optimization prompt
 */
export function createOptimizationPrompt(options: {
  content: string;
  goals: string[];
  currentMetrics?: Record<string, number>;
}): string {
  return `Analyze this content and provide optimization recommendations:

**Content**: ${options.content.substring(0, 2000)}...

**Optimization Goals**: ${options.goals.join(', ')}

${options.currentMetrics ? `**Current Metrics**: ${JSON.stringify(options.currentMetrics, null, 2)}` : ''}

Please provide specific recommendations to:

1. **Improve Readability**:
   - Sentence structure improvements
   - Paragraph organization
   - Transition improvements
   - Clarity enhancements

2. **Enhance Engagement**:
   - Hook optimization
   - Storytelling elements
   - Interactive components
   - Call-to-action improvements

3. **SEO Optimization**:
   - Keyword integration
   - Heading structure
   - Meta element optimization
   - Internal linking opportunities

4. **Content Structure**:
   - Information hierarchy
   - Section organization
   - Flow and coherence
   - Missing elements

Provide actionable, prioritized recommendations with expected impact on the specified goals.`;
}
