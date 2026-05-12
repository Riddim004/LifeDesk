import { MessageCircleMore } from "lucide-react";
import { Link } from "react-router-dom";
import { CountBadge } from "@/components/common/CountBadge";
import type { Language, Person, Task } from "@/types/models";
import { formatShortDate } from "@/utils/date";
import { relationLabels, sharedCopy, t } from "@/utils/copy";

interface PersonCardProps {
  person: Person;
  pendingCount: number;
  language: Language;
  latestTask?: Task;
  compact?: boolean;
}

export function PersonCard({ person, pendingCount, language, latestTask, compact = false }: PersonCardProps) {
  return (
    <Link
      to={`/social/person/${person.id}`}
      className="group flex items-center gap-4 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent-border)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.06)]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-lg font-semibold text-[color:var(--accent)]">
        {person.name.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[color:var(--text-strong)]">{person.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[color:var(--text-soft)]">{t(language, relationLabels[person.categoryId])}</p>
          </div>
          <CountBadge value={pendingCount} />
        </div>
        <div className="mt-3 flex items-start justify-between gap-3 text-sm text-[color:var(--text-soft)]">
          <div className="min-w-0 flex-1">
            <p className="truncate">{latestTask ? `${t(language, sharedCopy.recentTask)}：${latestTask.title}` : t(language, sharedCopy.noPending)}</p>
            {!compact && latestTask?.dueAt ? <p className="mt-1 text-xs text-[color:var(--text-faint)]">{formatShortDate(latestTask.dueAt, language)}</p> : null}
          </div>
          <MessageCircleMore className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--text-faint)] transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
