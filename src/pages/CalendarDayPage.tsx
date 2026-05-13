import { useParams } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getCategoryById, getTasksForDate, getPersonById } from "@/store/useLifeDeskStore";
import { sharedCopy, t } from "@/utils/copy";
import { formatDate } from "@/utils/date";

export default function CalendarDayPage() {
  const { date = "2026-05-12" } = useParams();
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const tasks = getTasksForDate(snapshot, date);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <Panel title={t(language, sharedCopy.currentDayEvents)} subtitle={date}>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border-soft)] p-5 text-sm text-[color:var(--text-soft)]">{t(language, sharedCopy.noEvents)}</div>
          ) : (
            tasks.map((task) => {
              const person = task.personId ? getPersonById(snapshot, task.personId) : undefined;
              const category = getCategoryById(snapshot, task.categoryId);
              return (
                <div key={task.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
                  <p className="text-sm font-semibold text-[color:var(--text-strong)]">{task.title}</p>
                  <p className="mt-2 text-sm text-[color:var(--text-soft)]">
                    {language === "zh-CN" ? "分类" : "Category"}：{category?.name || task.categoryId}
                    {person ? ` · ${language === "zh-CN" ? "人物" : "Person"}：${person.name}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--text-faint)]">{formatDate(task.dueAt || task.remindAt, language)}</p>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}
