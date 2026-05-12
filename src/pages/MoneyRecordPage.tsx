import { useParams } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getPersonById, getRecordById } from "@/store/useLifeDeskStore";
import { formatDate } from "@/utils/date";

export default function MoneyRecordPage() {
  const { recordId = "m-expense-1" } = useParams();
  const language = useLifeDeskStore((state) => state.settings.language);
  const snapshot = useLifeDeskSnapshot();
  const record = getRecordById(snapshot, recordId);

  if (!record) {
    return null;
  }

  const person = record.relatedPersonId ? getPersonById(snapshot, record.relatedPersonId) : undefined;

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <Panel title={language === "zh-CN" ? "资金记录详情" : "Money Record"} subtitle={record.title}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">{language === "zh-CN" ? "金额" : "Amount"}</p>
            <p className={record.type === "income" ? "mt-4 text-4xl font-semibold text-emerald-600" : "mt-4 text-4xl font-semibold text-rose-500"}>
              {record.type === "income" ? "+" : "-"}¥{record.amount}
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5 text-sm text-[color:var(--text-soft)]">
            <p>{language === "zh-CN" ? "类型" : "Type"}：{record.type}</p>
            <p className="mt-3">{language === "zh-CN" ? "时间" : "Date"}：{formatDate(record.occurredAt, language)}</p>
            <p className="mt-3">{language === "zh-CN" ? "关联人物" : "Linked Person"}：{person?.name || (language === "zh-CN" ? "无" : "None")}</p>
            <p className="mt-3">{language === "zh-CN" ? "备注" : "Note"}：{record.note || (language === "zh-CN" ? "无" : "None")}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
