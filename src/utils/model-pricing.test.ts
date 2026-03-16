/**
 * Tests for model-pricing utility functions.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  extractModelId,
  clearPricingCache,
  getModelPricing,
  fetchAllModelPricing,
} from "./model-pricing";

describe("extractModelId", () => {
  it("should extract model ID from provider/model format", () => {
    expect(extractModelId("openai/gpt-4o")).toBe("gpt-4o");
    expect(extractModelId("anthropic/claude-3-haiku")).toBe("claude-3-haiku");
    expect(extractModelId("myprovider/gpt-5.4")).toBe("gpt-5.4");
  });

  it("should return the same string when no provider prefix", () => {
    expect(extractModelId("gpt-4o")).toBe("gpt-4o");
    expect(extractModelId("gpt-5.4")).toBe("gpt-5.4");
    expect(extractModelId("claude-3-opus")).toBe("claude-3-opus");
  });

  it("should handle edge cases", () => {
    expect(extractModelId("/gpt-4")).toBe("gpt-4");
    expect(extractModelId("provider/")).toBe("");
    expect(extractModelId("")).toBe("");
  });
});

describe("getModelPricing", () => {
  beforeEach(() => {
    clearPricingCache();
  });

  it("should fetch pricing for a known model", async () => {
    const pricing = await getModelPricing("gpt-4o");
    expect(pricing).not.toBeNull();
    expect(pricing).toHaveProperty("inputCost");
    expect(pricing).toHaveProperty("outputCost");
    expect(typeof pricing!.inputCost).toBe("number");
    expect(typeof pricing!.outputCost).toBe("number");
    expect(pricing!.inputCost).toBeGreaterThanOrEqual(0);
    expect(pricing!.outputCost).toBeGreaterThanOrEqual(0);
  });

  it("should return same pricing with or without provider prefix", async () => {
    const pricingWithProvider = await getModelPricing("openai/gpt-4o");
    const pricingWithoutProvider = await getModelPricing("gpt-4o");

    expect(pricingWithProvider).toEqual(pricingWithoutProvider);
  });

  it("should return null for unknown model", async () => {
    const pricing = await getModelPricing("nonexistent-model-xyz123");
    expect(pricing).toBeNull();
  });
});

describe("fetchAllModelPricing", () => {
  beforeEach(() => {
    clearPricingCache();
  });

  it("should return a map of model pricings", async () => {
    const cache = await fetchAllModelPricing();
    expect(cache).toBeInstanceOf(Map);
    expect(cache.size).toBeGreaterThan(0);
  });

  it("should cache results for 7 days", async () => {
    const firstCall = await fetchAllModelPricing();
    const secondCall = await fetchAllModelPricing();
    expect(firstCall).toBe(secondCall); // Same reference due to caching
  });
});
