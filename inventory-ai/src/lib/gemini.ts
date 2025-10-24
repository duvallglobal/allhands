import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeminiAnalysis {
  title: string;
  description: string;
  tags: string[];
  category: string;
  seoTitle: string;
  seoDescription: string;
  marketingCopy: string;
  keyFeatures: string[];
  targetAudience: string[];
  competitiveAdvantages: string[];
}

export interface PriceAnalysis {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
  marketPosition: 'budget' | 'mid-range' | 'premium';
  competitiveAnalysis: string;
  pricingStrategy: string;
}

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  /**
   * Generate comprehensive product analysis using Gemini
   */
  async analyzeProduct(
    productData: {
      title?: string;
      description?: string;
      category?: string;
      brand?: string;
      condition?: string;
      aiIdentification?: any;
    },
    marketData?: any
  ): Promise<GeminiAnalysis> {
    const prompt = `
As an expert e-commerce product analyst, analyze the following product and generate comprehensive, SEO-optimized content:

Product Information:
- Title: ${productData.title || 'Unknown'}
- Description: ${productData.description || 'None provided'}
- Category: ${productData.category || 'Unknown'}
- Brand: ${productData.brand || 'Unknown'}
- Condition: ${productData.condition || 'Unknown'}
- AI Identification: ${JSON.stringify(productData.aiIdentification || {})}

Market Data:
${marketData ? JSON.stringify(marketData, null, 2) : 'No market data available'}

Please provide a JSON response with the following structure:
{
  "title": "Optimized product title (60-80 characters, include key features and brand)",
  "description": "Detailed product description (150-300 words, highlight benefits and features)",
  "tags": ["array", "of", "relevant", "seo", "tags", "and", "keywords"],
  "category": "Most appropriate product category",
  "seoTitle": "SEO-optimized title for search engines (50-60 characters)",
  "seoDescription": "Meta description for SEO (150-160 characters)",
  "marketingCopy": "Compelling marketing copy that sells the product (100-200 words)",
  "keyFeatures": ["list", "of", "key", "product", "features"],
  "targetAudience": ["primary", "target", "audience", "segments"],
  "competitiveAdvantages": ["unique", "selling", "points", "vs", "competitors"]
}

Focus on:
1. SEO optimization with relevant keywords
2. Compelling, benefit-focused copy
3. Clear value proposition
4. Professional, trustworthy tone
5. Accurate categorization
6. Market-relevant positioning

Respond only with valid JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing product with Gemini:', error);
      throw new Error('Failed to analyze product with Gemini');
    }
  }

  /**
   * Generate price recommendation using market data
   */
  async analyzePricing(
    productData: {
      title?: string;
      condition?: string;
      category?: string;
      brand?: string;
    },
    marketData: any,
    userPreferences?: {
      targetMargin?: number;
      pricingStrategy?: 'competitive' | 'premium' | 'budget';
    }
  ): Promise<PriceAnalysis> {
    const prompt = `
As a pricing expert, analyze the following product and market data to recommend an optimal price:

Product Information:
- Title: ${productData.title || 'Unknown'}
- Condition: ${productData.condition || 'Unknown'}
- Category: ${productData.category || 'Unknown'}
- Brand: ${productData.brand || 'Unknown'}

Market Data:
${JSON.stringify(marketData, null, 2)}

User Preferences:
- Target Margin: ${userPreferences?.targetMargin || 'Not specified'}%
- Pricing Strategy: ${userPreferences?.pricingStrategy || 'competitive'}

Please analyze the market data and provide a JSON response with:
{
  "recommendedPrice": 0.00,
  "priceRange": {
    "min": 0.00,
    "max": 0.00
  },
  "reasoning": "Detailed explanation of pricing rationale",
  "marketPosition": "budget|mid-range|premium",
  "competitiveAnalysis": "Analysis of how this price compares to competitors",
  "pricingStrategy": "Recommended strategy and tactics"
}

Consider:
1. Market average and median prices
2. Product condition impact
3. Brand value and recognition
4. Competitive positioning
5. Market demand indicators
6. Seasonal factors
7. Platform-specific pricing trends

Respond only with valid JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing pricing with Gemini:', error);
      throw new Error('Failed to analyze pricing with Gemini');
    }
  }

  /**
   * Generate search queries for scraping based on product identification
   */
  async generateSearchQueries(
    aiIdentification: any,
    maxQueries: number = 3
  ): Promise<string[]> {
    const prompt = `
Based on the following AI product identification data, generate ${maxQueries} optimized search queries for finding similar products on e-commerce platforms:

AI Identification Data:
${JSON.stringify(aiIdentification, null, 2)}

Generate search queries that are:
1. Specific enough to find exact or very similar products
2. Include key identifying features (brand, model, type)
3. Optimized for e-commerce search engines
4. Varied in approach (brand+model, category+features, etc.)

Return as a JSON array of strings:
["query1", "query2", "query3"]

Respond only with valid JSON array.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating search queries with Gemini:', error);
      // Fallback to basic queries
      return ['product search query'];
    }
  }

  /**
   * Analyze market trends for pricing strategy
   */
  async analyzeMarketTrends(
    productData: any,
    marketData: any
  ): Promise<{
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    factors: string[];
  }> {
    const prompt = `
As a market trend analyst, analyze the following data to determine market trends:

Product Data:
${JSON.stringify(productData, null, 2)}

Market Data:
${JSON.stringify(marketData, null, 2)}

Analyze the market trends and provide insights in JSON format:
{
  "direction": "up|down|stable",
  "confidence": 0.85,
  "factors": ["factor 1", "factor 2", "factor 3"]
}

Consider:
1. Price distribution patterns
2. Listing volume and frequency
3. Seasonal factors
4. Category-specific trends
5. Brand performance
6. Condition impact on pricing

Respond only with valid JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing market trends with Gemini:', error);
      return {
        direction: 'stable' as const,
        confidence: 0.5,
        factors: ['Insufficient data for trend analysis']
      };
    }
  }

  /**
   * Compile and analyze all data sources into comprehensive insights
   */
  async compileMarketAnalysis(
    productData: any,
    aiIdentification: any,
    marketData: any,
    comparableListings: any[]
  ): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
    marketTrends: string[];
    competitivePosition: string;
    riskFactors: string[];
  }> {
    const prompt = `
As a market research analyst, compile a comprehensive analysis from the following data sources:

Product Data:
${JSON.stringify(productData, null, 2)}

AI Identification:
${JSON.stringify(aiIdentification, null, 2)}

Market Data:
${JSON.stringify(marketData, null, 2)}

Comparable Listings:
${JSON.stringify(comparableListings.slice(0, 10), null, 2)}

Provide a comprehensive market analysis in JSON format:
{
  "summary": "Executive summary of market position and opportunity",
  "insights": ["key", "market", "insights", "discovered"],
  "recommendations": ["actionable", "recommendations", "for", "seller"],
  "marketTrends": ["observed", "market", "trends", "and", "patterns"],
  "competitivePosition": "Analysis of competitive positioning",
  "riskFactors": ["potential", "risks", "and", "challenges"]
}

Focus on:
1. Market opportunity assessment
2. Competitive landscape analysis
3. Pricing trends and patterns
4. Demand indicators
5. Risk assessment
6. Strategic recommendations

Respond only with valid JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error compiling market analysis with Gemini:', error);
      throw new Error('Failed to compile market analysis with Gemini');
    }
  }
}

export const geminiService = new GeminiService();