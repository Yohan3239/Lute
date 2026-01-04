import { useEffect, useState } from "react";
import { Card, Deck } from "../lib/types";
import { listDecks } from "../lib/decks";
import { Link } from "react-router-dom";

export default function Browse() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [currentDeck, setCurrentDeck] = useState<string | "all">("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // --------------------------
  // Load cards + decks
  // --------------------------
  useEffect(() => {
    listDecks().then(setDecks);
    window.api.readCards().then(setCards);
  }, []);

  // --------------------------
  // Helpers
  // --------------------------
  const filteredCards =
    currentDeck === "all"
      ? cards
      : cards.filter((c) => c.deckId === currentDeck);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  // --------------------------
  // Bulk Delete
  // --------------------------
  const handleDeleteClick = async () => {
    setShowDeleteConfirm(true);
  }
  const handleBulkDelete = async () => {
    const all = await window.api.readCards();
    const updated = all.filter((c) => !selected.includes(c.id));

    await window.api.saveCards(updated);
    setCards(updated);
    setSelected([]);
  };

  // Toggle select all visible cards
  const handleSelectAll = () => {
    const visibleIds = filteredCards.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selected.includes(id));

    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !visibleIds.includes(id)) // unselect visible
        : Array.from(new Set([...prev, ...visibleIds])) // add visible
    );
  };

  // --------------------------
  // Bulk Move to Deck
  // --------------------------
  const handleMoveToDeck = async (targetDeck: string) => {
    if (!targetDeck) return;

    const all = await window.api.readCards();

    const updated = all.map((c) =>
      selected.includes(c.id) ? { ...c, deckId: targetDeck } : c
    );

    await window.api.saveCards(updated);
    setCards(updated);
    setSelected([]);
  };

  // --------------------------
  // UI
  // --------------------------
  return (
    <div className="text-gray-100 flex h-full">

      {/* LEFT SIDEBAR */}
      <div className="w-60 border-r border-white/5 p-4 bg-[#111113]">
        <h2 className="mb-3 text-lg font-semibold">Decks</h2>

        {/* All cards option */}
        <div
          className={`p-2 rounded cursor-pointer ${
            currentDeck === "all" ? "bg-[#16161a] " : "hover:bg-white/5"
          }`}
          onClick={() => setCurrentDeck("all")}
        >
          All Cards
        </div>

        {/* Deck list */}
        {decks.map((deck) => (
          <div
            key={deck.id}
            className={`p-2 rounded cursor-pointer mt-1 ${
              currentDeck === deck.id ? "bg-[#16161a]" : "hover:bg-white/5"
            }`}
            onClick={() => setCurrentDeck(deck.id)}
          >
            {deck.name}
          </div>
        ))}
      </div>

      {/* MAIN TABLE AREA */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Bulk actions */}

        
          <div className="flex gap-3 mb-4">
            <button 
              className="px-4 py-2 rounded text-sm bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
              onClick={handleSelectAll}
              >Select All ({filteredCards.length})
            </button>
            {selected.length > 0 && (
              <div>
              <button
                className="px-3 py-1 rounded bg-rose-500/80 text-rose-50 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)] hover:bg-rose-500"
                onClick={handleDeleteClick}
              >
                Delete ({selected.length})
              </button>
            
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                  <div className="bg-[#16161a] p-4 rounded border border-white/10">
                    <p>Are you sure? This action cannot be reversed.</p>
                    <div className="mt-4 flex gap-2 justify-end">
                      <button className="px-4 py-2 rounded text-sm bg-rose-500/80 text-rose-50 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)] hover:bg-rose-500" 
                      onClick={() => {setShowDeleteConfirm(false); handleBulkDelete();}}>Delete</button>
                      <button className="px-4 py-2 rounded text-sm bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
                      onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              <select
                className="bg-[#16161a] border border-white/10 px-3 py-1 rounded text-gray-200"
                defaultValue=""
                onChange={(e) => handleMoveToDeck(e.target.value)}
              >
                <option value="" disabled>
                  Move to deck…
                </option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
              </div>
            )}
          </div>

        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-white/20">
            <tr>
              <th className="p-2">Question</th>
              <th className="p-2">Answer</th>
              <th className="p-2">Deck</th>
              <th className="p-2">Next Review</th>
            </tr>
          </thead>

          <tbody>
            {filteredCards.map((card) => {
                const deckName =
                decks.find((d) => d.id === card.deckId)?.name ?? "—";

                return (
                <tr
                
                    key={card.id}
                    onClick={() => toggleSelect(card.id)}
                    className={`border-b border-white/10 hover:bg-white/5 ${selected.includes(card.id) ? "bg-white/10" : ""}`}
                >

                    <td className="p-2">
                    <Link
                        to={`/cards/${card.id}`}
                        className="hover:underline"
                    >
                        {card.question}
                    </Link>
                    </td>

                    <td className="p-2 opacity-80">
                    {card.answer}
                    </td>

                    <td className="p-2">
                    {deckName}
                    </td>

                    <td className="p-2 opacity-75">
                    {new Date(card.nextReview).toLocaleDateString()}
                    </td>

                    {/* ⭐ EDIT BUTTON */}
                    <td className="p-2">
                    <Link
                        to={`/cards/${card.id}`}
                        className="px-3 py-1 rounded text-sm bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
                    >
                        Edit
                    </Link>
                    </td>
                </tr>
                );
            })}
            </tbody>

        </table>

      </div>
    </div>
  );
}
