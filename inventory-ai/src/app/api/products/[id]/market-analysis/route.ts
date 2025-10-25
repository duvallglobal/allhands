import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { facebookMarketplaceService } from '@/lib/facebook-marketplace'
import { apifyService } from '@/lib/apify'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await context.params;

  try {

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    console.log('Starting comprehensive market analysis for:', product.title)

    // Parallel market data collection
    const [facebookAnalysis, ebayData] = await Promise.allSettled([
      // Facebook Marketplace analysis
      facebookMarketplaceService.getMarketAnalysis(
        product.title,
        product.category || undefined,
        product.condition
      ),
      
      // eBay data - use getMarketData instead
      apifyService.getMarketData(product.title, {
        maxItemsPerPlatform: 50
      })
    ])

    // Process results
    const marketAnalysis = {
      facebook: facebookAnalysis.status === 'fulfilled' ? facebookAnalysis.value : null,
      ebay: ebayData.status === 'fulfilled' ? ebayData.value : null,
      timestamp: new Date().toISOString(),
      productId: product.id
    }

    // Calculate comprehensive pricing insights
    const pricingInsights = {
      platforms: {
        facebook: marketAnalysis.facebook ? {
          averagePrice: marketAnalysis.facebook.averagePrice,
          totalListings: marketAnalysis.facebook.totalListings,
          priceRange: marketAnalysis.facebook.priceRange,
          locationAnalysis: marketAnalysis.facebook.locationAnalysis,
          conditionAnalysis: marketAnalysis.facebook.conditionAnalysis
        } : null,
        ebay: marketAnalysis.ebay ? {
          averagePrice: marketAnalysis.ebay.averagePrice || 0,
          totalListings: marketAnalysis.ebay.items?.length || 0,
          soldListings: marketAnalysis.ebay.soldItems?.length || 0
        } : null
      },
      overallInsights: {
        recommendedPriceRange: calculatePriceRange(marketAnalysis),
        marketActivity: assessMarketActivity(marketAnalysis),
        competitivePosition: analyzeCompetitivePosition(marketAnalysis),
        demandIndicators: analyzeDemandIndicators(marketAnalysis)
      }
    }

    // Update product with market analysis
    await prisma.product.update({
      where: { id: productId },
      data: {
        marketAnalysis: JSON.stringify(marketAnalysis),
        // Store pricing insights within marketAnalysis
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        marketAnalysis,
        pricingInsights,
        summary: {
          totalPlatforms: Object.keys(marketAnalysis).filter(key => 
            key !== 'timestamp' && key !== 'productId' && marketAnalysis[key as keyof typeof marketAnalysis]
          ).length,
          totalListings: (marketAnalysis.facebook?.totalListings || 0) + 
                        (marketAnalysis.ebay?.items?.length || 0),
          averagePrice: calculateOverallAveragePrice(marketAnalysis)
        }
      }
    })

  } catch (error) {
    console.error('Error in market analysis:', error)
    return NextResponse.json(
      { error: 'Failed to perform market analysis' },
      { status: 500 }
    )
  }
}

function calculatePriceRange(marketAnalysis: any) {
  const prices: number[] = []
  
  if (marketAnalysis.facebook?.averagePrice) {
    prices.push(marketAnalysis.facebook.averagePrice)
  }
  
  if (marketAnalysis.ebay?.averagePrice) {
    prices.push(marketAnalysis.ebay.averagePrice)
  }
  
  if (prices.length === 0) return { min: 0, max: 0, recommended: 0 }
  
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const recommended = prices.reduce((sum, price) => sum + price, 0) / prices.length
  
  return {
    min: Math.round(min * 0.8 * 100) / 100, // 20% below minimum
    max: Math.round(max * 1.1 * 100) / 100, // 10% above maximum
    recommended: Math.round(recommended * 100) / 100
  }
}

function assessMarketActivity(marketAnalysis: any) {
  const totalListings = (marketAnalysis.facebook?.totalListings || 0) + 
                       (marketAnalysis.ebay?.items?.length || 0)
  
  if (totalListings > 50) return 'high'
  if (totalListings > 20) return 'medium'
  if (totalListings > 5) return 'low'
  return 'very-low'
}

function analyzeCompetitivePosition(marketAnalysis: any) {
  // Simple competitive analysis based on listing density
  const fbListings = marketAnalysis.facebook?.totalListings || 0
  const ebayListings = marketAnalysis.ebay?.items?.length || 0
  
  const totalCompetition = fbListings + ebayListings
  
  if (totalCompetition > 100) return 'highly-competitive'
  if (totalCompetition > 50) return 'competitive'
  if (totalCompetition > 20) return 'moderate'
  return 'low-competition'
}

function analyzeDemandIndicators(marketAnalysis: any) {
  const indicators = []
  
  if (marketAnalysis.facebook?.totalListings > 20) {
    indicators.push('High Facebook Marketplace activity')
  }
  
  if (marketAnalysis.ebay?.soldItems?.length > 10) {
    indicators.push('Strong eBay sales history')
  }
  
  if (marketAnalysis.facebook?.locationAnalysis) {
    const locations = Object.keys(marketAnalysis.facebook.locationAnalysis).length
    if (locations > 5) {
      indicators.push('Wide geographic distribution')
    }
  }
  
  return indicators
}

function calculateOverallAveragePrice(marketAnalysis: any) {
  const prices = []
  
  if (marketAnalysis.facebook?.averagePrice) {
    prices.push(marketAnalysis.facebook.averagePrice)
  }
  
  if (marketAnalysis.ebay?.averagePrice) {
    prices.push(marketAnalysis.ebay.averagePrice)
  }
  
  if (prices.length === 0) return 0
  
  return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length * 100) / 100
}