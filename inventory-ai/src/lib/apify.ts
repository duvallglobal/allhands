import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export interface EbayScrapingResult {
  title: string;
  price: number;
  condition: string;
  url: string;
  imageUrl?: string;
  seller: string;
  shipping?: number;
  location?: string;
  listingDate?: string;
  soldDate?: string;
  isSold: boolean;
  watchers?: number;
  bids?: number;
}

export interface GoogleShoppingResult {
  title: string;
  price: number;
  url: string;
  imageUrl?: string;
  seller: string;
  rating?: number;
  reviews?: number;
  shipping?: number;
  availability?: string;
}

export class ApifyService {
  private client: ApifyApi;

  constructor() {
    this.client = apifyClient;
  }

  /**
   * Scrape eBay for product listings
   */
  async scrapeEbay(searchQuery: string, options: {
    maxItems?: number;
    condition?: string;
    sortBy?: 'BestMatch' | 'EndTimeSoonest' | 'PricePlusShippingLowest' | 'PricePlusShippingHighest';
  } = {}): Promise<EbayScrapingResult[]> {
    try {
      const input = {
        searchQueries: [searchQuery],
        maxItemsPerQuery: options.maxItems || 20,
        extendOutputFunction: `($) => {
          return {
            watchers: $('.notranslate').text().trim(),
            bids: $('.vi-acc-del-range').text().trim(),
            condition: $('.u-flL.condText').text().trim(),
            shipping: $('.notranslate.vi-price .notranslate').text().trim(),
            location: $('.ux-textspans.ux-textspans--SECONDARY').text().trim()
          };
        }`,
        proxyConfiguration: {
          useApifyProxy: true,
        },
      };

      // Use eBay scraper actor
      const run = await this.client.actor('dtrungtin/ebay-scraper').call(input);
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      return items.map((item: any) => ({
        title: item.title || '',
        price: this.parsePrice(item.price),
        condition: item.condition || 'Unknown',
        url: item.url || '',
        imageUrl: item.image,
        seller: item.seller || '',
        shipping: this.parsePrice(item.shipping),
        location: item.location || '',
        listingDate: item.listingDate,
        soldDate: item.soldDate,
        isSold: item.isSold || false,
        watchers: parseInt(item.watchers) || 0,
        bids: parseInt(item.bids) || 0,
      }));
    } catch (error) {
      console.error('Error scraping eBay:', error);
      throw new Error('Failed to scrape eBay data');
    }
  }

  /**
   * Scrape Google Shopping for product listings
   */
  async scrapeGoogleShopping(searchQuery: string, options: {
    maxItems?: number;
    country?: string;
  } = {}): Promise<GoogleShoppingResult[]> {
    try {
      const input = {
        queries: [searchQuery],
        maxPagesPerQuery: Math.ceil((options.maxItems || 20) / 10),
        countryCode: options.country || 'US',
        languageCode: 'en',
        resultsPerPage: 100,
        includeUnfilteredResults: false,
        mobileResults: false,
      };

      // Use Google Shopping scraper actor
      const run = await this.client.actor('compass/google-shopping-scraper').call(input);
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      return items.slice(0, options.maxItems || 20).map((item: any) => ({
        title: item.title || '',
        price: this.parsePrice(item.price),
        url: item.url || '',
        imageUrl: item.imageUrl,
        seller: item.merchantName || item.seller || '',
        rating: item.rating ? parseFloat(item.rating) : undefined,
        reviews: item.reviewsCount ? parseInt(item.reviewsCount) : undefined,
        shipping: this.parsePrice(item.shipping),
        availability: item.availability || '',
      }));
    } catch (error) {
      console.error('Error scraping Google Shopping:', error);
      throw new Error('Failed to scrape Google Shopping data');
    }
  }

  /**
   * Get comprehensive market data for a product
   */
  async getMarketData(searchQuery: string, options: {
    maxItemsPerPlatform?: number;
    includeEbay?: boolean;
    includeGoogleShopping?: boolean;
  } = {}) {
    const results: {
      ebay: EbayScrapingResult[];
      googleShopping: GoogleShoppingResult[];
      summary: {
        totalListings: number;
        averagePrice: number;
        priceRange: { min: number; max: number };
        platforms: string[];
      };
    } = {
      ebay: [],
      googleShopping: [],
      summary: {
        totalListings: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        platforms: [],
      },
    };

    const promises: Promise<any>[] = [];

    if (options.includeEbay !== false) {
      promises.push(
        this.scrapeEbay(searchQuery, { maxItems: options.maxItemsPerPlatform || 15 })
          .then(data => {
            results.ebay = data;
            results.summary.platforms.push('eBay');
          })
          .catch(error => {
            console.error('eBay scraping failed:', error);
            results.ebay = [];
          })
      );
    }

    if (options.includeGoogleShopping !== false) {
      promises.push(
        this.scrapeGoogleShopping(searchQuery, { maxItems: options.maxItemsPerPlatform || 15 })
          .then(data => {
            results.googleShopping = data;
            results.summary.platforms.push('Google Shopping');
          })
          .catch(error => {
            console.error('Google Shopping scraping failed:', error);
            results.googleShopping = [];
          })
      );
    }

    await Promise.all(promises);

    // Calculate summary statistics
    const allPrices = [
      ...results.ebay.map(item => item.price).filter(price => price > 0),
      ...results.googleShopping.map(item => item.price).filter(price => price > 0),
    ];

    if (allPrices.length > 0) {
      results.summary.totalListings = allPrices.length;
      results.summary.averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
      results.summary.priceRange = {
        min: Math.min(...allPrices),
        max: Math.max(...allPrices),
      };
    }

    return results;
  }

  /**
   * Parse price string to number
   */
  private parsePrice(priceStr: string | number | undefined): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleaned = priceStr.toString().replace(/[^0-9.,]/g, '');
    const parsed = parseFloat(cleaned.replace(',', ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculate similarity score between two product titles
   */
  calculateSimilarity(title1: string, title2: string): number {
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
}

export const apifyService = new ApifyService();