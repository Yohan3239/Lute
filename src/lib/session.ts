// src/lib/session.ts
import { Card } from "./types";
import { reviewCard, Grade } from "./srs";

export class Session {
  private queue: Card[];
  private index = 0;

  constructor(cards: Card[]) {
    this.queue = cards;
  }

  get current(): Card | null {
    return this.queue[this.index] || null;
  }

  grade(grade: Grade): Card | null {
    const card = this.current;
    if (!card) return null;

    const updated = reviewCard(card, grade);
    this.queue[this.index] = updated;
    this.index++;

    return updated;
  }

  isFinished() {
    return this.index >= this.queue.length;
  }

  get results() {
    return this.queue;
  }
}
