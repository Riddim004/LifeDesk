import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { categories, defaultSettings } from "../src/data/seed";
import type { Category, LifeDeskData, MoneyRecord, Person, Task, UserSettings } from "../src/types/models";

const userId = "solo-user";

const createInitialState = (): LifeDeskData => ({
  settings: structuredClone(defaultSettings),
  categories: structuredClone(categories),
  persons: [],
  tasks: [],
  moneyRecords: [],
});

type CategoryRow = Omit<Category, "parentId" | "icon" | "color"> & {
  parent_id: string | null;
  icon: string | null;
  color: string | null;
};

type PersonRow = Omit<Person, "categoryId" | "avatarUrl" | "relationType" | "lastContactAt" | "contactPreference"> & {
  category_id: string;
  avatar_url: string | null;
  relation_type: Person["relationType"];
  last_contact_at: string | null;
  contact_preference: string | null;
};

type TaskRow = Omit<Task, "categoryId" | "personId" | "moneyRecordId" | "timeType" | "dueAt" | "startAt" | "remindAt" | "isDeleted" | "completedAt"> & {
  module_type: string;
  category_id: string;
  person_id: string | null;
  money_record_id: string | null;
  time_type: Task["timeType"];
  due_at: string | null;
  start_at: string | null;
  remind_at: string | null;
  is_deleted: number;
  completed_at: string | null;
};

type MoneyRecordRow = Omit<MoneyRecord, "relatedTaskId" | "relatedPersonId" | "relatedCategoryId"> & {
  related_task_id: string | null;
  related_person_id: string | null;
  related_category_id: string;
};

type SettingsRow = {
  user_id: string;
  language: UserSettings["language"];
  theme_mode: UserSettings["themeMode"];
  theme_color: UserSettings["themeColor"];
  font_size: UserSettings["fontSize"];
  notifications_enabled: number;
};

const rowToSettings = (row: SettingsRow): UserSettings => ({
  language: row.language,
  themeMode: row.theme_mode,
  themeColor: row.theme_color,
  fontSize: row.font_size,
  notificationsEnabled: Boolean(row.notifications_enabled),
});

const rowToCategory = (row: CategoryRow): Category => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  type: row.type,
  parentId: row.parent_id,
  sortOrder: row.sortOrder,
  icon: row.icon ?? undefined,
  color: row.color ?? undefined,
  pendingCount: row.pendingCount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const rowToPerson = (row: PersonRow): Person => ({
  id: row.id,
  userId: row.userId,
  categoryId: row.category_id,
  name: row.name,
  nickname: row.nickname ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
  relationType: row.relation_type,
  birthday: row.birthday ?? undefined,
  anniversary: row.anniversary ?? undefined,
  note: row.note ?? undefined,
  lastContactAt: row.last_contact_at ?? undefined,
  contactPreference: row.contact_preference ?? undefined,
  pendingCount: row.pendingCount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const rowToTask = (row: TaskRow): Task => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  description: row.description ?? undefined,
  categoryId: row.category_id,
  personId: row.person_id ?? undefined,
  moneyRecordId: row.money_record_id ?? undefined,
  status: row.status,
  priority: row.priority,
  timeType: row.time_type,
  dueAt: row.due_at ?? undefined,
  startAt: row.start_at ?? undefined,
  remindAt: row.remind_at ?? undefined,
  isDeleted: Boolean(row.is_deleted),
  completedAt: row.completed_at ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const legacySocialCategoryIds = new Set(["family", "friends", "online"]);

const normalizeTask = (task: Task): Task => ({
  ...task,
  categoryId: legacySocialCategoryIds.has(task.categoryId) ? "life" : task.categoryId,
});

const rowToMoneyRecord = (row: MoneyRecordRow): MoneyRecord => ({
  id: row.id,
  userId: row.userId,
  type: row.type,
  amount: row.amount,
  currency: row.currency,
  title: row.title,
  note: row.note ?? undefined,
  occurredAt: row.occurredAt,
  relatedTaskId: row.related_task_id ?? undefined,
  relatedPersonId: row.related_person_id ?? undefined,
  relatedCategoryId: row.related_category_id,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

function runInTransaction<T>(database: DatabaseSync, callback: () => T): T {
  database.exec("BEGIN");

  try {
    const result = callback();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function createSchema(database: DatabaseSync) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY,
      language TEXT NOT NULL,
      theme_mode TEXT NOT NULL,
      theme_color TEXT NOT NULL,
      font_size TEXT NOT NULL,
      notifications_enabled INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      sortOrder INTEGER NOT NULL,
      icon TEXT,
      color TEXT,
      pendingCount INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      nickname TEXT,
      avatar_url TEXT,
      relation_type TEXT NOT NULL,
      birthday TEXT,
      anniversary TEXT,
      note TEXT,
      last_contact_at TEXT,
      contact_preference TEXT,
      pendingCount INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      module_type TEXT NOT NULL,
      category_id TEXT NOT NULL,
      person_id TEXT,
      money_record_id TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      time_type TEXT NOT NULL,
      due_at TEXT,
      start_at TEXT,
      remind_at TEXT,
      is_deleted INTEGER NOT NULL,
      completed_at TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS money_records (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT,
      occurredAt TEXT NOT NULL,
      related_task_id TEXT,
      related_person_id TEXT,
      related_category_id TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

function clearData(database: DatabaseSync) {
  database.exec(`
    DELETE FROM money_records;
    DELETE FROM tasks;
    DELETE FROM persons;
    DELETE FROM categories;
    DELETE FROM settings;
  `);
}

function insertState(database: DatabaseSync, state: LifeDeskData) {
  const insertSettings = database.prepare(`
    INSERT INTO settings (user_id, language, theme_mode, theme_color, font_size, notifications_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertCategory = database.prepare(`
    INSERT INTO categories (id, userId, name, type, parent_id, sortOrder, icon, color, pendingCount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPerson = database.prepare(`
    INSERT INTO persons (id, userId, category_id, name, nickname, avatar_url, relation_type, birthday, anniversary, note, last_contact_at, contact_preference, pendingCount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTask = database.prepare(`
    INSERT INTO tasks (id, userId, title, description, module_type, category_id, person_id, money_record_id, status, priority, time_type, due_at, start_at, remind_at, is_deleted, completed_at, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMoneyRecord = database.prepare(`
    INSERT INTO money_records (id, userId, type, amount, currency, title, note, occurredAt, related_task_id, related_person_id, related_category_id, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSettings.run(
    userId,
    state.settings.language,
    state.settings.themeMode,
    state.settings.themeColor,
    state.settings.fontSize,
    state.settings.notificationsEnabled ? 1 : 0,
  );

  for (const category of state.categories) {
    insertCategory.run(
      category.id,
      category.userId,
      category.name,
      category.type,
      category.parentId,
      category.sortOrder,
      category.icon ?? null,
      category.color ?? null,
      category.pendingCount,
      category.createdAt,
      category.updatedAt,
    );
  }

  for (const person of state.persons) {
    insertPerson.run(
      person.id,
      person.userId,
      person.categoryId,
      person.name,
      person.nickname ?? null,
      person.avatarUrl ?? null,
      person.relationType,
      person.birthday ?? null,
      person.anniversary ?? null,
      person.note ?? null,
      person.lastContactAt ?? null,
      person.contactPreference ?? null,
      person.pendingCount,
      person.createdAt,
      person.updatedAt,
    );
  }

  for (const task of state.tasks) {
    const normalizedTask = normalizeTask(task);
    insertTask.run(
      normalizedTask.id,
      normalizedTask.userId,
      normalizedTask.title,
      normalizedTask.description ?? null,
      "event",
      normalizedTask.categoryId,
      normalizedTask.personId ?? null,
      normalizedTask.moneyRecordId ?? null,
      normalizedTask.status,
      normalizedTask.priority,
      normalizedTask.timeType,
      normalizedTask.dueAt ?? null,
      normalizedTask.startAt ?? null,
      normalizedTask.remindAt ?? null,
      normalizedTask.isDeleted ? 1 : 0,
      normalizedTask.completedAt ?? null,
      normalizedTask.createdAt,
      normalizedTask.updatedAt,
    );
  }

  for (const record of state.moneyRecords) {
    insertMoneyRecord.run(
      record.id,
      record.userId,
      record.type,
      record.amount,
      record.currency,
      record.title,
      record.note ?? null,
      record.occurredAt,
      record.relatedTaskId ?? null,
      record.relatedPersonId ?? null,
      record.relatedCategoryId,
      record.createdAt,
      record.updatedAt,
    );
  }
}

export interface LifeDeskDatabase {
  databaseFile: string;
  bootstrap: () => LifeDeskData;
  updateSettings: (payload: Partial<UserSettings>) => UserSettings;
  createPerson: (payload: Partial<Person>) => Person;
  createTask: (
    payload: Pick<Task, "id" | "title" | "categoryId" | "status" | "priority" | "timeType" | "isDeleted" | "createdAt"> &
      Partial<Pick<Task, "description" | "dueAt" | "remindAt" | "personId" | "moneyRecordId" | "completedAt">>,
  ) => Task;
  updateTask: (
    taskId: string,
    payload: Partial<Pick<Task, "title" | "description" | "categoryId" | "personId" | "priority" | "status" | "dueAt" | "remindAt" | "isDeleted" | "completedAt">>,
  ) => Task | null;
  completeTask: (taskId: string) => Task | null;
  reset: () => LifeDeskData;
}

function migrateDatabaseFiles(projectRoot: string, databaseFile: string) {
  const legacyRuntimeDir = path.join(projectRoot, "runtime-data");
  const legacyDatabaseFile = path.join(legacyRuntimeDir, "lifedesk.sqlite");

  if (fs.existsSync(databaseFile) || !fs.existsSync(legacyDatabaseFile)) {
    return;
  }

  const legacyRelatedFiles = [
    legacyDatabaseFile,
    `${legacyDatabaseFile}-shm`,
    `${legacyDatabaseFile}-wal`,
  ];
  const nextRelatedFiles = [
    databaseFile,
    `${databaseFile}-shm`,
    `${databaseFile}-wal`,
  ];

  legacyRelatedFiles.forEach((sourceFile, index) => {
    if (!fs.existsSync(sourceFile)) {
      return;
    }

    fs.renameSync(sourceFile, nextRelatedFiles[index]);
  });
}

export function createLifeDeskDatabase(projectRoot: string): LifeDeskDatabase {
  const dataRoot = path.resolve(projectRoot, "..");
  const databaseFile = path.join(dataRoot, "lifedesk.sqlite");

  fs.mkdirSync(dataRoot, { recursive: true });
  migrateDatabaseFiles(projectRoot, databaseFile);

  const database = new DatabaseSync(databaseFile);
  createSchema(database);

  const countRow = database.prepare("SELECT COUNT(*) AS count FROM settings").get() as { count: number };
  if (countRow.count === 0) {
    const initialState = createInitialState();
    runInTransaction(database, () => {
      clearData(database);
      insertState(database, initialState);
    });
  }

  const migrateLegacyTaskModel = () => {
    const now = new Date().toISOString();
    database.prepare(`
      UPDATE tasks
      SET category_id = ?, module_type = 'event', updatedAt = ?
      WHERE module_type = 'social' OR category_id IN ('family', 'friends', 'online')
    `).run("life", now);
  };

  migrateLegacyTaskModel();

  const bootstrap = (): LifeDeskData => {
    const settingsRow = database.prepare(`
      SELECT user_id, language, theme_mode, theme_color, font_size, notifications_enabled
      FROM settings
      WHERE user_id = ?
    `).get(userId) as SettingsRow | undefined;

    if (!settingsRow) {
      throw new Error("settings_not_found");
    }

    const categoryRows = database.prepare(`
      SELECT id, userId, name, type, parent_id, sortOrder, icon, color, pendingCount, createdAt, updatedAt
      FROM categories
      ORDER BY sortOrder ASC, createdAt ASC
    `).all() as CategoryRow[];

    const personRows = database.prepare(`
      SELECT id, userId, category_id, name, nickname, avatar_url, relation_type, birthday, anniversary, note, last_contact_at, contact_preference, pendingCount, createdAt, updatedAt
      FROM persons
      ORDER BY createdAt ASC, name ASC
    `).all() as PersonRow[];

    const taskRows = database.prepare(`
      SELECT id, userId, title, description, module_type, category_id, person_id, money_record_id, status, priority, time_type, due_at, start_at, remind_at, is_deleted, completed_at, createdAt, updatedAt
      FROM tasks
      ORDER BY createdAt ASC, id ASC
    `).all() as TaskRow[];

    const moneyRecordRows = database.prepare(`
      SELECT id, userId, type, amount, currency, title, note, occurredAt, related_task_id, related_person_id, related_category_id, createdAt, updatedAt
      FROM money_records
      ORDER BY occurredAt DESC, createdAt DESC
    `).all() as MoneyRecordRow[];

    return {
      settings: rowToSettings(settingsRow),
      categories: categoryRows.map(rowToCategory),
      persons: personRows.map(rowToPerson),
      tasks: taskRows.map(rowToTask).map(normalizeTask),
      moneyRecords: moneyRecordRows.map(rowToMoneyRecord),
    };
  };

  const updateSettings = (payload: Partial<UserSettings>): UserSettings => {
    const current = bootstrap().settings;
    const nextSettings: UserSettings = { ...current, ...payload };

    database.prepare(`
      UPDATE settings
      SET language = ?, theme_mode = ?, theme_color = ?, font_size = ?, notifications_enabled = ?
      WHERE user_id = ?
    `).run(
      nextSettings.language,
      nextSettings.themeMode,
      nextSettings.themeColor,
      nextSettings.fontSize,
      nextSettings.notificationsEnabled ? 1 : 0,
      userId,
    );

    return nextSettings;
  };

  const createPerson = (payload: Partial<Person>): Person => {
    if (!payload.id || !payload.name || !payload.categoryId) {
      throw new Error("invalid_person_payload");
    }

    const now = new Date().toISOString();
    const nextPerson: Person = {
      id: payload.id,
      userId,
      categoryId: payload.categoryId,
      name: payload.name,
      nickname: payload.nickname,
      avatarUrl: payload.avatarUrl,
      relationType: payload.relationType || (payload.categoryId as Person["relationType"]),
      birthday: payload.birthday,
      anniversary: payload.anniversary,
      note: payload.note,
      lastContactAt: payload.lastContactAt,
      contactPreference: payload.contactPreference,
      pendingCount: 0,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };

    database.prepare(`
      INSERT INTO persons (id, userId, category_id, name, nickname, avatar_url, relation_type, birthday, anniversary, note, last_contact_at, contact_preference, pendingCount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nextPerson.id,
      nextPerson.userId,
      nextPerson.categoryId,
      nextPerson.name,
      nextPerson.nickname ?? null,
      nextPerson.avatarUrl ?? null,
      nextPerson.relationType,
      nextPerson.birthday ?? null,
      nextPerson.anniversary ?? null,
      nextPerson.note ?? null,
      nextPerson.lastContactAt ?? null,
      nextPerson.contactPreference ?? null,
      nextPerson.pendingCount,
      nextPerson.createdAt,
      nextPerson.updatedAt,
    );

    return nextPerson;
  };

  const createTask = (
    payload: Pick<Task, "id" | "title" | "categoryId" | "status" | "priority" | "timeType" | "isDeleted" | "createdAt"> &
      Partial<Pick<Task, "description" | "dueAt" | "remindAt" | "personId" | "moneyRecordId" | "completedAt">>,
  ): Task => {
    if (!payload.id || !payload.title || !payload.categoryId) {
      throw new Error("invalid_task_payload");
    }

    const now = new Date().toISOString();
    const nextTask = normalizeTask({
      id: payload.id,
      userId,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      personId: payload.personId,
      moneyRecordId: payload.moneyRecordId,
      status: payload.status,
      priority: payload.priority,
      timeType: payload.timeType,
      dueAt: payload.dueAt,
      remindAt: payload.remindAt,
      isDeleted: payload.isDeleted,
      completedAt: payload.completedAt,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    });

    database.prepare(`
      INSERT INTO tasks (id, userId, title, description, module_type, category_id, person_id, money_record_id, status, priority, time_type, due_at, start_at, remind_at, is_deleted, completed_at, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nextTask.id,
      nextTask.userId,
      nextTask.title,
      nextTask.description ?? null,
      "event",
      nextTask.categoryId,
      nextTask.personId ?? null,
      nextTask.moneyRecordId ?? null,
      nextTask.status,
      nextTask.priority,
      nextTask.timeType,
      nextTask.dueAt ?? null,
      null,
      nextTask.remindAt ?? null,
      nextTask.isDeleted ? 1 : 0,
      nextTask.completedAt ?? null,
      nextTask.createdAt,
      nextTask.updatedAt,
    );

    return nextTask;
  };

  const updateTask = (
    taskId: string,
    payload: Partial<Pick<Task, "title" | "description" | "categoryId" | "personId" | "priority" | "status" | "dueAt" | "remindAt" | "isDeleted" | "completedAt">>,
  ): Task | null => {
    const currentRow = database.prepare(`
      SELECT id, userId, title, description, module_type, category_id, person_id, money_record_id, status, priority, time_type, due_at, start_at, remind_at, is_deleted, completed_at, createdAt, updatedAt
      FROM tasks
      WHERE id = ?
    `).get(taskId) as TaskRow | undefined;

    if (!currentRow) {
      return null;
    }

    const current = normalizeTask(rowToTask(currentRow));
    const nextTask = normalizeTask({
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    });

    database.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, category_id = ?, person_id = ?, status = ?, priority = ?, due_at = ?, remind_at = ?, is_deleted = ?, completed_at = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      nextTask.title,
      nextTask.description ?? null,
      nextTask.categoryId,
      nextTask.personId ?? null,
      nextTask.status,
      nextTask.priority,
      nextTask.dueAt ?? null,
      nextTask.remindAt ?? null,
      nextTask.isDeleted ? 1 : 0,
      nextTask.completedAt ?? null,
      nextTask.updatedAt,
      taskId,
    );

    return nextTask;
  };

  const completeTask = (taskId: string): Task | null => {
    const completedAt = new Date().toISOString();
    return updateTask(taskId, {
      status: "completed",
      isDeleted: true,
      completedAt,
    });
  };

  const reset = (): LifeDeskData => {
    const initialState = createInitialState();
    runInTransaction(database, () => {
      clearData(database);
      insertState(database, initialState);
    });
    return bootstrap();
  };

  return {
    databaseFile,
    bootstrap,
    updateSettings,
    createPerson,
    createTask,
    updateTask,
    completeTask,
    reset,
  };
}
