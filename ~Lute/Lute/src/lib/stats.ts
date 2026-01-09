import { Card } from "./types";

export function computeDeckStats(cards: Card[]) {
  const now = Date.now();

  const total = cards.length;
  const due = cards.filter(c => c.nextReview <= now).length;

  const newCount = cards.filter(c => c.status === "new").length;
  const learning = cards.filter(c => c.status === "learning").length;
  const review = cards.filter(c => c.status === "review").length;
  const relearning = cards.filter(c => c.status === "relearning").length;

  const lapses = cards.reduce((sum, c) => sum + (c.lapses ?? 0), 0);

  const avgEase =
    cards.length > 0
      ? cards.reduce((sum, c) => sum + (c.ease ?? 0), 0) / cards.length
      : 0;

  const avgInterval =
    cards.length > 0
      ? cards.reduce((sum, c) => sum + (c.interval ?? 0), 0) / cards.length
      : 0;

  return {
    total,
    due,
    newCount,
    learning,
    review,
    relearning,
    lapses,
    avgEase: Number(avgEase.toFixed(2)),
    avgInterval: Number(avgInterval.toFixed(2)),
  };
}
