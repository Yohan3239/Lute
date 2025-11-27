export {};
import { Card, Deck } from "../lib/types";

declare global {
    interface Window {
        api: {
        readCards: () => Promise<Card[]>;
        saveCards: (cards: Card[]) => Promise<boolean>;
        readDecks: () => Promise<Deck[]>;
        saveDecks: (decks: Deck[]) => Promise<boolean>;
        callLLM: (prompt:string) => Promise<string>;
        };
    }
}
