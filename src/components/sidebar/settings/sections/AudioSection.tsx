import type { SidebarSettings } from "@/features/workspace/types";
import { useTranslation } from "react-i18next";

type Props = {
  settings: SidebarSettings;
  setSettings: (next: SidebarSettings) => void;
  onSave: () => void;
};

export function AudioSection({ settings, setSettings, onSave }: Props) {
  const { t } = useTranslation();

  return (
    <section className="settings-card">
      <h3 className="settings-card-title">{t("Audio")}</h3>
      <div className="settings-grid">
        <label className="settings-toggle-row">
          <span className="settings-label">{t("Chime à la fin des conversations")}</span>
          <input
            type="checkbox"
            checked={settings.enableConversationChime ?? true}
            onChange={(e) =>
              setSettings({ ...settings, enableConversationChime: e.target.checked })
            }
          />
        </label>
      </div>
      <button type="button" className="settings-action" onClick={onSave}>
        {t("Sauvegarder")}
      </button>
    </section>
  );
}
