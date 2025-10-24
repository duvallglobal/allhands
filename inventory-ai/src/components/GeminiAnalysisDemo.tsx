'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Image, Globe, TrendingUp, Users, Zap } from 'lucide-react';

interface GeminiAnalysisResult {
  analysisType: string;
  result: any;
  timestamp: string;
}

export function GeminiAnalysisDemo({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeminiAnalysisResult[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('ebay');
  const [analysisUrl, setAnalysisUrl] = useState('');

  const runAnalysis = async (analysisType: string, additionalData?: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/gemini-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType,
          ...additionalData,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analysisTypes = [
    {
      id: 'market-search',
      title: 'Market Research',
      description: 'Real-time market data using grounded Google Search',
      icon: Search,
      color: 'bg-blue-500',
    },
    {
      id: 'image',
      title: 'Image Analysis',
      description: 'Advanced product analysis from images using Gemini Vision',
      icon: Image,
      color: 'bg-green-500',
      requiresInput: true,
      inputType: 'imageUrl',
    },
    {
      id: 'platform-listing',
      title: 'Platform Optimization',
      description: 'Generate platform-specific optimized listings',
      icon: Globe,
      color: 'bg-purple-500',
      requiresInput: true,
      inputType: 'platform',
    },
    {
      id: 'competitor-research',
      title: 'Competitor Analysis',
      description: 'Comprehensive competitive intelligence across platforms',
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      id: 'seo-content',
      title: 'SEO Optimization',
      description: 'Generate SEO-optimized content with current search trends',
      icon: TrendingUp,
      color: 'bg-pink-500',
    },
    {
      id: 'url-analysis',
      title: 'URL Analysis',
      description: 'Analyze competitor URLs for intelligence gathering',
      icon: Globe,
      color: 'bg-cyan-500',
      requiresInput: true,
      inputType: 'url',
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Analysis',
      description: 'Run all analysis types simultaneously',
      icon: Zap,
      color: 'bg-yellow-500',
    },
  ];

  const formatResult = (result: any, analysisType: string) => {
    if (typeof result === 'string') {
      return result;
    }

    if (analysisType === 'comprehensive') {
      return (
        <div className="space-y-4">
          {Object.entries(result).map(([key, value]) => (
            <div key={key} className="border rounded-lg p-3">
              <h4 className="font-semibold capitalize mb-2">{key.replace(/([A-Z])/g, ' $1')}</h4>
              <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Enhanced Gemini AI Analysis
          </CardTitle>
          <CardDescription>
            Leverage Google's Gemini AI with grounded search capabilities for comprehensive product analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisTypes.map((analysis) => {
              const Icon = analysis.icon;
              return (
                <Card key={analysis.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${analysis.color}`} />
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4" />
                      {analysis.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {analysis.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {analysis.requiresInput && (
                      <div className="space-y-2 mb-3">
                        {analysis.inputType === 'imageUrl' && (
                          <div>
                            <Label htmlFor="imageUrl" className="text-xs">Image URL</Label>
                            <Input
                              id="imageUrl"
                              placeholder="https://example.com/image.jpg"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                        {analysis.inputType === 'platform' && (
                          <div>
                            <Label htmlFor="platform" className="text-xs">Target Platform</Label>
                            <Select value={targetPlatform} onValueChange={setTargetPlatform}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ebay">eBay</SelectItem>
                                <SelectItem value="facebook">Facebook Marketplace</SelectItem>
                                <SelectItem value="shopify">Shopify</SelectItem>
                                <SelectItem value="amazon">Amazon</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {analysis.inputType === 'url' && (
                          <div>
                            <Label htmlFor="analysisUrl" className="text-xs">URL to Analyze</Label>
                            <Input
                              id="analysisUrl"
                              placeholder="https://example.com/product"
                              value={analysisUrl}
                              onChange={(e) => setAnalysisUrl(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        const additionalData: any = {};
                        if (analysis.inputType === 'imageUrl') additionalData.imageUrl = imageUrl;
                        if (analysis.inputType === 'platform') additionalData.targetPlatform = targetPlatform;
                        if (analysis.inputType === 'url') additionalData.url = analysisUrl;
                        runAnalysis(analysis.id, additionalData);
                      }}
                      disabled={loading || (analysis.requiresInput && (
                        (analysis.inputType === 'imageUrl' && !imageUrl) ||
                        (analysis.inputType === 'url' && !analysisUrl)
                      ))}
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Icon className="h-3 w-3 mr-1" />
                      )}
                      Analyze
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Recent Gemini AI analysis results with grounded search data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                {results.slice(0, 7).map((result, index) => (
                  <TabsTrigger key={index} value={index.toString()} className="text-xs">
                    <Badge variant="outline" className="text-xs">
                      {result.analysisType}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {results.slice(0, 7).map((result, index) => (
                <TabsContent key={index} value={index.toString()} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">
                          {result.analysisType.replace(/-/g, ' ')} Analysis
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-auto">
                        {formatResult(result.result, result.analysisType)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}