"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  readCards: () => electron.ipcRenderer.invoke("read-cards"),
  saveCards: (cards) => electron.ipcRenderer.invoke("save-cards", cards),
  readDecks: () => electron.ipcRenderer.invoke("read-decks"),
  saveDecks: (decks) => electron.ipcRenderer.invoke("save-decks", decks)
});
