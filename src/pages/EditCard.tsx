import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../lib/types";

export default function EditCard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [card, setCard] = useState<Card | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  // Load the card
  useEffect(() => {
    window.api.readCards().then((all) => {
      const found = all.find((c: Card) => c.id === id);
      if (found) {
        setCard(found);
        setQuestion(found.question);
        setAnswer(found.answer);
      }
    });
  }, [id]);

  if (!card) return <div className="text-white p-6">Loading...</div>;

  // Save updated card
  const handleSave = async () => {
    const all = await window.api.readCards();
    const updated = all.map((c) =>
      c.id === id
        ? {
            ...c,
            question: question.trim(),
            answer: answer.trim(),
            deckId: card.deckId,      // ⭐ Preserve deckId explicitly
          }
        : c
    );

    await window.api.saveCards(updated);

    // ⭐ Go back to the deck
    navigate(`/decks/${card.deckId}`);
  };

  // Delete card
  const handleDelete = async () => {
    const all = await window.api.readCards();
    const updated = all.filter((c) => c.id !== id);

    await window.api.saveCards(updated);

    // ⭐ Go back to the deck
    navigate(`/decks/${card.deckId}`);
  };

  return (
    <>
      <div className="text-white p-6">
        <h1 className="text-2xl mb-6">Edit Card</h1>

        <div className="flex flex-col gap-4">
          <input
            className="p-2 rounded bg-[#1a1a1a] border border-white/20"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question"
          />

          <textarea
            className="p-2 h-28 rounded bg-[#1a1a1a] border border-white/20"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer"
          />

          <button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          >
            Save Changes
          </button>

          <button
            onClick={() => setShowDelete(true)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded mt-4"
          >
            Delete Card
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-6 rounded-lg w-80 border border-white/20">
            <h2 className="text-xl mb-4 text-red-400">Delete this card?</h2>
            <p className="text-sm opacity-70 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDelete(false)}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700"
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
