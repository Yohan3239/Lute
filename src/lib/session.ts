import { Card } from "./types";
import { reviewCard } from "./srs";

export class Session {
  private queue: Card[];
  private index: number = 0;

  constructor(cards: Card[]) {
    this.queue = cards;
  }

  get current(): Card | null {
    return this.queue[this.index] || null;
  }

  grade(grade: "easy" | "good" | "hard" | "wrong") {
    if (!this.current) return;

    const updated = reviewCard(this.current, grade);
    this.queue[this.index] = updated;

    this.index++;
  }

  isFinished() {
    return this.index >= this.queue.length;
  }

  get results() {
    return this.queue;
  }
}
