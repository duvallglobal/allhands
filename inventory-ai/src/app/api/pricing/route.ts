import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { marketData, condition, category, brand } = await request.json()

    if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
      return NextResponse.json({ error: "Market data is required" }, { status: 400 })
    }

    // Calculate base price from market data
    const avgMarketPrice = marketData.reduce((sum, data) => sum + data.averagePrice, 0) / marketData.length
    const minMarketPrice = Math.min(...marketData.map(data => data.minPrice))
    const maxMarketPrice = Math.max(...marketData.map(data => data.maxPrice))

    // Condition multipliers
    const conditionMultipliers = {
      'new': 1.0,
      'like-new': 0.85,
      'very-good': 0.75,
      'good': 0.65,
      'acceptable': 0.50
    }

    // Category adjustments (some categories hold value better)
    const categoryMultipliers = {
      'electronics': 0.9, // Electronics depreciate quickly
      'clothing': 0.6,    // Clothing has lower resale value
      'home': 0.8,        // Home goods moderate depreciation
      'books': 0.4,       // Books have low resale value
      'toys': 0.7,        // Toys moderate depreciation
      'sports': 0.8,      // Sports equipment holds value well
      'collectibles': 1.1, // Collectibles can appreciate
      'jewelry': 0.9,     // Jewelry holds value well
      'default': 0.75
    }

    // Brand premium (simplified - in production, use a comprehensive brand database)
    const premiumBrands = ['apple', 'nike', 'adidas', 'sony', 'samsung', 'canon', 'nikon']
    const brandMultiplier = brand && premiumBrands.some(b => 
      brand.toLowerCase().includes(b)
    ) ? 1.1 : 1.0

    // Calculate suggested price
    const conditionMultiplier = conditionMultipliers[condition as keyof typeof conditionMultipliers] || 0.75
    const categoryMultiplier = categoryMultipliers[category as keyof typeof categoryMultipliers] || categoryMultipliers.default
    
    let suggestedPrice = avgMarketPrice * conditionMultiplier * categoryMultiplier * brandMultiplier

    // Apply pricing strategy (competitive pricing)
    // Price slightly below average to be competitive
    suggestedPrice *= 0.95

    // Ensure price is within reasonable bounds
    const minSuggestedPrice = minMarketPrice * conditionMultiplier * 0.8
    const maxSuggestedPrice = maxMarketPrice * conditionMultiplier * 1.2

    suggestedPrice = Math.max(minSuggestedPrice, Math.min(suggestedPrice, maxSuggestedPrice))

    // Calculate confidence based on data quality
    const totalSamples = marketData.reduce((sum, data) => sum + (data.sampleSize || 1), 0)
    const avgConfidence = marketData.reduce((sum, data) => sum + (data.confidence || 50), 0) / marketData.length
    
    let confidence = avgConfidence
    if (totalSamples >= 10) confidence += 10
    if (totalSamples >= 20) confidence += 5
    if (marketData.length > 1) confidence += 5 // Multiple sources
    
    confidence = Math.min(95, Math.max(30, confidence))

    // Generate pricing recommendations
    const recommendations = {
      suggested: Math.round(suggestedPrice * 100) / 100,
      competitive: Math.round(suggestedPrice * 0.9 * 100) / 100,
      premium: Math.round(suggestedPrice * 1.15 * 100) / 100,
      quick_sale: Math.round(suggestedPrice * 0.8 * 100) / 100
    }

    // Calculate potential profit margins (assuming 30% cost basis)
    const estimatedCost = suggestedPrice * 0.3
    const profitMargin = ((suggestedPrice - estimatedCost) / suggestedPrice * 100)

    return NextResponse.json({
      success: true,
      pricing: {
        marketPrice: Math.round(avgMarketPrice * 100) / 100,
        suggestedPrice: recommendations.suggested,
        priceRange: {
          min: Math.round(minMarketPrice * conditionMultiplier * 100) / 100,
          max: Math.round(maxMarketPrice * conditionMultiplier * 100) / 100
        },
        recommendations,
        confidence: Math.round(confidence),
        factors: {
          condition: {
            value: condition,
            impact: conditionMultiplier
          },
          category: {
            value: category,
            impact: categoryMultiplier
          },
          brand: {
            value: brand || 'unknown',
            impact: brandMultiplier
          }
        },
        analysis: {
          marketSamples: totalSamples,
          dataSources: marketData.length,
          estimatedProfitMargin: Math.round(profitMargin)
        }
      }
    })
  } catch (error) {
    console.error("Pricing calculation error:", error)
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 }
    )
  }
}