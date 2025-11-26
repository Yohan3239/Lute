import { DEFAULT_DECK_ID } from "./constants";
import { Card } from "./types";
export function createNewCard(q: string, a: string): Omit<Card, "deckId"> {
  return {
    id: crypto.randomUUID(),
    question: q,
    answer: a,

    interval: 1,
    ease: 2.5,
    reps: 0,
    nextReview: Date.now(),

    status: "new",   // ⭐ all new cards start here
  };
}

