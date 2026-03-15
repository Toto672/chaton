import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ThreadModelControls } from "@/components/model/ThreadModelControls";
import type { PiModel } from "@/components/model/types";
import { workspaceIpc } from "@/services/ipc/workspace";

type TitleModelPickerProps = {
  /** Current persisted model key, or null for default */
  modelKey: string | null;
  /** Called when the user picks a model (null = use conversation model) */
  onChange: (modelKey: string | null) => void;
};

/**
 * Reusable model picker for title generation settings.
 * Wraps ThreadModelControls with a "Default" option and no thinking/access controls.
 */
export function TitleModelPicker({ modelKey, onChange }: TitleModelPickerProps) {
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

  return (
    <ThreadModelControls
      models={models}
      selectedModelKey={modelKey ?? ""}
      isLoadingModels={loading}
      isUpdatingScope={false}
      onApplyModel={async (key) => {
        onChange(key || null);
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
      placeholder={t("settings.title.selectModel")}
    />
  );
}
