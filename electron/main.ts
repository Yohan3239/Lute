import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const dataPath = path.join(app.getPath("userData"), "cards.json");

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const decksPath = path.join(app.getPath("userData"), "decks.json");
const sampleDeckSeededPath = path.join(app.getPath("userData"), "sampleDeckSeeded.txt");
let sampleDeckSeeded = fs.existsSync(sampleDeckSeededPath);

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

function initAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.on("error", (err) => {
    console.error("Auto-updater error:", err);
  });
  autoUpdater.on("update-available", () => {
    console.log("Update available. Downloading...");
  });
  autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded. Quitting to install.");
    autoUpdater.quitAndInstall();
  });
  autoUpdater.checkForUpdates();
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../public/icon.ico"),
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
function ensureSampleDeck() {
  if (sampleDeckSeeded) return;

  const sampleDeck = {
    id: "sample-deck",
    name: "Sample",
    created: Date.now(),
  };
  const now = Date.now();
  const sampleCards = [
    {
      id: "sample-calc-ln-derivative",
      question: "What is d/dx of ln(x)?",
      answer: "1/x",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-calc-exp-integral",
      question: "What is the integral of e^x dx?",
      answer: "e^x + C",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-linear-mult-dim",
      question: "If A is 3x2 and B is 2x4, what is the size of AB?",
      answer: "3x4",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-linear-eigen",
      question: "What is an eigenvalue of a matrix?",
      answer: "A scalar lambda where Av = lambda v for a nonzero vector v",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-linear-rank",
      question: "What does the rank of a matrix represent?",
      answer: "The dimension of its column space",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-prob-bernoulli-var",
      question: "What is the variance of a Bernoulli(p) random variable?",
      answer: "p(1-p)",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-prob-bayes",
      question: "What is Bayes' theorem?",
      answer: "P(A|B) = P(B|A)P(A) / P(B)",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-stats-pvalue",
      question: "What is a p-value?",
      answer: "Probability under the null of data as extreme or more extreme",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-stats-ci",
      question: "What does a 95% confidence interval mean?",
      answer: "In repeated samples, 95% of intervals contain the true parameter",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-algo-merge",
      question: "What is the time complexity of merge sort?",
      answer: "O(n log n)",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-algo-dijkstra",
      question: "Dijkstra's algorithm requires what kind of edge weights?",
      answer: "Nonnegative weights",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-ds-hash",
      question: "Average time for hash table lookup?",
      answer: "O(1)",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-os-pagefault",
      question: "What is a page fault?",
      answer: "A trap when a process accesses a page not in RAM",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-db-acid",
      question: "What does ACID stand for in databases?",
      answer: "Atomicity, Consistency, Isolation, Durability",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-net-tcp",
      question: "What does TCP provide that UDP does not?",
      answer: "Reliable, ordered delivery with congestion control",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-physics-work-energy",
      question: "What does the work-energy theorem state?",
      answer: "Net work equals the change in kinetic energy",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-physics-gauss",
      question: "State Gauss's law for electricity.",
      answer: "Electric flux through a closed surface equals charge enclosed divided by epsilon0",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-physics-first-law",
      question: "What is the first law of thermodynamics?",
      answer: "Delta U = Q - W",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-physics-kinematics",
      question: "For constant acceleration, what is the equation for v^2?",
      answer: "v^2 = v0^2 + 2*a*delta_x",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-chem-ph",
      question: "How is pH defined?",
      answer: "-log10([H+])",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-chem-gibbs",
      question: "What is the Gibbs free energy equation?",
      answer: "Delta G = Delta H - T*Delta S",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-chem-sn1",
      question: "In SN1 reactions, the rate depends on what?",
      answer: "Only the substrate concentration",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-bio-atp",
      question: "What is the primary role of ATP in cells?",
      answer: "Energy currency that drives cellular reactions",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-bio-dna",
      question: "What are the base-pairing rules in DNA?",
      answer: "A pairs with T, and C pairs with G",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-econ-demand",
      question: "What does the law of demand state?",
      answer: "Quantity demanded falls as price rises, ceteris paribus",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-econ-gdp",
      question: "What is GDP?",
      answer: "Total market value of final goods and services produced domestically in a period",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-finance-npv",
      question: "What is net present value (NPV)?",
      answer: "Present value of inflows minus outflows discounted at a required rate",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-ee-capacitor",
      question: "What is the impedance of a capacitor?",
      answer: "1/(j*omega*C)",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-signals-nyquist",
      question: "Nyquist sampling theorem requires what minimum sampling rate?",
      answer: "At least twice the highest frequency (2*f_max)",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
    {
      id: "sample-ml-regularization",
      question: "What is the purpose of regularization in machine learning?",
      answer: "Reduce overfitting by penalizing model complexity",
      deckId: "sample-deck",
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: now,
      status: "new",
      learningStep: 0,
      lapses: 0,
    },
  ];
  let decks = [];
  if (fs.existsSync(decksPath)) {
    const raw = fs.readFileSync(decksPath, "utf8");
    try {
      decks = JSON.parse(raw);
    } catch {
      decks = [];
    }
  }
  decks.push(sampleDeck);
  fs.writeFileSync(decksPath, JSON.stringify(decks, null, 2));
  let cards = [];
  if (fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath, "utf8");
    try {
      cards = JSON.parse(raw);
    } catch {
      cards = [];
    }
  }
  fs.writeFileSync(dataPath, JSON.stringify([...cards, ...sampleCards], null, 2));
  fs.writeFileSync(sampleDeckSeededPath, "true");
  sampleDeckSeeded = true;
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
ensureSampleDeck();

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

ipcMain.handle("call-llm", async (_event, prompt: string, isProUser: boolean) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("call-llm requires a prompt string");
  }

  const res = await fetch("https://udgogxcgqduosejsbrzv.supabase.co/functions/v1/call_groq", {
    method: "POST",
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZ29neGNncWR1b3NlanNicnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODE2NzksImV4cCI6MjA4MzU1NzY3OX0.sze2KFS1F9G2f6z4JmXD9I2BRKkltIQoQOE6VQdlXfk`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, isProUser }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`LLM returned non-JSON: ${text}`);
  }
  if (data.error?.message) {
    throw new Error(`Groq: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq: empty content");
  return content;

});

ipcMain.handle("open-external", async (_event, url: string) => {
  await shell.openExternal(url);
});
// Handle deep linking for OAuth when app closed while waiting for callback
const deepLink = process.argv.find((arg) => arg.startsWith("lute://"));
if (deepLink) {
  app.whenReady().then(() => {
    win?.webContents.send("oauth-callback", deepLink);
  });
}

app.setAsDefaultProtocolClient("lute");
// Protocol handler for macOS
app.on("open-url", (event, url) => {
  event.preventDefault();

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
    win?.webContents.send("oauth-callback", url);
  }
});
app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();
})
