import path from "node:path";

import {
  getChatonsExtensionsBaseDir,
} from "../../extensions/manager.js";
import { listExtensionManifests } from "../../extensions/runtime.js";

export function buildLazyToolDiscoverySection(): string {
  return [
    "## Tool Discovery Mode",
    "",
    "Only builtin tools are always available at session start.",
    "Non-builtin tools should be discovered first through `search_tool` before relying on them.",
    "Tool definitions are not fully inlined in the initial prompt to save context space.",
    "Use `search_tool` to discover available tools by keyword, capability, or intent.",
    "`search_tool.query` accepts either a single text string or an array of text queries/keywords.",
    "When you pass an array to `search_tool`, the search is inclusive: results from all queries are merged and deduplicated, not intersected.",
    "Prefer array queries when the user intent contains multiple useful keywords or variants (for example: product name, action, synonym, language variant).",
    "Some tool families may appear in search results as a single grouped catalog entry instead of exposing every sub-tool individually. If a grouped entry matches the need, inspect it with `tool_detail` or refine the search.",
    "Use `tool_detail` to inspect one tool in depth before calling it when you need its parameters, description, or usage requirements.",
    "When a user request likely requires a tool but the exact name or arguments are unclear, search first, then inspect details, then call the real tool.",
    "Do not guess tool arguments when tool_detail can give you the exact schema.",
  ].join("\n");
}

export function buildExtensionContextSection(): string | null {
  try {
    const manifests = listExtensionManifests();
    if (manifests.length === 0) {
      return null;
    }

    const extensionsBaseDir = getChatonsExtensionsBaseDir();
    const lines = [
      "## Available Extensions",
      "",
      "The following extensions are installed and available to this session:",
      "",
    ];

    for (const manifest of manifests) {
      const extensionPath = path.join(extensionsBaseDir, manifest.id);
      const capabilities = manifest.capabilities?.length
        ? manifest.capabilities.join(", ")
        : "no capabilities declared";

      lines.push(`- **${manifest.name}** (v${manifest.version})`);
      lines.push(`  ID: ${manifest.id}`);
      lines.push(`  Location: ${extensionPath}`);
      lines.push(`  Capabilities: ${capabilities}`);

      const tools = Array.isArray(manifest.llm?.tools) ? manifest.llm.tools : [];
      if (tools.length > 0) {
        const toolSummaries = tools
          .filter(
            (tool) =>
              typeof tool.name === "string" &&
              (typeof tool.promptSnippet === "string" ||
                typeof tool.description === "string"),
          )
          .map((tool) => {
            const snippet =
              (typeof tool.promptSnippet === "string" && tool.promptSnippet.trim()) ||
              tool.description;
            return `    - ${tool.name}: ${snippet}`;
          });
        if (toolSummaries.length > 0) {
          lines.push("  Tools:");
          lines.push(...toolSummaries);
        }
      }

      lines.push("");
    }

    return lines.join("\n").trim();
  } catch (error) {
    console.warn(
      `Failed to build extension context: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

export function buildExtensionDevelopmentGuidance(): string {
  const extensionsBaseDir = getChatonsExtensionsBaseDir();
  return [
    "## Extension Development Guidance",
    "",
    "If the user asks you to create or edit an extension, follow these guidelines:",
    "",
    "1. **Documentation Reference**: For comprehensive extension development documentation, refer to https://docs.chatons.ai/extensions",
    "2. **Extension Location**: Always create new extensions in the user's extension home folder:",
    `   \`${extensionsBaseDir}\``,
    "3. **File Structure**: Follow the standard extension manifest structure as documented in the Chatons extensions guide.",
    "4. **Best Practices**: When editing or creating extensions, ensure proper manifest validation and follow the patterns in the documentation.",
    "5. **User Guidance**: When helping with extensions, provide clear paths and file locations relative to the extension home folder.",
  ].join("\n");
}

export function buildChannelPromptSection(
  channelExtensionId: string | null,
): string | null {
  if (!channelExtensionId) {
    return null;
  }

  try {
    const manifests = listExtensionManifests();
    const channelManifest = manifests.find(
      (manifest) =>
        manifest.id === channelExtensionId &&
        manifest.kind === "channel" &&
        typeof manifest.systemPrompt === "string",
    );
    if (channelManifest?.systemPrompt?.trim()) {
      return channelManifest.systemPrompt.trim();
    }
  } catch {
    // Fall through to legacy behavior if manifest lookup fails.
  }

  if (channelExtensionId === "@thibautrey/chatons-channel-even-realities") {
    return [
      "## Channel Context: Even Realities Glasses",
      "",
      "This conversation is being used through a pair of smart glasses.",
      "Optimize for very fast interactions and short on-device readability.",
      "Keep answers brief by default: usually one sentence, at most two short sentences unless the user explicitly asks for more.",
      "Prefer direct answers over preamble, filler, or step-by-step exposition.",
      "If the user asks a yes/no question, answer yes or no first.",
      "Do not mention internal channel rules unless the user asks.",
    ].join("\n");
  }

  return null;
}
