import { Card } from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import { getTodayString } from "./dateUtils";

export function getDueCards(cards: Card[], deckId: string): Card[] {
  const loadDeckSettings = () => {
    const raw = localStorage.getItem(`deck-${deckId}-settings`);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };
  const loadSettings = () => {
    const raw = localStorage.getItem(`deck-${deckId}-settings`);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };
  const deckSettings = loadDeckSettings();
  const settings = loadSettings();
  const maxNewCards = deckSettings?.dailyLimit ?? settings?.dailyLimit ?? DEFAULT_SETTINGS.dailyLimit;
  
  const now = Date.now();
  const isDue = (c: Card) => c.nextReview !== undefined && c.nextReview <= now;

  const sortByLateness = (a: Card, b: Card) => (now - a.nextReview!) - (now - b.nextReview!);

    const learningCards = cards
    .filter(c => c.status === "learning" && isDue(c))
    .sort(sortByLateness);

  const relearningCards = cards
    .filter(c => c.status === "relearning" && isDue(c))
    .sort(sortByLateness);

  const reviewingCards = cards
    .filter(c => c.status === "review" && isDue(c))
    .sort(sortByLateness);
  const today = getTodayString();
  const todayNewCount = Number(localStorage.getItem(`newCount-${deckId}-${today}`) ?? 0);
  const newCards = cards
    .filter(c => c.status === "new")
    .sort(sortByLateness)
    .slice(0, maxNewCards - todayNewCount);
  


  return [...learningCards, ...relearningCards, ...reviewingCards, ...newCards];
}
export function getNewCount(deckId: string, availableNew: number) {
  const today = getTodayString();
    const loadDeckSettings = () => {
    const raw = localStorage.getItem(`deck-${deckId}-settings`);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };
  const loadSettings = () => {
    const raw = localStorage.getItem(`deck-${deckId}-settings`);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };
  const deckSettings = loadDeckSettings();
  const settings = loadSettings();
  const maxNewCards = deckSettings?.dailyLimit ?? settings?.dailyLimit ?? DEFAULT_SETTINGS.dailyLimit;
  const todayNewCount = Number(localStorage.getItem(`newCount-${deckId}-${today}`) ?? 0);
  return Math.min(availableNew, Math.max(0, maxNewCards - todayNewCount));
}