import { GoogleGenerativeAI, Tool } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define tools for grounded search and URL context
const searchTool: Tool = {
  googleSearchRetrieval: {
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.7
    }
  }
};

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
  
  shippingWeight: {
    pounds: number;
    kilograms: number;
    estimationMethod: string;
  };
  
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  
  platformCategories: {
    ebay: {
      primaryCategory: string;
      primaryCategoryName: string;
      secondaryCategory?: string;
      secondaryCategoryName?: string;
      categoryPath: string;
    };
    facebook: {
      category: string;
      subcategory: string;
      categoryId: string;
    };
    shopify: {
      productType: string;
      vendor: string;
      collection: string;
    };
  };
  
  seoKeywords: {
    primary: string[];
    secondary: string[];
    longtail: string[];
  };
  
  shopifyMetafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
  
  inventoryData: {
    fragility: number;
    storageRequirements: string;
    handlingInstructions: string;
    insuranceValue: number;
  };
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
  private textModel;
  private imageModel;
  private searchModel;

  constructor() {
    // Use gemini-flash-latest for text analysis and search
    this.textModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    // Use gemini-flash-latest for image analysis
    this.imageModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    // Use search-enabled model for market research
    this.searchModel = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      tools: [searchTool]
    });
  }

  /**
   * Analyze product image using Gemini Vision
   */
  async analyzeProductImage(imageUrl: string, prompt?: string): Promise<any> {
    const defaultPrompt = `
    Analyze this product image and provide comprehensive inventory management data:
    
    REQUIRED FIELDS:
    1. Product identification (brand, model, type, SKU if visible)
    2. Condition assessment with grade (A-F) and detailed notes
    3. Shipping weight estimation (in lbs and kg) based on size and material
    4. Dimensions estimation (length x width x height in inches and cm)
    5. Material composition and build quality indicators
    6. Authenticity markers and verification points
    7. Estimated age/generation and manufacturing details
    8. Notable defects, wear patterns, or damage
    
    PLATFORM-SPECIFIC CATEGORIES:
    9. eBay category suggestions (primary and secondary)
    10. Facebook Marketplace category recommendations
    11. Shopify product type and vendor classification
    
    SEO & MARKETING DATA:
    12. SEO-optimized title (60 chars max)
    13. Meta description (160 chars max)
    14. SEO tags/keywords (10-15 relevant terms)
    15. Shopify metafields (custom fields for enhanced data)
    16. Key selling points and features
    17. Target audience demographics
    18. Competitive advantages
    
    INVENTORY MANAGEMENT:
    19. Recommended storage conditions
    20. Fragility rating (1-10)
    21. Special handling requirements
    22. Insurance value estimation
    
    Format as structured JSON with all fields populated.
    `;

    try {
      const result = await this.imageModel.generateContent([
        prompt || defaultPrompt,
        {
          inlineData: {
            data: imageUrl.split(',')[1], // Remove data:image/jpeg;base64, prefix
            mimeType: 'image/jpeg'
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { analysis: text };
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      throw new Error('Failed to analyze image with Gemini');
    }
  }

  /**
   * Search for current market information using grounded search
   */
  async searchMarketData(productName: string, brand?: string, model?: string): Promise<any> {
    const searchQuery = [productName, brand, model].filter(Boolean).join(' ');
    const prompt = `
    Search for current market information about: "${searchQuery}"
    
    Please provide comprehensive market data including:
    1. Current market prices across different platforms (eBay, Amazon, Facebook Marketplace, etc.)
    2. Price ranges and typical selling prices
    3. Product specifications and variations
    4. Brand reputation and market positioning
    5. Seasonal demand patterns and trends
    6. Common selling platforms and their price differences
    7. Authenticity concerns and verification methods
    8. Condition factors that significantly affect pricing
    9. Recent sales data and market activity
    10. Competitive products and alternatives
    
    Focus on recent, reliable data from established marketplaces and sources.
    Format as structured JSON with clear price data and market insights.
    `;

    try {
      const result = await this.searchModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { marketData: text };
    } catch (error) {
      console.error('Error searching market data with Gemini:', error);
      throw new Error('Failed to search market data with Gemini');
    }
  }

  /**
   * Analyze specific product URLs for competitive intelligence
   */
  async analyzeProductUrl(url: string): Promise<any> {
    const prompt = `
    Analyze this product URL and extract comprehensive information: ${url}
    
    Please provide:
    1. Product title and detailed description
    2. Listed price, original price, and any discounts
    3. Complete product specifications
    4. Seller information, ratings, and credibility
    5. Product condition and quality indicators
    6. Shipping costs and delivery options
    7. Return policy and warranty information
    8. Customer reviews and ratings summary
    9. Similar products or alternatives mentioned
    10. Platform-specific features and selling points
    
    Format as structured JSON with all available data.
    `;

    try {
      const result = await this.searchModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { urlAnalysis: text };
    } catch (error) {
      console.error('Error analyzing URL with Gemini:', error);
      throw new Error('Failed to analyze URL with Gemini');
    }
  }

  /**
   * Generate comprehensive product analysis using Gemini with market search
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
    // First, search for current market information if not provided
    let enhancedMarketData = marketData;
    if (!marketData && productData.title && productData.brand) {
      try {
        enhancedMarketData = await this.searchMarketData(
          productData.title,
          productData.brand
        );
      } catch (error) {
        console.warn('Could not fetch market data:', error);
      }
    }

    const prompt = `
As an expert e-commerce product analyst with access to current market data, analyze the following product and generate comprehensive inventory management data with SEO optimization and platform-specific categories:

Product Information:
- Title: ${productData.title || 'Unknown'}
- Description: ${productData.description || 'None provided'}
- Category: ${productData.category || 'Unknown'}
- Brand: ${productData.brand || 'Unknown'}
- Condition: ${productData.condition || 'Unknown'}
- AI Identification: ${JSON.stringify(productData.aiIdentification || {})}

Market Data:
${enhancedMarketData ? JSON.stringify(enhancedMarketData, null, 2) : 'No market data available'}

Search for additional current market trends and competitor analysis for this product type to enhance your recommendations.

Please provide a JSON response with the following COMPLETE structure:
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
  "competitiveAdvantages": ["unique", "selling", "points", "vs", "competitors"],
  
  "shippingWeight": {
    "pounds": 2.5,
    "kilograms": 1.13,
    "estimationMethod": "Based on product type and materials"
  },
  
  "dimensions": {
    "length": 12,
    "width": 8,
    "height": 3,
    "unit": "inches",
    "lengthCm": 30.5,
    "widthCm": 20.3,
    "heightCm": 7.6
  },
  
  "platformCategories": {
    "ebay": {
      "primaryCategory": "9355",
      "primaryCategoryName": "Cell Phones & Smartphones",
      "secondaryCategory": "20349",
      "secondaryCategoryName": "Cell Phone Accessories",
      "categoryPath": "Cell Phones & Accessories > Cell Phones & Smartphones"
    },
    "facebook": {
      "category": "Electronics",
      "subcategory": "Mobile Phones",
      "categoryId": "electronics_mobile_phones"
    },
    "shopify": {
      "productType": "Electronics - Mobile Devices",
      "vendor": "Brand Name",
      "collection": "Smartphones"
    }
  },
  
  "seoKeywords": {
    "primary": ["smartphone", "mobile phone", "unlocked phone"],
    "secondary": ["android phone", "dual sim", "camera phone"],
    "longtail": ["unlocked android smartphone dual camera", "budget friendly mobile phone"]
  },
  
  "shopifyMetafields": [
    {
      "namespace": "inventory",
      "key": "condition_grade",
      "value": "B+",
      "type": "single_line_text_field"
    },
    {
      "namespace": "inventory", 
      "key": "authenticity_verified",
      "value": "true",
      "type": "boolean"
    },
    {
      "namespace": "seo",
      "key": "focus_keywords",
      "value": "smartphone, unlocked, android",
      "type": "single_line_text_field"
    },
    {
      "namespace": "platforms",
      "key": "ebay_category",
      "value": "9355",
      "type": "single_line_text_field"
    }
  ],
  
  "inventoryData": {
    "fragility": 7,
    "storageRequirements": "Keep in dry, temperature-controlled environment",
    "handlingInstructions": "Handle with care, avoid drops",
    "insuranceValue": 250
  }
}

CRITICAL REQUIREMENTS:
1. MUST include accurate shipping weight estimation in both pounds and kilograms
2. MUST provide platform-specific categories for eBay, Facebook, and Shopify
3. MUST include comprehensive SEO keywords (primary, secondary, longtail)
4. MUST generate Shopify metafields for inventory management
5. MUST estimate realistic dimensions based on product type
6. Focus on Shopify as the source of truth for inventory data

Respond only with valid JSON containing ALL required fields.`;

    try {
      const result = await this.searchModel.generateContent(prompt);
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
   * Generate price recommendation using market data with search enhancement
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
    // Enhance market data with current search if needed
    let enhancedMarketData = marketData;
    if (productData.title && productData.brand) {
      try {
        const searchData = await this.searchMarketData(
          productData.title,
          productData.brand
        );
        enhancedMarketData = {
          ...marketData,
          searchEnhanced: searchData
        };
      } catch (error) {
        console.warn('Could not enhance market data with search:', error);
      }
    }

    const prompt = `
As a pricing expert with access to current market data, analyze the following product and recommend an optimal price:

Product Information:
- Title: ${productData.title || 'Unknown'}
- Condition: ${productData.condition || 'Unknown'}
- Category: ${productData.category || 'Unknown'}
- Brand: ${productData.brand || 'Unknown'}

Market Data:
${JSON.stringify(enhancedMarketData, null, 2)}

Search for additional current pricing trends and competitive analysis for similar products to enhance your pricing recommendation.

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
      const result = await this.searchModel.generateContent(prompt);
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
      const result = await this.textModel.generateContent(prompt);
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
      const result = await this.searchModel.generateContent(prompt);
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
      const result = await this.searchModel.generateContent(prompt);
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

  /**
   * Generate platform-specific listing content with search optimization
   */
  async generatePlatformListing(
    productData: any,
    targetPlatform: 'ebay' | 'facebook' | 'shopify' | 'amazon'
  ): Promise<any> {
    const prompt = `
    Search for current best practices and successful listing strategies for ${targetPlatform} and generate optimized listing content for this product:
    
    Product Data:
    ${JSON.stringify(productData, null, 2)}
    
    Research and provide platform-optimized content including:
    1. Title optimized for ${targetPlatform} search algorithm and character limits
    2. Description following ${targetPlatform} best practices and formatting
    3. Key features and benefits highlighted for ${targetPlatform} audience
    4. Condition description using ${targetPlatform} standards
    5. Pricing strategy based on ${targetPlatform} market data
    6. Category and subcategory recommendations for ${targetPlatform}
    7. Tags/keywords optimized for ${targetPlatform} search
    8. Shipping and return policies appropriate for ${targetPlatform}
    9. Image requirements and recommendations for ${targetPlatform}
    10. Current market trends affecting ${targetPlatform} listings
    
    Format as structured JSON optimized for ${targetPlatform}.
    `;

    try {
      const result = await this.searchModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { platformContent: text };
    } catch (error) {
      console.error('Error generating platform listing with Gemini:', error);
      throw new Error('Failed to generate platform listing with Gemini');
    }
  }

  /**
   * Research competitor strategies and market positioning
   */
  async researchCompetitors(
    productData: any,
    targetPlatforms: string[] = ['ebay', 'facebook', 'amazon']
  ): Promise<any> {
    const searchQuery = [productData.title, productData.brand, productData.category]
      .filter(Boolean)
      .join(' ');

    const prompt = `
    Research competitor strategies and market positioning for: "${searchQuery}"
    
    Focus on these platforms: ${targetPlatforms.join(', ')}
    
    Provide comprehensive competitive analysis including:
    1. Top competitors and their pricing strategies
    2. Common listing formats and presentation styles
    3. Successful marketing approaches and messaging
    4. Price positioning and market segments
    5. Customer review patterns and feedback themes
    6. Seasonal trends and demand patterns
    7. Platform-specific optimization techniques
    8. Emerging trends and opportunities
    9. Risk factors and market challenges
    10. Recommended differentiation strategies
    
    Format as structured JSON with actionable insights.
    `;

    try {
      const result = await this.searchModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { competitorAnalysis: text };
    } catch (error) {
      console.error('Error researching competitors with Gemini:', error);
      throw new Error('Failed to research competitors with Gemini');
    }
  }

  /**
   * Generate SEO-optimized content with current search trends
   */
  async generateSEOContent(productData: any): Promise<any> {
    const prompt = `
    Research current SEO trends and search patterns for products like: "${productData.title || productData.category}"
    
    Product Information:
    ${JSON.stringify(productData, null, 2)}
    
    Generate SEO-optimized content based on current search trends:
    1. Primary keywords with high search volume and low competition
    2. Long-tail keywords for specific product features
    3. Semantic keywords and related terms
    4. Title variations optimized for different search intents
    5. Meta descriptions for various platforms
    6. Content structure recommendations
    7. Internal linking opportunities
    8. Schema markup suggestions
    9. Local SEO considerations if applicable
    10. Voice search optimization
    
    Include current search volume estimates and competition analysis.
    Format as structured JSON with implementation guidance.
    `;

    try {
      const result = await this.searchModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { seoContent: text };
    } catch (error) {
      console.error('Error generating SEO content with Gemini:', error);
      throw new Error('Failed to generate SEO content with Gemini');
    }
  }
}

export const geminiService = new GeminiService();