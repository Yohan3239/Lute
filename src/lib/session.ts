/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/session.ts
import { Card, VariantCard } from "./types";
import { reviewCard, Grade } from "./srs";
export class Session {

  private queue: VariantCard[];
  private index = 0;

  constructor(cards: VariantCard[], startIndex = 0) {
    this.queue = cards;
    this.index = startIndex;
  }

  get current(): VariantCard | null {
    return this.queue[this.index] || null;
  }

  grade(grade: Grade): VariantCard | null {
    const card = this.current;
    if (!card) return null;
    const updatedBase = reviewCard(card as Card, grade);
    const updated : VariantCard = { ...updatedBase, variant: card.variant };

    this.queue[this.index] = updated;
    return updated;
  }
  next() {
    this.index++;
  }

  isFinished() {
    return this.index >= this.queue.length;
  }
  get position() {
    return this.index;
  }
  get results() {
    return this.queue;
  }
}
