import { Header } from "@/components/dashboard/header"
import { GeminiAnalysisDemo } from "@/components/GeminiAnalysisDemo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Search, Globe, TrendingUp, Users, Image, Brain } from "lucide-react"

export default function GeminiDemoPage() {
  // For demo purposes, we'll use a sample product ID
  const sampleProductId = "demo-product-123";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-8 w-8 text-blue-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Enhanced Gemini AI Integration
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the power of Google's Gemini AI with grounded search capabilities, 
              advanced image analysis, and comprehensive market intelligence for inventory management.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Gemini 2.0 Flash Exp
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Grounded Google Search
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Multi-Platform Optimization
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Real-Time Market Data
              </Badge>
            </div>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Search className="h-5 w-5" />
                  Grounded Search
                </CardTitle>
                <CardDescription>
                  Real-time market research using Google's native search capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Live market data retrieval</li>
                  <li>• Competitive pricing analysis</li>
                  <li>• Trend identification</li>
                  <li>• Market positioning insights</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Image className="h-5 w-5" />
                  Advanced Vision
                </CardTitle>
                <CardDescription>
                  Enhanced product analysis from images using Gemini Vision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Detailed product identification</li>
                  <li>• Condition assessment</li>
                  <li>• Authenticity verification</li>
                  <li>• Feature extraction</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Globe className="h-5 w-5" />
                  Platform Optimization
                </CardTitle>
                <CardDescription>
                  Generate platform-specific optimized content for maximum performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• eBay listing optimization</li>
                  <li>• Facebook Marketplace content</li>
                  <li>• Shopify product descriptions</li>
                  <li>• Amazon SEO optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Users className="h-5 w-5" />
                  Competitor Intelligence
                </CardTitle>
                <CardDescription>
                  Comprehensive competitive analysis across multiple platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Competitor strategy analysis</li>
                  <li>• Pricing benchmarking</li>
                  <li>• Market positioning</li>
                  <li>• Differentiation opportunities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-pink-200 dark:border-pink-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                  <TrendingUp className="h-5 w-5" />
                  SEO Optimization
                </CardTitle>
                <CardDescription>
                  Generate SEO-optimized content based on current search trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Keyword research & analysis</li>
                  <li>• Search volume estimation</li>
                  <li>• Content optimization</li>
                  <li>• Voice search optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-cyan-200 dark:border-cyan-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <Globe className="h-5 w-5" />
                  URL Analysis
                </CardTitle>
                <CardDescription>
                  Analyze competitor URLs for strategic intelligence gathering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Competitor page analysis</li>
                  <li>• Content strategy insights</li>
                  <li>• Pricing intelligence</li>
                  <li>• Market opportunity identification</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Demo */}
          <GeminiAnalysisDemo productId={sampleProductId} />

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Technical Implementation
              </CardTitle>
              <CardDescription>
                Advanced AI integration with optimized model selection and grounded search capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Model Architecture</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Text Model</Badge>
                      gemini-2.0-flash-exp for text generation and analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Image Model</Badge>
                      gemini-2.0-flash-exp for advanced image analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Search Model</Badge>
                      gemini-2.0-flash-exp with grounded search tools
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Enhanced Capabilities</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time Google Search integration</li>
                    <li>• Dynamic retrieval configuration</li>
                    <li>• Multi-modal analysis (text + images)</li>
                    <li>• Platform-specific optimization</li>
                    <li>• Comprehensive market intelligence</li>
                    <li>• SEO and competitive analysis</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}