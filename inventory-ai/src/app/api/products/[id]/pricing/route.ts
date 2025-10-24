import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dynamicPricingService } from '@/lib/dynamic-pricing'
import { apifyService } from '@/lib/apify'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Gather market data
    const searchQueries = [
      product.title,
      `${product.brand} ${product.model}`.trim(),
      `${product.category} ${product.brand}`.trim()
    ].filter(query => query.length > 0)

    const marketData = await apifyService.gatherMarketData(searchQueries[0], {
      maxResults: 20,
      includeEbay: true,
      includeGoogleShopping: true
    })

    // Prepare product data for pricing analysis
    const productData = {
      title: product.title,
      category: product.category || 'general',
      brand: product.brand || 'unknown',
      condition: {
        grade: product.condition || 'used',
        score: 0.7 // Default score, could be enhanced with AI analysis
      },
      colors: product.colors ? JSON.parse(product.colors) : [],
      size: product.size
    }

    // Perform pricing analysis
    const pricingAnalysis = await dynamicPricingService.analyzePricing(
      productData,
      marketData,
      {
        strategy: 'balanced',
        competitivePosition: 'competitive'
      }
    )

    // Store pricing analysis in database
    await prisma.product.update({
      where: { id: productId },
      data: {
        price: pricingAnalysis.recommendedPrice,
        pricingData: JSON.stringify(pricingAnalysis)
      }
    })

    return NextResponse.json(pricingAnalysis)

  } catch (error) {
    console.error('Error in pricing analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze pricing' },
      { status: 500 }
    )
  }
}