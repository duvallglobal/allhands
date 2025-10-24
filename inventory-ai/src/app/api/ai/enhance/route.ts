import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@/lib/auth"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productInfo, currentData } = await request.json()

    if (!productInfo && !currentData) {
      return NextResponse.json({ error: "Product information is required" }, { status: 400 })
    }

    const productData = productInfo || currentData

    // Generate SEO-optimized content using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert e-commerce content writer specializing in SEO-optimized product listings. Create compelling, search-friendly content that drives sales while being accurate and informative.`
        },
        {
          role: "user",
          content: `Based on this product information, create SEO-optimized content in JSON format:

Product Info: ${JSON.stringify(productData, null, 2)}

Generate:
- title: SEO-optimized product title (60-80 characters, include key features and brand)
- description: Compelling product description (150-300 words, highlight benefits, features, and use cases)
- tags: Array of relevant SEO tags/keywords (10-15 tags)
- meta_description: Meta description for SEO (150-160 characters)
- bullet_points: Array of 5-7 key selling points
- search_keywords: Array of search terms customers might use
- category_suggestions: Array of potential categories this product fits into

Make the content engaging, benefit-focused, and optimized for search engines while being accurate to the product.`
        }
      ],
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    // Parse the JSON response
    let enhancedContent
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      enhancedContent = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enhanced: enhancedContent
    })
  } catch (error) {
    console.error("AI enhancement error:", error)
    return NextResponse.json(
      { error: "Failed to enhance product content" },
      { status: 500 }
    )
  }
}