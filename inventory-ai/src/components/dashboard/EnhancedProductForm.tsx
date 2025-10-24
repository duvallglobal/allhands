'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from './image-upload';
import { ComparableListings } from './ComparableListings';
import { 
  Sparkles, 
  TrendingUp, 
  ShoppingCart, 
  Eye, 
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface EnhancedProductFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function EnhancedProductForm({ onSubmit, loading }: EnhancedProductFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'used',
    brand: '',
    model: '',
    tags: '',
    price: '',
    weight: '',
    dimensions: '',
  });
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (url: string) => {
    setImageUrl(url);
    
    // Create initial product record
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || 'New Product',
          imageUrl: url,
          status: 'draft',
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setProductId(data.product.id);
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const runEnhancedAnalysis = async () => {
    if (!imageUrl || !productId) {
      alert('Please upload an image first');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisStep('Analyzing image with AI...');

    try {
      const response = await fetch('/api/products/analyze-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          imageUrl,
          additionalContext: {
            userTitle: formData.title,
            userDescription: formData.description,
            userCategory: formData.category,
            condition: formData.condition,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data.analysis);
        
        // Auto-fill form with AI-generated data
        setFormData(prev => ({
          ...prev,
          title: data.analysis.enhancement.optimizedTitle || prev.title,
          description: data.analysis.enhancement.description || prev.description,
          category: data.analysis.identification.category || prev.category,
          brand: data.analysis.identification.brand || prev.brand,
          model: data.analysis.identification.model || prev.model,
          tags: data.analysis.enhancement.tags?.join(', ') || prev.tags,
          price: data.analysis.marketAnalysis.recommendedPrice?.toString() || prev.price,
        }));
        
        setAnalysisStep('Analysis complete!');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      alert('Analysis failed. Please try again.');
      setAnalysisStep('');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      imageUrl,
      productId,
      analysisData,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI-Powered Product Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Product Image</Label>
              <ImageUpload onUpload={handleImageUpload} />
            </div>

            {/* AI Analysis Button */}
            {imageUrl && (
              <div className="flex items-center gap-4">
                <Button
                  onClick={runEnhancedAnalysis}
                  disabled={analysisLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {analysisLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
                
                {analysisStep && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-pulse">⚡</div>
                    {analysisStep}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Results */}
            {analysisData && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">AI Analysis Complete</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(analysisData.identification.confidence * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(analysisData.marketAnalysis.recommendedPrice)}
                    </div>
                    <div className="text-sm text-muted-foreground">Recommended Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisData.marketAnalysis.totalComparables}
                    </div>
                    <div className="text-sm text-muted-foreground">Comparables Found</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Product title"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="toys">Toys & Games</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>
              
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Model number"
                />
              </div>
              
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like-new">Like New</SelectItem>
                    <SelectItem value="very-good">Very Good</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="acceptable">Acceptable</SelectItem>
                    <SelectItem value="for-parts">For Parts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Product description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="Weight"
                />
              </div>
              
              <div>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="L x W x H"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Product'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Market Analysis & Comparable Listings */}
      {analysisData && productId && (
        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">
              <Eye className="h-4 w-4 mr-2" />
              Market Insights
            </TabsTrigger>
            <TabsTrigger value="comparables">
              <TrendingUp className="h-4 w-4 mr-2" />
              Comparable Listings
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Target className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Market Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysisData.insights.summary}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Market Trends</h4>
                    <div className="space-y-2">
                      {analysisData.insights.marketTrends.map((trend: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{trend}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Risk Factors</h4>
                    <div className="space-y-2">
                      {analysisData.insights.riskFactors.map((risk: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparables">
            <ComparableListings productId={productId} />
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.insights.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}