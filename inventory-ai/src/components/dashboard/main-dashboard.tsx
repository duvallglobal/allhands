"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { ImageUpload } from "./image-upload"
import { EnhancedProductForm } from "./EnhancedProductForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
}

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

export function MainDashboard() {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'form'>('upload')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const initializeProcessingSteps = () => {
    return [
      { id: 'upload', name: 'Image Upload', status: 'completed' as const },
      { id: 'identify', name: 'AI Product Identification', status: 'pending' as const },
      { id: 'enhance', name: 'Content Enhancement', status: 'pending' as const },
      { id: 'scrape', name: 'Market Data Collection', status: 'pending' as const },
      { id: 'pricing', name: 'Price Recommendation', status: 'pending' as const }
    ]
  }

  const updateStepStatus = (stepId: string, status: ProcessingStep['status'], message?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ))
  }

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true)
    setCurrentStep('processing')
    setProcessingSteps(initializeProcessingSteps())

    try {
      // Step 1: Upload image
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadResult = await uploadResponse.json()
      const imageUrl = `${window.location.origin}${uploadResult.url}`
      setUploadedImage(imageUrl)

      // Step 2: AI Product Identification
      updateStepStatus('identify', 'processing')
      const identifyResponse = await fetch('/api/ai/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })

      if (!identifyResponse.ok) {
        throw new Error('Failed to identify product')
      }

      const identifyResult = await identifyResponse.json()
      updateStepStatus('identify', 'completed', 'Product identified successfully')

      // Step 3: Content Enhancement
      updateStepStatus('enhance', 'processing')
      const enhanceResponse = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo: identifyResult.identification })
      })

      if (!enhanceResponse.ok) {
        throw new Error('Failed to enhance content')
      }

      const enhanceResult = await enhanceResponse.json()
      updateStepStatus('enhance', 'completed', 'Content enhanced with SEO optimization')

      // Step 4: Market Data Scraping
      updateStepStatus('scrape', 'processing')
      const scrapeResponse = await fetch('/api/scrape/ebay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: enhanceResult.enhanced.title || identifyResult.identification.product_name,
          category: identifyResult.identification.category,
          brand: identifyResult.identification.brand
        })
      })

      if (!scrapeResponse.ok) {
        throw new Error('Failed to scrape market data')
      }

      const scrapeResult = await scrapeResponse.json()
      updateStepStatus('scrape', 'completed', `Found ${scrapeResult.results.length} market data sources`)

      // Step 5: Price Recommendation
      updateStepStatus('pricing', 'processing')
      const pricingResponse = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketData: scrapeResult.results,
          condition: identifyResult.identification.condition,
          category: identifyResult.identification.category,
          brand: identifyResult.identification.brand
        })
      })

      if (!pricingResponse.ok) {
        throw new Error('Failed to calculate pricing')
      }

      const pricingResult = await pricingResponse.json()
      updateStepStatus('pricing', 'completed', `Price calculated with ${pricingResult.pricing.confidence}% confidence`)

      // Combine all data
      const combinedData: ProductData = {
        title: enhanceResult.enhanced.title || identifyResult.identification.product_name,
        description: enhanceResult.enhanced.description || '',
        tags: enhanceResult.enhanced.tags || [],
        category: identifyResult.identification.category || '',
        condition: identifyResult.identification.condition || '',
        weight: identifyResult.identification.estimated_weight || '',
        suggestedPrice: pricingResult.pricing.suggestedPrice || 0,
        marketPrice: pricingResult.pricing.marketPrice || 0,
        confidence: pricingResult.pricing.confidence || 0
      }

      setProductData(combinedData)
      setCurrentStep('form')
    } catch (error) {
      console.error('Processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Update the current processing step to error
      const currentProcessingStep = processingSteps.find(step => step.status === 'processing')
      if (currentProcessingStep) {
        updateStepStatus(currentProcessingStep.id, 'error', errorMessage)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveProduct = async (data: ProductData) => {
    // TODO: Save to database
    console.log('Saving product:', data)
    alert('Product saved successfully!')
  }

  const handleEnhanceProduct = async () => {
    if (!productData) return
    
    setIsProcessing(true)
    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentData: productData })
      })

      if (response.ok) {
        const result = await response.json()
        setProductData(prev => ({
          ...prev!,
          title: result.enhanced.title || prev!.title,
          description: result.enhanced.description || prev!.description,
          tags: result.enhanced.tags || prev!.tags
        }))
      }
    } catch (error) {
      console.error('Enhancement error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSyncToShopify = async () => {
    if (!productData) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productData,
          imageUrl: uploadedImage
        })
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
    } finally {
      setIsProcessing(false)
    }
  }

  const resetProcess = () => {
    setCurrentStep('upload')
    setUploadedImage(null)
    setProductData(null)
    setProcessingSteps([])
    setIsProcessing(false)
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Inventory AI</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to start managing your inventory with AI-powered tools.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {currentStep === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Upload Product Image</h2>
            <p className="text-muted-foreground">
              Upload a photo of your product to get started with AI-powered identification and pricing.
            </p>
          </div>
          <ImageUpload onImageUpload={handleImageUpload} isProcessing={isProcessing} />
        </div>
      )}

      {currentStep === 'processing' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Your Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processingSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {step.status === 'processing' && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'processing' ? 'secondary' :
                        step.status === 'error' ? 'destructive' : 'outline'
                      }>
                        {step.status}
                      </Badge>
                    </div>
                    {step.message && (
                      <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'form' && productData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductForm
              productData={productData}
              isLoading={isProcessing}
              onSave={handleSaveProduct}
              onEnhance={handleEnhanceProduct}
              onSyncToShopify={handleSyncToShopify}
            />
          </div>
          <div className="space-y-4">
            {uploadedImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={uploadedImage}
                    alt="Product"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4">
                <Button
                  onClick={resetProcess}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                >
                  Start New Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}