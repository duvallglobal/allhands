import { ApifyClient } from 'apify-client'

const apify = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

export interface FacebookMarketplaceListing {
  title: string
  url: string
  minPrice?: number
  maxPrice?: number
  salePrice: number
  location: string
  imageUrl?: string
  description?: string
  condition?: string
  seller?: string
  listingDate?: string
  category?: string
  views?: number
  saves?: number
}

export interface FacebookMarketplaceSearchParams {
  query: string
  location?: string
  minPrice?: number
  maxPrice?: number
  category?: string
  condition?: string
  sortBy?: 'price_low_to_high' | 'price_high_to_low' | 'creation_time_descend' | 'distance_ascend'
  maxResults?: number
}

export class FacebookMarketplaceService {
  private static readonly ACTOR_ID = 'dtrungtin/facebook-marketplace-scraper'
  
  async searchListings(params: FacebookMarketplaceSearchParams): Promise<FacebookMarketplaceListing[]> {
    try {
      console.log('Starting Facebook Marketplace search with params:', params)
      
      const input = {
        searchQuery: params.query,
        location: params.location || 'United States',
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        category: params.category,
        condition: params.condition,
        sortBy: params.sortBy || 'creation_time_descend',
        maxItems: params.maxResults || 50,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }

      const run = await apify.actor(FacebookMarketplaceService.ACTOR_ID).call(input)
      
      if (!run.defaultDatasetId) {
        throw new Error('No dataset returned from Facebook Marketplace scraper')
      }

      const { items } = await apify.dataset(run.defaultDatasetId).listItems()
      
      return items.map((item: any) => ({
        title: item.title || '',
        url: item.url || '',
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
        salePrice: item.price || item.salePrice || 0,
        location: item.location || '',
        imageUrl: item.image || item.imageUrl,
        description: item.description,
        condition: item.condition,
        seller: item.seller || item.sellerName,
        listingDate: item.createdAt || item.listingDate,
        category: item.category,
        views: item.views,
        saves: item.saves
      }))

    } catch (error) {
      console.error('Facebook Marketplace search error:', error)
      throw new Error(`Facebook Marketplace search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMarketAnalysis(productTitle: string, category?: string, condition?: string): Promise<{
    averagePrice: number
    priceRange: { min: number; max: number }
    totalListings: number
    recentListings: FacebookMarketplaceListing[]
    locationAnalysis: { [location: string]: { count: number; avgPrice: number } }
    conditionAnalysis: { [condition: string]: { count: number; avgPrice: number } }
  }> {
    try {
      const searchParams: FacebookMarketplaceSearchParams = {
        query: productTitle,
        category,
        condition,
        maxResults: 100,
        sortBy: 'creation_time_descend'
      }

      const listings = await this.searchListings(searchParams)
      
      if (listings.length === 0) {
        return {
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          totalListings: 0,
          recentListings: [],
          locationAnalysis: {},
          conditionAnalysis: {}
        }
      }

      // Filter out listings with no price
      const validListings = listings.filter(listing => listing.salePrice > 0)
      
      // Calculate price statistics
      const prices = validListings.map(listing => listing.salePrice)
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      // Location analysis
      const locationAnalysis: { [location: string]: { count: number; avgPrice: number } } = {}
      validListings.forEach(listing => {
        const location = listing.location || 'Unknown'
        if (!locationAnalysis[location]) {
          locationAnalysis[location] = { count: 0, avgPrice: 0 }
        }
        locationAnalysis[location].count++
        locationAnalysis[location].avgPrice = 
          (locationAnalysis[location].avgPrice * (locationAnalysis[location].count - 1) + listing.salePrice) / 
          locationAnalysis[location].count
      })

      // Condition analysis
      const conditionAnalysis: { [condition: string]: { count: number; avgPrice: number } } = {}
      validListings.forEach(listing => {
        const cond = listing.condition || 'Unknown'
        if (!conditionAnalysis[cond]) {
          conditionAnalysis[cond] = { count: 0, avgPrice: 0 }
        }
        conditionAnalysis[cond].count++
        conditionAnalysis[cond].avgPrice = 
          (conditionAnalysis[cond].avgPrice * (conditionAnalysis[cond].count - 1) + listing.salePrice) / 
          conditionAnalysis[cond].count
      })

      return {
        averagePrice: Math.round(averagePrice * 100) / 100,
        priceRange: { min: minPrice, max: maxPrice },
        totalListings: validListings.length,
        recentListings: validListings.slice(0, 10), // Most recent 10
        locationAnalysis,
        conditionAnalysis
      }

    } catch (error) {
      console.error('Facebook Marketplace analysis error:', error)
      throw error
    }
  }

  async findSimilarListings(
    productTitle: string, 
    brand?: string, 
    model?: string, 
    category?: string
  ): Promise<FacebookMarketplaceListing[]> {
    try {
      // Create multiple search queries for better coverage
      const searchQueries = [
        productTitle,
        brand && model ? `${brand} ${model}` : '',
        brand ? brand : '',
        category ? `${category} ${productTitle.split(' ').slice(0, 2).join(' ')}` : ''
      ].filter(Boolean)

      const allListings: FacebookMarketplaceListing[] = []

      for (const query of searchQueries) {
        try {
          const listings = await this.searchListings({
            query,
            category,
            maxResults: 25
          })
          allListings.push(...listings)
        } catch (error) {
          console.warn(`Failed to search for query "${query}":`, error)
        }
      }

      // Remove duplicates based on URL
      const uniqueListings = allListings.filter((listing, index, self) => 
        index === self.findIndex(l => l.url === listing.url)
      )

      // Sort by relevance (price similarity and title similarity)
      return uniqueListings
        .filter(listing => listing.salePrice > 0)
        .sort((a, b) => {
          // Simple relevance scoring based on title similarity
          const titleA = a.title.toLowerCase()
          const titleB = b.title.toLowerCase()
          const searchTerms = productTitle.toLowerCase().split(' ')
          
          const scoreA = searchTerms.reduce((score, term) => 
            titleA.includes(term) ? score + 1 : score, 0
          )
          const scoreB = searchTerms.reduce((score, term) => 
            titleB.includes(term) ? score + 1 : score, 0
          )
          
          return scoreB - scoreA
        })
        .slice(0, 20) // Return top 20 most relevant

    } catch (error) {
      console.error('Facebook Marketplace similar listings error:', error)
      throw error
    }
  }
}

export const facebookMarketplaceService = new FacebookMarketplaceService()