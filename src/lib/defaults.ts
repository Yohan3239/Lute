import { DEFAULT_DECK_ID } from "./constants";
import { Card } from "./types";
export function createNewCard(question: string, answer: string): Card {
  return {
    id: crypto.randomUUID(),
    question,
    answer,
    interval: 1,
    ease: 2.5,
    reps: 0,
    nextReview: Date.now(),
    deckId: DEFAULT_DECK_ID,
  };
}
