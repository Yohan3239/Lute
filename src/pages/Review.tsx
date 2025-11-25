import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Session } from "../lib/session";
import { getDueCards } from "../lib/queue";
import { Card } from "../lib/types";

export default function Review() {
  const { deckId } = useParams();

  const [session, setSession] = useState<Session | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [tick, setTick] = useState(0);

  // Load deck cards & start session
  useEffect(() => {
    window.api.readCards().then((all) => {
      const filtered = deckId
        ? all.filter((c: Card) => c.deckId === deckId)
        : all;

      const due = getDueCards(filtered);
      setSession(new Session(due));
    });
  }, [deckId]);

  if (!session) return <div className="text-white p-6">Loading...</div>;
  if (!session.current)
    return <div className="text-white p-6">No cards due!</div>;

  const card = session.current;

  const handleGrade = async (g: "easy" | "good" | "hard" | "wrong") => {
    // Update the in-memory card
    session.grade(g);

    // Persist updated card to JSON
    const all = await window.api.readCards();
    const updated = all.map((c) =>
      c.id === card.id ? session.current : c
    );
    await window.api.saveCards(updated);

    setFlipped(false);
    setTick((t) => t + 1); // force re-render
  };

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl mb-4">
        {deckId ? "Reviewing deck" : "Review"}{" "}
        {deckId && <span className="opacity-70 text-base">({deckId})</span>}
      </h1>

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
