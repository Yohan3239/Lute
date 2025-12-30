import { Deck } from "./types";
import { v4 as uuid } from "uuid";

export async function createDeck(name: string): Promise<Deck> {
  const decks: Deck[] = await window.api.readDecks();

  const newDeck: Deck = {
    id: uuid(),
    name,
    created: Date.now(),
  };

  await window.api.saveDecks([...decks, newDeck]);

  return newDeck;
}

export async function listDecks(): Promise<Deck[]> {
  return window.api.readDecks();
}

export async function renameDeck(id: string, name: string) {
  const decks = await window.api.readDecks();
  const updated = decks.map(d => d.id === id ? { ...d, name } : d);
  await window.api.saveDecks(updated);
}

export async function deleteDeck(id: string) {
  const decks = await window.api.readDecks();
  const updated = decks.filter(d => d.id !== id);
  await window.api.saveDecks(updated);
}
