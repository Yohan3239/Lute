import { useEffect, useState } from "react";
import { Card, Deck } from "../lib/types";
import { listDecks } from "../lib/decks";
import { Link } from "react-router-dom";

export default function Browse() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [currentDeck, setCurrentDeck] = useState<string | "all">("all");

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
  const handleBulkDelete = async () => {
    const all = await window.api.readCards();
    const updated = all.filter((c) => !selected.includes(c.id));

    await window.api.saveCards(updated);
    setCards(updated);
    setSelected([]);
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
    <div className="text-white flex h-full">

      {/* LEFT SIDEBAR */}
      <div className="w-60 border-r border-white/10 p-4">
        <h2 className="mb-3 text-lg font-semibold">Decks</h2>

        {/* All cards option */}
        <div
          className={`p-2 rounded cursor-pointer ${
            currentDeck === "all" ? "bg-white/10" : ""
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
              currentDeck === deck.id ? "bg-white/10" : ""
            }`}
            onClick={() => setCurrentDeck(deck.id)}
          >
            {deck.name}
          </div>
        ))}
      </div>

      {/* MAIN TABLE AREA */}
      <div className="flex-1 p-4 overflow-auto">

        <h1 className="text-2xl mb-4">Browse</h1>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="flex gap-3 mb-4">
            <button
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              onClick={handleBulkDelete}
            >
              Delete ({selected.length})
            </button>

            <select
              className="bg-gray-700 px-3 py-1 rounded"
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

        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-white/20">
            <tr>
              <th className="p-2 w-8"></th>
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
                    className="border-b border-white/10 hover:bg-white/5"
                >
                    <td className="p-2">
                    <input
                        type="checkbox"
                        checked={selected.includes(card.id)}
                        onChange={() => toggleSelect(card.id)}
                    />
                    </td>

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
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
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
