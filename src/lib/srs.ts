// src/lib/srs.ts
import { Card } from "./types";

// ---- Tunable knobs (roughly Anki-ish) ----

// Learning steps for NEW cards (in minutes)
const LEARNING_STEPS_MIN = [10, 1440]; // 10 minutes, 1 day

// Relearning steps for LAPSED cards (in minutes)
const LAPSE_STEPS_MIN = [10]; // just 10 minutes for now

// Ease factor settings
const START_EASE = 2.5;
const MIN_EASE = 1.3;
const EASY_BONUS = 1.3;          // extra bonus for "Easy"
const LAPSE_INTERVAL_MULT = 0.5; // old interval × 0.5 on lapse

// Interval constants
const DAY_MS = 1000 * 60 * 60 * 24;

export type Grade = "easy" | "good" | "hard" | "wrong";

// --- helpers ---

function now() {
  return Date.now();
}

// Make sure a card has all the fields we expect (handles old JSON)
function normalizeCard(card: Card): Card {
  return {
    ...card,
    ease: card.ease ?? START_EASE,
    interval: card.interval ?? 0,
    reps: card.reps ?? 0,
    status: card.status ?? "new",
    learningStep: card.learningStep ?? 0,
    lapses: card.lapses ?? 0,
    nextReview: card.nextReview ?? now(),
  };
}

// ---- Core SRS function ----

export function reviewCard(rawCard: Card, grade: Grade): Card {
  const card = normalizeCard(rawCard);
  const t = now();

  // --- CASE A: NEW CARD ---
  if (card.status === "new") {
    if (grade === "wrong") {
      // NEW + WRONG → go into learning, first step
      card.status = "learning";
      card.learningStep = 0;
      card.nextReview = t + LEARNING_STEPS_MIN[0] * 60_000;
      return card;
    }

    if (grade === "easy") {
      // NEW + EASY → graduate immediately as review with ~4d
      card.status = "review";
      card.reps += 1;
      card.interval = 4;
      card.nextReview = t + card.interval * DAY_MS;
      return card;
    }

    // NEW + GOOD/HARD → learning mode, step 0
    card.status = "learning";
    card.learningStep = 0;
    card.nextReview = t + LEARNING_STEPS_MIN[0] * 60_000;
    return card;
  }

  // --- CASE B: LEARNING / RELEARNING ---
  if (card.status === "learning" || card.status === "relearning") {
    const steps = card.status === "learning" ? LEARNING_STEPS_MIN : LAPSE_STEPS_MIN;

    if (grade === "wrong") {
      // Back to first step
      card.learningStep = 0;
      card.nextReview = t + steps[0] * 60_000;
      return card;
    }

    const nextStep = card.learningStep + 1;

    if (nextStep < steps.length) {
      // More learning steps left
      card.learningStep = nextStep;
      card.nextReview = t + steps[nextStep] * 60_000;
      return card;
    }

    // Finished all steps → graduate to REVIEW
    card.status = "review";
    card.learningStep = 0;
    card.reps += 1;

    // If this was genuinely new (no interval), start with 1 day
    if (card.interval <= 0) {
      card.interval = 1;
    }

    // Final grade after graduation
    if (grade === "good") {
      card.interval = Math.max(1, card.interval);
      // ease unchanged
    } else if (grade === "easy") {
      card.interval = Math.max(1, Math.round(card.interval * EASY_BONUS));
      card.ease = Math.max(MIN_EASE, card.ease + 0.15);
    } else if (grade === "hard") {
      card.interval = Math.max(1, Math.round(card.interval * 1.2));
      card.ease = Math.max(MIN_EASE, card.ease - 0.15);
    }

    card.nextReview = t + card.interval * DAY_MS;
    return card;
  }

  // --- CASE C: REVIEW (mature) CARD ---
  if (card.status === "review") {
    if (grade === "wrong") {
      // Lapse: turn into RELEARNING
      card.lapses += 1;
      card.status = "relearning";
      card.learningStep = 0;

      // Punish interval and ease
      card.interval = Math.max(1, Math.round(card.interval * LAPSE_INTERVAL_MULT));
      card.ease = Math.max(MIN_EASE, card.ease - 0.20);

      // First lapse step
      card.nextReview = t + LAPSE_STEPS_MIN[0] * 60_000;
      return card;
    }

    // Hard / Good / Easy → grow interval
    if (grade === "hard") {
      card.interval = Math.max(1, Math.round(card.interval * 1.2));
      card.ease = Math.max(MIN_EASE, card.ease - 0.15);
    } else if (grade === "good") {
      card.interval = Math.max(1, Math.round(card.interval * card.ease));
      // ease unchanged
    } else if (grade === "easy") {
      card.interval = Math.max(1, Math.round(card.interval * card.ease * EASY_BONUS));
      card.ease = Math.max(MIN_EASE, card.ease + 0.15);
    }

    card.reps += 1;
    card.nextReview = t + card.interval * DAY_MS;
    return card;
  }

  // Fallback (shouldn't happen)
  card.nextReview = t + DAY_MS;
  return card;
}
