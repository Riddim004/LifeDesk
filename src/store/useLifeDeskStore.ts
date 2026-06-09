import { useMemo } from "react";
import { create } from "zustand";
import { categories, defaultSettings, moneyRecords, persons, tasks } from "@/data/seed";
import { backendApi } from "@/lib/api";
import type { Category, LifeDeskData, MoneyRecord, Person, Task, ThemeColor, ThemeMode, UserSettings } from "@/types/models";
import { compareByDate, getTaskEventDate } from "@/utils/date";

interface LifeDeskState {
  settings: UserSettings;
  categories: Category[];
  persons: Person[];
  tasks: Task[];
  moneyRecords: MoneyRecord[];
  backendReady: boolean;
  backendError: string | null;
  syncError: string | null;
  initialize: () => Promise<void>;
  clearSyncError: () => void;
  setLanguage: (language: UserSettings["language"]) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  setFontSize: (size: UserSettings["fontSize"]) => Promise<void>;
  setNotificationsEnabled: (value: boolean) => Promise<void>;
  createPerson: (payload: {
    categoryId: "family" | "friends" | "online";
    name: string;
    nickname?: string;
    note?: string;
    birthday?: string;
    contactPreference?: string;
  }) => Promise<string | null>;
  createTask: (payload: {
    categoryId: string;
    personId?: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    dueAt?: string;
  }) => Promise<string | null>;
  completeTask: (taskId: string) => Promise<boolean>;
  updateTask: (taskId: string, payload: Partial<Pick<Task, "title" | "description" | "categoryId" | "personId" | "priority" | "status" | "dueAt" | "remindAt">>) => Promise<boolean>;
  resetDemo: () => Promise<void>;
}

export type DemoState = LifeDeskData;

export const createEmptyState = (): DemoState => ({
  settings: structuredClone(defaultSettings),
  categories: structuredClone(categories),
  persons: [],
  tasks: [],
  moneyRecords: [],
});

export const createDemoState = (): DemoState => ({
  settings: structuredClone(defaultSettings),
  categories: structuredClone(categories),
  persons: structuredClone(persons),
  tasks: structuredClone(tasks),
  moneyRecords: structuredClone(moneyRecords),
});

const baseState = createEmptyState();

const getSyncErrorMessage = (language: UserSettings["language"]) =>
  language === "zh-CN"
    ? "本次修改没有成功保存到本地数据库，请确认启动程序仍在运行。"
    : "This change was not saved to the local database. Make sure the launcher is still running.";

export const useLifeDeskStore = create<LifeDeskState>((set, get) => ({
  ...createEmptyState(),
  backendReady: false,
  backendError: null,
  syncError: null,
  initialize: async () => {
    try {
      const data = await backendApi.getBootstrap();
      set({
        ...data,
        backendReady: true,
        backendError: null,
        syncError: null,
      });
    } catch (error) {
      set({
        backendReady: false,
        backendError: error instanceof Error ? error.message : "bootstrap_failed",
      });
    }
  },
  clearSyncError: () => {
    set({ syncError: null });
  },
  setLanguage: async (language) => {
    const state = get();
    if (!state.backendReady) {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return;
    }

    try {
      const settings = await backendApi.updateSettings({ language });
      set({ settings, syncError: null });
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
    }
  },
  setThemeMode: async (themeMode) => {
    const state = get();
    if (!state.backendReady) {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return;
    }

    try {
      const settings = await backendApi.updateSettings({ themeMode });
      set({ settings, syncError: null });
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
    }
  },
  setThemeColor: async (themeColor) => {
    const state = get();
    if (!state.backendReady) {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return;
    }

    try {
      const settings = await backendApi.updateSettings({ themeColor });
      set({ settings, syncError: null });
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
    }
  },
  setFontSize: async (fontSize) => {
    const state = get();
    if (!state.backendReady) {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return;
    }

    try {
      const settings = await backendApi.updateSettings({ fontSize });
      set({ settings, syncError: null });
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
    }
  },
  setNotificationsEnabled: async (notificationsEnabled) => {
    const state = get();
    if (!state.backendReady) {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return;
    }

    try {
      const settings = await backendApi.updateSettings({ notificationsEnabled });
      set({ settings, syncError: null });
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
    }
  },
  createPerson: async (payload) => {
    const now = new Date().toISOString();
    const personId = `person-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextPerson: Person = {
      id: personId,
      userId: "solo-user",
      categoryId: payload.categoryId,
      name: payload.name,
      nickname: payload.nickname,
      relationType: payload.categoryId,
      note: payload.note,
      birthday: payload.birthday,
      contactPreference: payload.contactPreference,
      pendingCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const state = get();

    if (!state.backendReady) {
      set((current) => ({
        persons: [
          ...current.persons,
          nextPerson,
        ],
        syncError: null,
      }));
      return personId;
    }

    try {
      const savedPerson = await backendApi.createPerson({ id: personId, ...payload });
      set((current) => ({
        persons: [
          ...current.persons,
          savedPerson,
        ],
        syncError: null,
      }));
      return savedPerson.id;
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return null;
    }
  },
  createTask: async (payload) => {
    const now = new Date().toISOString();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextTask: Task = {
      id: taskId,
      userId: "solo-user",
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      personId: payload.personId,
      status: "pending",
      priority: payload.priority || "medium",
      timeType: payload.dueAt ? "exact_time" : "long_term",
      dueAt: payload.dueAt,
      remindAt: payload.dueAt,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const state = get();

    if (!state.backendReady) {
      set((current) => ({
        tasks: [
          ...current.tasks,
          nextTask,
        ],
        syncError: null,
      }));
      return taskId;
    }

    try {
      const savedTask = await backendApi.createTask({
        id: nextTask.id,
        title: nextTask.title,
        description: nextTask.description,
        categoryId: nextTask.categoryId,
        personId: nextTask.personId,
        status: nextTask.status,
        priority: nextTask.priority,
        timeType: nextTask.timeType,
        dueAt: nextTask.dueAt,
        remindAt: nextTask.remindAt,
        isDeleted: nextTask.isDeleted,
        completedAt: nextTask.completedAt,
        createdAt: nextTask.createdAt,
      });
      set((current) => ({
        tasks: [
          ...current.tasks,
          savedTask,
        ],
        syncError: null,
      }));
      return savedTask.id;
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return null;
    }
  },
  completeTask: async (taskId) => {
    const state = get();
    const completedAt = new Date().toISOString();

    if (!state.backendReady) {
      set((current) => ({
        tasks: current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "completed",
                isDeleted: true,
                completedAt,
                updatedAt: completedAt,
              }
            : task,
        ),
        syncError: null,
      }));
      return true;
    }

    try {
      const savedTask = await backendApi.completeTask(taskId);
      set((current) => ({
        tasks: current.tasks.map((task) => (task.id === taskId ? savedTask : task)),
        syncError: null,
      }));
      return true;
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return false;
    }
  },
  updateTask: async (taskId, payload) => {
    const state = get();
    const currentTask = state.tasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return false;
    }

    const nextStatus = payload.status ?? currentTask.status;
    const isCompleted = nextStatus === "completed";
    const nextTaskPayload: Partial<
      Pick<Task, "title" | "description" | "categoryId" | "personId" | "priority" | "status" | "dueAt" | "remindAt" | "isDeleted" | "completedAt">
    > = {
      ...payload,
      status: nextStatus,
      isDeleted: false,
      completedAt: isCompleted ? currentTask.completedAt ?? new Date().toISOString() : undefined,
    };

    if (!state.backendReady) {
      set((current) => ({
        tasks: current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...payload,
                status: nextStatus,
                isDeleted: false,
                completedAt: isCompleted ? task.completedAt ?? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
        syncError: null,
      }));
      return true;
    }

    try {
      const savedTask = await backendApi.updateTask(taskId, nextTaskPayload);
      set((current) => ({
        tasks: current.tasks.map((task) => (task.id === taskId ? savedTask : task)),
        syncError: null,
      }));
      return true;
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
      return false;
    }
  },
  resetDemo: async () => {
    const state = get();

    if (!state.backendReady) {
      set({
        ...createEmptyState(),
        syncError: null,
      });
      return;
    }

    try {
      const data = await backendApi.resetData();
      set({
        ...data,
        backendReady: true,
        backendError: null,
        syncError: null,
      });
    } catch {
      set({ syncError: getSyncErrorMessage(state.settings.language) });
    }
  },
}));

export const useLifeDeskSnapshot = (): DemoState => {
  const settings = useLifeDeskStore((state) => state.settings);
  const categories = useLifeDeskStore((state) => state.categories);
  const persons = useLifeDeskStore((state) => state.persons);
  const tasks = useLifeDeskStore((state) => state.tasks);
  const moneyRecords = useLifeDeskStore((state) => state.moneyRecords);

  return useMemo(
    () => ({ settings, categories, persons, tasks, moneyRecords }),
    [settings, categories, persons, tasks, moneyRecords],
  );
};

export const categoryNameById = (state: DemoState) =>
  Object.fromEntries(state.categories.map((category) => [category.id, category.name]));

export const personNameById = (state: DemoState) =>
  Object.fromEntries(state.persons.map((person) => [person.id, person.name]));

export const getSocialGroups = (state: DemoState) =>
  state.categories.filter((category) => category.type === "social_group").sort((left, right) => left.sortOrder - right.sortOrder);

export const getEventGroups = (state: DemoState) =>
  state.categories.filter((category) => category.type === "event_group").sort((left, right) => left.sortOrder - right.sortOrder);

export const getPendingTasksByPerson = (state: DemoState, personId: string) =>
  state.tasks
    .filter((task) => task.personId === personId && task.status === "pending" && !task.isDeleted)
    .sort((left, right) => compareByDate(getTaskEventDate(left), getTaskEventDate(right)));

export const getCompletedTasksByPerson = (state: DemoState, personId: string) =>
  state.tasks
    .filter((task) => task.personId === personId && task.status === "completed")
    .sort((left, right) => compareByDate(right.completedAt, left.completedAt));

export const getPendingCountByPerson = (state: DemoState, personId: string) =>
  getPendingTasksByPerson(state, personId).length;

export const getPendingCountByRelation = (state: DemoState, relationId: string) =>
  state.persons
    .filter((person) => person.categoryId === relationId)
    .reduce((total, person) => total + getPendingCountByPerson(state, person.id), 0);

export const getNextTaskForPerson = (state: DemoState, personId: string) => getPendingTasksByPerson(state, personId)[0];

export const getPeopleByRelation = (state: DemoState, relationId: string) =>
  state.persons
    .filter((person) => person.categoryId === relationId)
    .sort((left, right) => {
      const pendingGap = getPendingCountByPerson(state, right.id) - getPendingCountByPerson(state, left.id);
      if (pendingGap !== 0) return pendingGap;
      return left.name.localeCompare(right.name, "zh-CN");
    });

export const getPeopleBoard = (state: DemoState) =>
  state.persons
    .map((person) => ({
      person,
      pendingCount: getPendingCountByPerson(state, person.id),
      latestTask: getNextTaskForPerson(state, person.id),
    }))
    .filter((entry) => entry.pendingCount > 0)
    .sort((left, right) => {
      if (right.pendingCount !== left.pendingCount) {
        return right.pendingCount - left.pendingCount;
      }
      return compareByDate(getTaskEventDate(left.latestTask as Task), getTaskEventDate(right.latestTask as Task));
    });

export const getTasksByEventCategory = (state: DemoState, categoryId: string) =>
  state.tasks
    .filter((task) => task.categoryId === categoryId && !task.isDeleted)
    .sort((left, right) => compareByDate(getTaskEventDate(left), getTaskEventDate(right)));

export const getTaskById = (state: DemoState, taskId: string) => state.tasks.find((task) => task.id === taskId);

export const getEventPendingCount = (state: DemoState, categoryId: string) =>
  getTasksByEventCategory(state, categoryId).filter((task) => task.status === "pending").length;

export const getTodayPriorities = (state: DemoState) =>
  state.tasks
    .filter((task) => task.status === "pending" && !task.isDeleted)
    .sort((left, right) => compareByDate(getTaskEventDate(left), getTaskEventDate(right)))
    .slice(0, 5);

export const getUpcomingReminders = (state: DemoState) =>
  getPeopleBoard(state)
    .slice(0, 3)
    .map((entry) => ({ person: entry.person, latestTask: entry.latestTask, pendingCount: entry.pendingCount }));

export const getMoneySummary = (state: DemoState) => {
  const income = state.moneyRecords.filter((record) => record.type === "income").reduce((sum, record) => sum + record.amount, 0);
  const expense = state.moneyRecords.filter((record) => record.type === "expense").reduce((sum, record) => sum + record.amount, 0);
  return { income, expense, balance: income - expense };
};

export const getMoneyRecordsSorted = (state: DemoState) =>
  [...state.moneyRecords].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

export const getRecordById = (state: DemoState, recordId: string) =>
  state.moneyRecords.find((record) => record.id === recordId);

export const getPersonById = (state: DemoState, personId: string) =>
  state.persons.find((person) => person.id === personId);

export const getCategoryById = (state: DemoState, categoryId: string) =>
  state.categories.find((category) => category.id === categoryId);

export const getTasksForDate = (state: DemoState, dateKey: string) =>
  state.tasks
    .filter((task) => !task.isDeleted)
    .filter((task) => getTaskEventDate(task)?.slice(0, 10) === dateKey)
    .sort((left, right) => compareByDate(getTaskEventDate(left), getTaskEventDate(right)));

export const resetDemoState = () => {
  useLifeDeskStore.setState(baseState);
};
