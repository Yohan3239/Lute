export {};
import { Card, Deck } from "../lib/types";
import { IpcRendererEvent } from "electron";

declare global {
    interface Window {
        api: {
        readCards: () => Promise<Card[]>;
        saveCards: (cards: Card[]) => Promise<boolean>;
        readDecks: () => Promise<Deck[]>;
        saveDecks: (decks: Deck[]) => Promise<boolean>;
        callLLM: (prompt:string) => Promise<string>;
        };
        ipcRenderer?: {
            on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
            removeListener: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
        }
    }
}
declare module "js-levenshtein" {
    function levenshtein(a: string, b: string): number;
    export default levenshtein;
}

