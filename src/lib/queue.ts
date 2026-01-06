import { Card } from "./types";

export function getDueCards(cards: Card[]): Card[] {
  const now = Date.now();
  const isDue = (c: Card) => c.nextReview !== undefined && c.nextReview <= now;

  const sortByLateness = (a: Card, b: Card) => (now - a.nextReview!) - (now - b.nextReview!);

    const learningCards = cards
    .filter(c => c.status === "learning" && isDue(c))
    .sort(sortByLateness);

  const relearningCards = cards
    .filter(c => c.status === "relearning" && isDue(c))
    .sort(sortByLateness);

  const reviewingCards = cards
    .filter(c => c.status === "review" && isDue(c))
    .sort(sortByLateness);

  const newCards = cards
    .filter(c => c.status === "new")
    .sort(sortByLateness); // optional, mostly cosmetic


  return [...learningCards, ...relearningCards, ...reviewingCards, ...newCards];
;
  
}
