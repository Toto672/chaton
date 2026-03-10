import {
  Archive,
  Blocks,
  Bot,
  Brain,
  Database,
  Gauge,
  GitBranch,
  Lightbulb,
  Lock,
  MessageCircle,
  MessageSquareShare,
  Puzzle,
  Radio,
  Settings,
  Sparkles,
  Waypoints,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type IconValue =
  | { kind: "svg"; Component: IconComponent }
  | { kind: "image"; src: string };

const ICONS: Record<string, IconComponent> = {
  Blocks,
  Bot,
  Brain,
  Database,
  Gauge,
  Lightbulb,
  MessageCircle,
  MessageSquareShare,
  Puzzle,
  Radio,
  Settings,
  Sparkles,
  Waypoints,
  Workflow,
  Wrench,
  Zap,
  Lock,
  Archive,
  GitBranch,
};

/**
 * Resolve the static icon bundled with the app for a given extension ID.
 * Used as a fallback when no explicit URL is provided.
 */
function staticIconPath(extensionId: string): string {
  const normalized = extensionId.replace(/\//g, "-");
  return `/extension-icons/${normalized}.svg`;
}

/**
 * Resolve an extension icon for display.
 *
 * Priority:
 *  1. Named lucide-react icon (used by manifest sidebar menu items)
 *  2. Explicit image URL or data-URL (local data-URL for installed,
 *     CDN URL for marketplace)
 *  3. Static icon bundled with the app (/extension-icons/)
 *  4. Puzzle fallback
 *
 * @param iconName - An icon identifier: lucide name, data-URL, HTTP URL, or
 *                   relative path from the manifest.
 * @param extensionId - The extension ID, used to look up bundled static icons.
 */
export function getExtensionIcon(
  iconName?: string | null,
  extensionId?: string,
): IconValue {
  const normalized = typeof iconName === "string" ? iconName.trim() : "";

  // 1. Named lucide-react icon from manifest menu items
  if (ICONS[normalized]) return { kind: "svg", Component: ICONS[normalized] };

  // 2. Explicit image: data-URL (local installed), HTTP URL (marketplace CDN),
  //    or absolute path
  if (/^(data:image\/|https?:\/\/|\/)/i.test(normalized)) {
    return { kind: "image", src: normalized };
  }

  // 3. Bundled static icon for this extension ID
  if (extensionId) {
    return { kind: "image", src: staticIconPath(extensionId) };
  }

  // 4. Final fallback
  return { kind: "svg", Component: Puzzle };
}
