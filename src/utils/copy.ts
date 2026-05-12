import type { FontSize, Language, ThemeColor, ThemeMode } from "@/types/models";

type LocalizedText = Record<Language, string>;

export const t = (language: Language, value: LocalizedText) => value[language];

export const navCopy = {
  events: { "zh-CN": "事件", "en-US": "Events" },
  calendar: { "zh-CN": "日历", "en-US": "Calendar" },
  social: { "zh-CN": "人际", "en-US": "Social" },
  money: { "zh-CN": "资金", "en-US": "Money" },
  settings: { "zh-CN": "设置", "en-US": "Settings" },
  userName: { "zh-CN": "你的工作台", "en-US": "Your Desk" },
};

export const eventLabels: Record<string, LocalizedText> = {
  study: { "zh-CN": "学业", "en-US": "Study" },
  career: { "zh-CN": "事业", "en-US": "Career" },
  life: { "zh-CN": "生活", "en-US": "Life" },
};

export const relationLabels: Record<string, LocalizedText> = {
  family: { "zh-CN": "家人", "en-US": "Family" },
  friends: { "zh-CN": "朋友", "en-US": "Friends" },
  online: { "zh-CN": "网友", "en-US": "Online" },
};

export const moneyLabels: Record<string, LocalizedText> = {
  income: { "zh-CN": "收入", "en-US": "Income" },
  expense: { "zh-CN": "支出", "en-US": "Expense" },
};

export const themeModeLabels: Record<ThemeMode, LocalizedText> = {
  light: { "zh-CN": "亮色", "en-US": "Light" },
  dark: { "zh-CN": "暗色", "en-US": "Dark" },
};

export const fontSizeLabels: Record<FontSize, LocalizedText> = {
  small: { "zh-CN": "小", "en-US": "Small" },
  medium: { "zh-CN": "中", "en-US": "Medium" },
  large: { "zh-CN": "大", "en-US": "Large" },
};

export const themeColorLabels: Record<ThemeColor, LocalizedText> = {
  forest: { "zh-CN": "森林绿", "en-US": "Forest" },
  ocean: { "zh-CN": "海盐蓝", "en-US": "Ocean" },
  apricot: { "zh-CN": "暖杏橙", "en-US": "Apricot" },
  mist: { "zh-CN": "雾霭灰", "en-US": "Mist" },
  lavender: { "zh-CN": "薰衣草紫", "en-US": "Lavender" },
  rose: { "zh-CN": "玫瑰粉", "en-US": "Rose" },
  amber: { "zh-CN": "琥珀黄", "en-US": "Amber" },
};

export const sharedCopy = {
  addPerson: { "zh-CN": "新增人物", "en-US": "Add Person" },
  addTask: { "zh-CN": "新增事务", "en-US": "Add Task" },
  doneAndClear: { "zh-CN": "完成并清除", "en-US": "Complete" },
  currentTodo: { "zh-CN": "当前待办", "en-US": "Open Tasks" },
  completed: { "zh-CN": "已完成事项", "en-US": "Completed" },
  recentReminder: { "zh-CN": "近期提醒", "en-US": "Upcoming Reminders" },
  socialBoard: { "zh-CN": "人际看板", "en-US": "People Board" },
  peopleNeedAttention: { "zh-CN": "当前最需要处理的人", "en-US": "People Needing Attention" },
  noPending: { "zh-CN": "暂无待办", "en-US": "No pending tasks" },
  recentTask: { "zh-CN": "最近待办", "en-US": "Latest task" },
  totalPending: { "zh-CN": "未完成事项", "en-US": "Pending" },
  thisWeek: { "zh-CN": "本周", "en-US": "This Week" },
  thisMonth: { "zh-CN": "本月", "en-US": "This Month" },
  today: { "zh-CN": "今天", "en-US": "Today" },
  viewAll: { "zh-CN": "查看全部", "en-US": "View all" },
  all: { "zh-CN": "全部", "en-US": "All" },
  onlyPendingPeople: { "zh-CN": "只看有待办人物", "en-US": "Pending only" },
  language: { "zh-CN": "语言", "en-US": "Language" },
  themeMode: { "zh-CN": "主题模式", "en-US": "Theme mode" },
  fontSize: { "zh-CN": "字体大小", "en-US": "Font size" },
  themeColor: { "zh-CN": "主题颜色", "en-US": "Theme color" },
  notifications: { "zh-CN": "通知提醒", "en-US": "Notifications" },
  currentDayEvents: { "zh-CN": "当日事件", "en-US": "Daily Events" },
  noEvents: { "zh-CN": "当天没有事件。", "en-US": "No events for this day." },
};
