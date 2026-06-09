import { CalendarDays, Layers3, Settings2, UsersRound, WalletCards } from "lucide-react";
import { NavLink } from "react-router-dom";
import { CountBadge } from "@/components/common/CountBadge";
import { navCopy, t } from "@/utils/copy";
import { useLifeDeskSnapshot, useLifeDeskStore, getPeopleBoard } from "@/store/useLifeDeskStore";

const navItems = [
  { to: "/events", key: "events", icon: Layers3 },
  { to: "/calendar", key: "calendar", icon: CalendarDays },
  { to: "/social", key: "social", icon: UsersRound },
  { to: "/money", key: "money", icon: WalletCards },
] as const;

export function Sidebar() {
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const socialPending = getPeopleBoard(snapshot).reduce((total, entry) => total + entry.pendingCount, 0);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col rounded-[32px] border border-[color:var(--border-soft)] bg-[color:var(--sidebar)] p-6 shadow-[var(--panel-shadow)]">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)] shadow-[0_14px_30px_rgba(21,87,66,0.18)]">
          <UsersRound className="h-7 w-7" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-soft)]">LifeDesk</p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">{t(language, navCopy.userName)}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badge = item.key === "social" ? socialPending : 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "group flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200",
                  isActive
                    ? "bg-[color:var(--accent)] text-white shadow-[0_16px_32px_var(--accent-shadow)]"
                    : "text-[color:var(--text-muted)] hover:bg-[color:var(--sidebar-hover)] hover:text-[color:var(--text-strong)]",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{t(language, navCopy[item.key])}</span>
                  </span>
                  {badge > 0 ? <CountBadge value={badge} className={isActive ? "bg-white/20 text-white" : ""} /> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          [
            "mt-6 flex items-center justify-between rounded-2xl border px-4 py-4 transition-all duration-200",
            isActive
              ? "border-transparent bg-[color:var(--accent)] text-white shadow-[0_16px_32px_var(--accent-shadow)]"
              : "border-[color:var(--border-soft)] bg-[color:var(--sidebar-hover)] text-[color:var(--text-strong)] hover:border-[color:var(--accent-border)]",
          ].join(" ")
        }
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--avatar-shell)] text-sm font-semibold text-[color:var(--accent)]">你</span>
          <span>
            <span className="block text-sm font-semibold">Solo</span>
            <span className="block text-xs text-current/70">{t(language, navCopy.settings)}</span>
          </span>
        </span>
        <Settings2 className="h-5 w-5" />
      </NavLink>
    </aside>
  );
}
