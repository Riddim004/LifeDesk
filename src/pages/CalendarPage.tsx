import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, categoryNameById, personNameById } from "@/store/useLifeDeskStore";
import { buildCalendarSummary, groupByWeeks, formatShortDate } from "@/utils/date";

const heatClasses = [
  "bg-[color:var(--heat-0)]",
  "bg-[color:var(--heat-1)]",
  "bg-[color:var(--heat-2)]",
  "bg-[color:var(--heat-3)]",
  "bg-[color:var(--heat-4)]",
];

export default function CalendarPage() {
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const [filter, setFilter] = useState<"all" | "event" | "social" | "money">("all");

  const summary = useMemo(() => {
    return buildCalendarSummary(snapshot.tasks, categoryNameById(snapshot), personNameById(snapshot), filter, 126);
  }, [filter, snapshot]);

  const weeks = useMemo(() => groupByWeeks(summary), [summary]);
  const busiestDay = useMemo(() => [...summary].sort((left, right) => right.eventCount - left.eventCount)[0], [summary]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <Panel
        title={language === "zh-CN" ? "日历热力图" : "Calendar Heatmap"}
        subtitle={language === "zh-CN" ? "点击绿色格子，直接进入当天 events。" : "Tap any green square to dive into the day's events."}
        actions={
          <div className="flex flex-wrap gap-2">
            {[
              ["all", language === "zh-CN" ? "全部" : "All"],
              ["event", language === "zh-CN" ? "事件" : "Events"],
              ["social", language === "zh-CN" ? "人际" : "Social"],
              ["money", language === "zh-CN" ? "资金关联" : "Money links"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as typeof filter)}
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  filter === value ? "bg-[color:var(--accent)] text-white shadow-[0_12px_24px_var(--accent-shadow)]" : "bg-[color:var(--panel-muted)] text-[color:var(--text-soft)]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="overflow-x-auto rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5">
            <div className="flex gap-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid gap-2">
                  {week.map((day) => (
                    <Link
                      key={day.date}
                      to={`/calendar/${day.date}`}
                      className={`h-7 w-7 rounded-[10px] border border-white/10 transition hover:scale-110 ${heatClasses[day.heatLevel]}`}
                      title={`${day.date} · ${day.eventCount}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">{language === "zh-CN" ? "最忙的一天" : "Busiest Day"}</p>
              <p className="mt-4 text-2xl font-semibold text-[color:var(--text-strong)]">{formatShortDate(busiestDay?.date, language)}</p>
              <p className="mt-2 text-sm text-[color:var(--text-soft)]">{busiestDay?.eventCount || 0} {language === "zh-CN" ? "条事件" : "events"}</p>
            </div>
            <div className="rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">{language === "zh-CN" ? "颜色说明" : "Legend"}</p>
              <div className="mt-4 flex items-center gap-2">
                {heatClasses.map((className, index) => (
                  <span key={className} className={`h-6 w-6 rounded-lg ${className}`} title={String(index)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
