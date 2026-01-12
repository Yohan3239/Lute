// src/lib/types.ts
import { MCQ, Cloze, TrueFalse } from "./llm";
export type CardStatus = "new" | "learning" | "review" | "relearning";
export type Classic = { type: "classic"; prompt: string; answer: string };
export type ReviewVariant = MCQ | Cloze | TrueFalse | Classic;
export type VariantCard = Card & {
  variant: ReviewVariant | null;
  runReturnedCount: number;
  statusData?: Record<statusDatatype, any>[];  // Session-only event metadata
};
export type statusDatatype = "burn" | "wet" | "poison" | "frozen" | "tempo up" | "overcharged" | "cursed" | "lucky";
export enum ArtifactType {
  FIRE_RING = "fire_ring",
  WATER_AMULET = "water_amulet",
  TOXIC_CHARM = "toxic_charm",
  ICE_TALISMAN = "ice_talisman",
  WIND_BRACELET = "wind_bracelet",
  STEAM_CORE = "steam_core",
  GAMBLERS_DICE = "gamblers_dice",
  SUPERCHARGER = "supercharger",
}

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
