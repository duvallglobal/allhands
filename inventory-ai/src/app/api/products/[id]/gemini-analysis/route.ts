import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { geminiService } from '@/lib/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisType, targetPlatform, imageUrl } = await request.json();
    const productId = params.id;

    // Get product data
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let result;

    switch (analysisType) {
      case 'image':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required for image analysis' }, { status: 400 });
        }
        result = await geminiService.analyzeProductImage(imageUrl);
        break;

      case 'market-search':
        result = await geminiService.searchMarketData(
          product.title || 'Unknown Product',
          product.brand,
          product.category
        );
        break;

      case 'platform-listing':
        if (!targetPlatform) {
          return NextResponse.json({ error: 'Target platform required for platform listing' }, { status: 400 });
        }
        result = await geminiService.generatePlatformListing(product, targetPlatform);
        break;

      case 'competitor-research':
        result = await geminiService.researchCompetitors(product, ['ebay', 'facebook', 'amazon']);
        break;

      case 'seo-content':
        result = await geminiService.generateSEOContent(product);
        break;

      case 'url-analysis':
        const { url } = await request.json();
        if (!url) {
          return NextResponse.json({ error: 'URL required for URL analysis' }, { status: 400 });
        }
        result = await geminiService.analyzeProductUrl(url);
        break;

      case 'comprehensive':
        // Run comprehensive analysis with multiple Gemini capabilities
        const [
          marketData,
          competitorAnalysis,
          seoContent,
          platformListing
        ] = await Promise.allSettled([
          geminiService.searchMarketData(product.title || 'Unknown Product', product.brand, product.category),
          geminiService.researchCompetitors(product, ['ebay', 'facebook', 'amazon']),
          geminiService.generateSEOContent(product),
          geminiService.generatePlatformListing(product, 'ebay')
        ]);

        result = {
          marketData: marketData.status === 'fulfilled' ? marketData.value : null,
          competitorAnalysis: competitorAnalysis.status === 'fulfilled' ? competitorAnalysis.value : null,
          seoContent: seoContent.status === 'fulfilled' ? seoContent.value : null,
          platformListing: platformListing.status === 'fulfilled' ? platformListing.value : null,
          errors: [
            marketData.status === 'rejected' ? marketData.reason : null,
            competitorAnalysis.status === 'rejected' ? competitorAnalysis.reason : null,
            seoContent.status === 'rejected' ? seoContent.reason : null,
            platformListing.status === 'rejected' ? platformListing.reason : null,
          ].filter(Boolean)
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Update product with analysis results if needed
    if (analysisType === 'comprehensive' || analysisType === 'market-search') {
      await prisma.product.update({
        where: { id: productId },
        data: {
          geminiAnalysis: result,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysisType,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Gemini analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform Gemini analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    // Get product with existing Gemini analysis
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        brand: true,
        category: true,
        geminiAnalysis: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        brand: product.brand,
        category: product.category,
        hasGeminiAnalysis: !!product.geminiAnalysis,
        lastAnalyzed: product.updatedAt,
      },
      geminiAnalysis: product.geminiAnalysis,
    });

  } catch (error) {
    console.error('Error fetching Gemini analysis:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Gemini analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}