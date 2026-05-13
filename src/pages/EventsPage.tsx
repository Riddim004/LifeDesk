import { ArrowRight, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getCategoryById, getEventGroups, getEventPendingCount, getPersonById, getTodayPriorities } from "@/store/useLifeDeskStore";
import { eventLabels, sharedCopy, t } from "@/utils/copy";
import { formatShortDate } from "@/utils/date";

export default function EventsPage() {
  const language = useLifeDeskStore((state) => state.settings.language);
  const createTask = useLifeDeskStore((state) => state.createTask);
  const completeTask = useLifeDeskStore((state) => state.completeTask);
  const snapshot = useLifeDeskSnapshot();
  const eventGroups = getEventGroups(snapshot);
  const pendingTasks = getTodayPriorities(snapshot);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("study");
  const [personId, setPersonId] = useState("");
  const [dueAt, setDueAt] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategoryId("study");
    setPersonId("");
    setDueAt("");
  };

  const handleCreateTask = () => {
    if (!title.trim()) {
      return;
    }

    createTask({
      categoryId,
      personId: personId || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });

    resetForm();
    setIsCreateOpen(false);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel
          title={language === "zh-CN" ? "事件工作台" : "Events Desk"}
          subtitle={language === "zh-CN" ? "所有事情都在这里汇总，人际事项也只是其中一种关联。" : "This is the single event pool, including tasks linked to people."}
          className="relative overflow-hidden"
          actions={
            <button
              type="button"
              onClick={() => setIsCreateOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
            >
              <Plus className="h-4 w-4" />
              {language === "zh-CN" ? "新增事件" : "Add Event"}
            </button>
          }
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,var(--accent-soft),transparent_60%)] opacity-80" />
          <div className="relative space-y-4">
            {isCreateOpen ? (
              <div className="rounded-[24px] border border-[color:var(--accent-border)] bg-[color:var(--panel-muted)] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "事件标题" : "Event title"}</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={language === "zh-CN" ? "例如：整理周报、预约洗牙" : "For example: Weekly report, dentist appointment"}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "分类" : "Category"}</span>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    >
                      {eventGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {t(language, eventLabels[group.id])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "关联人物" : "Related person"}</span>
                    <select
                      value={personId}
                      onChange={(event) => setPersonId(event.target.value)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    >
                      <option value="">{language === "zh-CN" ? "不关联人物" : "No person linked"}</option>
                      {snapshot.persons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "说明" : "Description"}</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={3}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "截止时间" : "Due time"}</span>
                    <input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(event) => setDueAt(event.target.value)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCreateTask}
                    className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
                  >
                    {language === "zh-CN" ? "保存事件" : "Save Event"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(false);
                    }}
                    className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-5 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
                  >
                    {language === "zh-CN" ? "取消" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
            {eventGroups.map((group) => (
              <Link
                key={group.id}
                to={`/events/${group.id}`}
                className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5 transition hover:-translate-y-1 hover:border-[color:var(--accent-border)]"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">{language === "zh-CN" ? "分类" : "Category"}</p>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-[color:var(--text-strong)]">{t(language, eventLabels[group.id])}</h3>
                    <p className="mt-3 text-sm text-[color:var(--text-soft)]">
                      {getEventPendingCount(snapshot, group.id)} {t(language, sharedCopy.totalPending)}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[color:var(--accent)]" />
                </div>
              </Link>
            ))}
            </div>
          </div>
        </Panel>

        <Panel
          title={language === "zh-CN" ? "今日重点" : "Today Focus"}
          subtitle={language === "zh-CN" ? "把注意力留给最先到期的事情，不区分它属于哪个入口。" : "Focus on what expires first, regardless of which view it comes from."}
        >
          <div className="space-y-3">
            {pendingTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-[22px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-strong)]">{task.title}</p>
                    <p className="mt-2 text-xs text-[color:var(--text-soft)]">
                      {(task.categoryId in eventLabels ? t(language, eventLabels[task.categoryId]) : getCategoryById(snapshot, task.categoryId)?.name || task.categoryId)}
                      {task.personId ? ` · ${language === "zh-CN" ? "人物" : "Person"}：${getPersonById(snapshot, task.personId)?.name || task.personId}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--text-soft)]">{formatShortDate(task.dueAt || task.remindAt, language)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => completeTask(task.id)}
                      className="rounded-full bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--accent-shadow)]"
                    >
                      {language === "zh-CN" ? "点掉" : "Done"}
                    </button>
                    <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title={language === "zh-CN" ? "近期事件" : "Recent Events"}
        subtitle={language === "zh-CN" ? "按照时间顺序快速扫一遍所有事项，包括与人物有关的事情。" : "Scan all tasks in time order, including the ones tied to people."}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {pendingTasks.map((task) => (
            <div key={task.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-strong)]">{task.title}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-soft)]">
                      {(task.categoryId in eventLabels ? t(language, eventLabels[task.categoryId]) : getCategoryById(snapshot, task.categoryId)?.name || task.categoryId)}
                      {task.personId ? ` · ${language === "zh-CN" ? "人物" : "Person"}：${getPersonById(snapshot, task.personId)?.name || task.personId}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => completeTask(task.id)}
                  className="rounded-full bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--accent-shadow)]"
                >
                  {language === "zh-CN" ? "点掉" : "Done"}
                </button>
              </div>
              <p className="mt-3 text-xs text-[color:var(--text-soft)]">{formatShortDate(task.dueAt || task.remindAt, language)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
