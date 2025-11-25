import { useEffect, useState } from "react";
import { Card } from "../lib/types";
import { createNewCard } from "../lib/defaults";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function AddCard() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<null | "saved" | "error">(null);

  // ⭐ get ?deckId=xxxx from URL
  const location = useLocation();
  const deckId = location.state?.deckId || null;

  const navigate = useNavigate();

  useEffect(() => {
    if (!deckId) {
      console.warn("No deckId provided!");
    }
  }, [deckId]);

  const handleSave = async () => {
    try {
      if (!deckId) {
        setStatus("error");
        return;
      }

      const existingCards = await window.api.readCards();

      // ⭐ new card attached to deckId
      const newCard: Card = {
        ...createNewCard(question, answer),
        deckId,
      };

      const updated = [...existingCards, newCard];
      await window.api.saveCards(updated);

      setStatus("saved");

      // optional: redirect back to deck
      navigate(`/decks/${deckId}`);

    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl mb-4">Add New Card</h1>

      {!deckId && (
        <div className="text-red-400 mb-4">
          ⚠️ Error: No deck selected.
        </div>
      )}

      <div className="flex flex-col gap-4">

        <input
          className="p-2 rounded bg-[#1a1a1a] border border-white/20"
          placeholder="Question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <textarea
          className="p-2 h-28 rounded bg-[#1a1a1a] border border-white/20"
          placeholder="Answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <button
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          onClick={handleSave}
          disabled={!deckId}
        >
          Save Card
        </button>

        {status === "saved" && (
          <div className="text-green-400">Card saved!</div>
        )}
        {status === "error" && (
          <div className="text-red-400">Error saving card!</div>
        )}
      </div>
    </div>
  );
}
