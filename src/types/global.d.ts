export {};
import { Card, Deck } from "../src/lib/types";

declare global {
    interface Window {
        api: {
        readCards: () => Promise<Card[]>;
        saveCards: (cards: Card[]) => Promise<boolean>;
        readDecks: () => Promise<Deck[]>;
        saveDecks: (decks: Deck[]) => Promise<boolean>;
        };
    }
}
