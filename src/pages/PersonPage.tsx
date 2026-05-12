import { Landmark, MessageSquareDot, RotateCcw, Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { TaskRow } from "@/components/social/TaskRow";
import { useLifeDeskSnapshot, useLifeDeskStore, getCompletedTasksByPerson, getMoneyRecordsSorted, getPendingCountByPerson, getPendingTasksByPerson, getPersonById } from "@/store/useLifeDeskStore";
import { relationLabels, sharedCopy, t } from "@/utils/copy";
import { formatDate, formatShortDate } from "@/utils/date";

export default function PersonPage() {
  const { personId = "mom" } = useParams();
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const person = getPersonById(snapshot, personId);
  const pendingTasks = getPendingTasksByPerson(snapshot, personId);
  const completedTasks = getCompletedTasksByPerson(snapshot, personId);
  const moneyRecords = getMoneyRecordsSorted(snapshot).filter((record) => record.relatedPersonId === personId);
  const pendingCount = getPendingCountByPerson(snapshot, personId);
  const completeTask = useLifeDeskStore((state) => state.completeTask);

  if (!person) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title={person.name} subtitle={t(language, relationLabels[person.categoryId])}>
          <div className="rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[color:var(--accent-soft)] text-2xl font-semibold text-[color:var(--accent)]">{person.name.slice(0, 1)}</div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-soft)]">{t(language, relationLabels[person.categoryId])}</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text-strong)]">{pendingCount}</p>
                <p className="text-sm text-[color:var(--text-soft)]">{t(language, sharedCopy.totalPending)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-[color:var(--text-soft)]">
              <p>{language === "zh-CN" ? "生日" : "Birthday"}：{formatShortDate(person.birthday, language)}</p>
              <p>{language === "zh-CN" ? "最近联系" : "Last Contact"}：{formatDate(person.lastContactAt, language)}</p>
              <p>{language === "zh-CN" ? "备注" : "Notes"}：{person.note || (language === "zh-CN" ? "暂无" : "None")}</p>
            </div>
          </div>
        </Panel>

        <Panel title={t(language, sharedCopy.currentTodo)} subtitle={language === "zh-CN" ? "像消息一样，一条条点掉它们。" : "Treat each one like an unread thread and clear it."}>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} language={language} onComplete={completeTask} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title={t(language, sharedCopy.completed)} subtitle={language === "zh-CN" ? "完成后从待办中退出，但仍然能回看。" : "Completed items leave the queue but stay visible in history."}>
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border-soft)] p-5 text-sm text-[color:var(--text-soft)]">{t(language, sharedCopy.noPending)}</div>
            ) : (
              completedTasks.map((task) => (
                <div key={task.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-4 w-4 text-[color:var(--text-faint)]" />
                    <p className="text-sm font-medium text-[color:var(--text-strong)]">{task.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title={language === "zh-CN" ? "资金关联" : "Money Links"}>
            <div className="space-y-3">
              {moneyRecords.map((record) => (
                <div key={record.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Landmark className="h-4 w-4 text-[color:var(--accent)]" />
                      <p className="text-sm font-medium text-[color:var(--text-strong)]">{record.title}</p>
                    </div>
                    <span className={record.type === "income" ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-rose-500"}>
                      {record.type === "income" ? "+" : "-"}¥{record.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={language === "zh-CN" ? "快捷动作" : "Quick Actions"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-4 text-left text-sm font-medium text-[color:var(--text-strong)]">
                <MessageSquareDot className="mb-3 h-4 w-4 text-[color:var(--accent)]" />
                {t(language, sharedCopy.addTask)}
              </button>
              <button className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-4 text-left text-sm font-medium text-[color:var(--text-strong)]">
                <Sparkles className="mb-3 h-4 w-4 text-[color:var(--accent)]" />
                {language === "zh-CN" ? "记录联系" : "Log Contact"}
              </button>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
