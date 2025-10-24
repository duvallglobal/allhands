"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Package, 
  Camera, 
  ArrowRight,
  Plus,
  Upload,
  Sparkles,
  QrCode,
  Eye
} from "lucide-react"
import { ImageUpload } from "../image-upload"

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
  createdAt: string
  condition?: {
    grade: string
    score: number
    indicators: string[]
  }
  colors?: string[]
  size?: string
  material?: string
}

interface IntakeStageProps {
  products: Product[]
  onProductUpdate: (productId: string, updates: Partial<Product>) => Promise<void>
  onStageComplete: (productId: string, nextStatus: string) => Promise<void>
}

export function IntakeStage({ products, onProductUpdate, onStageComplete }: IntakeStageProps) {
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: ''
  })
  const [processing, setProcessing] = useState<string | null>(null)

  const handleImageUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setNewProduct(prev => ({ ...prev, imageUrl: data.url }))
        return data.url
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleAIAnalysis = async (productId: string) => {
    setProcessing(productId)
    try {
      const response = await fetch(`/api/products/${productId}/analyze`, {
        method: 'POST'
      })

      if (response.ok) {
        const analysis = await response.json()
        await onProductUpdate(productId, {
          title: analysis.identification.title,
          description: analysis.enhancement.description,
          category: analysis.identification.category,
          brand: analysis.identification.brand,
          condition: analysis.identification.condition,
          colors: analysis.identification.colors,
          size: analysis.identification.size,
          material: analysis.identification.material
        })
      }
    } catch (error) {
      console.error('Error analyzing product:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleCreateProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          status: 'received'
        })
      })

      if (response.ok) {
        setNewProduct({ title: '', description: '', category: '', imageUrl: '' })
        setShowNewProductForm(false)
        // Refresh products list would be handled by parent component
      }
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const generateSKU = (product: Product) => {
    const categoryCode = product.category?.substring(0, 3).toUpperCase() || 'GEN'
    const timestamp = Date.now().toString().slice(-4)
    return `${categoryCode}-${timestamp}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Intake</h2>
          <p className="text-muted-foreground">
            Upload and process new inventory items
          </p>
        </div>
        <Button onClick={() => setShowNewProductForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* New Product Form */}
      {showNewProductForm && (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Product Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter product title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Electronics, Clothing, Books"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional product details"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Product Image</Label>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  currentImage={newProduct.imageUrl}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateProduct} disabled={!newProduct.title}>
                Create Product
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewProductForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products in Intake */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {product.title || 'Untitled Product'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      <Package className="h-3 w-3 mr-1" />
                      Received
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
              {product.imageUrl && (
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2 text-sm">
                {product.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{product.category}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                {product.condition && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <Badge variant="outline" className="text-xs">
                      {product.condition.grade}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAIAnalysis(product.id)}
                  disabled={processing === product.id}
                  className="flex-1"
                >
                  {processing === product.id ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Analysis
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStageComplete(product.id, 'photographed')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {!product.sku && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onProductUpdate(product.id, { sku: generateSKU(product) })}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate SKU
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && !showNewProductForm && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products in Intake</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding a new product to begin the workflow process.
            </p>
            <Button onClick={() => setShowNewProductForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}