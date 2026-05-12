import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getCategoryById, getTaskById } from "@/store/useLifeDeskStore";
import { eventLabels, t } from "@/utils/copy";
import { formatDate } from "@/utils/date";

export default function EventTaskPage() {
  const { taskId = "" } = useParams();
  const navigate = useNavigate();
  const language = useLifeDeskStore((state) => state.settings.language);
  const updateTask = useLifeDeskStore((state) => state.updateTask);
  const completeTask = useLifeDeskStore((state) => state.completeTask);
  const snapshot = useLifeDeskSnapshot();
  const task = getTaskById(snapshot, taskId);
  const category = task ? getCategoryById(snapshot, task.categoryId) : undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");
  const [dueAt, setDueAt] = useState("");

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setStatus(task.status);
    setDueAt(task.dueAt ? task.dueAt.slice(0, 16) : "");
  }, [task]);

  const categoryLabel = useMemo(() => {
    if (!task) {
      return "";
    }

    if (task.categoryId in eventLabels) {
      return t(language, eventLabels[task.categoryId]);
    }

    return category?.name || task.categoryId;
  }, [category?.name, language, task]);

  if (!task) {
    return (
      <div className="flex h-full flex-col gap-6 overflow-auto">
        <Panel
          title={language === "zh-CN" ? "未找到事件" : "Task Not Found"}
          subtitle={language === "zh-CN" ? "这个事件不存在，可能已经被删除。" : "This task does not exist or has been removed."}
        >
          <p className="text-sm text-[color:var(--text-soft)]">{language === "zh-CN" ? "请返回事件分类页重新选择。" : "Please return to the category view and select another task."}</p>
        </Panel>
      </div>
    );
  }

  const handleSave = () => {
    updateTask(task.id, {
      title,
      description,
      priority,
      status,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      remindAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title={language === "zh-CN" ? "事件详情与编辑" : "Event Task Editor"}
          subtitle={
            language === "zh-CN"
              ? "这里可以修改已有事件的标题、说明、优先级、状态和时间。"
              : "Edit title, notes, priority, status, and timing here."
          }
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "标题" : "Title"}</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "说明" : "Description"}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "优先级" : "Priority"}</span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as typeof priority)}
                  className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                >
                  <option value="low">{language === "zh-CN" ? "低" : "Low"}</option>
                  <option value="medium">{language === "zh-CN" ? "中" : "Medium"}</option>
                  <option value="high">{language === "zh-CN" ? "高" : "High"}</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "状态" : "Status"}</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                >
                  <option value="pending">{language === "zh-CN" ? "待处理" : "Pending"}</option>
                  <option value="completed">{language === "zh-CN" ? "已完成" : "Completed"}</option>
                  <option value="cancelled">{language === "zh-CN" ? "已取消" : "Cancelled"}</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "截止时间" : "Due time"}</span>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                  className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  completeTask(task.id);
                  navigate(`/events/${task.categoryId}`);
                }}
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
              >
                {language === "zh-CN" ? "点掉这个事件" : "Complete and Clear"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-5 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
              >
                {language === "zh-CN" ? "保存修改" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/events/${task.categoryId}`)}
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-5 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
              >
                {language === "zh-CN" ? "返回分类页" : "Back to Category"}
              </button>
            </div>
          </div>
        </Panel>

        <Panel
          title={language === "zh-CN" ? "当前事件摘要" : "Current Summary"}
          subtitle={language === "zh-CN" ? "右侧保持只读摘要，方便你边看边改。" : "A readable summary stays visible while you edit."}
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5 text-sm text-[color:var(--text-soft)]">
            <p>
              <span className="font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "分类" : "Category"}：</span>
              {categoryLabel}
            </p>
            <p>
              <span className="font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "当前标题" : "Current Title"}：</span>
              {task.title}
            </p>
            <p>
              <span className="font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "当前状态" : "Current Status"}：</span>
              {task.status}
            </p>
            <p>
              <span className="font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "当前时间" : "Current Time"}：</span>
              {formatDate(task.dueAt || task.remindAt, language)}
            </p>
            <p className="rounded-[18px] bg-[color:var(--canvas)] px-4 py-4 leading-7">
              {description || task.description || (language === "zh-CN" ? "还没有填写说明。" : "No description yet.")}
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
