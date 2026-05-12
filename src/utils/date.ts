import type { CalendarDaySummary, Language, Task } from "@/types/models";

const pad = (value: number) => String(value).padStart(2, "0");

export function toDateKey(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDate(input: string | undefined, language: Language) {
  if (!input) {
    return language === "zh-CN" ? "未设置" : "Not set";
  }

  return new Intl.DateTimeFormat(language === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(input));
}

export function formatShortDate(input: string | undefined, language: Language) {
  if (!input) {
    return language === "zh-CN" ? "待定" : "TBD";
  }

  return new Intl.DateTimeFormat(language === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}

export function compareByDate(a?: string, b?: string) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

export function getTaskEventDate(task: Task) {
  return task.remindAt || task.dueAt || task.startAt;
}

export function buildCalendarSummary(
  tasks: Task[],
  categoryNameById: Record<string, string>,
  personNameById: Record<string, string>,
  filter: "all" | "event" | "social" | "money" = "all",
  totalDays = 126,
): CalendarDaySummary[] {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - totalDays + 1);

  const byDay = new Map<string, Task[]>();

  tasks
    .filter((task) => !task.isDeleted)
    .filter((task) => {
      if (filter === "all") return true;
      if (filter === "event") return task.moduleType === "event";
      if (filter === "social") return task.moduleType === "social";
      return Boolean(task.moneyRecordId);
    })
    .forEach((task) => {
      const eventDate = getTaskEventDate(task);
      if (!eventDate) return;
      const key = toDateKey(eventDate);
      const current = byDay.get(key) || [];
      current.push(task);
      byDay.set(key, current);
    });

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const items = (byDay.get(key) || [])
      .sort((left, right) => compareByDate(getTaskEventDate(left), getTaskEventDate(right)))
      .map((task) => ({
        taskId: task.id,
        title: task.title,
        moduleType: task.moduleType,
        categoryName: categoryNameById[task.categoryId] || "",
        personName: task.personId ? personNameById[task.personId] : undefined,
        status: task.status,
        dueAt: getTaskEventDate(task),
      }));
    const count = items.length;

    return {
      date: key,
      eventCount: count,
      heatLevel: count === 0 ? 0 : count === 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 3 : 4,
      items,
    };
  });
}

export function groupByWeeks(days: CalendarDaySummary[]) {
  const weeks: CalendarDaySummary[][] = [];

  days.forEach((day, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }
    weeks[weekIndex].push(day);
  });

  return weeks;
}
