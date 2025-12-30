import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../lib/types";
import { useLocation } from "react-router-dom";
import { listDecks } from "../lib/decks";
import { Deck } from "../lib/types";

export default function EditCard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromDeckId = location.state?.deckId ?? null;

    const [card, setCard] = useState<Card | null>(null);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [showDelete, setShowDelete] = useState(false);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>("");

    // Load the card
    useEffect(() => {
        window.api.readCards().then((all) => {
            const found = all.find((c: Card) => c.id === id);
            if (found) {
            setCard(found);
            setQuestion(found.question);
            setAnswer(found.answer);
            setSelectedDeckId(found.deckId);   // ⭐ set initial deck
            }
        });
        listDecks().then(setDecks); // ⭐ load all decks
    }, [id]);


    if (!card) return <div className="text-gray-100 p-6">Loading...</div>;

    // Save updated card
    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) {
            return; // or show error
        }

        const all = await window.api.readCards();
        const updated = all.map((c) =>
        c.id === id
            ? {
                ...c,
                question: question.trim(),
                answer: answer.trim(),
                deckId: selectedDeckId,  // ⭐ move card to new deck
            }
        : c
    );

    await window.api.saveCards(updated);

    if (fromDeckId) {
    navigate(`/decks/${fromDeckId}`);
    } else {
    navigate("/browse");
    }

  };

  // Delete card
  const handleDelete = async () => {
    const all = await window.api.readCards();
    const updated = all.filter((c) => c.id !== id);

    await window.api.saveCards(updated);

    // ⭐ Go back to the deck
    if (fromDeckId) {
    navigate(`/decks/${fromDeckId}`);
    } else {
    navigate("/browse");
    }
  };

  return (
    <>
      <div className="text-gray-100 p-6">
        <h1 className="text-2xl mb-6">Edit Card</h1>

        <div className="flex flex-col gap-4">
        <div>
            <label className="opacity-70 text-sm">Deck</label>
            <select
                className="p-2 rounded bg-[#111113] border border-white/10 w-full mt-1 text-gray-100"
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
                className="p-2 rounded bg-[#111113] border border-white/10 text-gray-100"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Question"
            />

            <textarea
                className="p-2 h-28 rounded bg-[#111113] border border-white/10 text-gray-100"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer"
            />

                <button
                className="px-4 py-2 rounded bg-emerald-500/80 text-emerald-50 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)] hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none disabled:ring-0"
                onClick={handleSave}
                disabled={!question.trim() || !answer.trim()}
                >
                Save Card
                </button>

            <button
                onClick={() => setShowDelete(true)}
                className="px-4 py-2 rounded mt-4 bg-rose-500/80 text-rose-50 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)] hover:bg-rose-500"
            >
                Delete Card
            </button>
            </div>
        </div>

        {showDelete && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-[#16161a] p-6 rounded-lg w-80 border border-white/10">
                <h2 className="text-xl mb-4 text-rose-300">Delete this card?</h2>
                <p className="text-sm opacity-70 mb-6 text-gray-400">
                This action cannot be undone.
                </p>

                <div className="flex justify-end gap-4">
                <button
                    onClick={() => setShowDelete(false)}
                    className="px-3 py-1 rounded bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
                >
                    Cancel
                </button>

                <button
                    onClick={handleDelete}
                    className="px-3 py-1 rounded bg-rose-500/80 text-rose-50 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)] hover:bg-rose-500"
                >
                    Delete
                </button>
                </div>
            </div>
            </div>
        )}
        </>
    );
}
