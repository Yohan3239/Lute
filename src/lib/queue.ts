import { Card } from "./types";

export function getDueCards(cards: Card[]): Card[] {
  const now = Date.now();
  return cards.filter(c => c.nextReview <= now);
}
