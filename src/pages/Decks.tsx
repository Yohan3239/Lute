import { useEffect, useState } from "react";
import { Deck } from "../lib/types";
import { listDecks, createDeck } from "../lib/decks";
import { Link } from "react-router-dom";
import { Card } from "../lib/types";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  // Load decks + cards on page load
  useEffect(() => {
    listDecks().then(setDecks);
    window.api.readCards().then(setCards);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createDeck(newName.trim());
    setNewName("");
    setShowCreate(false);
    setDecks(await listDecks()); // refresh
  };

  // Count cards in each deck
  const countCards = (deckId: string) =>
    cards.filter((c) => c.deckId === deckId).length;

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Decks</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          New Deck
        </button>
      </div>

      {/* Deck list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decks.map((deck) => (
          <Link
            key={deck.id}
            to={`/decks/${deck.id}`}
            className="p-4 bg-[#111] rounded-lg border border-white/10 hover:border-purple-400 transition"
          >
            <div className="text-xl font-semibold">{deck.name}</div>
            <div className="opacity-60 mt-2 text-sm">
              {countCards(deck.id)} cards
            </div>
          </Link>
        ))}
      </div>

      {/* Create Deck Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-6 rounded-lg w-80 border border-white/20">
            <h2 className="text-xl mb-4">Create Deck</h2>

            <input
              className="w-full p-2 rounded bg-[#222] border border-white/20"
              placeholder="Deck name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
