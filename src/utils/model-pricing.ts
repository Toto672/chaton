/**
 * Utility functions for retrieving model pricing information from OpenRouter API.
 * Provides caching to minimize API calls.
 *
 * @example
 * ```typescript
 * import { getModelPricing, extractModelId } from "@/utils/model-pricing";
 *
 * // Get pricing for a model (with or without provider prefix)
 * const pricing = await getModelPricing("gpt-4o");
 * // or
 * const pricing = await getModelPricing("openai/gpt-4o");
 *
 * if (pricing) {
 *   console.log(`Input cost: $${pricing.inputCost} per token`);
 *   console.log(`Output cost: $${pricing.outputCost} per token`);
 *   // Output: { inputCost: 0.0000025, outputCost: 0.00001 }
 * }
 * ```
 */

export interface ModelPricing {
  /** Cost per input token in dollars */
  inputCost: number;
  /** Cost per output token in dollars */
  outputCost: number;
}

interface OpenRouterModel {
  id: string;
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
  };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

// Cache for model pricing data
let pricingCache: Map<string, ModelPricing> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Extracts the model ID without the provider prefix.
 * For example: "myprovider/gpt-5.4" -> "gpt-5.4"
 * Or: "gpt-5.4" -> "gpt-5.4"
 */
export function extractModelId(modelKey: string): string {
  const separatorIndex = modelKey.indexOf("/");
  if (separatorIndex === -1) {
    return modelKey;
  }
  return modelKey.slice(separatorIndex + 1);
}

/**
 * Fetches all model pricing data from OpenRouter API.
 * Results are cached for 7 days to minimize API calls.
 */
export async function fetchAllModelPricing(): Promise<Map<string, ModelPricing>> {
  // Return cached data if still valid
  if (pricingCache && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
    return pricingCache;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    const newCache = new Map<string, ModelPricing>();

    for (const model of data.data) {
      const modelId = extractModelId(model.id);
      const inputCost = parseFloat(model.pricing.prompt) || 0;
      const outputCost = parseFloat(model.pricing.completion) || 0;

      // Only add if we have valid pricing
      if (inputCost >= 0 && outputCost >= 0) {
        newCache.set(modelId.toLowerCase(), {
          inputCost,
          outputCost,
        });
      }
    }

    pricingCache = newCache;
    cacheTimestamp = Date.now();
    return pricingCache;
  } catch (error) {
    console.error("Failed to fetch model pricing:", error);
    // Return empty cache on error, or previous cache if available
    return pricingCache ?? new Map();
  }
}

/**
 * Gets the pricing for a specific model.
 * The model name can include a provider prefix (e.g., "openai/gpt-4o" or just "gpt-4o").
 * Returns null if the model is not found.
 *
 * @param modelKey - The model identifier, optionally with provider prefix
 * @returns The pricing information or null if not found
 *
 * @example
 * const pricing = await getModelPricing("openai/gpt-4o");
 * // Returns: { inputCost: 0.0000025, outputCost: 0.00001 }
 *
 * @example
 * const pricing = await getModelPricing("gpt-4o");
 * // Returns: { inputCost: 0.0000025, outputCost: 0.00001 }
 */
export async function getModelPricing(modelKey: string): Promise<ModelPricing | null> {
  const modelId = extractModelId(modelKey).toLowerCase();
  const cache = await fetchAllModelPricing();
  return cache.get(modelId) ?? null;
}

/**
 * Clears the pricing cache. Useful for testing or when fresh data is needed.
 */
export function clearPricingCache(): void {
  pricingCache = null;
  cacheTimestamp = 0;
}
