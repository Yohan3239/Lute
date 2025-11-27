import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Session } from "../lib/session";
import { getDueCards } from "../lib/queue";
import { Card, Deck, ReviewVariant, VariantCard } from "../lib/types";
import { listDecks } from "../lib/decks";
import { generateMCQ, generateCloze, generateTrueFalse } from "../lib/llm";
export default function Review() {
  const { deckId } = useParams();

  const [session, setSession] = useState<Session | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Prevents recreating the session during grading
  const sessionRef = useRef<Session | null>(null);

  const reviewMode = Boolean(deckId);

  // -------------------------------------------------
  // 1) Review Home (choose a deck)
  // -------------------------------------------------
  useEffect(() => {
    if (!reviewMode) {
      listDecks().then(setDecks);
      window.api.readCards().then(setCards);
    }
  }, [reviewMode]);

  // -------------------------------------------------
  // 2) Enter Review Mode (load session ONCE)
  // -------------------------------------------------
  useEffect(() => {
    if (!deckId) return;
    (async () => {
      const all = await window.api.readCards();
      const filtered = all.filter((c) => c.deckId === deckId);
      const due = getDueCards(filtered);
      
      const VariantList : VariantCard[] = await Promise.all(
        due.map(async (card) => {
          const rand = Math.random();
          const variant =
          rand < 0.33 ? await generateCloze(card) : rand < 0.66 ? await generateMCQ(card) : await generateTrueFalse(card);
          return { ...card, variant}
        })
      );
      
      const s = new Session(VariantList);
      sessionRef.current = s;
      setSession(s);

      setFinished(due.length === 0);
    })();
  }, [deckId]);

  // -------------------------------------------------
  // CASE 1: Review homepage (deck list)
  // -------------------------------------------------
  if (!reviewMode) {
    const countDue = (id: string) =>
      cards.filter((c) => c.deckId === id && c.nextReview <= Date.now()).length;

    return (
      <div className="text-white p-6">
        <h1 className="text-2xl mb-4">Pick a deck to review</h1>

        <div className="flex flex-col divide-y divide-white/10 border border-white/10 rounded-lg">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              to={`/review/${deck.id}`}
              className="px-4 py-3 hover:bg-white/5 transition-colors flex justify-between"
            >
              <div className="font-medium">{deck.name}</div>
              <div className="opacity-60 text-sm">{countDue(deck.id)} due</div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------
  // CASE 2: Session finished
  // -------------------------------------------------
  if (finished) {
    return (
      <div className="text-white p-6">
        <h1 className="text-2xl mb-4">🎉 Session complete!</h1>
        <p className="opacity-70 mb-4">You're all done for today.</p>

        <Link
          to={`/review`}
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
        >
          Back to review menu
        </Link>
      </div>
    );
  }

  // -------------------------------------------------
  // CASE 3: Active review session
  // -------------------------------------------------
  if (!session) return <div className="text-white p-6">Loading…</div>;

  const card = session.current;
  if (!card) {
    setFinished(true);
    return <div className="text-white p-6">Finishing...</div>;
  }

  // -------------------------------------------------
  // Grade handler
  // -------------------------------------------------
  const handleGrade = async (grade: "easy" | "good" | "hard" | "wrong") => {
    const s = sessionRef.current;
    if (!s) return;

    const updated = s.grade(grade);
    if (!updated) return;

    // Save updated card
    const all = await window.api.readCards();
    const saved = all.map((c) => (c.id === updated.id ? updated : c));
    await window.api.saveCards(saved);

    if (s.isFinished()) {
      setFinished(true);
    } else {
      // Force re-render but DO NOT recreate session
      setSession(new Session([...s.results])); // safe shallow copy
      sessionRef.current = s;
    }
  };
  const v = card.variant;

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl mb-4">Reviewing…</h1>

      <div className="grid gap-3">
        <div className="p-4 border border-white/20 rounded">
          <span className="text-sm opacity-60 mb-1">Question   </span>
          <span className="px-2 py-0.5 text-xs rounded bg-white/10 border border-white/20">
            {v ? (v.type === "mcq" ? "MCQ" : v.type === "cloze" ? "Cloze" : "True/False") : "Flashcard"}
          </span>
          <div>{card.variant?.prompt}</div>
        </div>

        <div className="p-4 border border-white/20 rounded">
          <span className="text-sm opacity-60 mb-1">Options   </span>

          {v?.type === "mcq" && (
            <ul className="mt-3 space-y-2">
              {v.options.map((opt, i) => (
                <li key={i} className="p-2 rounded bg-white/5 border border-white/10">
                  <button 
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:bg-gray-600 disabled:opacity-50"
                  onClick={() => ""}>{opt}</button>
                </li>
              ))}
            </ul>
          )}
       </div>

      </div>

    </div>
  );
}
