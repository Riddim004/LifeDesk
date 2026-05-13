import { app, BrowserWindow, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startLifeDeskServer, type LifeDeskServerHandle } from "../api/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const devServerUrl = process.env.LIFEDESK_ELECTRON_DEV_URL;

let mainWindow: BrowserWindow | null = null;
let serverHandle: LifeDeskServerHandle | null = null;

function resolveDesktopRuntimeDir() {
  const configuredDataDir = process.env.LIFEDESK_DATA_DIR?.trim();
  if (configuredDataDir) {
    return path.join(configuredDataDir, "runtime-data");
  }

  if (process.platform === "win32") {
    const preferredBaseDir = "D:\\LifeDeskData";

    try {
      fs.mkdirSync(preferredBaseDir, { recursive: true });
      return path.join(preferredBaseDir, "runtime-data");
    } catch (error) {
      console.warn(`Unable to use ${preferredBaseDir} for desktop data, falling back to userData.`, error);
    }
  }

  return path.join(app.getPath("userData"), "runtime-data");
}

async function ensureServer() {
  if (devServerUrl) {
    return null;
  }

  if (serverHandle) {
    return serverHandle;
  }

  const runtimeDir = resolveDesktopRuntimeDir();
  serverHandle = await startLifeDeskServer({
    host: "127.0.0.1",
    port: 0,
    projectRoot,
    runtimeDir,
  });

  return serverHandle;
}

async function createMainWindow() {
  const activeServer = await ensureServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 820,
    backgroundColor: "#0f172a",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const targetUrl = devServerUrl ?? activeServer?.url;
  if (!targetUrl) {
    throw new Error("desktop_target_url_unavailable");
  }

  await mainWindow.loadURL(targetUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (devServerUrl) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

async function closeServer() {
  if (!serverHandle) {
    return;
  }

  const currentHandle = serverHandle;
  serverHandle = null;
  await currentHandle.close();
}

app.whenReady()
  .then(createMainWindow)
  .then(() => {
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createMainWindow();
      }
    });
  })
  .catch(async (error: unknown) => {
    console.error("Failed to start LifeDesk desktop app", error);
    await dialog.showMessageBox({
      type: "error",
      title: "LifeDesk 启动失败",
      message: "桌面应用启动失败",
      detail: error instanceof Error ? error.stack ?? error.message : String(error),
    });
    await closeServer();
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void closeServer();
});
