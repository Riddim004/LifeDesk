import { PaintbrushVertical, RefreshCcw } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskStore } from "@/store/useLifeDeskStore";
import { fontSizeLabels, sharedCopy, t, themeColorLabels, themeModeLabels } from "@/utils/copy";

const themeColors = ["forest", "ocean", "apricot", "mist", "lavender", "rose", "amber"] as const;
const fontSizes = ["small", "medium", "large"] as const;
const languages = [
  ["zh-CN", "中文"],
  ["en-US", "English"],
] as const;
const themeModes = ["light", "dark"] as const;

export default function SettingsPage() {
  const settings = useLifeDeskStore((state) => state.settings);
  const setLanguage = useLifeDeskStore((state) => state.setLanguage);
  const setThemeMode = useLifeDeskStore((state) => state.setThemeMode);
  const setThemeColor = useLifeDeskStore((state) => state.setThemeColor);
  const setFontSize = useLifeDeskStore((state) => state.setFontSize);
  const setNotificationsEnabled = useLifeDeskStore((state) => state.setNotificationsEnabled);
  const resetDemo = useLifeDeskStore((state) => state.resetDemo);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <Panel title={t(settings.language, sharedCopy.notifications)} subtitle={settings.language === "zh-CN" ? "基础设置支持即时预览。" : "Core settings preview instantly."}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t(settings.language, sharedCopy.language)}</p>
              <div className="mt-3 flex gap-3">
                {languages.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void setLanguage(value)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      settings.language === value ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel-muted)] text-[color:var(--text-soft)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t(settings.language, sharedCopy.themeMode)}</p>
              <div className="mt-3 flex gap-3">
                {themeModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => void setThemeMode(mode)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      settings.themeMode === mode ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel-muted)] text-[color:var(--text-soft)]",
                    ].join(" ")}
                  >
                    {t(settings.language, themeModeLabels[mode])}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t(settings.language, sharedCopy.fontSize)}</p>
              <div className="mt-3 flex gap-3">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => void setFontSize(size)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      settings.fontSize === size ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel-muted)] text-[color:var(--text-soft)]",
                    ].join(" ")}
                  >
                    {t(settings.language, fontSizeLabels[size])}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <PaintbrushVertical className="h-4 w-4 text-[color:var(--accent)]" />
                <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t(settings.language, sharedCopy.themeColor)}</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {themeColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => void setThemeColor(color)}
                    className={[
                      "rounded-[22px] border p-4 text-left transition",
                      settings.themeColor === color ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : "border-[color:var(--border-soft)] bg-[color:var(--panel-muted)]",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-semibold text-[color:var(--text-strong)]">{t(settings.language, themeColorLabels[color])}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t(settings.language, sharedCopy.notifications)}</p>
              <label className="mt-3 flex items-center justify-between rounded-[22px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-4 text-sm text-[color:var(--text-soft)]">
                <span>{settings.language === "zh-CN" ? "开启站内提醒" : "Enable reminders"}</span>
                <input type="checkbox" checked={settings.notificationsEnabled} onChange={(event) => void setNotificationsEnabled(event.target.checked)} />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void resetDemo()}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--panel-muted)] px-4 py-2 text-sm font-semibold text-[color:var(--text-strong)] transition hover:border-[color:var(--accent-border)]"
            >
              <RefreshCcw className="h-4 w-4" />
              {settings.language === "zh-CN" ? "清空本地数据" : "Clear local data"}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
