import type { LifeDeskData, Task, UserSettings } from "@/types/models";

const apiBase = "/api";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${input}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const backendApi = {
  getBootstrap: () => request<LifeDeskData>("/bootstrap"),
  updateSettings: (payload: Partial<UserSettings>) =>
    request<UserSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createPerson: (payload: {
    id: string;
    categoryId: "family" | "friends" | "online";
    name: string;
    nickname?: string;
    note?: string;
    birthday?: string;
    contactPreference?: string;
  }) =>
    request("/persons", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createTask: (payload: {
    id: string;
    title: string;
    description?: string;
    categoryId: string;
    personId?: string;
    status: "pending" | "completed" | "cancelled";
    priority: "low" | "medium" | "high";
    timeType: "exact_time" | "relative_time" | "long_term" | "range_time";
    dueAt?: string;
    remindAt?: string;
    isDeleted: boolean;
    completedAt?: string;
    createdAt: string;
  }) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTask: (
    taskId: string,
    payload: Partial<Pick<Task, "title" | "description" | "priority" | "status" | "dueAt" | "remindAt" | "isDeleted" | "completedAt">>,
  ) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  completeTask: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/complete`, {
      method: "PATCH",
    }),
  resetData: () =>
    request<LifeDeskData>("/reset", {
      method: "POST",
    }),
};
