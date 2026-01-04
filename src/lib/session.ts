/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/session.ts
import { Card, VariantCard } from "./types";
import { reviewCard, Grade } from "./srs";
import { GameState, initialGameState } from "./gameLogic";
export class Session {
  
  private queue: VariantCard[];
  private index = 0;
  private game: GameState = initialGameState();
  private deckId: string = "";
  private isAIMode: boolean = false;

  constructor(cards: VariantCard[], startIndex = 0, gameState = initialGameState(), deck = "", isAI = false) {
    this.queue = cards;
    this.index = startIndex;
    this.game = gameState;
    this.deckId = deck;
    this.isAIMode = isAI;
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

  get gameState() {
    return this.game;
  }

  get deck() {
    return this.deckId;
  }

  get isAI() {
    return this.isAIMode;
  }
  setGame(state: GameState) {
    this.game = state;
  }
}
