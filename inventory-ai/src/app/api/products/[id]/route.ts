import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        comparableListings: {
          orderBy: { similarity: 'desc' },
          take: 10,
        },
        scrapedData: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      status,
    } = data;

    const { id } = await params;
    
    // Verify product ownership
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        category,
        condition,
        brand,
        model,
        tags,
        price: price ? parseFloat(price) : null,
        weight,
        dimensions,
        status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Verify product ownership
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Delete related data first
    await prisma.comparableListing.deleteMany({
      where: { productId: id },
    });

    await prisma.scrapedData.deleteMany({
      where: { productId: id },
    });

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}