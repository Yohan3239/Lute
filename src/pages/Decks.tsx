import { useEffect, useState, useMemo } from "react";
import { Deck } from "../lib/types";
import { listDecks, createDeck } from "../lib/decks";
import { Link } from "react-router-dom";
import { Card } from "../lib/types";
import { DEFAULT_DECK_ID } from "../lib/constants";

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

  // 👉 SAFELY sort decks without causing rerenders
  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      if (a.id === DEFAULT_DECK_ID) return -1;
      if (b.id === DEFAULT_DECK_ID) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [decks]);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    await createDeck(newName.trim());
    setNewName("");
    setShowCreate(false);

    setDecks(await listDecks()); // refresh
  };

  const countCards = (deckId: string) =>
    cards.filter((c) => c.deckId === deckId).length;

  return (
    <div className="text-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded bg-emerald-500/80 text-emerald-50 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)] hover:bg-emerald-500"
        >
          New Deck
        </button>
      </div>

      {/* Deck list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedDecks.map((deck) => (
          <Link
            key={deck.id}
            to={`/decks/${deck.id}`}
            className="p-4 bg-[#111113] rounded-lg border border-white/5 hover:border-indigo-300/70 transition shadow-[0_0_30px_-10px_rgba(129,140,248,0.15)]"
          >
            <div className="flex items-center gap-2 text-xl font-semibold">
              {deck.name}

              {deck.id === DEFAULT_DECK_ID && (
                <span className="text-xs px-2 py-1 rounded bg-white/10 uppercase opacity-80">
                  DEFAULT
                </span>
              )}
            </div>

            <div className="opacity-60 mt-2 text-sm">
              {countCards(deck.id)} cards
            </div>
          </Link>
        ))}
      </div>

      {/* Create Deck Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#16161a] p-6 rounded-lg w-80 border border-white/10">
            <h2 className="text-xl mb-4">Create Deck</h2>

            <input
              className="w-full p-2 rounded bg-[#111113] border border-white/10"
              placeholder="Deck name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 rounded bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                className="px-3 py-1 rounded bg-emerald-500/80 text-emerald-50 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)] hover:bg-emerald-500"
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
