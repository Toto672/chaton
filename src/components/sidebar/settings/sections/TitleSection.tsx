import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TitleModelPicker } from "@/components/model/TitleModelPicker";
import { workspaceIpc } from "@/services/ipc/workspace";

export function TitleSection() {
  const { t } = useTranslation();
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const result = await workspaceIpc.getTitleModelPreference();
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
    void workspaceIpc.setTitleModelPreference(modelKey);
  };

  return (
    <section className="settings-card">
      <h3 className="settings-card-title">{t("settings.title.title")}</h3>
      <div className="settings-card-note">
        {t("settings.title.desc")}
      </div>

      <div className="settings-grid">
        <div className="settings-row-wrap">
          <span className="settings-label">
            {t("settings.title.modelLabel")}
          </span>
          {loaded ? (
            <TitleModelPicker
              modelKey={selectedModelKey}
              onChange={handleModelChange}
            />
          ) : null}
        </div>
      </div>

      <div className="settings-card-note" style={{ marginTop: 4 }}>
        {t("settings.title.modelHint")}
      </div>
    </section>
  );
}
