import { CheckCircle2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getCategoryById, getTasksByEventCategory } from "@/store/useLifeDeskStore";
import { eventLabels, t } from "@/utils/copy";
import { formatDate } from "@/utils/date";

export default function EventCategoryPage() {
  const { categoryId = "study" } = useParams();
  const language = useLifeDeskStore((state) => state.settings.language);
  const createTask = useLifeDeskStore((state) => state.createTask);
  const completeTask = useLifeDeskStore((state) => state.completeTask);
  const snapshot = useLifeDeskSnapshot();
  const category = getCategoryById(snapshot, categoryId);
  const tasks = getTasksByEventCategory(snapshot, categoryId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");

  const label = useMemo(() => {
    if (categoryId in eventLabels) {
      return t(language, eventLabels[categoryId]);
    }
    return category?.name || categoryId;
  }, [category?.name, categoryId, language]);

  const handleCreateTask = () => {
    if (!title.trim()) {
      return;
    }

    createTask({
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });

    setTitle("");
    setDescription("");
    setDueAt("");
    setIsCreateOpen(false);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <Panel
        title={`${language === "zh-CN" ? "事件分类" : "Event Category"} · ${label}`}
        subtitle={language === "zh-CN" ? "这里专门看事，不混入人际浏览逻辑。" : "This view stays task-first, without social navigation noise."}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
          >
            <Plus className="h-4 w-4" />
            {language === "zh-CN" ? "新建事件" : "Add Event"}
          </button>
        }
      >
        <div className="space-y-4">
          {isCreateOpen ? (
            <div className="rounded-[24px] border border-[color:var(--accent-border)] bg-[color:var(--panel-muted)] p-5">
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "事件标题" : "Event title"}</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                  />
                </label>
                <label className="grid gap-2">
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
                    setTitle("");
                    setDescription("");
                    setDueAt("");
                    setIsCreateOpen(false);
                  }}
                  className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-5 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
                >
                  {language === "zh-CN" ? "取消" : "Cancel"}
                </button>
              </div>
            </div>
          ) : null}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[color:var(--text-strong)]">{task.title}</p>
                  {task.description ? <p className="mt-2 text-sm text-[color:var(--text-soft)]">{task.description}</p> : null}
                </div>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">{task.priority}</span>
              </div>
              <p className="mt-4 text-sm text-[color:var(--text-soft)]">{formatDate(task.dueAt || task.remindAt, language)}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => completeTask(task.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--accent-shadow)]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {language === "zh-CN" ? "点掉" : "Done"}
                </button>
                <Link
                  to={`/events/task/${task.id}`}
                  className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-2 text-xs font-semibold text-[color:var(--text-strong)] transition hover:border-[color:var(--accent-border)]"
                >
                  {language === "zh-CN" ? "点进来编辑这个事件" : "Open to edit this task"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
