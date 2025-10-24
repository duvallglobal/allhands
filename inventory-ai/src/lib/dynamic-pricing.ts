import { apifyService } from './apify';
import { geminiService } from './gemini';
import { facebookMarketplaceService, FacebookMarketplaceListing } from './facebook-marketplace';

export interface PricingAnalysis {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  competitivePosition: string;
  velocityOptimized: number;
  marginOptimized: number;
  conditionAdjustment: number;
  marketTrends: {
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    factors: string[];
  };
  comparableAnalysis: {
    medianPrice: number;
    averagePrice: number;
    totalComparables: number;
    priceDistribution: { [key: string]: number };
  };
}

export interface ConditionMultipliers {
  'new-in-package': number;
  'new': number;
  'like-new': number;
  'good': number;
  'acceptable': number;
  'poor': number;
}

export interface CategoryMultipliers {
  electronics: number;
  clothing: number;
  automotive: number;
  collectibles: number;
  books: number;
  home: number;
  sports: number;
  default: number;
}

export class DynamicPricingService {
  private conditionMultipliers: ConditionMultipliers = {
    'new-in-package': 1.0,
    'new': 0.85,
    'like-new': 0.75,
    'good': 0.65,
    'acceptable': 0.45,
    'poor': 0.25
  };

  private categoryMultipliers: CategoryMultipliers = {
    electronics: 0.7,  // Electronics depreciate quickly
    clothing: 0.4,     // Fashion items have low resale
    automotive: 0.8,   // Auto parts hold value well
    collectibles: 0.9, // Collectibles can appreciate
    books: 0.3,        // Books have low resale value
    home: 0.6,         // Home goods moderate depreciation
    sports: 0.5,       // Sports equipment varies widely
    default: 0.6
  };

  private brandMultipliers: { [key: string]: number } = {
    'apple': 0.8,
    'samsung': 0.7,
    'nike': 0.6,
    'adidas': 0.6,
    'louis vuitton': 0.85,
    'gucci': 0.85,
    'rolex': 0.9,
    'default': 0.6
  };

  /**
   * Comprehensive pricing analysis with multi-source market data
   */
  async analyzePricing(
    productData: {
      title: string;
      category: string;
      brand: string;
      condition: { grade: string; score: number };
      colors?: string[];
      size?: string;
    },
    marketData: any,
    options: {
      strategy?: 'velocity' | 'margin' | 'balanced';
      targetMargin?: number;
      competitivePosition?: 'aggressive' | 'competitive' | 'premium';
    } = {}
  ): Promise<PricingAnalysis> {
    try {
      // Step 1: Gather additional market data from multiple sources
      const enhancedMarketData = await this.gatherEnhancedMarketData(productData);
      
      // Step 2: Calculate base price from comparables
      const basePrice = this.calculateBasePrice(marketData, enhancedMarketData);
      
      // Step 3: Apply condition-based adjustments
      const conditionAdjustedPrice = this.applyConditionAdjustment(
        basePrice, 
        productData.condition
      );
      
      // Step 4: Apply category and brand multipliers
      const categoryAdjustedPrice = this.applyCategoryAdjustment(
        conditionAdjustedPrice,
        productData.category,
        productData.brand
      );
      
      // Step 5: Apply competitive positioning
      const competitivePrice = this.applyCompetitivePositioning(
        categoryAdjustedPrice,
        options.competitivePosition || 'competitive'
      );
      
      // Step 6: Calculate velocity vs margin optimized prices
      const velocityPrice = competitivePrice * 0.85; // 15% below market for quick sale
      const marginPrice = competitivePrice * 1.1;    // 10% above market for higher margin
      
      // Step 7: Analyze market trends
      const marketTrends = await this.analyzeMarketTrends(productData, marketData);
      
      // Step 8: Generate final recommendation based on strategy
      const recommendedPrice = this.selectOptimalPrice(
        competitivePrice,
        velocityPrice,
        marginPrice,
        options.strategy || 'balanced',
        marketTrends
      );

      return {
        recommendedPrice,
        priceRange: {
          min: velocityPrice,
          max: marginPrice
        },
        competitivePosition: this.determineCompetitivePosition(recommendedPrice, basePrice),
        velocityOptimized: velocityPrice,
        marginOptimized: marginPrice,
        conditionAdjustment: this.getConditionMultiplier(productData.condition.grade),
        marketTrends,
        comparableAnalysis: this.analyzeComparables(marketData, enhancedMarketData)
      };

    } catch (error) {
      console.error('Error in dynamic pricing analysis:', error);
      throw new Error('Failed to analyze pricing');
    }
  }

  /**
   * Gather enhanced market data from Facebook Marketplace and additional sources
   */
  private async gatherEnhancedMarketData(productData: any): Promise<any> {
    try {
      // Generate search queries for Facebook Marketplace
      const fbQueries = await geminiService.generateSearchQueries(productData, 2);
      
      // Search Facebook Marketplace
      let facebookData = {
        listings: [] as FacebookMarketplaceListing[],
        averagePrice: 0,
        totalListings: 0,
        analysis: null as any
      };

      try {
        // Use the primary search query for Facebook Marketplace
        const primaryQuery = fbQueries[0] || productData.title;
        
        // Get Facebook Marketplace analysis
        const fbAnalysis = await facebookMarketplaceService.getMarketAnalysis(
          primaryQuery,
          productData.category,
          productData.condition?.grade
        );

        // Get similar listings for comparison
        const similarListings = await facebookMarketplaceService.findSimilarListings(
          productData.title,
          productData.brand,
          productData.model,
          productData.category
        );

        facebookData = {
          listings: similarListings,
          averagePrice: fbAnalysis.averagePrice,
          totalListings: fbAnalysis.totalListings,
          analysis: fbAnalysis
        };

        console.log(`Found ${similarListings.length} Facebook Marketplace listings with avg price $${fbAnalysis.averagePrice}`);

      } catch (fbError) {
        console.warn('Facebook Marketplace search failed:', fbError);
        // Continue with empty data if FB fails
      }

      // Could add other platforms here (Mercari, Poshmark, etc.)
      return {
        facebook: facebookData,
        // Add other platforms as needed
      };
    } catch (error) {
      console.error('Error gathering enhanced market data:', error);
      return { facebook: { listings: [], averagePrice: 0, totalListings: 0, analysis: null } };
    }
  }

  /**
   * Calculate base price from all available market data
   */
  private calculateBasePrice(primaryMarketData: any, enhancedMarketData: any): number {
    const allPrices: number[] = [];

    // Add eBay prices
    if (primaryMarketData.ebay) {
      allPrices.push(...primaryMarketData.ebay.map((item: any) => item.price).filter((p: number) => p > 0));
    }

    // Add Google Shopping prices
    if (primaryMarketData.googleShopping) {
      allPrices.push(...primaryMarketData.googleShopping.map((item: any) => item.price).filter((p: number) => p > 0));
    }

    // Add Facebook Marketplace prices (when available)
    if (enhancedMarketData.facebook?.listings) {
      allPrices.push(...enhancedMarketData.facebook.listings.map((item: FacebookMarketplaceListing) => item.salePrice).filter((p: number) => p > 0));
    }

    if (allPrices.length === 0) {
      return 0;
    }

    // Use median price as base to avoid outlier influence
    allPrices.sort((a, b) => a - b);
    const median = allPrices.length % 2 === 0
      ? (allPrices[allPrices.length / 2 - 1] + allPrices[allPrices.length / 2]) / 2
      : allPrices[Math.floor(allPrices.length / 2)];

    return median;
  }

  /**
   * Apply condition-based pricing adjustments
   */
  private applyConditionAdjustment(basePrice: number, condition: { grade: string; score: number }): number {
    const multiplier = this.getConditionMultiplier(condition.grade);
    
    // Fine-tune based on condition score if available
    const scoreAdjustment = condition.score ? (condition.score - 0.5) * 0.2 : 0;
    const finalMultiplier = Math.max(0.1, Math.min(1.0, multiplier + scoreAdjustment));
    
    return basePrice * finalMultiplier;
  }

  /**
   * Get condition multiplier
   */
  private getConditionMultiplier(conditionGrade: string): number {
    const normalizedGrade = conditionGrade.toLowerCase().replace(/[^a-z-]/g, '');
    return this.conditionMultipliers[normalizedGrade as keyof ConditionMultipliers] || 0.6;
  }

  /**
   * Apply category and brand adjustments
   */
  private applyCategoryAdjustment(price: number, category: string, brand: string): number {
    const categoryMultiplier = this.categoryMultipliers[category.toLowerCase() as keyof CategoryMultipliers] || this.categoryMultipliers.default;
    const brandMultiplier = this.brandMultipliers[brand.toLowerCase()] || this.brandMultipliers.default;
    
    // Combine multipliers (weighted average)
    const combinedMultiplier = (categoryMultiplier * 0.7) + (brandMultiplier * 0.3);
    
    return price * combinedMultiplier;
  }

  /**
   * Apply competitive positioning strategy
   */
  private applyCompetitivePositioning(price: number, position: string): number {
    switch (position) {
      case 'aggressive':
        return price * 0.9; // 10% below market
      case 'premium':
        return price * 1.15; // 15% above market
      case 'competitive':
      default:
        return price * 0.95; // 5% below market for competitive edge
    }
  }

  /**
   * Analyze market trends using AI
   */
  private async analyzeMarketTrends(productData: any, marketData: any): Promise<any> {
    try {
      const trendAnalysis = await geminiService.analyzeMarketTrends(productData, marketData);
      return {
        direction: trendAnalysis.direction || 'stable',
        confidence: trendAnalysis.confidence || 0.5,
        factors: trendAnalysis.factors || []
      };
    } catch (error) {
      console.error('Error analyzing market trends:', error);
      return {
        direction: 'stable' as const,
        confidence: 0.5,
        factors: ['Insufficient data for trend analysis']
      };
    }
  }

  /**
   * Select optimal price based on strategy and market conditions
   */
  private selectOptimalPrice(
    competitivePrice: number,
    velocityPrice: number,
    marginPrice: number,
    strategy: string,
    marketTrends: any
  ): number {
    switch (strategy) {
      case 'velocity':
        return velocityPrice;
      case 'margin':
        return marginPrice;
      case 'balanced':
      default:
        // Adjust based on market trends
        if (marketTrends.direction === 'up' && marketTrends.confidence > 0.7) {
          return marginPrice; // Market trending up, go for higher margin
        } else if (marketTrends.direction === 'down' && marketTrends.confidence > 0.7) {
          return velocityPrice; // Market trending down, prioritize velocity
        }
        return competitivePrice; // Stable market, stay competitive
    }
  }

  /**
   * Determine competitive position description
   */
  private determineCompetitivePosition(recommendedPrice: number, basePrice: number): string {
    const ratio = recommendedPrice / basePrice;
    
    if (ratio < 0.85) return 'Aggressive - Priced for quick sale';
    if (ratio < 0.95) return 'Competitive - Priced to move';
    if (ratio < 1.05) return 'Market Rate - Fair market pricing';
    if (ratio < 1.15) return 'Premium - Higher margin positioning';
    return 'Luxury - Premium market positioning';
  }

  /**
   * Analyze comparable listings
   */
  private analyzeComparables(primaryMarketData: any, enhancedMarketData: any): any {
    const allPrices: number[] = [];

    // Collect all prices
    if (primaryMarketData.ebay) {
      allPrices.push(...primaryMarketData.ebay.map((item: any) => item.price).filter((p: number) => p > 0));
    }
    if (primaryMarketData.googleShopping) {
      allPrices.push(...primaryMarketData.googleShopping.map((item: any) => item.price).filter((p: number) => p > 0));
    }

    if (allPrices.length === 0) {
      return {
        medianPrice: 0,
        averagePrice: 0,
        totalComparables: 0,
        priceDistribution: {}
      };
    }

    allPrices.sort((a, b) => a - b);
    const median = allPrices.length % 2 === 0
      ? (allPrices[allPrices.length / 2 - 1] + allPrices[allPrices.length / 2]) / 2
      : allPrices[Math.floor(allPrices.length / 2)];

    const average = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;

    // Create price distribution
    const priceRanges = {
      'Under $25': 0,
      '$25-$50': 0,
      '$50-$100': 0,
      '$100-$250': 0,
      '$250-$500': 0,
      'Over $500': 0
    };

    allPrices.forEach(price => {
      if (price < 25) priceRanges['Under $25']++;
      else if (price < 50) priceRanges['$25-$50']++;
      else if (price < 100) priceRanges['$50-$100']++;
      else if (price < 250) priceRanges['$100-$250']++;
      else if (price < 500) priceRanges['$250-$500']++;
      else priceRanges['Over $500']++;
    });

    return {
      medianPrice: median,
      averagePrice: average,
      totalComparables: allPrices.length,
      priceDistribution: priceRanges
    };
  }
}

export const dynamicPricingService = new DynamicPricingService();