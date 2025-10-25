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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = { userId: session.user.id };
    if (status) {
      whereClause.status = status;
    }

    // Get products
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            comparableListings: true,
          },
        },
      },
    });

    // Get total count
    const totalCount = await prisma.product.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      title,
      description,
      category,
      condition,
      brand,
      model,
      tags,
      price,
      weight,
      dimensions,
      imageUrl,
      status = 'draft',
    } = data;

    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description,
        category,
        condition,
        brand,
        model,
        tags,
        weight,
        dimensions,
        imageUrl,
        status,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}