import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MemoryModelPicker } from "@/components/model/MemoryModelPicker";
import { workspaceIpc } from "@/services/ipc/workspace";

export function MemorySection() {
  const { t } = useTranslation();
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const result = await workspaceIpc.getMemoryModelPreference();
        if (result.ok) {
          setSelectedModelKey(result.modelKey);
        }
      } catch {
        // Ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleModelChange = (modelKey: string | null) => {
    setSelectedModelKey(modelKey);
    void workspaceIpc.setMemoryModelPreference(modelKey);
  };

  return (
    <section className="settings-card">
      <h3 className="settings-card-title">{t("settings.memory.title")}</h3>
      <div className="settings-card-note">
        {t("settings.memory.desc")}
      </div>

      <div className="settings-grid">
        <div className="settings-row-wrap">
          <span className="settings-label">
            {t("settings.memory.modelLabel")}
          </span>
          {loaded ? (
            <MemoryModelPicker
              modelKey={selectedModelKey}
              onChange={handleModelChange}
            />
          ) : null}
        </div>
      </div>

      <div className="settings-card-note" style={{ marginTop: 4 }}>
        {t("settings.memory.modelHint")}
      </div>
    </section>
  );
}
