export interface Card {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  interval: number;
  ease: number;
  reps: number;
  nextReview: number;
}


export interface Deck {
    id: string;
    name: string;
    created: number;
}
