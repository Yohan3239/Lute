import { useEffect, useState } from "react";
import { Card, Deck } from "../lib/types";
import { createNewCard } from "../lib/defaults";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { DEFAULT_DECK_ID } from "../lib/constants";
import { listDecks } from "../lib/decks";

export default function AddCard() {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [status, setStatus] = useState<null | "saved" | "error">(null);

    // ⭐ get ?deckId=xxxx from URL
    const location = useLocation();
    const deckId = location.state?.deckId || null;
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState(
        deckId ?? DEFAULT_DECK_ID
    );

    const navigate = useNavigate();
        useEffect(() => {
        listDecks().then(setDecks);
        }, []);

    useEffect(() => {
        if (!deckId) {
        console.warn("No deckId provided!");
        }
    }, [deckId]);

    const handleSave = async () => {
        try {
            const existingCards = await window.api.readCards();

            // ⭐ new card attached to deckId
            const newCard: Card = {
                ...createNewCard(question, answer),
                deckId: selectedDeckId,
            };

            const updated = [...existingCards, newCard];
            await window.api.saveCards(updated);

            setStatus("saved");

            // optional: redirect back to deck
            navigate(`/decks/${selectedDeckId}`);

            } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl mb-4">Add New Card</h1>



      <div className="flex flex-col gap-4">
        <div>
            <label className="opacity-70 text-sm">Deck</label>
            <select
                className="p-2 bg-[#1a1a1a] border border-white/20 rounded w-full mt-1"
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
            >
                {decks.map((d) => (
                <option key={d.id} value={d.id}>
                    {d.name}
                </option>
                ))}
            </select>
        </div>

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
