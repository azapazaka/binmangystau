// src/lib/ai.ts
import type { AiProviderResult, AiValidationStatus, AiVisualSeverity, ReportCategory } from '@/types'
import { env } from './env'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `You are an AI assistant that evaluates city issue reports submitted by citizens.
Analyze the provided image and determine:
1. Is this a valid city infrastructure issue? (road damage, broken streetlight, trash accumulation, traffic sign damage, etc.)
2. What category best describes the issue: "road", "light", "trash", "traffic", or "other"
3. What is the visual severity: "low", "medium", or "high"
4. Your confidence level as a number between 0 and 1
5. Short descriptive tags (2-5 words each, max 5 tags)
6. A brief one-sentence reason for your assessment

Respond ONLY with valid JSON. No markdown, no code fences — raw JSON only:
{"isValidReport":true,"suggestedCategory":"road","confidence":0.92,"visualSeverity":"high","tags":["pothole","road damage"],"reason":"Large pothole visible on road surface posing a safety risk."}`

export async function analyzeReportImage(
  photoUrl: string,
  userCategory: ReportCategory,
  description: string,
): Promise<AiProviderResult | null> {
  const apiKey = env.openRouterApiKey
  if (!apiKey) return null

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CityPulse',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: photoUrl } },
              {
                type: 'text',
                text: `User-selected category: ${userCategory}. Description: "${description || 'none provided'}"`,
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 300,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    const content: string | undefined = data.choices?.[0]?.message?.content
    if (!content) return null

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      isValidReport: Boolean(parsed.isValidReport),
      suggestedCategory: (parsed.suggestedCategory ?? userCategory) as ReportCategory,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
      tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]).slice(0, 5) : [],
      reason: String(parsed.reason ?? ''),
      visualSeverity: (parsed.visualSeverity ?? 'low') as AiVisualSeverity,
    }
  } catch {
    return null
  }
}

export function normalizeAiResult(result: AiProviderResult | null): {
  ai_validation_status: AiValidationStatus
  ai_needs_review: boolean
  ai_category: ReportCategory | null
  ai_confidence: number | null
  ai_tags: string[]
  ai_reason: string | null
  ai_visual_severity: AiVisualSeverity | null
} {
  if (!result) {
    return {
      ai_validation_status: 'unavailable',
      ai_needs_review: false,
      ai_category: null,
      ai_confidence: null,
      ai_tags: [],
      ai_reason: null,
      ai_visual_severity: null,
    }
  }

  let ai_validation_status: AiValidationStatus
  if (result.confidence < 0.6) {
    ai_validation_status = 'uncertain'
  } else if (result.isValidReport) {
    ai_validation_status = 'valid'
  } else {
    ai_validation_status = 'invalid'
  }

  return {
    ai_validation_status,
    ai_needs_review: ai_validation_status === 'uncertain' || ai_validation_status === 'invalid',
    ai_category: result.suggestedCategory ?? null,
    ai_confidence: result.confidence,
    ai_tags: result.tags,
    ai_reason: result.reason,
    ai_visual_severity: result.visualSeverity ?? null,
  }
}
