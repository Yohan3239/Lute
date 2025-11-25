import { contextBridge, ipcRenderer } from "electron";
import { Card, Deck } from "../src/lib/types";
contextBridge.exposeInMainWorld("api", {
  readCards: () => ipcRenderer.invoke("read-cards"),
  saveCards: (cards: Card[]) => ipcRenderer.invoke("save-cards", cards),
  readDecks: () => ipcRenderer.invoke("read-decks"),
  saveDecks: (decks: Deck[]) => ipcRenderer.invoke("save-decks", decks),
});
