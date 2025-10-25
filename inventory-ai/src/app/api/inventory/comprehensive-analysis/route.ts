import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini';
import { ebayApi } from '@/lib/ebay-api';
import { shopifyInventory, ShopifyInventoryService } from '@/lib/shopify-inventory';
import { z } from 'zod';

// Request validation schema
const AnalysisRequestSchema = z.object({
  imageUrl: z.string().optional(),
  productTitle: z.string().optional(),
  productDescription: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  condition: z.string().optional(),
  category: z.string().optional(),
  includeEbayData: z.boolean().default(true),
  createShopifyProduct: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = AnalysisRequestSchema.parse(body);

    const geminiService = new GeminiService();
    const results: any = {
      timestamp: new Date().toISOString(),
      analysisType: 'comprehensive',
      data: {},
    };

    // Step 1: Image Analysis (if image provided)
    if (validatedData.imageUrl) {
      console.log('🔍 Analyzing product image with Gemini...');
      try {
        results.data.imageAnalysis = await geminiService.analyzeProductImage(validatedData.imageUrl);
      } catch (error) {
        console.error('Image analysis failed:', error);
        results.data.imageAnalysis = { error: 'Failed to analyze image' };
      }
    }

    // Step 2: Market Research with Grounded Search
    console.log('📊 Conducting market research...');
    const productName = validatedData.productTitle || 
                       results.data.imageAnalysis?.productIdentification?.title || 
                       'Unknown Product';
    const brand = validatedData.brand || 
                  results.data.imageAnalysis?.productIdentification?.brand || 
                  'Unknown Brand';

    try {
      results.data.marketResearch = await geminiService.searchMarketData(productName, brand);
    } catch (error) {
      console.error('Market research failed:', error);
      results.data.marketResearch = { error: 'Failed to conduct market research' };
    }

    // Step 3: eBay Competitive Analysis (if enabled)
    if (validatedData.includeEbayData) {
      console.log('🛒 Analyzing eBay competitive data...');
      try {
        const ebaySearchResults = await ebayApi.searchItems(`${productName} ${brand}`, {
          limit: 20,
          sort: 'price',
        });

        const competitivePricing = await ebayApi.getCompetitivePricing(productName, {
          brand: brand,
          condition: validatedData.condition,
        });

        results.data.ebayAnalysis = {
          searchResults: ebaySearchResults,
          competitivePricing: competitivePricing,
          suggestedCategories: await ebayApi.suggestCategories(productName, brand),
        };
      } catch (error) {
        console.error('eBay analysis failed:', error);
        results.data.ebayAnalysis = { error: 'Failed to analyze eBay data' };
      }
    }

    // Step 4: Comprehensive Gemini Analysis with all data
    console.log('🧠 Generating comprehensive AI analysis...');
    const productData = {
      title: validatedData.productTitle || results.data.imageAnalysis?.productIdentification?.title,
      description: validatedData.productDescription,
      category: validatedData.category,
      brand: brand,
      condition: validatedData.condition,
      aiIdentification: results.data.imageAnalysis,
    };

    try {
      results.data.geminiAnalysis = await geminiService.analyzeProduct(
        productData,
        {
          marketResearch: results.data.marketResearch,
          ebayData: results.data.ebayAnalysis,
        }
      );
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      results.data.geminiAnalysis = { error: 'Failed to generate comprehensive analysis' };
    }

    // Step 5: Generate Shopify-Ready Inventory Data
    console.log('🏪 Preparing Shopify inventory data...');
    if (results.data.geminiAnalysis && !results.data.geminiAnalysis.error) {
      const analysis = results.data.geminiAnalysis;
      
      results.data.shopifyInventoryData = {
        title: analysis.title,
        description: analysis.description,
        brand: analysis.platformCategories?.shopify?.vendor || brand,
        model: validatedData.model,
        sku: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        price: results.data.ebayAnalysis?.competitivePricing?.averagePrice || 0,
        weight: analysis.shippingWeight?.pounds || 1,
        weightUnit: 'lb' as const,
        dimensions: analysis.dimensions ? {
          length: analysis.dimensions.length,
          width: analysis.dimensions.width,
          height: analysis.dimensions.height,
          unit: 'in' as const,
        } : undefined,
        trackQuantity: true,
        continueSellingWhenOutOfStock: false,
        requiresShipping: true,
        condition: validatedData.condition || 'used',
        productType: analysis.platformCategories?.shopify?.productType || 'General',
        vendor: analysis.platformCategories?.shopify?.vendor || brand,
        tags: [
          ...analysis.tags,
          ...analysis.seoKeywords?.primary || [],
          ...analysis.seoKeywords?.secondary || [],
        ],
        seoTitle: analysis.seoTitle,
        seoDescription: analysis.seoDescription,
        images: validatedData.imageUrl ? [{
          src: validatedData.imageUrl,
          alt: analysis.title,
          position: 1,
        }] : [],
        metafields: analysis.shopifyMetafields || [],
        locations: [{
          locationId: 1, // Default location
          quantity: 1,
        }],
      };

      // Step 6: Create Shopify Product (if requested)
      if (validatedData.createShopifyProduct) {
        console.log('🚀 Creating Shopify product...');
        try {
          const shopifyProduct = await shopifyInventory.createProduct(results.data.shopifyInventoryData);
          results.data.shopifyProduct = shopifyProduct;
          
          // Sync to eBay if eBay integration is enabled
          if (validatedData.includeEbayData) {
            console.log('🔄 Syncing to eBay...');
            try {
              await shopifyInventory.syncInventoryToEbay(shopifyProduct.id!, ebayApi);
              results.data.ebaySync = { success: true, message: 'Product synced to eBay successfully' };
            } catch (error) {
              console.error('eBay sync failed:', error);
              results.data.ebaySync = { success: false, error: 'Failed to sync to eBay' };
            }
          }
        } catch (error) {
          console.error('Shopify product creation failed:', error);
          results.data.shopifyProduct = { error: 'Failed to create Shopify product' };
        }
      }
    }

    // Step 7: Generate Platform-Specific Listings
    console.log('📝 Generating platform-specific content...');
    if (results.data.geminiAnalysis && !results.data.geminiAnalysis.error) {
      try {
        // eBay listing
        results.data.platformListings = {
          ebay: await geminiService.generatePlatformListing(productData, 'ebay'),
          facebook: await geminiService.generatePlatformListing(productData, 'facebook'),
          shopify: await geminiService.generatePlatformListing(productData, 'shopify'),
        };
      } catch (error) {
        console.error('Platform listing generation failed:', error);
        results.data.platformListings = { error: 'Failed to generate platform listings' };
      }
    }

    // Step 8: SEO Content Generation
    console.log('🎯 Generating SEO content...');
    try {
      results.data.seoContent = await geminiService.generateSEOContent({
        title: productName,
        brand: brand,
        category: validatedData.category,
        seoKeywords: results.data.geminiAnalysis?.seoKeywords,
      });
    } catch (error) {
      console.error('SEO content generation failed:', error);
      results.data.seoContent = { error: 'Failed to generate SEO content' };
    }

    // Step 9: Competitor Research
    console.log('🕵️ Conducting competitor research...');
    try {
      results.data.competitorResearch = await geminiService.researchCompetitors({
        title: productName,
        brand: brand,
        category: validatedData.category,
      }, ['ebay', 'amazon', 'facebook']);
    } catch (error) {
      console.error('Competitor research failed:', error);
      results.data.competitorResearch = { error: 'Failed to conduct competitor research' };
    }

    // Summary
    results.summary = {
      analysisComplete: true,
      componentsAnalyzed: Object.keys(results.data).length,
      recommendedPrice: results.data.ebayAnalysis?.competitivePricing?.averagePrice || 0,
      shippingWeight: results.data.geminiAnalysis?.shippingWeight,
      platformCategories: results.data.geminiAnalysis?.platformCategories,
      seoKeywords: results.data.geminiAnalysis?.seoKeywords,
      shopifyReady: !!results.data.shopifyInventoryData,
      ebayReady: !!results.data.ebayAnalysis,
    };

    console.log('✅ Comprehensive analysis completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('Comprehensive analysis failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete comprehensive analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Comprehensive Inventory Analysis API',
    description: 'Analyzes products using Gemini AI, eBay data, and prepares Shopify inventory with shipping weights, SEO tags, and platform categories',
    endpoints: {
      POST: 'Perform comprehensive product analysis',
    },
    requiredFields: {
      imageUrl: 'Product image URL (optional)',
      productTitle: 'Product title (optional)',
      brand: 'Product brand (optional)',
      condition: 'Product condition (optional)',
      includeEbayData: 'Include eBay competitive analysis (default: true)',
      createShopifyProduct: 'Create Shopify product automatically (default: false)',
    },
    features: [
      'Gemini AI image analysis with shipping weight estimation',
      'Real-time market research with grounded Google Search',
      'eBay competitive pricing and category suggestions',
      'Platform-specific categories (eBay, Facebook, Shopify)',
      'SEO-optimized content with keywords and meta tags',
      'Shopify metafields for inventory management',
      'Automatic Shopify product creation',
      'Multi-platform inventory synchronization',
      'Comprehensive competitor research',
    ],
  });
}