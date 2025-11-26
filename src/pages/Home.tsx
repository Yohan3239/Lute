import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Deck } from "../lib/types";
import { listDecks } from "../lib/decks";

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

  const dayName = (i: number) =>
    i === 0 ? "Today" : i === 1 ? "Tomorrow" : `+${i} days`;

  return (
    <div className="text-white p-6 space-y-8">
      <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>

      {/* ---------------- TODAY STATS ---------------- */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[#111] border border-white/10 rounded-lg">
          <div className="text-3xl font-bold">{dueToday}</div>
          <div className="opacity-70">Due Today</div>
        </div>

        <div className="p-4 bg-[#111] border border-white/10 rounded-lg">
          <div className="text-3xl font-bold">{newCards}</div>
          <div className="opacity-70">New Cards</div>
        </div>

        <div className="p-4 bg-[#111] border border-white/10 rounded-lg">
          <div className="text-3xl font-bold">{learningDue}</div>
          <div className="opacity-70">Learning</div>
        </div>
      </div>

      {/* ---------------- QUICK ACTIONS ---------------- */}
      <div className="flex gap-3">
        <Link
          to="/add"
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
        >
          + Add Card
        </Link>
        <Link
          to="/browse"
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Browse
        </Link>
        <Link
          to="/decks"
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Decks
        </Link>
      </div>

      {/* ---------------- PER DECK OVERVIEW ---------------- */}
      <div>
        <h2 className="text-xl mb-3">Your Decks</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deckStats.map((deck) => (
            <Link
              to={`/review/${deck.id}`}
              key={deck.id}
              className="p-4 bg-[#111] border border-white/10 rounded-lg hover:border-purple-400 transition"
            >
              <div className="text-xl font-semibold">{deck.name}</div>
              <div className="opacity-70 mt-2 text-sm">
                {deck.total} cards • {deck.due} due • {deck.new} new
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ---------------- FORECAST ---------------- */}
      <div>
        <h2 className="text-xl mb-3">7-Day Review Forecast</h2>

        <div className="space-y-2">
          {forecast.map((count, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 opacity-70">{dayName(i)}</div>
              <div className="flex-1 h-2 bg-white/10 rounded">
                <div
                  className="h-2 bg-purple-500 rounded"
                  style={{ width: `${Math.min(count * 8, 100)}%` }}
                ></div>
              </div>
              <div className="w-10 text-right opacity-80">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
