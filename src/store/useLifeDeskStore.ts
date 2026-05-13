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
  initialize: () => Promise<void>;
  setLanguage: (language: UserSettings["language"]) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setFontSize: (size: UserSettings["fontSize"]) => void;
  setNotificationsEnabled: (value: boolean) => void;
  createPerson: (payload: {
    categoryId: "family" | "friends" | "online";
    name: string;
    nickname?: string;
    note?: string;
    birthday?: string;
    contactPreference?: string;
  }) => string;
  createTask: (payload: {
    categoryId: string;
    personId?: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    dueAt?: string;
  }) => string;
  completeTask: (taskId: string) => void;
  updateTask: (taskId: string, payload: Partial<Pick<Task, "title" | "description" | "categoryId" | "personId" | "priority" | "status" | "dueAt" | "remindAt">>) => void;
  resetDemo: () => void;
}

export type DemoState = LifeDeskData;

export const createDemoState = (): DemoState => ({
  settings: structuredClone(defaultSettings),
  categories: structuredClone(categories),
  persons: structuredClone(persons),
  tasks: structuredClone(tasks),
  moneyRecords: structuredClone(moneyRecords),
});

const baseState = createDemoState();

export const useLifeDeskStore = create<LifeDeskState>((set) => ({
  ...createDemoState(),
  backendReady: false,
  backendError: null,
  initialize: async () => {
    try {
      const data = await backendApi.getBootstrap();
      set({
        ...data,
        backendReady: true,
        backendError: null,
      });
    } catch (error) {
      set({
        backendReady: false,
        backendError: error instanceof Error ? error.message : "bootstrap_failed",
      });
    }
  },
  setLanguage: (language) => {
    set((state) => ({ settings: { ...state.settings, language } }));
    void backendApi.updateSettings({ language }).catch(() => undefined);
  },
  setThemeMode: (themeMode) => {
    set((state) => ({ settings: { ...state.settings, themeMode } }));
    void backendApi.updateSettings({ themeMode }).catch(() => undefined);
  },
  setThemeColor: (themeColor) => {
    set((state) => ({ settings: { ...state.settings, themeColor } }));
    void backendApi.updateSettings({ themeColor }).catch(() => undefined);
  },
  setFontSize: (fontSize) => {
    set((state) => ({ settings: { ...state.settings, fontSize } }));
    void backendApi.updateSettings({ fontSize }).catch(() => undefined);
  },
  setNotificationsEnabled: (notificationsEnabled) => {
    set((state) => ({ settings: { ...state.settings, notificationsEnabled } }));
    void backendApi.updateSettings({ notificationsEnabled }).catch(() => undefined);
  },
  createPerson: (payload) => {
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

    set((state) => ({
      persons: [
        ...state.persons,
        nextPerson,
      ],
    }));

    void backendApi.createPerson({ id: personId, ...payload }).catch(() => undefined);

    return personId;
  },
  createTask: (payload) => {
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

    set((state) => ({
      tasks: [
        ...state.tasks,
        nextTask,
      ],
    }));

    void backendApi.createTask({
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
    }).catch(() => undefined);

    return taskId;
  },
  completeTask: (taskId) => {
    const completedAt = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((task) =>
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
    }));
    void backendApi.completeTask(taskId).catch(() => undefined);
  },
  updateTask: (taskId, payload) => {
    let nextTaskPayload:
      | Partial<Pick<Task, "title" | "description" | "categoryId" | "personId" | "priority" | "status" | "dueAt" | "remindAt" | "isDeleted" | "completedAt">>
      | undefined;
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextStatus = payload.status ?? task.status;
        const isCompleted = nextStatus === "completed";
        nextTaskPayload = {
          ...payload,
          status: nextStatus,
          isDeleted: false,
          completedAt: isCompleted ? task.completedAt ?? new Date().toISOString() : undefined,
        };

        return {
          ...task,
          ...payload,
          status: nextStatus,
          isDeleted: false,
          completedAt: isCompleted ? task.completedAt ?? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    if (nextTaskPayload) {
      void backendApi.updateTask(taskId, nextTaskPayload).catch(() => undefined);
    }
  },
  resetDemo: () => {
    set({
      ...createDemoState(),
      backendReady: true,
      backendError: null,
    });
    void backendApi.resetData()
      .then((data) =>
        set({
          ...data,
          backendReady: true,
          backendError: null,
        }),
      )
      .catch(() => undefined);
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
