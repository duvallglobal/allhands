"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { EnhancedProductForm } from "./EnhancedProductForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Sparkles, 
  Package, 
  TrendingUp, 
  ShoppingCart,
  Plus,
  Eye,
  Edit,
  Trash2
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
  createdAt: string
}

export function EnhancedDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('create')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const handleProductSubmit = async (data: any) => {
    setLoading(true)
    try {
      // If productId exists, update the product
      if (data.productId) {
        const response = await fetch(`/api/products/${data.productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            category: data.category,
            condition: data.condition,
            brand: data.brand,
            model: data.model,
            tags: data.tags,
            price: parseFloat(data.price) || 0,
            weight: data.weight,
            dimensions: data.dimensions,
            status: 'ready',
          }),
        })

        if (response.ok) {
          alert('Product saved successfully!')
          setActiveTab('products')
          fetchProducts()
        } else {
          throw new Error('Failed to save product')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const syncToShopify = async (productId: string) => {
    try {
      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Product synced to Shopify successfully! Product ID: ${result.productId}`)
      } else {
        throw new Error('Failed to sync to Shopify')
      }
    } catch (error) {
      console.error('Shopify sync error:', error)
      alert('Failed to sync to Shopify. Please try again.')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
        alert('Product deleted successfully!')
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'analyzing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'draft':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Inventory AI</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to start managing your inventory with AI-powered insights.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory AI</h1>
          <p className="text-muted-foreground">
            AI-powered inventory management with market insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <Sparkles className="h-3 w-3 mr-1" />
            Enhanced AI
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </TabsTrigger>
          <TabsTrigger value="products" onClick={fetchProducts}>
            <Package className="h-4 w-4 mr-2" />
            My Products
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <EnhancedProductForm onSubmit={handleProductSubmit} loading={loading} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products found. Create your first product to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-sm line-clamp-2">
                              {product.title}
                            </h3>
                            <Badge className={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                          </div>
                          
                          {product.price && (
                            <div className="text-lg font-bold text-green-600">
                              {formatPrice(product.price)}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {product.brand && <span>{product.brand}</span>}
                            {product.category && (
                              <>
                                {product.brand && <span>•</span>}
                                <span>{product.category}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncToShopify(product.id)}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProduct(product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics features coming soon!</p>
                <p className="text-sm">Track your inventory performance and market trends.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}