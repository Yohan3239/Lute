import { Card } from "./types";

export function createNewCard(question: string, answer: string): Omit<Card, "deckId"> {
  return {
    id: crypto.randomUUID(),
    question,
    answer,
    interval: 1,
    ease: 2.5,
    reps: 0,
    nextReview: Date.now(),
  };
}
