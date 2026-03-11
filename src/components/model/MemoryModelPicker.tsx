import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ThreadModelControls } from "@/components/model/ThreadModelControls";
import type { PiModel } from "@/components/model/types";
import { workspaceIpc } from "@/services/ipc/workspace";

const AUTO_KEY = "__auto__";

// Synthetic model entry representing "auto" mode
const AUTO_MODEL: PiModel = {
  id: "Auto (last used model)",
  provider: "auto",
  key: AUTO_KEY,
  scoped: true,
  supportsThinking: false,
  thinkingLevels: [],
};

type MemoryModelPickerProps = {
  /** Current persisted model key, or null for auto */
  modelKey: string | null;
  /** Called when the user picks a model (null = auto) */
  onChange: (modelKey: string | null) => void;
};

/**
 * Reusable model picker for memory settings.
 * Wraps ThreadModelControls with an "Auto" option and no thinking/access controls.
 */
export function MemoryModelPicker({ modelKey, onChange }: MemoryModelPickerProps) {
  const { t } = useTranslation();
  const [models, setModels] = useState<PiModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const result = await workspaceIpc.listPiModels();
        if (result.ok) {
          setModels(result.models);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshModels = async () => {
    try {
      const result = await workspaceIpc.listPiModels();
      if (result.ok) {
        setModels(result.models);
      }
    } catch {
      // Ignore
    }
  };

  // Prepend the auto entry
  const allModels: PiModel[] = [
    { ...AUTO_MODEL, id: t("settings.memory.modelAuto") },
    ...models,
  ];

  const selectedKey = modelKey ?? AUTO_KEY;

  return (
    <ThreadModelControls
      models={allModels}
      selectedModelKey={selectedKey}
      isLoadingModels={loading}
      isUpdatingScope={false}
      onApplyModel={async (key) => {
        onChange(key === AUTO_KEY ? null : key);
      }}
      onToggleModelScoped={async () => {}}
      onThinkingChange={async () => {}}
      onAccessModeChange={async () => {}}
      onOpenModelsMenu={() => void refreshModels()}
      t={t}
      showScopeToggle={false}
      showThinking={false}
      showAccessMode={false}
      dropdownDirection="down"
    />
  );
}
