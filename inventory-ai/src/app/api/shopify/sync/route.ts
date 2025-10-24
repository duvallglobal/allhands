import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productData, imageUrl } = await request.json()

    if (!productData) {
      return NextResponse.json({ error: "Product data is required" }, { status: 400 })
    }

    // Shopify API configuration
    const shopifyDomain = process.env.SHOPIFY_DOMAIN
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN

    if (!shopifyDomain || !shopifyAccessToken) {
      console.warn("Shopify credentials not configured")
      return NextResponse.json({
        success: true,
        message: "Shopify sync simulated (credentials not configured)",
        productId: `mock_${Date.now()}`,
        shopifyUrl: `https://${shopifyDomain || 'your-shop'}.myshopify.com/admin/products/mock_${Date.now()}`
      })
    }

    // Prepare product data for Shopify
    const shopifyProduct = {
      product: {
        title: productData.title,
        body_html: formatDescriptionForShopify(productData.description),
        vendor: productData.brand || '',
        product_type: productData.category || '',
        tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : '',
        status: 'draft', // Create as draft for review
        variants: [
          {
            price: productData.suggestedPrice?.toString() || '0.00',
            inventory_management: 'shopify',
            inventory_quantity: 1,
            weight: parseWeight(productData.weight),
            weight_unit: 'lb'
          }
        ],
        images: imageUrl ? [{ src: imageUrl }] : [],
        options: [
          {
            name: 'Title',
            values: ['Default Title']
          }
        ]
      }
    }

    // Create product in Shopify
    const shopifyApiUrl = `https://${shopifyDomain}.myshopify.com/admin/api/2023-10/products.json`
    
    const response = await fetch(shopifyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken
      },
      body: JSON.stringify(shopifyProduct)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Shopify API error:', errorData)
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const result = await response.json()
    const createdProduct = result.product

    return NextResponse.json({
      success: true,
      message: 'Product successfully synced to Shopify',
      productId: createdProduct.id,
      shopifyUrl: `https://${shopifyDomain}.myshopify.com/admin/products/${createdProduct.id}`,
      product: {
        id: createdProduct.id,
        title: createdProduct.title,
        handle: createdProduct.handle,
        status: createdProduct.status
      }
    })
  } catch (error) {
    console.error("Shopify sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync product to Shopify" },
      { status: 500 }
    )
  }
}

function formatDescriptionForShopify(description: string): string {
  if (!description) return ''
  
  // Convert plain text to basic HTML formatting
  return description
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function parseWeight(weightString: string): number {
  if (!weightString) return 0
  
  // Extract numeric value from weight string
  const match = weightString.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0
}