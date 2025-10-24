import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enhancedAIService } from '@/lib/enhanced-ai'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.imageUrl) {
      return NextResponse.json({ error: 'Product image required for analysis' }, { status: 400 })
    }

    // Perform enhanced AI analysis
    const analysis = await enhancedAIService.analyzeProduct(
      product.imageUrl,
      {
        title: product.title,
        description: product.description,
        category: product.category,
        condition: product.condition
      }
    )

    // Update product with analysis results
    await prisma.product.update({
      where: { id: productId },
      data: {
        title: analysis.identification.title,
        description: analysis.enhancement.description,
        category: analysis.identification.category,
        brand: analysis.identification.brand,
        model: analysis.identification.model,
        condition: analysis.identification.condition.grade,
        colors: JSON.stringify(analysis.identification.colors),
        size: analysis.identification.size,
        material: analysis.identification.material,
        tags: JSON.stringify(analysis.enhancement.tags),
        aiAnalysis: JSON.stringify(analysis)
      }
    })

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze product' },
      { status: 500 }
    )
  }
}