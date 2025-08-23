"use strict";
/**
 * Readability & Content Scoring Service
 * Comprehensive readability analysis, content structure scoring, engagement optimization,
 * SEO compliance scoring, and overall content quality metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadabilityScoringService = void 0;
const ai_1 = require("ai");
const zod_1 = require("zod");
// Zod schemas for structured AI responses
const ReadabilityAnalysisSchema = zod_1.z.object({
    analysis: zod_1.z.object({
        complexity: zod_1.z.object({
            sentenceLength: zod_1.z.object({
                average: zod_1.z.number(),
                min: zod_1.z.number(),
                max: zod_1.z.number(),
                variance: zod_1.z.number(),
                score: zod_1.z.number().min(0).max(100)
            }),
            wordComplexity: zod_1.z.object({
                averageSyllables: zod_1.z.number(),
                complexWords: zod_1.z.number(),
                percentageComplex: zod_1.z.number(),
                score: zod_1.z.number().min(0).max(100)
            }),
            passiveVoice: zod_1.z.object({
                count: zod_1.z.number(),
                percentage: zod_1.z.number(),
                score: zod_1.z.number().min(0).max(100)
            })
        }),
        structure: zod_1.z.object({
            paragraphLength: zod_1.z.object({
                average: zod_1.z.number(),
                variance: zod_1.z.number(),
                score: zod_1.z.number().min(0).max(100)
            }),
            listUsage: zod_1.z.object({
                count: zod_1.z.number(),
                appropriateUse: zod_1.z.boolean(),
                score: zod_1.z.number().min(0).max(100)
            }),
            headingDistribution: zod_1.z.object({
                count: zod_1.z.number(),
                distribution: zod_1.z.array(zod_1.z.number()),
                score: zod_1.z.number().min(0).max(100)
            })
        }),
        engagement: zod_1.z.object({
            hooks: zod_1.z.array(zod_1.z.string()),
            questions: zod_1.z.number(),
            callsToAction: zod_1.z.number(),
            personalPronouns: zod_1.z.number(),
            transitionWords: zod_1.z.number(),
            score: zod_1.z.number().min(0).max(100)
        }),
        suggestions: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum(['sentence_length', 'word_complexity', 'paragraph_length', 'passive_voice', 'structure', 'engagement']),
            priority: zod_1.z.enum(['low', 'medium', 'high']),
            description: zod_1.z.string(),
            examples: zod_1.z.array(zod_1.z.string()).optional(),
            expectedImprovement: zod_1.z.number().min(0).max(100)
        }))
    }),
    overallScore: zod_1.z.number().min(0).max(100),
    targetAudienceMatch: zod_1.z.number().min(0).max(100)
});
const ContentQualityAnalysisSchema = zod_1.z.object({
    quality: zod_1.z.object({
        expertise: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            indicators: zod_1.z.array(zod_1.z.string()),
            improvements: zod_1.z.array(zod_1.z.string())
        }),
        authoritativeness: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            indicators: zod_1.z.array(zod_1.z.string()),
            improvements: zod_1.z.array(zod_1.z.string())
        }),
        trustworthiness: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            indicators: zod_1.z.array(zod_1.z.string()),
            improvements: zod_1.z.array(zod_1.z.string())
        }),
        originality: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            uniqueInsights: zod_1.z.array(zod_1.z.string()),
            improvements: zod_1.z.array(zod_1.z.string())
        }),
        depth: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            coverage: zod_1.z.array(zod_1.z.string()),
            gaps: zod_1.z.array(zod_1.z.string())
        }),
        usefulness: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            practicalValue: zod_1.z.array(zod_1.z.string()),
            improvements: zod_1.z.array(zod_1.z.string())
        })
    }),
    recommendations: zod_1.z.array(zod_1.z.object({
        priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        category: zod_1.z.enum(['content', 'structure', 'seo', 'readability', 'engagement']),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        action: zod_1.z.string(),
        impact: zod_1.z.number().min(0).max(100),
        effort: zod_1.z.enum(['low', 'medium', 'high'])
    }))
});
const SEOComplianceSchema = zod_1.z.object({
    compliance: zod_1.z.object({
        keywordUsage: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            naturalness: zod_1.z.number().min(0).max(100),
            density: zod_1.z.number(),
            distribution: zod_1.z.number().min(0).max(100)
        }),
        contentLength: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            optimal: zod_1.z.boolean(),
            currentWords: zod_1.z.number(),
            recommendedRange: zod_1.z.object({
                min: zod_1.z.number(),
                max: zod_1.z.number()
            })
        }),
        titleOptimization: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            keywordPresence: zod_1.z.boolean(),
            lengthOptimal: zod_1.z.boolean(),
            clickworthiness: zod_1.z.number().min(0).max(100)
        }),
        metaDescription: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            present: zod_1.z.boolean(),
            keywordPresence: zod_1.z.boolean(),
            lengthOptimal: zod_1.z.boolean()
        }),
        headingStructure: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            h1Count: zod_1.z.number(),
            keywordInHeadings: zod_1.z.boolean(),
            properHierarchy: zod_1.z.boolean()
        }),
        internalLinks: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            count: zod_1.z.number(),
            relevance: zod_1.z.number().min(0).max(100)
        }),
        imageOptimization: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            altTextPresent: zod_1.z.number().min(0).max(1),
            keywordInAlt: zod_1.z.boolean()
        })
    }),
    overallSeoScore: zod_1.z.number().min(0).max(100)
});
/**
 * Readability & Content Scoring Service
 * Comprehensive content analysis for readability, quality, and SEO compliance
 */
class ReadabilityScoringService {
    constructor(config) {
        this.config = {
            targetAudience: 'general',
            contentType: 'blog',
            cacheResults: true,
            cacheTTL: 12, // 12 hours default
            ...config
        };
    }
    /**
     * Perform comprehensive readability analysis
     */
    async analyzeReadability(request) {
        const content = request.content;
        // Calculate basic readability metrics
        const basicMetrics = this.calculateBasicReadability(content);
        // Enhance with AI analysis if enabled
        let aiAnalysis = null;
        if (request.includeSuggestions) {
            aiAnalysis = await this.performAIReadabilityAnalysis(request);
        }
        const readingLevel = this.determineReadingLevel(basicMetrics.fleschKincaidGrade);
        const suggestions = [];
        // Generate suggestions based on analysis
        if (basicMetrics.fleschKincaidGrade > 12) {
            suggestions.push({
                type: 'sentence_length',
                description: 'Reduce sentence length to improve readability',
                impact: 'high',
                examples: ['Break long sentences into shorter ones', 'Use more periods instead of commas']
            });
        }
        if (basicMetrics.averageSentenceLength > 20) {
            suggestions.push({
                type: 'sentence_length',
                description: 'Average sentence length is too high',
                impact: 'medium',
                examples: ['Aim for 15-20 words per sentence on average']
            });
        }
        // Add AI-generated suggestions if available
        if (aiAnalysis?.analysis?.suggestions) {
            suggestions.push(...aiAnalysis.analysis.suggestions.map((s) => ({
                type: s.type,
                description: s.description,
                impact: s.priority,
                examples: s.examples || []
            })));
        }
        return {
            fleschKincaidGrade: basicMetrics.fleschKincaidGrade,
            fleschReadingEase: basicMetrics.fleschReadingEase,
            gunningFog: basicMetrics.gunningFog,
            colemanLiau: basicMetrics.colemanLiau,
            automatedReadabilityIndex: basicMetrics.automatedReadabilityIndex,
            averageScore: basicMetrics.averageScore,
            readingLevel,
            suggestions
        };
    }
    /**
     * Calculate comprehensive content quality score
     */
    async calculateContentQuality(request) {
        const readabilityMetrics = await this.analyzeReadability({
            content: request.content,
            targetAudience: request.targetAudience,
            includeSuggestions: true
        });
        const seoCompliance = await this.analyzeSEOCompliance(request);
        // Enhanced AI-powered quality analysis
        const qualityAnalysis = await this.performAIQualityAnalysis(request);
        // Calculate component scores
        const components = {
            readability: this.scoreReadability(readabilityMetrics),
            structure: this.scoreStructure(request.content),
            engagement: this.scoreEngagement(request.content),
            seo: seoCompliance.overallSeoScore,
            expertise: qualityAnalysis?.quality?.expertise?.score || 70
        };
        // Calculate overall score with weights
        const weights = {
            readability: 0.20,
            structure: 0.20,
            engagement: 0.20,
            seo: 0.25,
            expertise: 0.15
        };
        const overall = Object.entries(components).reduce((total, [key, score]) => {
            return total + (score * (weights[key] || 0));
        }, 0);
        // Generate quality factors
        const factors = [
            {
                name: 'Readability',
                score: components.readability,
                weight: weights.readability,
                description: 'How easy the content is to read and understand'
            },
            {
                name: 'Structure',
                score: components.structure,
                weight: weights.structure,
                description: 'Content organization and formatting'
            },
            {
                name: 'Engagement',
                score: components.engagement,
                weight: weights.engagement,
                description: 'How engaging and compelling the content is'
            },
            {
                name: 'SEO Optimization',
                score: components.seo,
                weight: weights.seo,
                description: 'Search engine optimization compliance'
            },
            {
                name: 'Expertise',
                score: components.expertise,
                weight: weights.expertise,
                description: 'Depth of knowledge and authority demonstrated'
            }
        ];
        // Generate recommendations
        const recommendations = [];
        // Add recommendations based on low scores
        if (components.readability < 70) {
            recommendations.push({
                priority: 'high',
                category: 'readability',
                title: 'Improve Content Readability',
                description: 'Content is difficult to read for the target audience',
                action: 'Simplify language, shorten sentences, and improve paragraph structure',
                impact: 85,
                effort: 'medium'
            });
        }
        if (components.seo < 60) {
            recommendations.push({
                priority: 'critical',
                category: 'seo',
                title: 'Optimize for Search Engines',
                description: 'Content lacks proper SEO optimization',
                action: 'Improve keyword usage, meta tags, and content structure',
                impact: 90,
                effort: 'medium'
            });
        }
        if (components.engagement < 60) {
            recommendations.push({
                priority: 'medium',
                category: 'engagement',
                title: 'Increase Content Engagement',
                description: 'Content may not hold reader attention effectively',
                action: 'Add more hooks, questions, examples, and interactive elements',
                impact: 70,
                effort: 'medium'
            });
        }
        // Add AI-generated recommendations
        if (qualityAnalysis?.recommendations) {
            recommendations.push(...qualityAnalysis.recommendations);
        }
        return {
            overall: Math.round(overall),
            components,
            factors,
            recommendations
        };
    }
    /**
     * Analyze SEO compliance
     */
    async analyzeSEOCompliance(request) {
        const prompt = `Analyze SEO compliance for this content:

Title: ${request.title}
Content: ${request.content.substring(0, 2000)}...
Word Count: ${request.wordCount || this.countWords(request.content)}
Target Keywords: ${request.targetKeywords?.join(', ') || 'Not specified'}
Internal Links: ${request.links?.internal || 0}
External Links: ${request.links?.external || 0}
Images: ${request.images || 0}

Analyze SEO compliance across:
1. Keyword usage and optimization
2. Content length and structure
3. Title and meta optimization potential
4. Heading structure and keyword placement
5. Internal linking opportunities
6. Image optimization potential

Provide specific scores and recommendations.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: SEOComplianceSchema
            });
            const compliance = result.object.compliance;
            return {
                overallSeoScore: result.object.overallSeoScore,
                keywordOptimization: compliance.keywordUsage.score,
                contentStructure: (compliance.headingStructure.score + compliance.contentLength.score) / 2,
                technicalSEO: (compliance.internalLinks.score + compliance.imageOptimization.score) / 2
            };
        }
        catch (error) {
            // Fallback scoring
            return this.basicSEOScoring(request);
        }
    }
    /**
     * Calculate engagement score
     */
    scoreEngagement(content) {
        let score = 0;
        const lowerContent = content.toLowerCase();
        // Check for engaging elements
        const questions = (content.match(/\?/g) || []).length;
        const exclamations = (content.match(/!/g) || []).length;
        const personalPronouns = (lowerContent.match(/\b(you|your|we|our|us|i|me|my)\b/g) || []).length;
        const transitionWords = (lowerContent.match(/\b(however|therefore|meanwhile|furthermore|moreover|additionally|consequently|thus|hence|nevertheless|nonetheless)\b/g) || []).length;
        const listsAndBullets = (content.match(/^\s*[-*+•]/gm) || []).length;
        // Score based on engagement factors
        score += Math.min(questions * 5, 25); // Questions boost engagement
        score += Math.min(exclamations * 3, 15); // Exclamations (but don't overuse)
        score += Math.min(personalPronouns * 0.5, 20); // Personal pronouns create connection
        score += Math.min(transitionWords * 2, 20); // Good flow
        score += Math.min(listsAndBullets * 2, 20); // Lists improve readability
        return Math.min(score, 100);
    }
    /**
     * Score content structure
     */
    scoreStructure(content) {
        let score = 0;
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const headings = (content.match(/^#+\s/gm) || []).length;
        const lists = (content.match(/^\s*[-*+•]/gm) || []).length;
        const averageParagraphLength = paragraphs.reduce((sum, p) => sum + this.countWords(p), 0) / paragraphs.length;
        // Paragraph structure (30 points)
        if (averageParagraphLength >= 50 && averageParagraphLength <= 150) {
            score += 30;
        }
        else if (averageParagraphLength <= 200) {
            score += 20;
        }
        else {
            score += 10;
        }
        // Heading usage (25 points)
        const wordCount = this.countWords(content);
        const headingRatio = headings / (wordCount / 100); // Headings per 100 words
        if (headingRatio >= 0.5 && headingRatio <= 2) {
            score += 25;
        }
        else if (headingRatio > 0) {
            score += 15;
        }
        // List usage (20 points)
        if (lists > 0) {
            score += Math.min(lists * 5, 20);
        }
        // Content length appropriateness (25 points)
        if (wordCount >= 800) {
            score += 25;
        }
        else if (wordCount >= 500) {
            score += 20;
        }
        else if (wordCount >= 300) {
            score += 15;
        }
        else {
            score += 5;
        }
        return Math.min(score, 100);
    }
    /**
     * Score readability metrics
     */
    scoreReadability(metrics) {
        const targetGrade = 8; // 8th grade level is generally optimal
        const gradeDiff = Math.abs(metrics.fleschKincaidGrade - targetGrade);
        let score = 100;
        // Penalize for being too far from target grade level
        score -= gradeDiff * 5;
        // Flesch Reading Ease should be 60-80 for general audience
        if (metrics.fleschReadingEase >= 60 && metrics.fleschReadingEase <= 80) {
            score += 10;
        }
        else if (metrics.fleschReadingEase >= 50 && metrics.fleschReadingEase <= 90) {
            score += 5;
        }
        else {
            score -= 10;
        }
        return Math.max(0, Math.min(score, 100));
    }
    /**
     * Perform AI-powered readability analysis
     */
    async performAIReadabilityAnalysis(request) {
        const prompt = `Analyze the readability and writing quality of this content:

Content: ${request.content.substring(0, 2000)}...
Target Audience: ${request.targetAudience || 'General'}
Target Grade Level: ${request.targetGrade || 8}

Analyze:
1. Sentence complexity and length variation
2. Word complexity and vocabulary level
3. Passive voice usage
4. Paragraph structure and flow
5. Use of lists and formatting
6. Heading distribution and effectiveness
7. Engagement factors (hooks, questions, CTAs)
8. Transition words and coherence

Provide specific improvement suggestions with examples and expected impact.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: ReadabilityAnalysisSchema
            });
            return result.object;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Perform AI-powered content quality analysis
     */
    async performAIQualityAnalysis(request) {
        const prompt = `Analyze the overall quality of this content using E-A-T principles:

Title: ${request.title}
Content: ${request.content.substring(0, 2000)}...
Content Type: ${request.contentType || 'Blog'}
Target Keywords: ${request.targetKeywords?.join(', ') || 'Not specified'}

Analyze for:
1. EXPERTISE: Depth of knowledge, technical accuracy, professional insights
2. AUTHORITATIVENESS: Industry authority, credible sources, professional tone
3. TRUSTWORTHINESS: Transparency, source citations, factual accuracy
4. ORIGINALITY: Unique insights, fresh perspectives, original research
5. DEPTH: Comprehensive coverage, detailed explanations, thorough analysis
6. USEFULNESS: Practical value, actionable advice, problem-solving

Provide specific scores (0-100) and actionable improvement recommendations.`;
        try {
            const result = await (0, ai_1.generateObject)({
                model: this.config.model,
                prompt,
                schema: ContentQualityAnalysisSchema
            });
            return result.object;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Basic readability calculations
     */
    calculateBasicReadability(content) {
        const sentences = this.countSentences(content);
        const words = this.countWords(content);
        const syllables = this.countSyllables(content);
        if (sentences === 0 || words === 0) {
            return {
                fleschKincaidGrade: 0,
                fleschReadingEase: 0,
                gunningFog: 0,
                colemanLiau: 0,
                automatedReadabilityIndex: 0,
                averageScore: 0,
                averageSentenceLength: 0
            };
        }
        const avgWordsPerSentence = words / sentences;
        const avgSyllablesPerWord = syllables / words;
        // Flesch Reading Ease
        const fleschReadingEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        // Flesch-Kincaid Grade Level
        const fleschKincaidGrade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
        // Gunning Fog Index
        const complexWords = this.countComplexWords(content);
        const gunningFog = 0.4 * (avgWordsPerSentence + (100 * complexWords / words));
        // Coleman-Liau Index
        const characters = content.replace(/\s+/g, '').length;
        const avgCharsPerWord = characters / words;
        const avgSentencesPer100Words = (sentences / words) * 100;
        const colemanLiau = (0.0588 * ((characters / words) * 100)) - (0.296 * avgSentencesPer100Words) - 15.8;
        // Automated Readability Index (ARI)
        const automatedReadabilityIndex = (4.71 * avgCharsPerWord) + (0.5 * avgWordsPerSentence) - 21.43;
        // Average of all scores
        const averageScore = (fleschKincaidGrade + gunningFog + colemanLiau + automatedReadabilityIndex) / 4;
        return {
            fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
            fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
            gunningFog: Math.max(0, gunningFog),
            colemanLiau: Math.max(0, colemanLiau),
            automatedReadabilityIndex: Math.max(0, automatedReadabilityIndex),
            averageScore: Math.max(0, averageScore),
            averageSentenceLength: avgWordsPerSentence
        };
    }
    /**
     * Basic SEO scoring fallback
     */
    basicSEOScoring(request) {
        let keywordScore = 0;
        let structureScore = 0;
        let technicalScore = 0;
        const wordCount = request.wordCount || this.countWords(request.content);
        const hasKeywords = request.targetKeywords && request.targetKeywords.length > 0;
        // Keyword optimization
        if (hasKeywords) {
            const keywordDensity = this.calculateKeywordDensity(request.content, request.targetKeywords[0]);
            if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
                keywordScore = 80;
            }
            else if (keywordDensity > 0) {
                keywordScore = 60;
            }
            else {
                keywordScore = 20;
            }
        }
        else {
            keywordScore = 30;
        }
        // Structure score
        structureScore = wordCount >= 800 ? 80 : wordCount >= 500 ? 60 : wordCount >= 300 ? 40 : 20;
        // Technical SEO score
        const hasInternalLinks = (request.links?.internal || 0) > 0;
        const hasImages = (request.images || 0) > 0;
        technicalScore = (hasInternalLinks ? 40 : 0) + (hasImages ? 40 : 0) + 20; // Base score
        const overallScore = (keywordScore + structureScore + technicalScore) / 3;
        return {
            overallSeoScore: Math.round(overallScore),
            keywordOptimization: keywordScore,
            contentStructure: structureScore,
            technicalSEO: technicalScore
        };
    }
    /**
     * Utility methods
     */
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    countSentences(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.length;
    }
    countSyllables(text) {
        const words = text.toLowerCase().split(/\s+/);
        return words.reduce((total, word) => total + this.countSyllablesInWord(word), 0);
    }
    countSyllablesInWord(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3)
            return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }
    countComplexWords(text) {
        const words = text.toLowerCase().split(/\s+/);
        return words.filter(word => this.countSyllablesInWord(word) >= 3).length;
    }
    calculateKeywordDensity(content, keyword) {
        const words = this.countWords(content);
        const keywordMatches = (content.toLowerCase().match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')) || []).length;
        return (keywordMatches / words) * 100;
    }
    determineReadingLevel(grade) {
        if (grade <= 5) {
            return {
                grade,
                description: 'Very easy to read',
                audience: 'Elementary school level'
            };
        }
        else if (grade <= 6) {
            return {
                grade,
                description: 'Easy to read',
                audience: '6th grade level'
            };
        }
        else if (grade <= 7) {
            return {
                grade,
                description: 'Fairly easy to read',
                audience: '7th grade level'
            };
        }
        else if (grade <= 8) {
            return {
                grade,
                description: 'Standard reading level',
                audience: '8th grade level'
            };
        }
        else if (grade <= 9) {
            return {
                grade,
                description: 'Fairly difficult to read',
                audience: '9th grade level'
            };
        }
        else if (grade <= 13) {
            return {
                grade,
                description: 'Difficult to read',
                audience: 'High school to college level'
            };
        }
        else {
            return {
                grade,
                description: 'Very difficult to read',
                audience: 'Graduate level and above'
            };
        }
    }
    /**
     * Generate content improvement suggestions
     */
    async generateImprovementSuggestions(qualityScore, readabilityMetrics) {
        const suggestions = [];
        // Readability suggestions
        if (readabilityMetrics.fleschKincaidGrade > 12) {
            suggestions.push('Simplify language and reduce sentence complexity for better readability');
        }
        if (readabilityMetrics.fleschReadingEase < 60) {
            suggestions.push('Improve reading ease by using shorter sentences and common words');
        }
        // Quality suggestions based on component scores
        if (qualityScore.components.structure < 70) {
            suggestions.push('Improve content structure with better headings and paragraph organization');
        }
        if (qualityScore.components.engagement < 60) {
            suggestions.push('Add more engaging elements like questions, examples, and interactive content');
        }
        if (qualityScore.components.seo < 70) {
            suggestions.push('Optimize for search engines with better keyword usage and meta tags');
        }
        if (qualityScore.components.expertise < 70) {
            suggestions.push('Demonstrate more expertise with deeper insights and authoritative sources');
        }
        return suggestions;
    }
}
exports.ReadabilityScoringService = ReadabilityScoringService;
