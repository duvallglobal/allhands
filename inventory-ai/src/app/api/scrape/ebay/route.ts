import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productName, category, brand } = await request.json()

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    // Construct search query
    const searchQuery = [productName, brand].filter(Boolean).join(" ")
    
    // ScrapingDog API configuration
    const scrapingDogApiKey = process.env.SCRAPINGDOG_API_KEY
    if (!scrapingDogApiKey) {
      console.warn("ScrapingDog API key not configured")
      // Return mock data for development
      return NextResponse.json({
        success: true,
        results: generateMockEbayData(productName, category)
      })
    }

    // eBay search URL
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sacat=0&LH_Sold=1&LH_Complete=1&rt=nc`
    
    // ScrapingDog API endpoint
    const scrapingUrl = `https://api.scrapingdog.com/scrape?api_key=${scrapingDogApiKey}&url=${encodeURIComponent(ebaySearchUrl)}&dynamic=false`

    const response = await fetch(scrapingUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`ScrapingDog API error: ${response.status}`)
    }

    const html = await response.text()
    
    // Parse eBay results from HTML
    const results = parseEbayResults(html, productName)

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error("eBay scraping error:", error)
    
    // Return mock data on error for development
    const { productName, category } = await request.json()
    return NextResponse.json({
      success: true,
      results: generateMockEbayData(productName, category),
      note: "Using mock data due to scraping error"
    })
  }
}

function parseEbayResults(html: string, productName: string) {
  // Basic HTML parsing to extract product information
  // In a production environment, you'd use a proper HTML parser like cheerio
  const results = []
  
  try {
    // Extract sold listings data using regex patterns
    // This is a simplified version - in production, use proper HTML parsing
    const priceMatches = html.match(/\$[\d,]+\.?\d*/g) || []
    const titleMatches = html.match(/<h3[^>]*>([^<]+)<\/h3>/g) || []
    
    const prices = priceMatches
      .map(price => parseFloat(price.replace(/[$,]/g, '')))
      .filter(price => price > 0 && price < 10000)
      .slice(0, 10)
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      results.push({
        source: 'eBay Sold Listings',
        averagePrice: Math.round(avgPrice * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        sampleSize: prices.length,
        confidence: prices.length >= 5 ? 85 : 60
      })
    }
  } catch (parseError) {
    console.error("Error parsing eBay results:", parseError)
  }
  
  // If no results found, return mock data
  if (results.length === 0) {
    return generateMockEbayData(productName, 'unknown')
  }
  
  return results
}

function generateMockEbayData(productName: string, category: string) {
  // Generate realistic mock pricing data based on product category
  const basePrices = {
    electronics: { min: 50, max: 500, avg: 200 },
    clothing: { min: 10, max: 100, avg: 35 },
    home: { min: 20, max: 200, avg: 75 },
    books: { min: 5, max: 50, avg: 15 },
    toys: { min: 10, max: 80, avg: 30 },
    sports: { min: 25, max: 300, avg: 100 },
    default: { min: 20, max: 150, avg: 60 }
  }
  
  const priceRange = basePrices[category as keyof typeof basePrices] || basePrices.default
  
  // Add some randomness to make it more realistic
  const variance = 0.3
  const avgPrice = priceRange.avg * (1 + (Math.random() - 0.5) * variance)
  const minPrice = priceRange.min * (1 + (Math.random() - 0.5) * variance)
  const maxPrice = priceRange.max * (1 + (Math.random() - 0.5) * variance)
  
  return [
    {
      source: 'eBay Sold Listings (Mock)',
      averagePrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      sampleSize: Math.floor(Math.random() * 15) + 5,
      confidence: 75,
      note: 'Mock data for development'
    }
  ]
}