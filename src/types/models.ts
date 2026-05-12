export type Language = "zh-CN" | "en-US";
export type ThemeMode = "light" | "dark";
export type ThemeColor =
  | "forest"
  | "ocean"
  | "apricot"
  | "mist"
  | "lavender"
  | "rose"
  | "amber";
export type FontSize = "small" | "medium" | "large";

export type CategoryType =
  | "event_root"
  | "event_group"
  | "social_root"
  | "social_group"
  | "money_root"
  | "money_group";

export type TaskStatus = "pending" | "completed" | "cancelled";
export type TaskTimeType = "exact_time" | "relative_time" | "long_term" | "range_time";
export type TaskModuleType = "event" | "social";
export type MoneyType = "income" | "expense";

export interface UserSettings {
  language: Language;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  fontSize: FontSize;
  notificationsEnabled: boolean;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  sortOrder: number;
  icon?: string;
  color?: string;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  relationType: "family" | "friends" | "online";
  birthday?: string;
  anniversary?: string;
  note?: string;
  lastContactAt?: string;
  contactPreference?: string;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  moduleType: TaskModuleType;
  categoryId: string;
  personId?: string;
  moneyRecordId?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  timeType: TaskTimeType;
  dueAt?: string;
  startAt?: string;
  remindAt?: string;
  isDeleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyRecord {
  id: string;
  userId: string;
  type: MoneyType;
  amount: number;
  currency: string;
  title: string;
  note?: string;
  occurredAt: string;
  relatedTaskId?: string;
  relatedPersonId?: string;
  relatedCategoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDaySummary {
  date: string;
  eventCount: number;
  heatLevel: number;
  items: Array<{
    taskId: string;
    title: string;
    moduleType: TaskModuleType;
    categoryName: string;
    personName?: string;
    status: TaskStatus;
    dueAt?: string;
  }>;
}

export interface LifeDeskData {
  settings: UserSettings;
  categories: Category[];
  persons: Person[];
  tasks: Task[];
  moneyRecords: MoneyRecord[];
}
