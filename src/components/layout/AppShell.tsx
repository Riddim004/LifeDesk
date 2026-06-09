import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLifeDeskStore } from "@/store/useLifeDeskStore";

export function AppShell() {
  const language = useLifeDeskStore((state) => state.settings.language);
  const backendReady = useLifeDeskStore((state) => state.backendReady);
  const backendError = useLifeDeskStore((state) => state.backendError);
  const syncError = useLifeDeskStore((state) => state.syncError);
  const clearSyncError = useLifeDeskStore((state) => state.clearSyncError);
  const isConnecting = !backendReady && !backendError;

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--bg)] px-6 py-6 text-[color:var(--text)] transition-colors duration-300 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1600px] gap-6 overflow-hidden">
        <Sidebar />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[36px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] shadow-[var(--panel-shadow)]">
          <div className="px-6 pt-6 lg:px-8 lg:pt-8">
            {isConnecting ? (
              <div className="mb-4 rounded-2xl border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--text-strong)]">
                {language === "zh-CN"
                  ? "正在连接本地后端，数据会以父文件夹中的 lifedesk.sqlite 为准。"
                  : "Connecting to the local backend. The source of truth is lifedesk.sqlite in the parent folder."}
              </div>
            ) : null}
            {backendError ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {language === "zh-CN"
                  ? "本地后端未连接成功，当前界面不会读取数据库数据。请先运行 npm run dev:full 或 npm run start。"
                  : "The local backend is unavailable, so the app cannot read database data right now. Run npm run dev:full or npm run start first."}
              </div>
            ) : null}
            {syncError ? (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>{syncError}</span>
                <button
                  type="button"
                  onClick={clearSyncError}
                  className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800"
                >
                  {language === "zh-CN" ? "知道了" : "Dismiss"}
                </button>
              </div>
            ) : null}
          </div>
          <div className="app-shell-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6 lg:px-8 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
