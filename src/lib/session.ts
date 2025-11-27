// src/lib/session.ts
import { Card, ReviewVariant, VariantCard } from "./types";
import { reviewCard, Grade } from "./srs";
export class Session {

  private queue: VariantCard[];
  private index = 0;

  constructor(cards: VariantCard[]) {
    this.queue = cards;
  }

  get current(): VariantCard | null {
    return this.queue[this.index] || null;
  }

  grade(grade: Grade): Card | null {
    const card = this.current;
    if (!card) return null;

    const updated = reviewCard(card, grade);
    //this.queue[this.index] = updated;
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
