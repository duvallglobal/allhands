"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Eye,
  Edit,
  Package,
  Globe
} from "lucide-react"

interface Product {
  id: string
  title: string
  description?: string
  category?: string
  brand?: string
  model?: string
  price?: number
  imageUrl?: string
  status: string
  sku?: string
  additionalImages?: string[]
  shopifyId?: string
  ebayId?: string
  listedAt?: string
}

interface ListingStageProps {
  products: Product[]
  onProductUpdate: (productId: string, updates: Partial<Product>) => Promise<void>
  onStageComplete: (productId: string, nextStatus: string) => Promise<void>
}

export function ListingStage({ products, onProductUpdate, onStageComplete }: ListingStageProps) {
  const [syncing, setSyncing] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  const handleSyncToShopify = async (productId: string) => {
    setSyncing(productId)
    try {
      const response = await fetch(`/api/products/${productId}/sync-shopify`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        await onProductUpdate(productId, {
          shopifyId: data.shopifyId,
          listedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error syncing to Shopify:', error)
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncToEbay = async (productId: string) => {
    setPublishing(productId)
    try {
      const response = await fetch(`/api/products/${productId}/sync-ebay`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        await onProductUpdate(productId, {
          ebayId: data.ebayId,
          listedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error syncing to eBay:', error)
    } finally {
      setPublishing(null)
    }
  }

  const handleMultiPlatformSync = async (productId: string) => {
    setSyncing(productId)
    try {
      // Sync to both platforms simultaneously
      const [shopifyResponse, ebayResponse] = await Promise.allSettled([
        fetch(`/api/products/${productId}/sync-shopify`, { method: 'POST' }),
        fetch(`/api/products/${productId}/sync-ebay`, { method: 'POST' })
      ])

      const updates: any = { listedAt: new Date().toISOString() }

      if (shopifyResponse.status === 'fulfilled' && shopifyResponse.value.ok) {
        const shopifyData = await shopifyResponse.value.json()
        updates.shopifyId = shopifyData.shopifyId
      }

      if (ebayResponse.status === 'fulfilled' && ebayResponse.value.ok) {
        const ebayData = await ebayResponse.value.json()
        updates.ebayId = ebayData.ebayId
      }

      await onProductUpdate(productId, updates)
    } catch (error) {
      console.error('Error with multi-platform sync:', error)
    } finally {
      setSyncing(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlatformStatus = (product: Product) => {
    const platforms = []
    if (product.shopifyId) platforms.push('Shopify')
    if (product.ebayId) platforms.push('eBay')
    return platforms
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Listing & Distribution</h2>
          <p className="text-muted-foreground">
            Publish products to multiple platforms and manage active listings
          </p>
        </div>
      </div>

      {/* Products in Listing Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map((product) => {
          const platforms = getPlatformStatus(product)
          
          return (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {product.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Listed
                      </Badge>
                      {product.sku && (
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      )}
                      {product.price && (
                        <Badge variant="outline" className="text-xs font-semibold text-green-600">
                          {formatPrice(product.price)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* View details */}}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {product.imageUrl && (
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {product.brand && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Brand:</span>
                          <span className="font-medium">{product.brand}</span>
                        </div>
                      )}
                      {product.category && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{product.category}</span>
                        </div>
                      )}
                      {product.listedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Listed:</span>
                          <span className="text-xs">{formatDate(product.listedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Platform Status */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Platform Status:</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Shopify
                          </span>
                          {product.shopifyId ? (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Not Listed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            eBay
                          </span>
                          {product.ebayId ? (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Not Listed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Listing Actions */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Platform Actions</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={product.shopifyId ? "outline" : "default"}
                      onClick={() => handleSyncToShopify(product.id)}
                      disabled={syncing === product.id}
                      className="text-xs"
                    >
                      {syncing === product.id ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : product.shopifyId ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Package className="h-3 w-3 mr-1" />
                      )}
                      {product.shopifyId ? 'Update' : 'Sync'} Shopify
                    </Button>

                    <Button
                      size="sm"
                      variant={product.ebayId ? "outline" : "default"}
                      onClick={() => handleSyncToEbay(product.id)}
                      disabled={publishing === product.id}
                      className="text-xs"
                    >
                      {publishing === product.id ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : product.ebayId ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Globe className="h-3 w-3 mr-1" />
                      )}
                      {product.ebayId ? 'Update' : 'List'} eBay
                    </Button>
                  </div>

                  {/* Multi-platform sync */}
                  {!product.shopifyId || !product.ebayId ? (
                    <Button
                      size="sm"
                      onClick={() => handleMultiPlatformSync(product.id)}
                      disabled={syncing === product.id}
                      className="w-full text-xs"
                      variant="secondary"
                    >
                      {syncing === product.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Syncing to All Platforms...
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3 mr-2" />
                          Sync to All Platforms
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Listed on All Platforms
                      </Badge>
                    </div>
                  )}
                </div>

                {/* External Links */}
                {(product.shopifyId || product.ebayId) && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="text-sm font-medium">View Listings:</div>
                    <div className="flex gap-2">
                      {product.shopifyId && (
                        <Button size="sm" variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Shopify
                        </Button>
                      )}
                      {product.ebayId && (
                        <Button size="sm" variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          eBay
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mark as Sold */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStageComplete(product.id, 'sold')}
                  className="w-full text-xs"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Sold
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {products.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Ready for Listing</h3>
            <p className="text-muted-foreground text-center">
              Products will appear here after they complete the photography stage.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}