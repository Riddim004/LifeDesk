import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLifeDeskStore } from "@/store/useLifeDeskStore";

export function AppShell() {
  const language = useLifeDeskStore((state) => state.settings.language);
  const backendReady = useLifeDeskStore((state) => state.backendReady);
  const backendError = useLifeDeskStore((state) => state.backendError);
  const isConnecting = !backendReady && !backendError;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] px-6 py-6 text-[color:var(--text)] transition-colors duration-300 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1600px] gap-6">
        <Sidebar />
        <main className="flex-1 overflow-hidden rounded-[36px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] p-6 shadow-[var(--panel-shadow)] lg:p-8">
          {isConnecting ? (
            <div className="mb-4 rounded-2xl border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--text-strong)]">
              {language === "zh-CN"
                ? "正在连接本地后端，数据会以 runtime-data/lifedesk.sqlite 为准。"
                : "Connecting to the local backend. The source of truth is runtime-data/lifedesk.sqlite."}
            </div>
          ) : null}
          {backendError ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {language === "zh-CN"
                ? "本地后端未连接成功，当前界面仅展示内置演示数据。请先运行 npm run dev:full 或 npm run start。"
                : "The local backend is unavailable, so the app is currently showing built-in demo data only. Run npm run dev:full or npm run start first."}
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
