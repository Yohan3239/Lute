import { Card } from "./types";

export function reviewCard(card: Card, grade: "easy" | "good" | "hard" | "wrong"): Card {
  const now = Date.now();

  switch (grade) {
    case "easy":
      card.ease += 0.1;
      card.interval = Math.round(card.interval * card.ease);
      break;

    case "good":
      card.interval = Math.round(card.interval * card.ease);
      break;

    case "hard":
      card.ease = Math.max(1.3, card.ease - 0.2);
      card.interval = Math.max(1, Math.round(card.interval * 0.7));
      break;

    case "wrong":
      card.interval = 1;
      card.ease = Math.max(1.3, card.ease - 0.3);
      break;
  }

  card.reps++;
  card.nextReview = now + card.interval * 24 * 60 * 60 * 1000;

  return card;
}
