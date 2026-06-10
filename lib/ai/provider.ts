import { classifyWithMockProvider } from "@/lib/ai/providers/mock";
import {
  analyzeWithGeminiProvider,
  classifyWithGeminiProvider,
} from "@/lib/ai/providers/gemini";
import {
  analyzeWithOpenAiProvider,
  buildFallbackDeepAnalysis,
  classifyWithOpenAiProvider,
} from "@/lib/ai/providers/openai";
import {
  analyzeWithOpenRouterProvider,
  classifyWithOpenRouterProvider,
} from "@/lib/ai/providers/openrouter";
import { env } from "@/lib/env";
import type {
  AiProviderResult,
  AiVisualSeverity,
  ReportCategory,
  ReportDeepAnalysis,
} from "@/types";

type ClassifyImageInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
};

export async function classifyImageWithProvider(
  input: ClassifyImageInput,
): Promise<AiProviderResult | null> {
  if (env.aiProvider === "gemini") {
    const result = await classifyWithGeminiProvider(input);

    return result ?? classifyWithMockProvider(input);
  }

  if (env.aiProvider === "openai") {
    const result = await classifyWithOpenAiProvider(input);

    return result ?? classifyWithMockProvider(input);
  }

  if (env.aiProvider === "openrouter") {
    const result = await classifyWithOpenRouterProvider(input);

    return result ?? classifyWithMockProvider(input);
  }

  if (env.aiProvider === "mock" || !env.aiApiUrl) {
    return classifyWithMockProvider(input);
  }

  try {
    const response = await fetch(env.aiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: env.aiApiKey ? `Bearer ${env.aiApiKey}` : "",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AiProviderResult;
  } catch {
    return null;
  }
}

type DeepAnalysisInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
  address: string | null;
  aiReason: string | null;
  aiVisualSeverity: AiVisualSeverity | null;
  aiTags: string[];
};

export async function analyzeReportWithProvider(
  input: DeepAnalysisInput,
): Promise<ReportDeepAnalysis> {
  if (env.aiProvider === "gemini") {
    const result = await analyzeWithGeminiProvider({
      imageUrl: input.imageUrl,
      userCategory: input.userCategory,
      description: input.description,
      address: input.address,
    });

    if (result) {
      return result;
    }
  }

  if (env.aiProvider === "openai") {
    const result = await analyzeWithOpenAiProvider({
      imageUrl: input.imageUrl,
      userCategory: input.userCategory,
      description: input.description,
      address: input.address,
    });

    if (result) {
      return result;
    }
  }

  if (env.aiProvider === "openrouter") {
    const result = await analyzeWithOpenRouterProvider({
      imageUrl: input.imageUrl,
      userCategory: input.userCategory,
      description: input.description,
      address: input.address,
    });

    if (result) {
      return result;
    }
  }

  if (env.aiProvider === "mock") {
    const { analyzeWithMockProvider } = await import("@/lib/ai/providers/mock");

    return analyzeWithMockProvider({
      userCategory: input.userCategory,
      description: input.description,
      address: input.address,
      aiReason: input.aiReason,
      aiVisualSeverity: input.aiVisualSeverity,
      aiTags: input.aiTags,
    });
  }

  return buildFallbackDeepAnalysis({
    userCategory: input.userCategory,
    description: input.description,
    aiReason: input.aiReason,
    aiVisualSeverity: input.aiVisualSeverity,
    address: input.address,
    aiTags: input.aiTags,
  });
}
