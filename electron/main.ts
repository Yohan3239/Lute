import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from "electron";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const dataPath = path.join(app.getPath("userData"), "cards.json");

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


  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}
// Ensure default deck exists
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

  if (!decks.find((d: { id: string; }) => d.id === "default-deck")) {
    decks.push({
      id: "default-deck",
      name: "Default",
      created: Date.now(),
    });

    fs.writeFileSync(decksPath, JSON.stringify(decks, null, 2));
  }
}

ensureDefaultDeck();

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

ipcMain.handle("call-llm", async (_event, prompt: string) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("call-llm requires a prompt string");
  }

  const res = await fetch("https://udgogxcgqduosejsbrzv.supabase.co/functions/v1/call_groq", {
    method: "POST",
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZ29neGNncWR1b3NlanNicnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODE2NzksImV4cCI6MjA4MzU1NzY3OX0.sze2KFS1F9G2f6z4JmXD9I2BRKkltIQoQOE6VQdlXfk`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
});

ipcMain.handle("open-external", async (_event, url: string) => {
  await shell.openExternal(url);
});
// Handle deep linking for OAuth when app closed while waiting for callback
const deepLink = process.argv.find((arg) => arg.startsWith("lute://"));
if (deepLink) {
  console.log("OAuth callback (app launch):", deepLink);
  app.whenReady().then(() => {
    win?.webContents.send("oauth-callback", deepLink);
  });
}

app.setAsDefaultProtocolClient("lute");
// Protocol handler for macOS
app.on("open-url", (event, url) => {
  event.preventDefault();
  console.log("OAuth callback:", url);

  win?.webContents.send("oauth-callback", url);
});

// Single instance lock to allow second-instance event
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on("second-instance", (_event, argv) => {
  // Protocol handler for Windows
  const url = argv.find(arg => arg.startsWith("lute://"));
  if (url) {
    console.log("OAuth callback (second-instance):", url);
    win?.webContents.send("oauth-callback", url);
  }
});
app.whenReady().then(createWindow)
