import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { Card, Deck } from "../src/lib/types";
contextBridge.exposeInMainWorld("api", {
  readCards: () => ipcRenderer.invoke("read-cards"),
  saveCards: (cards: Card[]) => ipcRenderer.invoke("save-cards", cards),
  readDecks: () => ipcRenderer.invoke("read-decks"),
  saveDecks: (decks: Deck[]) => ipcRenderer.invoke("save-decks", decks),
  callLLM: (prompt:string) => ipcRenderer.invoke('call-llm', prompt),
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on(channel, listener),
  removeListener: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.removeListener(channel, listener),
});
contextBridge.exposeInMainWorld("authAPI", {
  openExternal: (url: string) =>
    ipcRenderer.invoke("open-external", url),

  onOAuthCallback: (cb: (url: string) => void) =>
    ipcRenderer.on("oauth-callback", (_e, url) => cb(url)),
});

