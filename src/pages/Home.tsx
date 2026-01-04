import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Deck } from "../lib/types";
import { listDecks } from "../lib/decks";
import { DEFAULT_SETTINGS } from "../lib/constants";
import { getSaveExists } from "./Review";

function readStreak() {
  return {
    globalStreak: Number(localStorage.getItem("globalStreak") || "0"),
    lastStreakDate: localStorage.getItem("lastStreakDate") || "",
  };
}

const resetStreak = () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastStreakDate = localStorage.getItem("lastStreakDate") || "1970-01-01";
  
  if (lastStreakDate === today || lastStreakDate === yesterday) {
    return; // is fine
  } else {
    localStorage.setItem("globalStreak", "0");
  }
}
export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [{ globalStreak, lastStreakDate }, setStreakState] = useState(readStreak);

  useEffect(() => {
    resetStreak();
    setStreakState(readStreak());
    window.api.readCards().then(setCards);
    listDecks().then(setDecks);
  }, []);

  useEffect(() => {
    // refresh when returning to the tab/home
    const onFocus = () => {
      resetStreak();

      setStreakState(readStreak());
    }
    
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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


      <div className="grid grid-cols-4 gap-4">

        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)]">
          <div className="text-3xl font-bold hover:scale-105">{dueToday}</div>
          <div className="opacity-70 text-gray-400">Due Today</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)]">
          <div className="text-3xl font-bold hover:scale-105">{newCards}</div>
          <div className="opacity-70 text-gray-400">New Cards</div>
        </div>

        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)]">
          <div className="text-3xl font-bold hover:scale-105">{learningDue}</div>
          <div className="opacity-70 text-gray-400">Learning</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/5 rounded-lg shadow-[0_0_30px_-10px_rgba(129,140,248,0.2)] ">
          {globalStreak > 0 && 
          <div className="text-5xl font-bold text-indigo-300 hover:scale-105">{globalStreak }</div>
          } 
          {globalStreak === 0 &&
          <div className="text-3xl font-bold text-gray-500 hover:scale-105">{globalStreak}</div>
          }
          <div className="text-sm tracking-wide text-gray-400">Streak</div>
          <div className="text-xs tracking-wide text-gray-400/70">
            Last Review: {lastStreakDate}
          </div>
        </div>
      </div>

      {/* ---------------- PER DECK OVERVIEW ---------------- */}
      <div>
        <h2 className="text-xl mb-3">Decks</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deckStats.map((deck) => {
            const save = getSaveExists(deck);
            const otherModeActive = defaultMode === "ai" ? save.classicSaveExists : save.aiSaveExists;
            return (
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
                  <Link className={`${save.aiSaveExists ? "opacity-40 cursor-not-allowed pointer-events-none" : ""} flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-gray-100 ring-white/70 hover:bg-white/30 border-white/20 transition`}
                    to={`/review/${deck.id}?mode=classic`}
                    onClick={(e) => {
                      if (save.aiSaveExists) {
                        e.preventDefault();
                      }
                    }} 
                  >
                    {save.aiSaveExists ? "Session in progress" : "Classic"}
                  </Link>

                  <Link className={`${save.classicSaveExists ? "opacity-40 cursor-not-allowed pointer-events-none" : ""} flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 text-white font-semibold px-4 py-2 border-l border-white/20 shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 transition`}
                    to={`/review/${deck.id}?mode=ai`} 
                      onClick={(e) => {
                      if (save.classicSaveExists) {
                        e.preventDefault();
                      }
                    }} 
                  >
                    {save.classicSaveExists ? "Session in progress" : "Quiz"}
                  </Link>
                </div>
              ) : (
                <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20 mt-4">
                  <Link
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-none bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 text-white font-semibold px-4 py-2 shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 transition ${otherModeActive ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
                    to={`/review/${deck.id}?mode=${defaultMode}`}
                    onClick={(e) => {
                      if (otherModeActive) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {otherModeActive ? "Other mode in progress" : "Review"}
                  </Link>
                </div>
              )}
            </div>
          )})}

            
          
            
            
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
                  className="h-2 bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 rounded shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]"
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
