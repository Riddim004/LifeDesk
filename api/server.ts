import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLifeDeskDatabase } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveProjectRoot() {
  const parentDir = path.resolve(__dirname, "..");
  return path.basename(parentDir) === "build-electron" ? path.resolve(parentDir, "..") : parentDir;
}

export interface LifeDeskServerOptions {
  port?: number;
  host?: string;
  projectRoot?: string;
  runtimeDir?: string;
}

export interface LifeDeskServerHandle {
  port: number;
  host: string;
  url: string;
  databaseFile: string;
  close: () => Promise<void>;
}

export function createLifeDeskApp(options: LifeDeskServerOptions = {}) {
  const projectRoot = options.projectRoot ?? resolveProjectRoot();
  const runtimeDir = options.runtimeDir ?? path.join(projectRoot, "runtime-data");
  const distDir = path.join(projectRoot, "dist");
  const database = createLifeDeskDatabase(runtimeDir);
  const app = express();

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

  return { app, database, projectRoot, runtimeDir, distDir };
}

export async function startLifeDeskServer(options: LifeDeskServerOptions = {}): Promise<LifeDeskServerHandle> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? Number(process.env.PORT || 8787);
  const { app, database } = createLifeDeskApp(options);

  return await new Promise((resolve, reject) => {
    let resolved = false;
    const server = app.listen(port, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("server_address_unavailable"));
        return;
      }

      resolved = true;
      const serverUrl = `http://${host}:${address.port}`;
      resolve({
        port: address.port,
        host,
        url: serverUrl,
        databaseFile: database.databaseFile,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          }),
      });
    });

    server.on("error", (error) => {
      if (!resolved) {
        reject(error);
      } else {
        console.error(error);
      }
    });
  });
}

const launchedDirectly = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (launchedDirectly) {
  startLifeDeskServer()
    .then((server: LifeDeskServerHandle) => {
      console.log(`LifeDesk backend running at ${server.url}`);
    })
    .catch((error: unknown) => {
      console.error("Failed to start LifeDesk backend", error);
      process.exitCode = 1;
    });
}
