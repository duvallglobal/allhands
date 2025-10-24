"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2, ShoppingCart, DollarSign } from "lucide-react"

interface ProductData {
  title: string
  description: string
  tags: string[]
  category: string
  condition: string
  weight: string
  suggestedPrice: number
  marketPrice: number
  confidence: number
}

interface ProductFormProps {
  productData?: ProductData
  isLoading?: boolean
  onSave: (data: ProductData) => void
  onEnhance: () => void
  onSyncToShopify: () => void
}

export function ProductForm({ 
  productData, 
  isLoading = false, 
  onSave, 
  onEnhance,
  onSyncToShopify 
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductData>(
    productData || {
      title: "",
      description: "",
      tags: [],
      category: "",
      condition: "",
      weight: "",
      suggestedPrice: 0,
      marketPrice: 0,
      confidence: 0
    }
  )

  const [newTag, setNewTag] = useState("")

  const handleInputChange = (field: keyof ProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange("tags", [...formData.tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange("tags", formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Product Information
            <Button
              variant="outline"
              size="sm"
              onClick={onEnhance}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              AI Enhance
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Product title..."
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Product description..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="toys">Toys & Games</SelectItem>
                <SelectItem value="sports">Sports & Outdoors</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Condition</label>
            <Select
              value={formData.condition}
              onValueChange={(value) => handleInputChange("condition", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="very-good">Very Good</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="acceptable">Acceptable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Weight</label>
            <Input
              value={formData.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              placeholder="e.g., 1.5 lbs"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                disabled={isLoading}
              />
              <Button onClick={addTag} variant="outline" disabled={isLoading}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {(formData.suggestedPrice > 0 || formData.marketPrice > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Market Price</label>
                <div className="text-2xl font-bold text-muted-foreground">
                  ${formData.marketPrice.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Suggested Price</label>
                <div className="text-2xl font-bold text-primary">
                  ${formData.suggestedPrice.toFixed(2)}
                </div>
              </div>
            </div>
            {formData.confidence > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Confidence</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${formData.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formData.confidence}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={isLoading || !formData.title}
          className="flex-1"
        >
          Save Product
        </Button>
        <Button
          onClick={onSyncToShopify}
          disabled={isLoading || !formData.title}
          variant="outline"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Sync to Shopify
        </Button>
      </div>
    </div>
  )
}