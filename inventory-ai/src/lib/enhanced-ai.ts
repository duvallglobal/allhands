import OpenAI from 'openai';
import { geminiService } from './gemini';
import { apifyService } from './apify';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnhancedProductAnalysis {
  identification: {
    title: string;
    category: string;
    brand: string;
    model: string;
    colors: string[];
    size: string;
    material: string;
    condition: {
      grade: string;
      indicators: string[];
      score: number;
    };
    authenticity: {
      markers: string[];
      confidence: number;
    };
    keyFeatures: string[];
    confidence: number;
  };
  enhancement: {
    optimizedTitle: string;
    description: string;
    tags: string[];
    seoTitle: string;
    seoDescription: string;
    marketingCopy: string;
  };
  marketAnalysis: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    recommendedPrice: number;
    marketPosition: string;
    competitiveAnalysis: string;
    totalComparables: number;
  };
  comparableListings: Array<{
    platform: string;
    title: string;
    price: number;
    url: string;
    similarity: number;
    condition?: string;
    seller?: string;
  }>;
  insights: {
    summary: string;
    recommendations: string[];
    marketTrends: string[];
    riskFactors: string[];
  };
}

export class EnhancedAIService {
  /**
   * Complete AI-powered product analysis pipeline
   */
  async analyzeProduct(
    imageUrl: string,
    productId: string,
    userId: string,
    additionalContext?: {
      userTitle?: string;
      userDescription?: string;
      userCategory?: string;
      condition?: string;
    }
  ): Promise<EnhancedProductAnalysis> {
    try {
      // Step 1: OpenAI Vision for initial identification
      console.log('Step 1: Analyzing image with OpenAI Vision...');
      const visionAnalysis = await this.analyzeImageWithVision(imageUrl, additionalContext);

      // Step 2: Generate optimized search queries
      console.log('Step 2: Generating search queries...');
      const searchQueries = await geminiService.generateSearchQueries(visionAnalysis, 3);

      // Step 3: Scrape market data from multiple platforms
      console.log('Step 3: Scraping market data...');
      const marketDataPromises = searchQueries.map(query => 
        apifyService.getMarketData(query, { maxItemsPerPlatform: 10 })
      );
      const marketDataResults = await Promise.allSettled(marketDataPromises);
      
      // Combine successful results
      const combinedMarketData: {
        ebay: any[];
        googleShopping: any[];
        summary: { totalListings: number; averagePrice: number; priceRange: { min: number; max: number }; platforms: string[] };
      } = {
        ebay: [],
        googleShopping: [],
        summary: { totalListings: 0, averagePrice: 0, priceRange: { min: 0, max: 0 }, platforms: [] }
      };

      marketDataResults.forEach(result => {
        if (result.status === 'fulfilled') {
          combinedMarketData.ebay.push(...result.value.ebay);
          combinedMarketData.googleShopping.push(...result.value.googleShopping);
        }
      });

      // Recalculate summary
      const allPrices = [
        ...combinedMarketData.ebay.map((item: any) => item.price).filter((p: number) => p > 0),
        ...combinedMarketData.googleShopping.map((item: any) => item.price).filter((p: number) => p > 0)
      ];

      if (allPrices.length > 0) {
        combinedMarketData.summary = {
          totalListings: allPrices.length,
          averagePrice: allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length,
          priceRange: { min: Math.min(...allPrices), max: Math.max(...allPrices) },
          platforms: ['eBay', 'Google Shopping']
        };
      }

      // Step 4: Enhanced product analysis with Gemini
      console.log('Step 4: Enhancing product data with Gemini...');
      const productData = {
        title: additionalContext?.userTitle || visionAnalysis.title,
        description: additionalContext?.userDescription,
        category: additionalContext?.userCategory || visionAnalysis.category,
        brand: visionAnalysis.brand,
        condition: additionalContext?.condition || 'used',
        aiIdentification: visionAnalysis
      };

      const geminiAnalysis = await geminiService.analyzeProduct(productData, combinedMarketData);

      // Step 5: Price analysis
      console.log('Step 5: Analyzing pricing...');
      const priceAnalysis = await geminiService.analyzePricing(productData, combinedMarketData);

      // Step 6: Calculate similarity scores and create comparable listings
      console.log('Step 6: Processing comparable listings...');
      const comparableListings = await this.processComparableListings(
        productId,
        visionAnalysis.title || geminiAnalysis.title,
        combinedMarketData
      );

      // Step 7: Compile comprehensive market analysis
      console.log('Step 7: Compiling market insights...');
      const marketInsights = await geminiService.compileMarketAnalysis(
        productData,
        visionAnalysis,
        combinedMarketData,
        comparableListings
      );

      // Step 8: Store all data in database
      console.log('Step 8: Storing analysis data...');
      await this.storeAnalysisData(productId, {
        visionAnalysis,
        geminiAnalysis,
        priceAnalysis,
        marketData: combinedMarketData,
        marketInsights,
        comparableListings
      });

      // Return comprehensive analysis
      return {
        identification: {
          title: visionAnalysis.title || geminiAnalysis.title,
          category: visionAnalysis.category || geminiAnalysis.category,
          brand: visionAnalysis.brand || 'Unknown',
          model: visionAnalysis.model || '',
          colors: visionAnalysis.colors || [],
          size: visionAnalysis.size || '',
          material: visionAnalysis.material || '',
          condition: visionAnalysis.condition || {
            grade: additionalContext?.condition || 'used',
            indicators: [],
            score: 0.7
          },
          authenticity: visionAnalysis.authenticity || {
            markers: [],
            confidence: 0.5
          },
          keyFeatures: geminiAnalysis.keyFeatures || [],
          confidence: visionAnalysis.confidence || 0.8
        },
        enhancement: {
          optimizedTitle: geminiAnalysis.title,
          description: geminiAnalysis.description,
          tags: geminiAnalysis.tags,
          seoTitle: geminiAnalysis.seoTitle,
          seoDescription: geminiAnalysis.seoDescription,
          marketingCopy: geminiAnalysis.marketingCopy
        },
        marketAnalysis: {
          averagePrice: combinedMarketData.summary.averagePrice,
          priceRange: combinedMarketData.summary.priceRange,
          recommendedPrice: priceAnalysis.recommendedPrice,
          marketPosition: priceAnalysis.marketPosition,
          competitiveAnalysis: priceAnalysis.competitiveAnalysis,
          totalComparables: combinedMarketData.summary.totalListings
        },
        comparableListings: comparableListings.slice(0, 10), // Top 10 most similar
        insights: {
          summary: marketInsights.summary,
          recommendations: marketInsights.recommendations,
          marketTrends: marketInsights.marketTrends,
          riskFactors: marketInsights.riskFactors
        }
      };

    } catch (error) {
      console.error('Error in enhanced AI analysis:', error);
      throw new Error('Failed to complete enhanced AI analysis');
    }
  }

  /**
   * Analyze image using OpenAI Vision
   */
  private async analyzeImageWithVision(imageUrl: string, context?: any): Promise<any> {
    const prompt = `Analyze this product image and provide comprehensive identification information. 

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

Please identify:
1. Product title/name
2. Brand (if visible)
3. Model number (if visible)
4. Category/type
5. Color(s) - primary and secondary colors
6. Size/dimensions (if determinable)
7. Material/construction
8. Key features and characteristics
9. Condition assessment with specific indicators:
   - New in Package (NIB): Sealed packaging, pristine condition
   - New: No packaging but unused, no wear
   - Like New: Minimal to no signs of use
   - Good: Light wear, fully functional
   - Acceptable: Moderate wear, may have cosmetic issues
10. Authenticity markers (logos, serial numbers, quality indicators)
11. Notable details or unique identifiers

Respond in JSON format:
{
  "title": "Product name",
  "brand": "Brand name",
  "model": "Model number",
  "category": "Product category",
  "colors": ["primary color", "secondary color"],
  "size": "size/dimensions",
  "material": "material type",
  "features": ["feature1", "feature2"],
  "condition": {
    "grade": "condition grade",
    "indicators": ["wear pattern 1", "condition indicator 2"],
    "score": 0.85
  },
  "authenticity": {
    "markers": ["logo quality", "serial number"],
    "confidence": 0.9
  },
  "confidence": 0.95,
  "details": "Additional observations"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI Vision');

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error with OpenAI Vision:', error);
      throw error;
    }
  }

  /**
   * Process and store comparable listings with similarity scores
   */
  private async processComparableListings(
    productId: string,
    productTitle: string,
    marketData: any
  ): Promise<any[]> {
    const comparables: any[] = [];

    // Process eBay listings
    for (const item of marketData.ebay) {
      const similarity = apifyService.calculateSimilarity(productTitle, item.title);
      comparables.push({
        platform: 'ebay',
        title: item.title,
        price: item.price,
        url: item.url,
        similarity,
        condition: item.condition,
        seller: item.seller,
        imageUrl: item.imageUrl,
        shipping: item.shipping,
        location: item.location,
        isSold: item.isSold
      });
    }

    // Process Google Shopping listings
    for (const item of marketData.googleShopping) {
      const similarity = apifyService.calculateSimilarity(productTitle, item.title);
      comparables.push({
        platform: 'google_shopping',
        title: item.title,
        price: item.price,
        url: item.url,
        similarity,
        seller: item.seller,
        imageUrl: item.imageUrl,
        shipping: item.shipping,
        availability: item.availability
      });
    }

    // Sort by similarity score (highest first)
    comparables.sort((a, b) => b.similarity - a.similarity);

    // Store in database
    for (const comparable of comparables.slice(0, 20)) { // Store top 20
      try {
        await prisma.comparableListing.create({
          data: {
            productId,
            platform: comparable.platform,
            title: comparable.title,
            price: comparable.price,
            condition: comparable.condition,
            url: comparable.url,
            imageUrl: comparable.imageUrl,
            seller: comparable.seller,
            shipping: comparable.shipping,
            location: comparable.location,
            similarity: comparable.similarity,
            isSold: comparable.isSold || false
          }
        });
      } catch (error) {
        console.error('Error storing comparable listing:', error);
      }
    }

    return comparables;
  }

  /**
   * Store comprehensive analysis data in database
   */
  private async storeAnalysisData(productId: string, analysisData: any): Promise<void> {
    try {
      // Update product with analysis results
      await prisma.product.update({
        where: { id: productId },
        data: {
          aiIdentification: JSON.stringify(analysisData.visionAnalysis),
          aiAnalysis: JSON.stringify(analysisData.geminiAnalysis),
          ebayData: JSON.stringify(analysisData.marketData.ebay),
          googleShoppingData: JSON.stringify(analysisData.marketData.googleShopping),
          marketAnalysis: JSON.stringify(analysisData.marketInsights),
          recommendedPrice: analysisData.priceAnalysis.recommendedPrice,
          currentMarketPrice: analysisData.marketData.summary.averagePrice,
          status: 'ready'
        }
      });

      // Store scraped data records
      await prisma.scrapedData.createMany({
        data: [
          {
            productId,
            platform: 'ebay',
            query: 'combined queries',
            rawData: JSON.stringify(analysisData.marketData.ebay),
            status: 'completed'
          },
          {
            productId,
            platform: 'google_shopping',
            query: 'combined queries',
            rawData: JSON.stringify(analysisData.marketData.googleShopping),
            status: 'completed'
          }
        ]
      });

    } catch (error) {
      console.error('Error storing analysis data:', error);
      throw error;
    }
  }
}

export const enhancedAIService = new EnhancedAIService();