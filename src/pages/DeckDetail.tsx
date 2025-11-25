import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Deck, Card } from "../lib/types";
import { listDecks, renameDeck, deleteDeck } from "../lib/decks";

export default function DeckDetail() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  // Load deck + cards for this deck
  useEffect(() => {
    if (!deckId) return;

    listDecks().then((allDecks) => {
      const found = allDecks.find((d) => d.id === deckId) || null;
      setDeck(found);
      if (found) setNewName(found.name);
    });

    window.api.readCards().then((allCards) => {
      const filtered = allCards.filter((c: Card) => c.deckId === deckId);
      setCards(filtered);
    });
  }, [deckId]);

  const handleRename = async () => {
    if (!deckId || !newName.trim()) return;
    await renameDeck(deckId, newName.trim());
    const updatedDecks = await listDecks();
    const updated = updatedDecks.find((d) => d.id === deckId) || null;
    setDeck(updated);
    setShowRename(false);
  };

  const handleDelete = async () => {
    if (!deckId) return;

    const allCards = await window.api.readCards();
    const remaining = allCards.filter((c: Card) => c.deckId !== deckId);
    await window.api.saveCards(remaining);

    await deleteDeck(deckId);
    navigate("/decks");
  };

  if (!deck) {
    return (
      <div className="text-white p-6">
        <h1 className="text-2xl mb-2">Deck not found</h1>
        <button
          onClick={() => navigate("/decks")}
          className="mt-2 px-3 py-1 bg-purple-600 rounded"
        >
          Back to decks
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="text-white p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold">{deck.name}</h1>
            <div className="text-sm opacity-60">
              {cards.length} cards · created{" "}
              {new Date(deck.created).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRename(true);
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Rename
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Link
            to={`/review/${deck.id}`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Review this deck
          </Link>

          {/* ⭐ FIXED: correct deckId passing */}
          <Link
            to= "/add"
            state={{deckId: deck.id}}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Add card to this deck
          </Link>
        </div>

        {/* Cards in this deck */}
        <h2 className="text-xl mb-3">Cards</h2>
        {cards.length === 0 ? (
          <div className="opacity-60">No cards in this deck yet.</div>
        ) : (
          <div className="flex flex-col divide-y divide-white/10 border border-white/10 rounded-lg">
            {cards.map((card) => (
              <Link
                key={card.id}
                to={`/cards/${card.id}`}
                className="px-4 py-3 hover:bg-white/5 transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{card.question}</div>
                  <div className="opacity-50 text-sm">{card.answer}</div>
                </div>

                <div className="opacity-30 text-sm">›</div>
              </Link>
            ))}
          </div>

        )}
      </div>

      {/* Rename and Delete modals remain unchanged */}
    </>
  );
}
