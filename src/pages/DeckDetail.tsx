import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Deck, Card } from "../lib/types";
import { listDecks, renameDeck, deleteDeck } from "../lib/decks";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_DECK_ID, DEFAULT_SETTINGS } from "../lib/constants";
import DeckSettings from "./DeckSettings";
import Import from "./Import";
import { formatDateMs } from "../lib/dateUtils";
import AddCard from "./AddCard";
import { getNewCount } from "../lib/queue";
import { useAuth } from "../lib/useAuth";
import { getSaveExists } from "./Review";
import { useCoins } from "../lib/useCoins";

export default function DeckDetail() {
  const { deckId } = useParams();
  const {userId, signInWithGoogle} = useAuth();
  const coins = useCoins(userId);
  const navigate = useNavigate();
 

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const loadDefaultMode = () => {
    try {
      const raw = localStorage.getItem("settings");
      if (!raw) return DEFAULT_SETTINGS.defaultMode;
      const parsed = JSON.parse(raw);
      return parsed.defaultMode || DEFAULT_SETTINGS.defaultMode;
    } catch {
      return DEFAULT_SETTINGS.defaultMode;
    }
  };
  const defaultMode = loadDefaultMode();
  const loadDefaultRunLength = () => {
    try {
      const raw = localStorage.getItem("settings");
      if (!raw) return DEFAULT_SETTINGS.defaultRunMaxLength;
      const parsed = JSON.parse(raw);
      return Number(parsed.defaultRunMaxLength) || DEFAULT_SETTINGS.defaultRunMaxLength;
    } catch {
      return DEFAULT_SETTINGS.defaultRunMaxLength;
    }
  };
  const defaultRunLength = loadDefaultRunLength();

  const now = Date.now();
  const newCount = cards.filter(c => c.status === "new").length;
  const learningCount = cards.filter(c => c.status === "learning" || c.status === "relearning").length;
  const dueCount = cards.filter(c => c.nextReview <= now  && c.status !== "new").length;
  const nothingToDo = dueCount === 0 && getNewCount(deckId ?? "", cards.filter((c) => c.status === "new").length) === 0;

  
  // Load deck info + cards
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
  }, [deckId, showAddCard, showDelete, showImport, showRename, showSettings]);

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

    // remove cards with this deck
    const allCards = await window.api.readCards();
    const remaining = allCards.filter((c: Card) => c.deckId !== deckId);
    await window.api.saveCards(remaining);

    // remove deck itself
    await deleteDeck(deckId);

    navigate("/decks");
  };

  if (!deck) {
    return (
      <div className="text-gray-100 p-6">
        <h1 className="text-2xl mb-2">Deck not found</h1>
        <button
          onClick={() => navigate("/decks")}
          className="mt-2 px-3 py-1 rounded-lg bg-indigo-500/80 text-indigo-50 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)] hover:bg-indigo-500"
        >
          Back to decks
        </button>
      </div>
    );
  }
  function formatDue(ts: number) {
    const diff = ts - Date.now();
    if (diff <= 0) return "Due now";

    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins} min`;

    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hours`;

    const days = Math.round(hours / 24);
    return `${days} days`;
  }

  const isDefault = deck.id === DEFAULT_DECK_ID;
  const save = getSaveExists(deck);
  const canStartAI = userId && (coins !== null && coins >= (defaultRunLength === 30 ? 2 : 1) || save.aiSaveExists);
  const aiLocked = save.classicSaveExists || !canStartAI || nothingToDo; 
  return (
    <>
      <div className="text-gray-100 p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {deck.name}
              {isDefault && (
                <span className="ml-2 text-xs bg-white/10 px-2 py-1 rounded-lg uppercase opacity-80">
                  DEFAULT
                </span>
              )}
            </h1>

            <div className="text-sm opacity-70 flex gap-4 flex-wrap">
              <span>{newCount} new</span>
              <span>{learningCount} learning</span>
              <span>{dueCount} due</span>
            </div>


            <div className="text-sm opacity-60">
              {cards.length} cards · created{" "}
              {formatDateMs(deck.created)}
            </div>
          </div>

          {!isDefault && (
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRename(true);
                }}
                className="px-3 py-1 rounded-lg bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
              >
                Rename
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDelete(true);
                }}
                className="px-3 py-1 rounded-lg bg-rose-500/80 text-rose-50 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)] hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
            
          )}
        </div>

        {/* ACTION BUTTONS */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-3 mb-6">
          {defaultMode === "none" ? (
            <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20">
              <Link
                className={`px-4 py-2 bg-white/10 text-gray-100 ring-white/70 hover:bg-white/30 border-white/20 transition ${save.aiSaveExists || nothingToDo ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""}`}
                to={`/review/${deck.id}?mode=classic`}
                onClick={(e) => {
                  if (save.aiSaveExists || nothingToDo) {
                    e.preventDefault();
                  }
                }}
              >
                {save.aiSaveExists ? "Active" : "Classic"}
              </Link>

              <Link
                className={`flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 text-white font-semibold px-4 py-2 border-l border-white/20 shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 transition ${aiLocked ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""}`}
                to={`/review/${deck.id}?mode=ai`}
                onClick={(e) => {
                  if (aiLocked) {
                    e.preventDefault();
                  }
                }}
              >
                {save.classicSaveExists ? "Active" : !userId ? "Login" : "Quiz"}{defaultRunLength === 30 ? " 2🪙" : " 1🪙"}
              </Link>
            </div>
          ) : (
            <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20">
              <Link
                className={`flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 text-white font-semibold px-4 py-2 shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 transition ${(defaultMode === "ai" && aiLocked) || nothingToDo || (!userId && defaultMode === "ai") ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""}`}
                to={`/review/${deck.id}?mode=${defaultMode}`}
                onClick={(e) => {
                  if ((defaultMode === "ai" && aiLocked) || nothingToDo || (!userId && defaultMode === "ai")) {
                    e.preventDefault();
                  }
                }}
              >
                Review{defaultMode === "ai" ? (defaultRunLength === 30 ? " 2🪙" : " 1🪙") : ""}
              </Link>
            </div>
          )}
        
          </div>
          <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={()=> setShowAddCard(true)}
            className="px-4 py-2 rounded-lg bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
          >
            Add card
          </button>
          <button
            type="button"
            onClick={()=> setShowImport(true)}
            className="px-4 py-2 rounded-lg bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
          >
            Import
          </button>
          {cards.length > 0 && 
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!userId) {
                // prompt sign-in for unauthenticated users
                try {
                  await signInWithGoogle();
                } catch (err) {
                  console.error('Sign-in failed', err);
                }
                return;
              }
              setShowUpload(true);
              setUploadTitle(deck.name || "");
            }}
            className="px-3 py-1 rounded-lg bg-indigo-500/80 text-white ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)] hover:bg-indigo-500"
          >
            Upload to Plaza
          </button>
      }
          <button
            type="button"
            onClick={()=> setShowSettings(true)}
            className="px-4 py-2 rounded-lg bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
          >
            Settings
          </button>
        </div>
        </div>
        {/* CARD LIST */}
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

                <div className="opacity-40 text-xs mt-1">
                  Next review: {formatDue(card.nextReview)}

                </div>

                </div>
                <div className="opacity-30 text-sm">›</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* RENAME MODAL */}
      {showRename && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#16161a] p-6 rounded-lg w-80 border border-white/10">
            <h2 className="text-xl mb-4">Rename deck</h2>
            <input
              className="w-full p-2 rounded bg-[#111113] border border-white/10"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRename(false)}
                className="px-3 py-1 rounded bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1 rounded bg-indigo-500/80 text-indigo-50 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)] hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#16161a] p-6 rounded-lg w-80 border border-white/10">
            <h2 className="text-xl mb-4 text-rose-300">Delete this deck?</h2>

            <p className="text-sm opacity-70 mb-6">
              This will delete the entire deck and its cards.
            </p>

            <div className="flex justify-end gap-3">
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
      {/* UPLOAD TO PLAZA MODAL */}
      {showUpload && userId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#16161a] p-6 rounded-lg w-96 border border-white/10">
            <h2 className="text-xl mb-2">Upload to Deck Plaza</h2>
            <p className="text-sm opacity-70 mb-4">Share this deck with the community. This deck will then be available for others to view and use.</p>
            <p className="text-sm opacity-70 mb-4 text-rose-400">Uploading will overwrite any previous version of this deck you have uploaded. If you want to keep multiple versions, consider changing the title.</p>

            <label className="text-sm opacity-70">Title</label>
            <input className="w-full p-2 rounded bg-[#111113] border border-white/10 mb-3" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />

            <label className="text-sm opacity-70">Description (optional)</label>
            <textarea className="w-full p-2 rounded bg-[#111113] border border-white/10 mb-3" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUpload(false)} className="px-3 py-1 rounded bg-[#16161a] border border-white/10 text-gray-200 hover:border-indigo-300/70">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    const localDeckId = deck.id;
                    const deckPayload: any = {
                      local_deck_id: localDeckId,
                      owner_user_id: userId,
                      name: uploadTitle || deck.name,
                      created_at: new Date().toISOString(),
                      description: uploadDescription,
                    };
                    const { owner_user_id, local_deck_id } = await supabase.from('plaza').select('owner_user_id, local_deck_id, name').eq('local_deck_id', localDeckId).eq('owner_user_id', userId).eq('name', uploadTitle || deck.name).single().then(res => res.data) || {};
                    if (owner_user_id && local_deck_id) {
                      const {error} = await supabase.from('plaza').delete().eq('local_deck_id', localDeckId).eq('owner_user_id', owner_user_id);
                      if (error) {
                        console.error('SELECT failed', error);
                        return;
                      }
                    }
                    const { data, error } = await supabase.from('plaza').insert(deckPayload).select().single();

                    const plazaDeckId = data.id;

                    const cardPayload = cards.map((c) => ({
                      local_card_id: c.id,
                      plaza_deck_id: plazaDeckId,
                      user_id: userId,
                      question: c.question,
                      answer: c.answer,
                    }));
                    await supabase.from('plaza_cards').delete().eq('plaza_deck_id', plazaDeckId).eq('user_id', userId);
                    const { error: cardError } = await supabase.from('plaza_cards').insert(cardPayload);
                    if (error || cardError) {
                      console.error('INSERT failed', error);
                      alert('Upload failed');
                      return;
                    }
                    alert('Uploaded to Plaza successfully.');
                    setShowUpload(false);
                  } catch (err) {
                    console.error(err);
                    alert('Upload failed. See console.');
                  }
                }}
                className="px-3 py-1 rounded bg-green-500/80 text-white"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddCard &&
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAddCard(false)}
            aria-label="Close settings"
          />
          <div className="relative w-full max-w-3xl mx-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.9)]">
            <button
              type="button"
              onClick={() => setShowAddCard(false)}
              className="absolute right-4 top-4 rounded-md border border-white/10 px-2 py-1 text-sm text-gray-200 hover:border-indigo-300/70"
            >
              Close
            </button>
            <AddCard deckId={deckId ?? ""} />
          </div>
        </div>
      }
      {showImport &&
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowImport(false)}
            aria-label="Close settings"
          />
          <div className="relative w-full max-w-3xl mx-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.9)]">
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="absolute right-4 top-4 rounded-md border border-white/10 px-2 py-1 text-sm text-gray-200 hover:border-indigo-300/70"
            >
              Close
            </button>
            <Import deckId={deckId ?? ""} />
          </div>
        </div>
      }
      {showSettings &&
        <div className="fixed inset-0 z-50 flex items-center justify-center">
              <button
                type="button"
                className="absolute inset-0 bg-black/60"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              />
              <div className="relative w-full max-w-3xl mx-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.9)]">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="absolute right-4 top-4 rounded-md border border-white/10 px-2 py-1 text-sm text-gray-200 hover:border-indigo-300/70"
                >
                  Close
                </button>
                <DeckSettings deckId={deckId ?? ""} />
              </div>
        </div>
      }


    </>
  );
}
