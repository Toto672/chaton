import { describe, expect, it } from "vitest";

import { computeComposerContextUsage } from "./context-usage";

describe("computeComposerContextUsage", () => {
  it("uses the last assistant input usage instead of summing totalTokens across turns", () => {
    const messages = [
      {
        role: "assistant",
        usage: {
          input: 1200,
          output: 300,
          totalTokens: 1500,
        },
      },
      {
        role: "assistant",
        usage: {
          input: 1800,
          output: 400,
          totalTokens: 2200,
        },
      },
    ];

    expect(computeComposerContextUsage(messages, 128_000)).toEqual({
      usedTokens: 1800,
      contextWindow: 128_000,
      percentage: 1,
    });
  });

  it("adds a coarse estimate for new messages after the last measured assistant turn", () => {
    const messages = [
      {
        role: "assistant",
        usage: {
          input: 1000,
          output: 250,
          totalTokens: 1250,
        },
      },
      {
        role: "user",
        content: [{ type: "text", text: "abcdefghij" }],
      },
    ];

    expect(computeComposerContextUsage(messages, 10_000)).toEqual({
      usedTokens: 1003,
      contextWindow: 10_000,
      percentage: 10,
    });
  });

  it("falls back to text estimation when no usage data is available", () => {
    const messages = [
      {
        role: "user",
        content: [{ type: "text", text: "12345678" }],
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "1234" }],
      },
    ];

    expect(computeComposerContextUsage(messages, 100)).toEqual({
      usedTokens: 3,
      contextWindow: 100,
      percentage: 3,
    });
  });

  it("reads nested message.usage records emitted by Pi snapshots", () => {
    const messages = [
      {
        message: {
          role: "assistant",
          usage: {
            input: 4096,
            output: 512,
            totalTokens: 4608,
          },
        },
      },
    ];

    expect(computeComposerContextUsage(messages, 8192)).toEqual({
      usedTokens: 4096,
      contextWindow: 8192,
      percentage: 50,
    });
  });
});

