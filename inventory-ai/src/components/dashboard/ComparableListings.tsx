'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

interface ComparableListing {
  id: string;
  platform: string;
  title: string;
  price: number;
  condition?: string;
  url: string;
  imageUrl?: string;
  seller?: string;
  shipping?: number;
  location?: string;
  similarity: number;
  listingDate?: string;
  soldDate?: string;
  isSold: boolean;
}

interface ComparableListingsProps {
  productId: string;
}

export function ComparableListings({ productId }: ComparableListingsProps) {
  const [listings, setListings] = useState<ComparableListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchComparableListings();
  }, [productId, selectedPlatform]);

  const fetchComparableListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        productId,
        limit: '20',
      });
      
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }

      const response = await fetch(`/api/products/comparables?${params}`);
      const data = await response.json();

      if (data.success) {
        setListings(data.comparables);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching comparable listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'ebay':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'google_shopping':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-500';
    if (similarity >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSimilarityIcon = (similarity: number) => {
    if (similarity >= 0.8) return <TrendingUp className="h-4 w-4" />;
    if (similarity >= 0.6) return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const platforms = ['all', 'ebay', 'google_shopping'];
  const platformLabels = {
    all: 'All Platforms',
    ebay: 'eBay',
    google_shopping: 'Google Shopping',
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparable Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Comparable Listings
          {statistics && (
            <Badge variant="outline">
              {statistics.totalListings} found
            </Badge>
          )}
        </CardTitle>
        
        {statistics && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {formatPrice(statistics.averagePrice)}
              </div>
              <div className="text-sm text-muted-foreground">Average Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {formatPrice(statistics.priceRange.min)} - {formatPrice(statistics.priceRange.max)}
              </div>
              <div className="text-sm text-muted-foreground">Price Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round(statistics.averageSimilarity * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Similarity</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <TabsList className="grid w-full grid-cols-3">
            {platforms.map((platform) => (
              <TabsTrigger key={platform} value={platform}>
                {platformLabels[platform as keyof typeof platformLabels]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedPlatform} className="mt-6">
            {listings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comparable listings found for this platform.
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPlatformColor(listing.platform)}>
                            {listing.platform === 'ebay' ? 'eBay' : 'Google Shopping'}
                          </Badge>
                          <div className={`flex items-center gap-1 ${getSimilarityColor(listing.similarity)}`}>
                            {getSimilarityIcon(listing.similarity)}
                            <span className="text-sm font-medium">
                              {Math.round(listing.similarity * 100)}% match
                            </span>
                          </div>
                          {listing.isSold && (
                            <Badge variant="secondary">Sold</Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm mb-2 line-clamp-2">
                          {listing.title}
                        </h4>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {formatPrice(listing.price)}
                          </span>
                          {listing.condition && (
                            <span>Condition: {listing.condition}</span>
                          )}
                          {listing.seller && (
                            <span>Seller: {listing.seller}</span>
                          )}
                          {listing.shipping && listing.shipping > 0 && (
                            <span>+{formatPrice(listing.shipping)} shipping</span>
                          )}
                        </div>
                        
                        {listing.location && (
                          <div className="text-sm text-muted-foreground mt-1">
                            📍 {listing.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {listing.imageUrl && (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="w-16 h-16 object-cover rounded border"
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(listing.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}