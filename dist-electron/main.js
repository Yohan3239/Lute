import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import fs from "fs";
const dataPath = path.join(app.getPath("userData"), "cards.json");
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const decksPath = path.join(app.getPath("userData"), "decks.json");
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function ensureDefaultDeck() {
  if (!fs.existsSync(decksPath)) {
    fs.writeFileSync(decksPath, "[]");
  }
  const raw = fs.readFileSync(decksPath, "utf8");
  let decks = [];
  try {
    decks = JSON.parse(raw);
  } catch {
    decks = [];
  }
  if (!decks.find((d) => d.id === "default-deck")) {
    decks.push({
      id: "default-deck",
      name: "Default",
      created: Date.now()
    });
    fs.writeFileSync(decksPath, JSON.stringify(decks, null, 2));
  }
}
ensureDefaultDeck();
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("read-cards", async () => {
  try {
    if (!fs.existsSync(dataPath)) return [];
    const raw = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read cards:", err);
    return [];
  }
});
ipcMain.handle("save-cards", async (_event, cards) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(cards, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to save cards:", err);
    return false;
  }
});
ipcMain.handle("read-decks", async () => {
  if (!fs.existsSync(decksPath)) {
    fs.writeFileSync(decksPath, "[]");
  }
  const raw = fs.readFileSync(decksPath, "utf8");
  return JSON.parse(raw);
});
ipcMain.handle("save-decks", async (_event, decks) => {
  fs.writeFileSync(decksPath, JSON.stringify(decks, null, 2));
  return true;
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
