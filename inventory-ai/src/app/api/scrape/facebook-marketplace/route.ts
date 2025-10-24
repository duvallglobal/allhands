import { NextRequest, NextResponse } from 'next/server'
import { facebookMarketplaceService } from '@/lib/facebook-marketplace'

export async function POST(request: NextRequest) {
  try {
    const { query, location, category, condition, maxResults = 50 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    console.log('Facebook Marketplace search request:', { query, location, category, condition })

    const listings = await facebookMarketplaceService.searchListings({
      query,
      location,
      category,
      condition,
      maxResults,
      sortBy: 'creation_time_descend'
    })

    return NextResponse.json({
      success: true,
      data: {
        listings,
        totalFound: listings.length,
        query,
        searchParams: { location, category, condition }
      }
    })

  } catch (error) {
    console.error('Facebook Marketplace scraping error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to scrape Facebook Marketplace',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const location = searchParams.get('location')
    const category = searchParams.get('category')
    const condition = searchParams.get('condition')
    const maxResults = parseInt(searchParams.get('maxResults') || '25')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const listings = await facebookMarketplaceService.searchListings({
      query,
      location: location || undefined,
      category: category || undefined,
      condition: condition || undefined,
      maxResults,
      sortBy: 'creation_time_descend'
    })

    return NextResponse.json({
      success: true,
      data: {
        listings,
        totalFound: listings.length,
        query,
        searchParams: { location, category, condition }
      }
    })

  } catch (error) {
    console.error('Facebook Marketplace scraping error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to scrape Facebook Marketplace',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}