import { ArrowUpRight, BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getMoneyRecordsSorted, getMoneySummary, getPersonById } from "@/store/useLifeDeskStore";
import { moneyLabels, t } from "@/utils/copy";
import { formatShortDate } from "@/utils/date";

export default function MoneyPage() {
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const summary = getMoneySummary(snapshot);
  const records = getMoneyRecordsSorted(snapshot);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <section className="grid gap-6 xl:grid-cols-3">
        <Panel title={t(language, moneyLabels.income)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold text-emerald-600">¥{summary.income}</p>
              <p className="mt-2 text-sm text-[color:var(--text-soft)]">{language === "zh-CN" ? "本月累计" : "This month"}</p>
            </div>
            <BanknoteArrowUp className="h-6 w-6 text-emerald-600" />
          </div>
        </Panel>
        <Panel title={t(language, moneyLabels.expense)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold text-rose-500">¥{summary.expense}</p>
              <p className="mt-2 text-sm text-[color:var(--text-soft)]">{language === "zh-CN" ? "本月累计" : "This month"}</p>
            </div>
            <BanknoteArrowDown className="h-6 w-6 text-rose-500" />
          </div>
        </Panel>
        <Panel title={language === "zh-CN" ? "余额感知" : "Balance"}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold text-[color:var(--text-strong)]">¥{summary.balance}</p>
              <p className="mt-2 text-sm text-[color:var(--text-soft)]">{language === "zh-CN" ? "收入减支出" : "Income minus expense"}</p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-[color:var(--accent)]" />
          </div>
        </Panel>
      </section>

      <Panel title={language === "zh-CN" ? "近期资金流" : "Recent Flow"} subtitle={language === "zh-CN" ? "这里专门看资金，不和事件模块混在一起。" : "Money gets its own lane instead of blending into events."}>
        <div className="space-y-3">
          {records.map((record) => {
            const relatedPerson = record.relatedPersonId ? getPersonById(snapshot, record.relatedPersonId) : undefined;
            return (
              <Link key={record.id} to={`/money/${record.id}`} className="block rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4 transition hover:border-[color:var(--accent-border)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-strong)]">{record.title}</p>
                    <p className="mt-2 text-sm text-[color:var(--text-soft)]">
                      {relatedPerson ? `${language === "zh-CN" ? "关联人物" : "Linked person"}：${relatedPerson.name}` : formatShortDate(record.occurredAt, language)}
                    </p>
                  </div>
                  <span className={record.type === "income" ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-rose-500"}>
                    {record.type === "income" ? "+" : "-"}¥{record.amount}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
