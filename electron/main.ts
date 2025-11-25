import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow, ipcMain } from "electron";
import fs from "fs";


const dataPath = path.join(app.getPath("userData"), "cards.json");

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const decksPath = path.join(app.getPath("userData"), "decks.json");

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

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

ipcMain.handle("save-cards", async (_event, cards: any[]) => {
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

app.whenReady().then(createWindow)
