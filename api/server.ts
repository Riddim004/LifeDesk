import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLifeDeskDatabase } from "./database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const app = express();
const port = Number(process.env.PORT || 8787);
const database = createLifeDeskDatabase(projectRoot);

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, storage: "sqlite", databaseFile: database.databaseFile });
});

app.get("/api/bootstrap", (_request, response, next) => {
  try {
    response.json(database.bootstrap());
  } catch (error) {
    next(error);
  }
});

app.patch("/api/settings", (request, response, next) => {
  try {
    response.json(database.updateSettings(request.body));
  } catch (error) {
    next(error);
  }
});

app.post("/api/persons", (request, response, next) => {
  try {
    response.status(201).json(database.createPerson(request.body));
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_person_payload") {
      response.status(400).json({ message: "invalid_person_payload" });
      return;
    }
    next(error);
  }
});

app.post("/api/tasks", (request, response, next) => {
  try {
    response.status(201).json(database.createTask(request.body));
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_task_payload") {
      response.status(400).json({ message: "invalid_task_payload" });
      return;
    }
    next(error);
  }
});

app.patch("/api/tasks/:taskId", (request, response, next) => {
  try {
    const { taskId } = request.params;
    const nextTask = database.updateTask(taskId, request.body);

    if (!nextTask) {
      response.status(404).json({ message: "task_not_found" });
      return;
    }

    response.json(nextTask);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tasks/:taskId/complete", (request, response, next) => {
  try {
    const { taskId } = request.params;
    const nextTask = database.completeTask(taskId);

    if (!nextTask) {
      response.status(404).json({ message: "task_not_found" });
      return;
    }

    response.json(nextTask);
  } catch (error) {
    next(error);
  }
});

app.post("/api/reset", (_request, response, next) => {
  try {
    response.json(database.reset());
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV === "production" && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response) => {
  console.error(error);
  response.status(500).json({ message: "internal_server_error" });
});

app.listen(port, () => {
  console.log(`LifeDesk backend running at http://localhost:${port}`);
});
