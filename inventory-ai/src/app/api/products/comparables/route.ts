import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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

    // Build where clause
    const whereClause: any = { productId };
    if (platform) {
      whereClause.platform = platform;
    }

    // Get comparable listings
    const comparables = await prisma.comparableListing.findMany({
      where: whereClause,
      orderBy: [
        { similarity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    });

    // Get statistics
    const stats = await prisma.comparableListing.aggregate({
      where: whereClause,
      _avg: {
        price: true,
        similarity: true,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      comparables,
      statistics: {
        totalListings: stats._count.id,
        averagePrice: stats._avg.price || 0,
        averageSimilarity: stats._avg.similarity || 0,
        priceRange: {
          min: stats._min.price || 0,
          max: stats._max.price || 0,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching comparable listings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch comparable listings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}