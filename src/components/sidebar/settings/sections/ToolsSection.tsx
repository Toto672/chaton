import type { PiSettingsJson } from "@/features/workspace/types";
import { useTranslation } from "react-i18next";

const TOOL_VALUES = [
  "read",
  "bash",
  "edit",
  "write",
  "grep",
  "find",
  "ls",
] as const;

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "dark:focus-visible:ring-blue-400/60 dark:focus-visible:ring-offset-slate-900",
        checked
          ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
          : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700",
      ].join(" ")}
      onClick={() => onChange(!checked)}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0.5",
          "dark:bg-slate-50",
        ].join(" ")}
      />
    </button>
  );
}

export function ToolsSection({
  settings,
  setSettings,
  onSave,
}: {
  settings: PiSettingsJson;
  setSettings: (next: PiSettingsJson) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const selected = Array.isArray(settings.defaultTools)
    ? settings.defaultTools.filter(
        (tool): tool is string => typeof tool === "string",
      )
    : ["read", "bash", "edit", "write"];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <label className="flex flex-col gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          defaultTools
        </span>
        <div className="flex flex-wrap gap-2">
          {TOOL_VALUES.map((tool) => {
            const active = selected.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                  active
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
                onClick={() => {
                  const next = active
                    ? selected.filter((item) => item !== tool)
                    : [...selected, tool];
                  setSettings({ ...settings, defaultTools: next });
                }}
              >
                {tool}
              </button>
            );
          })}
        </div>
      </label>
      {(
        [
          "extensionsEnabled",
          "skillsEnabled",
          "promptTemplatesEnabled",
          "themesEnabled",
          "offlineMode",
        ] as const
      ).map((key) => (
        <div
          className="mt-4 flex items-center justify-between gap-4"
          key={key}
        >
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {key}
          </span>
          <Toggle
            checked={Boolean(settings[key])}
            onChange={(v) => setSettings({ ...settings, [key]: v })}
          />
        </div>
      ))}
      <button
        type="button"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
        onClick={onSave}
      >
        {t("Sauvegarder")}
      </button>
    </section>
  );
}
