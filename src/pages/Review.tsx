import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Session } from "../lib/session";
import { getDueCards } from "../lib/queue";
import { Card, Deck } from "../lib/types";
import { listDecks } from "../lib/decks";

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

    window.api.readCards().then((all) => {
      const filtered = all.filter((c) => c.deckId === deckId);
      const due = getDueCards(filtered);

      const s = new Session(due);
      sessionRef.current = s;
      setSession(s);

      setFinished(due.length === 0);
    });
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

    setFlipped(false);

    if (s.isFinished()) {
      setFinished(true);
    } else {
      // Force re-render but DO NOT recreate session
      setSession(new Session([...s.results])); // safe shallow copy
      sessionRef.current = s;
    }
  };

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl mb-4">Reviewing…</h1>

      <div
        className="p-8 border border-white/20 rounded-lg cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
        {!flipped ? card.question : card.answer}
      </div>

      {flipped && (
        <div className="flex gap-4 mt-4">
          <button onClick={() => handleGrade("easy")}>Easy</button>
          <button onClick={() => handleGrade("good")}>Good</button>
          <button onClick={() => handleGrade("hard")}>Hard</button>
          <button onClick={() => handleGrade("wrong")}>Wrong</button>
        </div>
      )}
    </div>
  );
}
