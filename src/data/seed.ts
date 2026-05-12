import type { Category, MoneyRecord, Person, Task, UserSettings } from "@/types/models";

const userId = "solo-user";
const now = "2026-05-12T09:00:00.000Z";

export const defaultSettings: UserSettings = {
  language: "zh-CN",
  themeMode: "light",
  themeColor: "forest",
  fontSize: "medium",
  notificationsEnabled: true,
};

export const categories: Category[] = [
  { id: "events", userId, name: "事件", type: "event_root", parentId: null, sortOrder: 1, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "study", userId, name: "学业", type: "event_group", parentId: "events", sortOrder: 1, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "career", userId, name: "事业", type: "event_group", parentId: "events", sortOrder: 2, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "life", userId, name: "生活", type: "event_group", parentId: "events", sortOrder: 3, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "social", userId, name: "人际", type: "social_root", parentId: null, sortOrder: 2, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "family", userId, name: "家人", type: "social_group", parentId: "social", sortOrder: 1, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "friends", userId, name: "朋友", type: "social_group", parentId: "social", sortOrder: 2, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "online", userId, name: "网友", type: "social_group", parentId: "social", sortOrder: 3, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "money", userId, name: "资金", type: "money_root", parentId: null, sortOrder: 3, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "income", userId, name: "收入", type: "money_group", parentId: "money", sortOrder: 1, pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "expense", userId, name: "支出", type: "money_group", parentId: "money", sortOrder: 2, pendingCount: 0, createdAt: now, updatedAt: now },
];

export const persons: Person[] = [
  { id: "mom", userId, categoryId: "family", name: "妈妈", nickname: "Mom", relationType: "family", birthday: "2026-05-13T09:00:00.000Z", note: "喜欢提前准备礼物", lastContactAt: "2026-05-11T12:00:00.000Z", contactPreference: "重要日子提前提醒", pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "dad", userId, categoryId: "family", name: "爸爸", relationType: "family", anniversary: "2026-05-20T10:00:00.000Z", note: "关心体检安排", lastContactAt: "2026-05-10T14:00:00.000Z", contactPreference: "周末联系", pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "sister", userId, categoryId: "family", name: "姐姐", relationType: "family", note: "近期没有待办", lastContactAt: "2026-05-08T11:00:00.000Z", pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "xiaolin", userId, categoryId: "friends", name: "小林", relationType: "friends", note: "借了我一本书", lastContactAt: "2026-05-09T18:00:00.000Z", contactPreference: "每周跟进", pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "ajie", userId, categoryId: "friends", name: "阿杰", relationType: "friends", note: "合作资料待确认", lastContactAt: "2026-05-07T08:30:00.000Z", pendingCount: 0, createdAt: now, updatedAt: now },
  { id: "net-a", userId, categoryId: "online", name: "网友 A", relationType: "online", note: "合作消息待回复", lastContactAt: "2026-05-10T20:20:00.000Z", pendingCount: 0, createdAt: now, updatedAt: now },
];

export const tasks: Task[] = [
  { id: "t-study-1", userId, title: "准备英语考试大纲", moduleType: "event", categoryId: "study", status: "pending", priority: "high", timeType: "exact_time", dueAt: "2026-05-13T08:00:00.000Z", remindAt: "2026-05-12T22:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-study-2", userId, title: "提交课程作业", moduleType: "event", categoryId: "study", status: "pending", priority: "medium", timeType: "exact_time", dueAt: "2026-05-14T15:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-career-1", userId, title: "更新项目简历", moduleType: "event", categoryId: "career", status: "pending", priority: "high", timeType: "range_time", dueAt: "2026-05-15T12:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-life-1", userId, title: "预约体检", moduleType: "event", categoryId: "life", status: "pending", priority: "medium", timeType: "relative_time", dueAt: "2026-05-18T09:30:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-mom-1", userId, title: "提醒买生日蛋糕", moduleType: "social", categoryId: "family", personId: "mom", status: "pending", priority: "high", timeType: "exact_time", dueAt: "2026-05-13T10:00:00.000Z", remindAt: "2026-05-12T18:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-mom-2", userId, title: "帮忙预约体检", moduleType: "social", categoryId: "family", personId: "mom", status: "pending", priority: "medium", timeType: "range_time", dueAt: "2026-05-20T09:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-dad-1", userId, title: "周末打电话确认体检", moduleType: "social", categoryId: "family", personId: "dad", status: "pending", priority: "medium", timeType: "exact_time", dueAt: "2026-05-17T10:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-xiaolin-1", userId, title: "提醒还书", moduleType: "social", categoryId: "friends", personId: "xiaolin", status: "pending", priority: "medium", timeType: "exact_time", dueAt: "2026-05-13T16:30:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-ajie-1", userId, title: "发合作资料", moduleType: "social", categoryId: "friends", personId: "ajie", status: "pending", priority: "high", timeType: "exact_time", dueAt: "2026-05-12T15:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-ajie-2", userId, title: "确认聚餐时间", moduleType: "social", categoryId: "friends", personId: "ajie", status: "completed", priority: "low", timeType: "exact_time", dueAt: "2026-05-11T18:00:00.000Z", isDeleted: false, completedAt: "2026-05-11T19:00:00.000Z", createdAt: now, updatedAt: now },
  { id: "t-net-1", userId, title: "回复合作消息", moduleType: "social", categoryId: "online", personId: "net-a", status: "pending", priority: "high", timeType: "exact_time", dueAt: "2026-05-14T09:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
  { id: "t-net-2", userId, title: "整理线上交流纪要", moduleType: "social", categoryId: "online", personId: "net-a", status: "pending", priority: "medium", timeType: "range_time", dueAt: "2026-05-16T11:00:00.000Z", isDeleted: false, createdAt: now, updatedAt: now },
];

export const moneyRecords: MoneyRecord[] = [
  { id: "m-income-1", userId, type: "income", amount: 3200, currency: "CNY", title: "项目结算", occurredAt: "2026-05-05T10:00:00.000Z", relatedCategoryId: "income", createdAt: now, updatedAt: now },
  { id: "m-expense-1", userId, type: "expense", amount: 268, currency: "CNY", title: "给妈妈买礼物", note: "生日礼物预算", occurredAt: "2026-05-12T09:30:00.000Z", relatedTaskId: "t-mom-1", relatedPersonId: "mom", relatedCategoryId: "expense", createdAt: now, updatedAt: now },
  { id: "m-expense-2", userId, type: "expense", amount: 1299, currency: "CNY", title: "课程报名", occurredAt: "2026-05-09T08:00:00.000Z", relatedTaskId: "t-study-1", relatedCategoryId: "expense", createdAt: now, updatedAt: now },
];
