import { z } from 'zod';

// Shopify API Configuration
const SHOPIFY_CONFIG = {
  API_VERSION: '2024-01',
  ENDPOINTS: {
    PRODUCTS: '/admin/api/2024-01/products',
    INVENTORY_ITEMS: '/admin/api/2024-01/inventory_items',
    INVENTORY_LEVELS: '/admin/api/2024-01/inventory_levels',
    LOCATIONS: '/admin/api/2024-01/locations',
    METAFIELDS: '/admin/api/2024-01/metafields',
    VARIANTS: '/admin/api/2024-01/variants',
  }
};

// Shopify Product Types
export interface ShopifyProduct {
  id?: number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  template_suffix?: string;
  status: 'active' | 'archived' | 'draft';
  published_scope?: string;
  tags?: string;
  admin_graphql_api_id?: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image?: ShopifyImage;
  seo_title?: string;
  seo_description?: string;
  metafields?: ShopifyMetafield[];
}

export interface ShopifyVariant {
  id?: number;
  product_id?: number;
  title: string;
  price: string;
  sku?: string;
  position?: number;
  inventory_policy: 'deny' | 'continue';
  compare_at_price?: string;
  fulfillment_service: string;
  inventory_management?: 'shopify' | 'not_managed';
  option1?: string;
  option2?: string;
  option3?: string;
  created_at?: string;
  updated_at?: string;
  taxable: boolean;
  barcode?: string;
  grams: number; // Weight in grams
  image_id?: number;
  weight: number;
  weight_unit: 'g' | 'kg' | 'oz' | 'lb';
  inventory_item_id?: number;
  inventory_quantity?: number;
  old_inventory_quantity?: number;
  requires_shipping: boolean;
  admin_graphql_api_id?: string;
  metafields?: ShopifyMetafield[];
}

export interface ShopifyOption {
  id?: number;
  product_id?: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyImage {
  id?: number;
  product_id?: number;
  position?: number;
  created_at?: string;
  updated_at?: string;
  alt?: string;
  width?: number;
  height?: number;
  src: string;
  variant_ids?: number[];
  admin_graphql_api_id?: string;
}

export interface ShopifyMetafield {
  id?: number;
  namespace: string;
  key: string;
  value: string;
  type: 'string' | 'integer' | 'json_string' | 'boolean' | 'date' | 'dimension' | 'weight' | 'volume' | 'rating' | 'color' | 'single_line_text_field' | 'multi_line_text_field' | 'product_reference' | 'file_reference' | 'page_reference' | 'variant_reference' | 'url';
  description?: string;
  owner_id?: number;
  owner_resource: 'product' | 'variant' | 'customer' | 'order' | 'shop' | 'article' | 'page' | 'collection';
  created_at?: string;
  updated_at?: string;
  admin_graphql_api_id?: string;
}

export interface ShopifyInventoryItem {
  id: number;
  sku?: string;
  created_at: string;
  updated_at: string;
  requires_shipping: boolean;
  cost?: string;
  country_code_of_origin?: string;
  province_code_of_origin?: string;
  harmonized_system_code?: string;
  tracked: boolean;
  country_harmonized_system_codes?: Array<{
    country_code: string;
    harmonized_system_code: string;
  }>;
  admin_graphql_api_id: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
  admin_graphql_api_id: string;
}

export interface ShopifyLocation {
  id: number;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  zip?: string;
  province?: string;
  country?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  country_code: string;
  country_name: string;
  province_code?: string;
  legacy: boolean;
  active: boolean;
  admin_graphql_api_id: string;
}

// Enhanced Product Data for Inventory Management
export interface InventoryProductData {
  // Basic Product Info
  title: string;
  description: string;
  brand: string;
  model?: string;
  sku: string;
  barcode?: string;
  
  // Pricing
  price: number;
  compareAtPrice?: number;
  cost?: number;
  
  // Physical Properties
  weight: number;
  weightUnit: 'g' | 'kg' | 'oz' | 'lb';
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  
  // Inventory Management
  trackQuantity: boolean;
  continueSellingWhenOutOfStock: boolean;
  requiresShipping: boolean;
  
  // Condition & Quality
  condition: 'new' | 'used' | 'refurbished' | 'open_box' | 'for_parts';
  conditionNotes?: string;
  qualityGrade?: string;
  
  // Categories & Classification
  productType: string;
  vendor: string;
  tags: string[];
  
  // SEO & Marketing
  seoTitle?: string;
  seoDescription?: string;
  marketingCopy?: string;
  
  // Platform-Specific Data
  ebayCategory?: string;
  facebookCategory?: string;
  
  // Images
  images: Array<{
    src: string;
    alt?: string;
    position?: number;
  }>;
  
  // Custom Metafields
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
  
  // Inventory Tracking
  locations: Array<{
    locationId: number;
    quantity: number;
  }>;
}

export class ShopifyInventoryService {
  private shopDomain: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseUrl = `https://${shopDomain}.myshopify.com`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
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
      throw new Error(`Shopify API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Create a comprehensive product with all inventory data
  async createProduct(productData: InventoryProductData): Promise<ShopifyProduct> {
    // Prepare the product payload
    const product: Partial<ShopifyProduct> = {
      title: productData.title,
      body_html: productData.description,
      vendor: productData.vendor,
      product_type: productData.productType,
      tags: productData.tags.join(', '),
      status: 'active',
      seo_title: productData.seoTitle,
      seo_description: productData.seoDescription,
      variants: [{
        title: 'Default Title',
        price: productData.price.toString(),
        sku: productData.sku,
        barcode: productData.barcode,
        grams: this.convertWeightToGrams(productData.weight, productData.weightUnit),
        weight: productData.weight,
        weight_unit: productData.weightUnit,
        inventory_policy: productData.continueSellingWhenOutOfStock ? 'continue' : 'deny',
        inventory_management: productData.trackQuantity ? 'shopify' : 'not_managed',
        fulfillment_service: 'manual',
        requires_shipping: productData.requiresShipping,
        taxable: true,
        compare_at_price: productData.compareAtPrice?.toString(),
      }],
      images: productData.images.map((img, index) => ({
        src: img.src,
        alt: img.alt || productData.title,
        position: img.position || index + 1,
      })),
      options: [{
        name: 'Title',
        position: 1,
        values: ['Default Title'],
      }],
    };

    const response = await this.makeRequest(SHOPIFY_CONFIG.ENDPOINTS.PRODUCTS, {
      method: 'POST',
      body: JSON.stringify({ product }),
    });

    const createdProduct = response.product;

    // Add metafields after product creation
    if (productData.metafields.length > 0) {
      await this.addProductMetafields(createdProduct.id, productData.metafields);
    }

    // Set inventory levels if tracking quantity
    if (productData.trackQuantity && productData.locations.length > 0) {
      const variantId = createdProduct.variants[0].id;
      const inventoryItemId = createdProduct.variants[0].inventory_item_id;
      
      for (const location of productData.locations) {
        await this.setInventoryLevel(inventoryItemId, location.locationId, location.quantity);
      }
    }

    return createdProduct;
  }

  // Update existing product with new inventory data
  async updateProduct(productId: number, productData: Partial<InventoryProductData>): Promise<ShopifyProduct> {
    const updatePayload: any = {};

    if (productData.title) updatePayload.title = productData.title;
    if (productData.description) updatePayload.body_html = productData.description;
    if (productData.vendor) updatePayload.vendor = productData.vendor;
    if (productData.productType) updatePayload.product_type = productData.productType;
    if (productData.tags) updatePayload.tags = productData.tags.join(', ');
    if (productData.seoTitle) updatePayload.seo_title = productData.seoTitle;
    if (productData.seoDescription) updatePayload.seo_description = productData.seoDescription;

    const response = await this.makeRequest(`${SHOPIFY_CONFIG.ENDPOINTS.PRODUCTS}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ product: updatePayload }),
    });

    return response.product;
  }

  // Add metafields to a product
  async addProductMetafields(productId: number, metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>): Promise<void> {
    for (const metafield of metafields) {
      await this.makeRequest(SHOPIFY_CONFIG.ENDPOINTS.METAFIELDS, {
        method: 'POST',
        body: JSON.stringify({
          metafield: {
            ...metafield,
            owner_id: productId,
            owner_resource: 'product',
          },
        }),
      });
    }
  }

  // Set inventory level for a specific location
  async setInventoryLevel(inventoryItemId: number, locationId: number, quantity: number): Promise<void> {
    await this.makeRequest(`${SHOPIFY_CONFIG.ENDPOINTS.INVENTORY_LEVELS}/set`, {
      method: 'POST',
      body: JSON.stringify({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity,
      }),
    });
  }

  // Get all locations
  async getLocations(): Promise<ShopifyLocation[]> {
    const response = await this.makeRequest(SHOPIFY_CONFIG.ENDPOINTS.LOCATIONS);
    return response.locations;
  }

  // Get product by SKU
  async getProductBySku(sku: string): Promise<ShopifyProduct | null> {
    const response = await this.makeRequest(`${SHOPIFY_CONFIG.ENDPOINTS.PRODUCTS}?fields=id,title,variants&limit=250`);
    
    for (const product of response.products) {
      const variant = product.variants.find((v: ShopifyVariant) => v.sku === sku);
      if (variant) {
        // Get full product details
        const fullProduct = await this.getProduct(product.id);
        return fullProduct;
      }
    }
    
    return null;
  }

  // Get full product details
  async getProduct(productId: number): Promise<ShopifyProduct> {
    const response = await this.makeRequest(`${SHOPIFY_CONFIG.ENDPOINTS.PRODUCTS}/${productId}`);
    return response.product;
  }

  // Sync inventory from Shopify to other platforms
  async syncInventoryToEbay(productId: number, ebayService: any): Promise<void> {
    const product = await this.getProduct(productId);
    
    for (const variant of product.variants) {
      if (variant.sku) {
        // Create eBay inventory item from Shopify data
        const ebayInventoryItem = {
          sku: variant.sku,
          product: {
            title: product.title,
            description: product.body_html,
            brand: product.vendor,
            imageUrls: product.images.map(img => img.src),
          },
          condition: this.mapShopifyConditionToEbay(product),
          availability: {
            shipToLocationAvailability: {
              quantity: variant.inventory_quantity || 0,
            },
          },
          packageWeightAndSize: {
            weight: {
              value: variant.weight,
              unit: variant.weight_unit === 'lb' ? 'POUND' : 'KILOGRAM',
            },
          },
        };

        await ebayService.createOrUpdateInventoryItem(variant.sku, ebayInventoryItem);
      }
    }
  }

  // Helper method to convert weight to grams
  private convertWeightToGrams(weight: number, unit: string): number {
    switch (unit) {
      case 'kg': return weight * 1000;
      case 'lb': return weight * 453.592;
      case 'oz': return weight * 28.3495;
      case 'g':
      default: return weight;
    }
  }

  // Helper method to map Shopify condition to eBay condition
  private mapShopifyConditionToEbay(product: ShopifyProduct): string {
    // This would typically be stored in metafields
    // For now, return a default
    return 'USED_EXCELLENT';
  }

  // Generate comprehensive metafields for inventory management
  static generateInventoryMetafields(analysisData: any): Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }> {
    const metafields = [];

    // AI Analysis Data
    if (analysisData.condition) {
      metafields.push({
        namespace: 'inventory',
        key: 'condition_grade',
        value: analysisData.condition.grade || 'B',
        type: 'single_line_text_field',
      });

      metafields.push({
        namespace: 'inventory',
        key: 'condition_notes',
        value: analysisData.condition.notes || '',
        type: 'multi_line_text_field',
      });
    }

    // Authenticity
    if (analysisData.authenticity) {
      metafields.push({
        namespace: 'inventory',
        key: 'authenticity_verified',
        value: analysisData.authenticity.verified ? 'true' : 'false',
        type: 'boolean',
      });
    }

    // Dimensions
    if (analysisData.dimensions) {
      metafields.push({
        namespace: 'inventory',
        key: 'dimensions',
        value: JSON.stringify(analysisData.dimensions),
        type: 'json_string',
      });
    }

    // Platform Categories
    if (analysisData.ebayCategory) {
      metafields.push({
        namespace: 'platforms',
        key: 'ebay_category',
        value: analysisData.ebayCategory,
        type: 'single_line_text_field',
      });
    }

    if (analysisData.facebookCategory) {
      metafields.push({
        namespace: 'platforms',
        key: 'facebook_category',
        value: analysisData.facebookCategory,
        type: 'single_line_text_field',
      });
    }

    // SEO Data
    if (analysisData.seoKeywords) {
      metafields.push({
        namespace: 'seo',
        key: 'keywords',
        value: Array.isArray(analysisData.seoKeywords) 
          ? analysisData.seoKeywords.join(', ') 
          : analysisData.seoKeywords,
        type: 'single_line_text_field',
      });
    }

    // Market Analysis
    if (analysisData.marketAnalysis) {
      metafields.push({
        namespace: 'market',
        key: 'analysis_data',
        value: JSON.stringify(analysisData.marketAnalysis),
        type: 'json_string',
      });
    }

    return metafields;
  }
}

// Export singleton instance
export const shopifyInventory = new ShopifyInventoryService(
  process.env.SHOPIFY_SHOP_DOMAIN || '',
  process.env.SHOPIFY_ACCESS_TOKEN || ''
);