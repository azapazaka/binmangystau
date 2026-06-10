import { normalizeAiClassification } from "@/lib/ai/normalize";
import { classifyImageWithProvider } from "@/lib/ai/provider";
import type { ReportCategory } from "@/types";

type ClassifyReportImageInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
};

export async function classifyReportImage({
  imageUrl,
  userCategory,
  description,
}: ClassifyReportImageInput) {
  const providerResult = await classifyImageWithProvider({
    imageUrl,
    userCategory,
    description,
  });

  return normalizeAiClassification({
    userCategory,
    providerResult,
  });
}
