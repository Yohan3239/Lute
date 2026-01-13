import { Link, useLocation, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card } from "../lib/types";

export interface DeckPlazaCardsProps {
  deckId?: string;
  deckName?: string;
  fromHover?: boolean;
}
export function DeckPlazaCards({ deckId, deckName, fromHover }: DeckPlazaCardsProps) {

  const params = useParams<{ deckId: string }>();
  const deckIdFromParams = params.deckId;
  const location = useLocation();
  const state = location.state as { deckId?: string; deckName?: string } | null;
  const resolvedDeckId = deckId ?? deckIdFromParams ?? state?.deckId;
  const resolvedDeckName = deckName ?? state?.deckName;
  const [cards, setCards] = useState<any[]>([]);
  const [existingDecks, setExistingDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>();
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDeckName, setImportDeckName] = useState("");
  useEffect(() => {
    async function LoadDecks() {
      const existingDecks = await window.api.readDecks();
      setExistingDecks(existingDecks);
    }
    
    async function LoadCards() {
      const { data, error } = await supabase.from('plaza_cards').select('*').eq('plaza_deck_id', resolvedDeckId);
    if (error) {
      console.error("Error loading plaza deck cards:", error);
      }
      else setCards(data ?? []);
    }
    LoadCards();
    LoadDecks();
  }, [resolvedDeckId]);
  if (!resolvedDeckId) {
    return <div>Missing deck id.</div>;
  }

  async function handleImportDeck(nameOverride?: string) {
    const fallbackName = resolvedDeckName
      ? `Imported ${resolvedDeckName}`
      : `Imported Deck ${resolvedDeckId}`;
    const deckName = (nameOverride ?? importDeckName).trim() || fallbackName;
    const newDeck = {
      id: `plaza-import-${crypto.randomUUID()}`,
      name: deckName,
      created: Date.now(),
    }
    await window.api.saveDecks(existingDecks.concat(newDeck));
    const existingCards = await window.api.readCards();
    const newCards = cards.map((card) => ({
      id: crypto.randomUUID(),
      deckId: newDeck.id,
      question: card.question,
      answer: card.answer,
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: Date.now(),
      status: "new",
      learningStep: 0,
      lapses: 0
    }));
    const updated = [...existingCards, ...newCards as Card[]];
    await window.api.saveCards(updated);
    alert(`Imported deck with ${newCards.length} cards as "${newDeck.name}".`);
  }
  function handlePrompt() {
    setShowModal(true);
  }
  async function handleAddtoExistingDeck() {
    setShowModal(false);
    const existingCards = await window.api.readCards();
    const newCards = cards.map((card) => ({
      id: crypto.randomUUID(),
      deckId: selectedDeckId, // or prompt user to select deck
      question: card.question,
      answer: card.answer,
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextReview: Date.now(),
      status: "new",
      learningStep: 0,
      lapses: 0
    }));
    const updated = [...existingCards, ...newCards as Card[]];
    await window.api.saveCards(updated);
    alert(`Added ${newCards.length} cards to the selected deck.`);

  }
  return (
    
      <div>

        {!fromHover &&
        <div className=" mb-4 px-4 py-3 border-b border-white/10">
          <h1 className="text-2xl font-bold mb-4">
            {resolvedDeckName ?? resolvedDeckId}
          </h1>
          <div className="flex flex-row items-center mb-2 justify-between">
            <div>
              <button
                onClick={() => {
                  const fallbackName = resolvedDeckName
                    ? `Imported ${resolvedDeckName}`
                    : `Imported Deck ${resolvedDeckId}`;
                  setImportDeckName(fallbackName);
                  setShowImportModal(true);
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-500 text-white rounded-lg transition mr-2"
              >
              Import Deck
              </button>
              <button onClick={() => handlePrompt()} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-500 text-white rounded-lg transition mr-2">
              Add to Existing Deck
              </button>
              <div className={showImportModal ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" : "hidden"}>
              <div className="bg-[#111113] p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4 text-white">Name Imported Deck</h2>
                <input
                  className="p-2 bg-[#111113] border border-white/10 rounded-lg w-full mt-1 text-gray-100 mb-4"
                  value={importDeckName}
                  onChange={(e) => setImportDeckName(e.target.value)}
                  placeholder="Imported deck name"
                />

                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition mr-2"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-500 text-white rounded-lg transition"
                    onClick={() => {
                      setShowImportModal(false);
                      void handleImportDeck(importDeckName);
                    }}
                    disabled={!importDeckName.trim()}
                  >
                    Import Deck
                  </button>
                </div>
              </div>
              </div>
              <div className={showModal ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" : "hidden"}>
              <div className="bg-[#111113] p-6 rounded-lg w-96">
                
                <h2 className="text-xl font-bold mb-4 text-white">Select Deck to Add Cards</h2>
                <select
                  className="p-2 bg-[#111113] border border-white/10 rounded-lg w-full mt-1 text-gray-100 mb-4"
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                >
                  <option value="" disabled>Select a deck</option>
                  {existingDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition mr-2"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-500 text-white rounded-lg transition"
                    onClick={() => handleAddtoExistingDeck()}
                    disabled={!selectedDeckId}
                  >
                    Add Cards
                  </button>
                </div>
              </div>
              </div>
            </div>
            <Link to="/deckplaza" className="px-4 py-2 bg-indigo-700 hover:bg-indigo-500 text-white rounded-lg transition">
            Return to Deck Plaza
            </Link>
          </div>
        </div>

        }
         <div className="px-4 py-3 text-gray-300 text-sm">{cards.length} Cards</div>

        <div className="flex flex-col divide-y divide-white/5 border border-white/5 rounded-lg bg-[#111113]">
          {(fromHover ? cards.slice(0, 5) : cards).map((card: any) => (
            <div
              key={card.id}
              className="px-4 py-3 hover:bg-white/5 transition-colors flex justify-between items-center"
            >
              <div>
                <div className={`font-medium truncate ${fromHover ? 'w-52' : 'w-full'}`}>{card.question}</div>
                <div className={`opacity-50 text-sm text-gray-400 truncate ${fromHover ? 'w-52' : 'w-full'}`}>{card.answer}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    
  );
}
