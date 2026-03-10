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
 * Try to resolve a local extension icon from the static extension-icons directory.
 * Returns a path to either .svg or .png version of the icon.
 */
function tryStaticIcon(extensionId?: string): string | null {
  if (!extensionId) return null;

  // Normalize extension ID to filename format: @scope/name -> @scope-name
  const normalized = extensionId.replace(/\//g, "-");

  // Try .svg first, then .png
  // Browser will handle 404 gracefully by falling back to lucide icons
  const svgPath = `/extension-icons/${normalized}.svg`;
  return svgPath;
}

export function getExtensionIcon(
  iconName?: string | null,
  extensionId?: string,
): IconValue {
  const normalized = typeof iconName === "string" ? iconName.trim() : "";

  // Named lucide-react icons are used by manifest menu items.
  if (ICONS[normalized]) return { kind: "svg", Component: ICONS[normalized] };

  // Prefer static marketplace icons bundled with the app (works for both marketplace and installed).
  if (extensionId) {
    const staticPath = tryStaticIcon(extensionId);
    if (staticPath) return { kind: "image", src: staticPath };
  }

  // Fall back to explicit image URLs resolved by the backend for installed extensions.
  if (/^(data:image\/|https?:\/\/|\/)/i.test(normalized)) {
    return { kind: "image", src: normalized };
  }

  // Final fallback to puzzle icon if nothing else works
  return { kind: "svg", Component: Puzzle };
}
