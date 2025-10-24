import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enhancedAIService } from '@/lib/enhanced-ai';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, imageUrl, additionalContext } = await request.json();

    if (!productId || !imageUrl) {
      return NextResponse.json(
        { error: 'Product ID and image URL are required' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Update product status to analyzing
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'analyzing' },
    });

    // Perform enhanced AI analysis
    const analysis = await enhancedAIService.analyzeProduct(
      imageUrl,
      productId,
      session.user.id,
      additionalContext
    );

    // Update product with basic info from analysis
    await prisma.product.update({
      where: { id: productId },
      data: {
        title: analysis.enhancement.optimizedTitle,
        description: analysis.enhancement.description,
        tags: JSON.stringify(analysis.enhancement.tags),
        category: analysis.identification.category,
        brand: analysis.identification.brand,
        model: analysis.identification.model,
        recommendedPrice: analysis.marketAnalysis.recommendedPrice,
        currentMarketPrice: analysis.marketAnalysis.averagePrice,
        status: 'ready',
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    
    // Update product status to draft on error
    const { productId } = await request.json().catch(() => ({}));
    if (productId) {
      try {
        await prisma.product.update({
          where: { id: productId },
          data: { status: 'draft' },
        });
      } catch (updateError) {
        console.error('Error updating product status:', updateError);
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to analyze product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}