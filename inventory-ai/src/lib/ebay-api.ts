import { z } from 'zod';

// eBay API Configuration
const EBAY_CONFIG = {
  // Sandbox URLs for development
  SANDBOX_BASE_URL: 'https://api.sandbox.ebay.com',
  PRODUCTION_BASE_URL: 'https://api.ebay.com',
  
  // API Endpoints
  ENDPOINTS: {
    // Browse API - for product data (current and past)
    BROWSE: '/buy/browse/v1',
    SEARCH: '/buy/browse/v1/item_summary/search',
    ITEM_DETAILS: '/buy/browse/v1/item',
    
    // Listing Management API
    LISTING_MANAGEMENT: '/sell/inventory/v1',
    INVENTORY_ITEMS: '/sell/inventory/v1/inventory_item',
    OFFERS: '/sell/inventory/v1/offer',
    
    // Catalog API
    CATALOG: '/commerce/catalog/v1_beta',
    PRODUCT_SEARCH: '/commerce/catalog/v1_beta/product_summary/search',
    PRODUCT_DETAILS: '/commerce/catalog/v1_beta/product',
    
    // Inventory API
    INVENTORY: '/sell/inventory/v1',
    INVENTORY_LOCATION: '/sell/inventory/v1/location',
    
    // Feed API
    FEED: '/sell/feed/v1',
    INVENTORY_FEED: '/sell/feed/v1/inventory_item',
    
    // Merchant Integration Platform
    MERCHANT: '/sell/account/v1',
    FULFILLMENT_POLICY: '/sell/account/v1/fulfillment_policy',
    PAYMENT_POLICY: '/sell/account/v1/payment_policy',
    RETURN_POLICY: '/sell/account/v1/return_policy',
    
    // Inventory Mapping API
    INVENTORY_MAPPING: '/sell/inventory/v1/inventory_item_group'
  }
};

// eBay API Response Types
export interface EbaySearchResult {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  image?: {
    imageUrl: string;
  };
  seller: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  shippingOptions?: Array<{
    shippingCost: {
      value: string;
      currency: string;
    };
    shippingServiceCode: string;
  }>;
  itemLocation?: {
    country: string;
    postalCode: string;
  };
  categories?: Array<{
    categoryId: string;
    categoryName: string;
  }>;
}

export interface EbayItemDetails {
  itemId: string;
  title: string;
  description?: string;
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  conditionDescription?: string;
  brand?: string;
  mpn?: string; // Manufacturer Part Number
  upc?: string;
  ean?: string;
  isbn?: string;
  epid?: string; // eBay Product ID
  aspects?: Record<string, string[]>;
  specifications?: Record<string, string>;
  images: Array<{
    imageUrl: string;
  }>;
  seller: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  shippingOptions: Array<{
    shippingCost: {
      value: string;
      currency: string;
    };
    shippingServiceCode: string;
    deliveryOptions: string[];
  }>;
  returnPolicy?: {
    returnsAccepted: boolean;
    returnPeriod?: {
      value: number;
      unit: string;
    };
    returnShippingCostPayer?: string;
  };
  itemLocation: {
    country: string;
    postalCode: string;
    city?: string;
    stateOrProvince?: string;
  };
  categories: Array<{
    categoryId: string;
    categoryName: string;
  }>;
  itemWebUrl: string;
  estimatedAvailabilities?: Array<{
    estimatedAvailableQuantity: number;
    deliveryOptions: string[];
  }>;
}

export interface EbayCatalogProduct {
  productId: string;
  title: string;
  brand?: string;
  mpn?: string;
  gtin?: string;
  aspects?: Record<string, string[]>;
  description?: string;
  images?: Array<{
    imageUrl: string;
  }>;
  productWebUrl?: string;
}

export interface EbayInventoryItem {
  sku: string;
  product: {
    title: string;
    description?: string;
    brand?: string;
    mpn?: string;
    aspects?: Record<string, string[]>;
    imageUrls?: string[];
    upc?: string[];
    ean?: string[];
    isbn?: string[];
  };
  condition: string;
  conditionDescription?: string;
  availability: {
    shipToLocationAvailability: {
      quantity: number;
    };
  };
  packageWeightAndSize?: {
    dimensions?: {
      height: number;
      length: number;
      width: number;
      unit: 'INCH' | 'CENTIMETER';
    };
    packageType?: string;
    weight?: {
      value: number;
      unit: 'POUND' | 'KILOGRAM';
    };
  };
}

export interface EbayOffer {
  offerId?: string;
  sku: string;
  marketplaceId: string;
  format: 'AUCTION' | 'FIXED_PRICE';
  availableQuantity: number;
  categoryId: string;
  listingDescription?: string;
  listingPolicies: {
    fulfillmentPolicyId: string;
    paymentPolicyId: string;
    returnPolicyId: string;
  };
  pricingSummary: {
    price: {
      currency: string;
      value: string;
    };
  };
  quantityLimitPerBuyer?: number;
  tax?: {
    applyTax: boolean;
    thirdPartyTaxCategory?: string;
    vatPercentage?: number;
  };
}

export class EbayApiService {
  private accessToken: string;
  private isProduction: boolean;
  private baseUrl: string;

  constructor(accessToken: string, isProduction: boolean = false) {
    this.accessToken = accessToken;
    this.isProduction = isProduction;
    this.baseUrl = isProduction ? EBAY_CONFIG.PRODUCTION_BASE_URL : EBAY_CONFIG.SANDBOX_BASE_URL;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', // Default to US marketplace
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Browse API - Search for items
  async searchItems(query: string, options: {
    categoryIds?: string[];
    filter?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ items: EbaySearchResult[]; total: number }> {
    const params = new URLSearchParams({
      q: query,
      limit: (options.limit || 50).toString(),
      offset: (options.offset || 0).toString(),
    });

    if (options.categoryIds?.length) {
      params.append('category_ids', options.categoryIds.join(','));
    }
    if (options.filter) {
      params.append('filter', options.filter);
    }
    if (options.sort) {
      params.append('sort', options.sort);
    }

    const endpoint = `${EBAY_CONFIG.ENDPOINTS.SEARCH}?${params.toString()}`;
    const response = await this.makeRequest(endpoint);

    return {
      items: response.itemSummaries || [],
      total: response.total || 0,
    };
  }

  // Browse API - Get item details
  async getItemDetails(itemId: string): Promise<EbayItemDetails> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.ITEM_DETAILS}/${itemId}`;
    return this.makeRequest(endpoint);
  }

  // Catalog API - Search products
  async searchCatalogProducts(query: string, options: {
    categoryIds?: string[];
    aspects?: Record<string, string>;
    limit?: number;
  } = {}): Promise<{ products: EbayCatalogProduct[]; total: number }> {
    const params = new URLSearchParams({
      q: query,
      limit: (options.limit || 50).toString(),
    });

    if (options.categoryIds?.length) {
      params.append('category_ids', options.categoryIds.join(','));
    }

    const endpoint = `${EBAY_CONFIG.ENDPOINTS.PRODUCT_SEARCH}?${params.toString()}`;
    const response = await this.makeRequest(endpoint);

    return {
      products: response.productSummaries || [],
      total: response.total || 0,
    };
  }

  // Catalog API - Get product details
  async getCatalogProduct(productId: string): Promise<EbayCatalogProduct> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.PRODUCT_DETAILS}/${productId}`;
    return this.makeRequest(endpoint);
  }

  // Inventory API - Create or update inventory item
  async createOrUpdateInventoryItem(sku: string, inventoryItem: EbayInventoryItem): Promise<void> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.INVENTORY_ITEMS}/${sku}`;
    await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(inventoryItem),
    });
  }

  // Inventory API - Get inventory item
  async getInventoryItem(sku: string): Promise<EbayInventoryItem> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.INVENTORY_ITEMS}/${sku}`;
    return this.makeRequest(endpoint);
  }

  // Inventory API - Delete inventory item
  async deleteInventoryItem(sku: string): Promise<void> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.INVENTORY_ITEMS}/${sku}`;
    await this.makeRequest(endpoint, { method: 'DELETE' });
  }

  // Listing Management - Create offer
  async createOffer(offer: EbayOffer): Promise<{ offerId: string }> {
    const endpoint = EBAY_CONFIG.ENDPOINTS.OFFERS;
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(offer),
    });
  }

  // Listing Management - Update offer
  async updateOffer(offerId: string, offer: Partial<EbayOffer>): Promise<void> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.OFFERS}/${offerId}`;
    await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(offer),
    });
  }

  // Listing Management - Publish offer
  async publishOffer(offerId: string): Promise<{ listingId: string }> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.OFFERS}/${offerId}/publish`;
    return this.makeRequest(endpoint, { method: 'POST' });
  }

  // Listing Management - Withdraw offer
  async withdrawOffer(offerId: string): Promise<void> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.OFFERS}/${offerId}/withdraw`;
    await this.makeRequest(endpoint, { method: 'POST' });
  }

  // Get competitive pricing data for a product
  async getCompetitivePricing(productQuery: string, options: {
    condition?: string;
    categoryId?: string;
    brand?: string;
    model?: string;
  } = {}): Promise<{
    averagePrice: number;
    priceRange: { min: number; max: number };
    totalListings: number;
    recentSales: Array<{
      price: number;
      condition: string;
      soldDate?: string;
    }>;
  }> {
    // Build search query with filters
    let searchQuery = productQuery;
    if (options.brand) searchQuery += ` ${options.brand}`;
    if (options.model) searchQuery += ` ${options.model}`;

    const filters = [];
    if (options.condition) {
      filters.push(`conditionIds:{${this.getConditionId(options.condition)}}`);
    }
    if (options.categoryId) {
      filters.push(`categoryIds:{${options.categoryId}}`);
    }

    const searchOptions = {
      filter: filters.join(','),
      sort: 'price',
      limit: 100,
    };

    const results = await this.searchItems(searchQuery, searchOptions);
    
    const prices = results.items
      .map(item => parseFloat(item.price.value))
      .filter(price => !isNaN(price));

    if (prices.length === 0) {
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        totalListings: 0,
        recentSales: [],
      };
    }

    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      totalListings: results.total,
      recentSales: results.items.slice(0, 10).map(item => ({
        price: parseFloat(item.price.value),
        condition: item.condition,
      })),
    };
  }

  // Helper method to map condition names to eBay condition IDs
  private getConditionId(condition: string): string {
    const conditionMap: Record<string, string> = {
      'new': '1000',
      'open_box': '1500',
      'refurbished': '2000',
      'used': '3000',
      'very_good': '4000',
      'good': '5000',
      'acceptable': '6000',
      'for_parts': '7000',
    };

    return conditionMap[condition.toLowerCase()] || '3000'; // Default to 'used'
  }

  // Get eBay categories for a product
  async suggestCategories(productTitle: string, brand?: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    categoryPath: string;
  }>> {
    // This would typically use eBay's category suggestion API
    // For now, we'll return some common categories based on keywords
    const categories = [];
    
    const title = productTitle.toLowerCase();
    
    if (title.includes('phone') || title.includes('smartphone')) {
      categories.push({
        categoryId: '9355',
        categoryName: 'Cell Phones & Smartphones',
        categoryPath: 'Cell Phones & Accessories > Cell Phones & Smartphones',
      });
    }
    
    if (title.includes('laptop') || title.includes('computer')) {
      categories.push({
        categoryId: '177',
        categoryName: 'Laptops & Netbooks',
        categoryPath: 'Computers/Tablets & Networking > Laptops & Netbooks',
      });
    }
    
    if (title.includes('watch')) {
      categories.push({
        categoryId: '31387',
        categoryName: 'Wristwatches',
        categoryPath: 'Jewelry & Watches > Watches, Parts & Accessories > Wristwatches',
      });
    }

    // Add more category logic as needed
    return categories;
  }

  // Inventory Mapping - Create inventory item group
  async createInventoryItemGroup(inventoryItemGroupKey: string, data: {
    title: string;
    description?: string;
    imageUrls?: string[];
    aspects?: Record<string, string[]>;
    variantSKUs: string[];
  }): Promise<void> {
    const endpoint = `${EBAY_CONFIG.ENDPOINTS.INVENTORY_MAPPING}/${inventoryItemGroupKey}`;
    await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const ebayApi = new EbayApiService(
  process.env.EBAY_ACCESS_TOKEN || '',
  process.env.NODE_ENV === 'production'
);