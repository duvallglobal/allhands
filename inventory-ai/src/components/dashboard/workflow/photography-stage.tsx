"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  Download,
  Upload
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
  additionalImages?: string[]
}

interface PhotographyStageProps {
  products: Product[]
  onProductUpdate: (productId: string, updates: Partial<Product>) => Promise<void>
  onStageComplete: (productId: string, nextStatus: string) => Promise<void>
}

export function PhotographyStage({ products, onProductUpdate, onStageComplete }: PhotographyStageProps) {
  const [generatingImages, setGeneratingImages] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState<string | null>(null)

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingImages(productId)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const product = products.find(p => p.id === productId)
        const additionalImages = product?.additionalImages || []
        
        await onProductUpdate(productId, {
          additionalImages: [...additionalImages, data.url]
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploadingImages(null)
    }
  }

  const handleGenerateAIImages = async (productId: string) => {
    setGeneratingImages(productId)
    try {
      const response = await fetch(`/api/products/${productId}/generate-images`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        const product = products.find(p => p.id === productId)
        const additionalImages = product?.additionalImages || []
        
        await onProductUpdate(productId, {
          additionalImages: [...additionalImages, ...data.generatedImages]
        })
      }
    } catch (error) {
      console.error('Error generating AI images:', error)
    } finally {
      setGeneratingImages(null)
    }
  }

  const handleRemoveImage = async (productId: string, imageUrl: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const updatedImages = (product.additionalImages || []).filter(img => img !== imageUrl)
    await onProductUpdate(productId, { additionalImages: updatedImages })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Photography & Image Enhancement</h2>
          <p className="text-muted-foreground">
            Add professional photos and generate AI-enhanced listing images
          </p>
        </div>
      </div>

      {/* Products in Photography Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {product.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      <Camera className="h-3 w-3 mr-1" />
                      Photography
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
              {/* Main Product Image */}
              {product.imageUrl && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Main Product Image</h4>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Additional Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Additional Photos</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateAIImages(product.id)}
                      disabled={generatingImages === product.id}
                    >
                      {generatingImages === product.id ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {(product.additionalImages || []).map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={imageUrl}
                        alt={`${product.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(product.id, imageUrl)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Upload New Image */}
                  <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center hover:border-muted-foreground/50 transition-colors">
                    <ImageUpload
                      onImageUpload={(file) => handleImageUpload(product.id, file)}
                      currentImage=""
                      className="w-full h-full"
                      showPreview={false}
                    >
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        {uploadingImages === product.id ? (
                          <div className="text-xs text-muted-foreground">Uploading...</div>
                        ) : (
                          <>
                            <Plus className="h-6 w-6 text-muted-foreground mb-2" />
                            <div className="text-xs text-muted-foreground">Add Photo</div>
                          </>
                        )}
                      </div>
                    </ImageUpload>
                  </div>
                </div>
              </div>

              {/* Photography Tips */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <h5 className="font-medium mb-2">Photography Tips:</h5>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Use natural lighting when possible</li>
                  <li>• Include multiple angles and close-ups</li>
                  <li>• Show any defects or wear clearly</li>
                  <li>• Use a clean, neutral background</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateAIImages(product.id)}
                  disabled={generatingImages === product.id}
                  variant="outline"
                  className="flex-1"
                >
                  {generatingImages === product.id ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Photos
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => onStageComplete(product.id, 'listed')}
                  disabled={!product.imageUrl}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Image Count */}
              <div className="text-xs text-muted-foreground text-center">
                {(product.additionalImages?.length || 0) + (product.imageUrl ? 1 : 0)} photos total
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Ready for Photography</h3>
            <p className="text-muted-foreground text-center">
              Products will appear here after they complete the pricing stage.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}