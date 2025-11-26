// src/lib/types.ts
export type CardStatus = "new" | "learning" | "review" | "relearning";

export interface Card {
  id: string;
  deckId: string;

  question: string;
  answer: string;

  // SRS fields
  interval: number;        // in days
  ease: number;            // ease factor
  reps: number;            // successful reviews
  nextReview: number;      // timestamp (ms)

  status: CardStatus;      // "new" | "learning" | "review" | "relearning"
  learningStep: number;    // index into steps array
  lapses: number;          // number of times you failed as a review card
}


export interface Deck {
    id: string;
    name: string;
    created: number;
}
