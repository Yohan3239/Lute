import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Deck } from "../lib/types";
import { listDecks } from "../lib/decks";
import { DEFAULT_SETTINGS } from "./Settings";

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    window.api.readCards().then(setCards);
    listDecks().then(setDecks);
  }, []);

  const now = Date.now();

  // ---- Today Stats ----
  const dueToday = cards.filter((c) => c.nextReview <= now).length;
  const newCards = cards.filter((c) => c.status === "new").length;
  const learningDue = cards.filter(
    (c) => c.status === "learning" && c.nextReview <= now
  ).length;

  // ---- Per-deck stats ----
  const deckStats = decks.map((deck) => {
    const deckCards = cards.filter((c) => c.deckId === deck.id);
    return {
      ...deck,
      total: deckCards.length,
      due: deckCards.filter((c) => c.nextReview <= now).length,
      new: deckCards.filter((c) => c.status === "new").length,
    };
  });

  // ---- 7-day forecast ----
  const forecast = Array(8).fill(0);

  cards.forEach((c) => {
    const days = Math.floor((c.nextReview - now) / (24 * 3600 * 1000));
    if (days >= 0 && days <= 7) forecast[days]++;
  });

  const loadDefaultMode = () => {
    try {
      const raw = localStorage.getItem("settings");
      if (!raw) return DEFAULT_SETTINGS.defaultMode;
      const parsed = JSON.parse(raw);
      return parsed.defaultMode || DEFAULT_SETTINGS.defaultMode;
    } catch {
      return DEFAULT_SETTINGS.defaultMode;
    }
  };

  const defaultMode = loadDefaultMode();
  const dayName = (i: number) =>
    i === 0 ? "Today" : i === 1 ? "Tomorrow" : `+${i} days`;

  return (
    <div className="text-gray-100 p-6 space-y-8">
      <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>

      {/* ---------------- TODAY STATS ---------------- */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)]">
          <div className="text-3xl font-bold">{dueToday}</div>
          <div className="opacity-70 text-gray-400">Due Today</div>
        </div>

        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)]">
          <div className="text-3xl font-bold">{newCards}</div>
          <div className="opacity-70 text-gray-400">New Cards</div>
        </div>

        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)]">
          <div className="text-3xl font-bold">{learningDue}</div>
          <div className="opacity-70 text-gray-400">Learning</div>
        </div>
      </div>

      {/* ---------------- PER DECK OVERVIEW ---------------- */}
      <div>
        <h2 className="text-xl mb-3">Decks</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deckStats.map((deck) => (
            
            <div
              key={deck.id}
              className="p-4 bg-[#111113] border border-white/5 rounded-lg hover:border-indigo-300/70 transition shadow-[0_0_30px_-10px_rgba(129,140,248,0.15)] flex flex-col gap-3"
            >
              <div className="flex flex-row justify-between">
                <div className="text-xl font-semibold">{deck.name}</div>
                <div className="opacity-70 mt-2 text-sm text-gray-400">
                  {deck.total} cards • {deck.due} due • {deck.new} new
                </div>
              </div>
              {defaultMode === "none" ? (
                <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20 mt-4">
                  <Link
                    className="flex-1 px-4 py-2 bg-white/10 text-gray-100 ring-white/70 hover:bg-white/30 border-white/20 transition text-center"
                    to={`/review/${deck.id}?mode=classic`}
                  >
                    Classic
                  </Link>

                  <Link
                    className="flex-1 px-4 py-2 bg-emerald-400/70 hover:bg-emerald-400/90 transition border-l border-white/20 text-center"
                    to={`/review/${deck.id}?mode=ai`}
                  >
                    Quiz
                  </Link>
                </div>
              ) : (
                <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20 mt-4">
                  <Link
                    className="flex-1 px-4 py-2 transition text-center bg-emerald-400/70 hover:bg-emerald-400/90 text-white"
                    to={`/review/${deck.id}?mode=${defaultMode}`}
                  >
                    Review
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- FORECAST ---------------- */}
      <div>
        <h2 className="text-xl mb-3">7-Day Review Forecast</h2>

        <div className="space-y-2">
          {forecast.map((count, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 opacity-70 text-gray-400">{dayName(i)}</div>
              <div className="flex-1 h-2 bg-white/5 rounded">
                <div
                  className="h-2 bg-indigo-400/80 rounded shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]"
                  style={{ width: `${Math.min(count * 8, 100)}%` }}
                ></div>
              </div>
              <div className="w-10 text-right opacity-80 text-gray-300">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
