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

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    // Use OpenAI Vision API to identify the product
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image and provide detailed information in JSON format. Include:
              - product_name: A clear, descriptive name
              - category: Main product category
              - brand: Brand name if visible
              - condition: Estimated condition (new, like-new, very-good, good, acceptable)
              - key_features: Array of key features/characteristics
              - estimated_weight: Estimated weight with unit
              - material: Primary materials if identifiable
              - color: Primary colors
              - style: Style or design characteristics
              - confidence: Your confidence level (0-100) in the identification
              
              Be specific and accurate. If you can't determine something, indicate "unknown".`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    // Try to parse JSON from the response
    let productInfo
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      productInfo = JSON.parse(jsonString)
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      productInfo = {
        product_name: "Unknown Product",
        category: "unknown",
        brand: "unknown",
        condition: "unknown",
        key_features: [],
        estimated_weight: "unknown",
        material: "unknown",
        color: "unknown",
        style: "unknown",
        confidence: 50,
        raw_response: content
      }
    }

    return NextResponse.json({
      success: true,
      identification: productInfo
    })
  } catch (error) {
    console.error("AI identification error:", error)
    return NextResponse.json(
      { error: "Failed to identify product" },
      { status: 500 }
    )
  }
}