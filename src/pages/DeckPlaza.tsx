import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import { DeckPlazaCards } from "./DeckPlazaCards";

export function DeckPlaza() {
  const { userId } = useAuth();
  const [plazaDecks, setPlazaDecks] = useState<any[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    const loadPlazaDecks = async () => {
      const { data, error } = await supabase.from('plaza').select('*');
      if (error) {
        console.error("Error loading plaza decks:", error);
      }
      else {
        setPlazaDecks(data);
      }
    };
    loadPlazaDecks();
  }, []);

  if (!userId) {
    return (
      <div> Please log in! </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">Deck Plaza</h1>
      <p className="mb-4 text-gray-300 text-center">Welcome to the Deck Plaza! Here you can explore and share decks created by the community.</p>
      <div className="flex flex-col-4">
        {plazaDecks.map((deck) => (
          <motion.div
            key={deck.id}
            className="relative"
            onHoverStart={() => setHovered(deck.id)}
            onHoverEnd={() => setHovered((id) => (id === deck.id ? null : id))}
          >
            <Link
              to={`/deckplaza/${deck.id}`}
              state={{ deckId: deck.id, deckName: deck.name, fromHover: false }}
              className="block border border-white/10 rounded-lg p-4 my-4 bg-[#111113] hover:border-indigo-300/70 transition shadow-[0_0_30px_-10px_rgba(129,140,248,0.15)]"
            >
              <h2 className="text-xl font-semibold">{deck.name}</h2>
              <p className="opacity-70 mb-2">{deck.description}</p>
              <p className="text-xs opacity-50">{deck.id}</p>
            </Link>

            <AnimatePresence>
              {hovered === deck.id && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-3 z-50"
                >
                  <div className="w-64 p-1.5 rounded-lg border border-white/10 bg-[#0b0b0c] shadow-lg">
                    <DeckPlazaCards deckId={deck.id} deckName={deck.name} fromHover={true} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
