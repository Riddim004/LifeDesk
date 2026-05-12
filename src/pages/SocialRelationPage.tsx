import { Link, useParams } from "react-router-dom";
import { CountBadge } from "@/components/common/CountBadge";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getPeopleByRelation, getPendingCountByPerson, getNextTaskForPerson } from "@/store/useLifeDeskStore";
import { relationLabels, sharedCopy, t } from "@/utils/copy";
import { formatShortDate } from "@/utils/date";

export default function SocialRelationPage() {
  const { relationId = "family" } = useParams();
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const people = getPeopleByRelation(snapshot, relationId);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <Panel
        title={`${language === "zh-CN" ? "关系分类" : "Relation Group"} · ${t(language, relationLabels[relationId])}`}
        subtitle={language === "zh-CN" ? "这一页像聊天列表一样，核心问题是：谁还有事没处理。" : "Think of this page like a chat list: who still has open loops?"}
      >
        <div className="space-y-3">
          {people.map((person) => {
            const pendingCount = getPendingCountByPerson(snapshot, person.id);
            const nextTask = getNextTaskForPerson(snapshot, person.id);
            return (
              <Link
                key={person.id}
                to={`/social/person/${person.id}`}
                className="block rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4 transition hover:border-[color:var(--accent-border)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent)]">{person.name.slice(0, 1)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--text-strong)]">{person.name}</p>
                      <p className="mt-2 truncate text-sm text-[color:var(--text-soft)]">
                        {nextTask ? `${nextTask.title}` : t(language, sharedCopy.noPending)}
                      </p>
                      <p className="mt-2 text-xs text-[color:var(--text-faint)]">
                        {nextTask?.dueAt ? formatShortDate(nextTask.dueAt, language) : ""}
                      </p>
                    </div>
                  </div>
                  <CountBadge value={pendingCount} />
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
