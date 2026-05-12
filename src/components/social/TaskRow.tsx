import { CheckCircle2, Clock3 } from "lucide-react";
import type { Language, Task } from "@/types/models";
import { formatDate } from "@/utils/date";

interface TaskRowProps {
  task: Task;
  language: Language;
  onComplete?: (taskId: string) => void;
}

export function TaskRow({ task, language, onComplete }: TaskRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--text-strong)]">{task.title}</p>
        {task.description ? <p className="mt-2 text-sm text-[color:var(--text-soft)]">{task.description}</p> : null}
        <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--text-faint)]">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{formatDate(task.dueAt || task.remindAt, language)}</span>
        </div>
      </div>
      {onComplete ? (
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--accent-shadow)] transition hover:scale-[1.02]"
        >
          <CheckCircle2 className="h-4 w-4" />
          {language === "zh-CN" ? "点掉" : "Done"}
        </button>
      ) : null}
    </div>
  );
}
