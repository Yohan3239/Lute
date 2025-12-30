// src/lib/defaults.ts
import { Card } from "./types";

export function createNewCard(q: string, a: string): Omit<Card, "deckId"> {
  return {
    id: crypto.randomUUID(),
    question: q,
    answer: a,

    interval: 0,           // brand new → 0 days until first SRS step
    ease: 2.5,
    reps: 0,
    nextReview: Date.now(),    // due immediately

    status: "new",
    learningStep: 0,
    lapses: 0,
  };
}
