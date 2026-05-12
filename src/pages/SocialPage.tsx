import { BellDot, ChevronRight, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CountBadge } from "@/components/common/CountBadge";
import { Panel } from "@/components/common/Panel";
import { PersonCard } from "@/components/social/PersonCard";
import { useLifeDeskSnapshot, useLifeDeskStore, getPeopleBoard, getSocialGroups, getUpcomingReminders, getPendingCountByRelation } from "@/store/useLifeDeskStore";
import { relationLabels, sharedCopy, t } from "@/utils/copy";

export default function SocialPage() {
  const navigate = useNavigate();
  const language = useLifeDeskStore((state) => state.settings.language);
  const createPerson = useLifeDeskStore((state) => state.createPerson);
  const snapshot = useLifeDeskSnapshot();
  const relationGroups = getSocialGroups(snapshot);
  const peopleBoard = getPeopleBoard(snapshot);
  const reminders = getUpcomingReminders(snapshot);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [relationId, setRelationId] = useState<"family" | "friends" | "online">("family");
  const [note, setNote] = useState("");

  const resetForm = () => {
    setName("");
    setNickname("");
    setRelationId("family");
    setNote("");
  };

  const handleCreatePerson = () => {
    if (!name.trim()) {
      return;
    }

    createPerson({
      categoryId: relationId,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      note: note.trim() || undefined,
    });

    resetForm();
    setIsCreateOpen(false);
    navigate(`/social/${relationId}`);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={language === "zh-CN" ? "人际" : "Social"}
          subtitle={language === "zh-CN" ? "先看到谁，再进入这个人身上的事情。" : "See who needs you first, then enter that person's open threads."}
          actions={
            <button
              type="button"
              onClick={() => setIsCreateOpen((current) => !current)}
              className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
            >
              {t(language, sharedCopy.addPerson)}
            </button>
          }
        >
          <div className="grid gap-4">
            {isCreateOpen ? (
              <div className="rounded-[24px] border border-[color:var(--accent-border)] bg-[color:var(--panel-muted)] p-5 shadow-[0_16px_32px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "新增人物" : "Create Person"}</h3>
                    <p className="mt-2 text-sm text-[color:var(--text-soft)]">
                      {language === "zh-CN" ? "填写后会直接进入对应关系分类页。" : "After saving, you will jump into the selected relation group."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(false);
                    }}
                    className="rounded-full bg-[color:var(--canvas)] p-2 text-[color:var(--text-soft)]"
                    aria-label={language === "zh-CN" ? "关闭新增人物表单" : "Close create person form"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "人物名称" : "Name"}</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={language === "zh-CN" ? "例如：表姐、小王、网友 A" : "For example: Emma, Leo, Online Friend A"}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "昵称" : "Nickname"}</span>
                    <input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder={language === "zh-CN" ? "可选" : "Optional"}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "关系分类" : "Relation Group"}</span>
                    <select
                      value={relationId}
                      onChange={(event) => setRelationId(event.target.value as typeof relationId)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    >
                      <option value="family">{t(language, relationLabels.family)}</option>
                      <option value="friends">{t(language, relationLabels.friends)}</option>
                      <option value="online">{t(language, relationLabels.online)}</option>
                    </select>
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "备注" : "Note"}</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      placeholder={language === "zh-CN" ? "例如：最近要提醒他什么，或者这个人的特点" : "For example: what to remember about this person"}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCreatePerson}
                    className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
                  >
                    {language === "zh-CN" ? "保存并进入" : "Save and Open"}
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
            {relationGroups.map((group) => {
              const count = getPendingCountByRelation(snapshot, group.id);
              return (
                <Link
                  key={group.id}
                  to={`/social/${group.id}`}
                  className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent-border)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-soft)]">{language === "zh-CN" ? "关系分类" : "Relation"}</p>
                      <h3 className="mt-4 text-2xl font-semibold text-[color:var(--text-strong)]">{t(language, relationLabels[group.id])}</h3>
                    </div>
                    <CountBadge value={count} />
                  </div>
                  <div className="mt-8 flex items-center justify-between text-sm text-[color:var(--text-soft)]">
                    <span>{count} {t(language, sharedCopy.totalPending)}</span>
                    <ChevronRight className="h-4 w-4 text-[color:var(--accent)]" />
                  </div>
                </Link>
              );
            })}
            </div>
          </div>
        </Panel>

        <Panel title={t(language, sharedCopy.recentReminder)} subtitle={language === "zh-CN" ? "提醒依旧保留，但入口仍然以人物为主。" : "Reminders stay visible, but the entry remains people-first."}>
          <div className="space-y-3">
            {reminders.map((entry) => (
              <div key={entry.person.id} className="rounded-[22px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
                <div className="flex items-start gap-3">
                  <BellDot className="mt-1 h-4 w-4 text-[color:var(--accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-strong)]">{entry.person.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--text-soft)]">{entry.latestTask?.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title={t(language, sharedCopy.socialBoard)} subtitle={t(language, sharedCopy.peopleNeedAttention)}>
        <div className="grid gap-4 xl:grid-cols-2">
          {peopleBoard.map((entry) => (
            <PersonCard
              key={entry.person.id}
              person={entry.person}
              pendingCount={entry.pendingCount}
              latestTask={entry.latestTask}
              language={language}
            />
          ))}
        </div>
      </Panel>

      <Panel title={language === "zh-CN" ? "关系摘要" : "Relationship Summary"} subtitle={language === "zh-CN" ? "人际模块永远围绕‘谁有事’展开。" : "The social module always revolves around who needs attention."}>
        <div className="grid gap-4 md:grid-cols-3">
          {relationGroups.map((group) => {
            const count = getPendingCountByRelation(snapshot, group.id);
            return (
              <div key={group.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-[color:var(--accent)]" />
                  <span className="font-medium text-[color:var(--text-strong)]">{t(language, relationLabels[group.id])}</span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-[color:var(--text-strong)]">{count}</p>
                <p className="mt-2 text-sm text-[color:var(--text-soft)]">{t(language, sharedCopy.totalPending)}</p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
