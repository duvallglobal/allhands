"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  RefreshCw,
  Target,
  BarChart3,
  Eye,
  Edit
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
  condition?: {
    grade: string
    score: number
    indicators: string[]
  }
  colors?: string[]
  size?: string
  material?: string
}

interface PricingStageProps {
  products: Product[]
  onProductUpdate: (productId: string, updates: Partial<Product>) => Promise<void>
  onStageComplete: (productId: string, nextStatus: string) => Promise<void>
}

export function PricingStage({ products, onProductUpdate, onStageComplete }: PricingStageProps) {
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [pricingData, setPricingData] = useState<{ [key: string]: any }>({})

  const handlePricingAnalysis = async (productId: string) => {
    setAnalyzing(productId)
    try {
      // Run comprehensive market analysis including Facebook Marketplace
      const response = await fetch(`/api/products/${productId}/market-analysis`, {
        method: 'POST'
      })

      if (response.ok) {
        const analysis = await response.json()
        setPricingData(prev => ({ ...prev, [productId]: analysis.data }))
        
        // Update product with recommended price
        const recommendedPrice = analysis.data.pricingInsights.overallInsights.recommendedPriceRange.recommended
        await onProductUpdate(productId, {
          price: recommendedPrice
        })
      }
    } catch (error) {
      console.error('Error analyzing pricing:', error)
    } finally {
      setAnalyzing(null)
    }
  }

  const handlePriceUpdate = async (productId: string, newPrice: number) => {
    await onProductUpdate(productId, { price: newPrice })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getConditionColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case 'new-in-package':
      case 'new':
        return 'bg-green-100 text-green-800'
      case 'like-new':
        return 'bg-blue-100 text-blue-800'
      case 'good':
        return 'bg-yellow-100 text-yellow-800'
      case 'acceptable':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pricing & Market Analysis</h2>
          <p className="text-muted-foreground">
            Set competitive prices based on AI market analysis
          </p>
        </div>
      </div>

      {/* Products in Pricing Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map((product) => {
          const pricing = pricingData[product.id]
          
          return (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {product.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Pricing
                      </Badge>
                      {product.sku && (
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
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
                      {product.condition && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Condition:</span>
                          <Badge className={`text-xs ${getConditionColor(product.condition.grade)}`}>
                            {product.condition.grade}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Current Price */}
                    <div className="border rounded-lg p-3 bg-muted/50">
                      <Label className="text-xs text-muted-foreground">Current Price</Label>
                      <div className="text-2xl font-bold text-green-600">
                        {product.price ? formatPrice(product.price) : 'Not Set'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Analysis */}
                {pricing && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Market Analysis
                    </h4>
                    
                    {/* Price Recommendations */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-600">
                          {formatPrice(pricing.pricingInsights?.overallInsights?.recommendedPriceRange?.min || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Min Price</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-600">
                          {formatPrice(pricing.pricingInsights?.overallInsights?.recommendedPriceRange?.recommended || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Recommended</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-semibold text-purple-600">
                          {formatPrice(pricing.pricingInsights?.overallInsights?.recommendedPriceRange?.max || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Max Price</div>
                      </div>
                    </div>

                    {/* Platform Data */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Platform Analysis:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {pricing.pricingInsights?.platforms?.facebook && (
                          <div className="p-2 bg-blue-50 rounded">
                            <div className="font-medium text-blue-700">Facebook Marketplace</div>
                            <div className="text-blue-600">
                              {formatPrice(pricing.pricingInsights.platforms.facebook.averagePrice)} avg
                            </div>
                            <div className="text-muted-foreground">
                              {pricing.pricingInsights.platforms.facebook.totalListings} listings
                            </div>
                          </div>
                        )}
                        {pricing.pricingInsights?.platforms?.ebay && (
                          <div className="p-2 bg-yellow-50 rounded">
                            <div className="font-medium text-yellow-700">eBay</div>
                            <div className="text-yellow-600">
                              {formatPrice(pricing.pricingInsights.platforms.ebay.averagePrice)} avg
                            </div>
                            <div className="text-muted-foreground">
                              {pricing.pricingInsights.platforms.ebay.totalListings} listings
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Market Activity:</span>
                        <span className="capitalize">{pricing.pricingInsights?.overallInsights?.marketActivity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Competition:</span>
                        <span className="capitalize">{pricing.pricingInsights?.overallInsights?.competitivePosition?.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Listings:</span>
                        <span>{pricing.summary?.totalListings || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Input */}
                <div className="space-y-2">
                  <Label htmlFor={`price-${product.id}`}>Set Price</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`price-${product.id}`}
                        type="number"
                        step="0.01"
                        value={product.price || ''}
                        onChange={(e) => handlePriceUpdate(product.id, parseFloat(e.target.value) || 0)}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePricingAnalysis(product.id)}
                      disabled={analyzing === product.id}
                    >
                      {analyzing === product.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handlePricingAnalysis(product.id)}
                    disabled={analyzing === product.id}
                    variant="outline"
                    className="flex-1"
                  >
                    {analyzing === product.id ? (
                      <>Analyzing...</>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analyze Market
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => onStageComplete(product.id, 'priced')}
                    disabled={!product.price}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {products.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Ready for Pricing</h3>
            <p className="text-muted-foreground text-center">
              Products will appear here after they complete the intake stage.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}