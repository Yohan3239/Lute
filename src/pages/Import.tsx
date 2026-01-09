import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_DECK_ID } from '../lib/constants';
import { type Card, type CardStatus } from '../lib/types';

interface DeckIdProp {
  deckId?: string;
}
export default function Import({ deckId: deckIdProp }: DeckIdProp) {
    const { state } = useLocation();
    const deckId = deckIdProp ?? state?.deckId ?? null;
    const [divider, setDivider] = useState(",");
    const [textToParse, setTextToParse] = useState("");
    useEffect(() => {
        if (!deckId) {
        console.warn("No deckId provided!");
        }
    }, [deckId]);
    const handleImport = async () => {
        try {
            const lines = textToParse.split("\n").filter(line => line.trim() !== "");
            const newCards: Card[] = [];
            let skipped = 0;

            for (const line of lines) {
                const parts = line.split(divider);
                
                if (parts.length != 2) {
                    skipped++;

                    continue;
                }
                const [questionRaw = "", answerRaw = ""] = parts;
                const question = questionRaw.trim();
                const answer = answerRaw.trim();
                if (!question || !answer) {
                    skipped++;
                    continue;
                }

                const status: CardStatus = "new";
                newCards.push({
                    id: crypto.randomUUID(),
                    deckId: deckId || DEFAULT_DECK_ID,
                    question,
                    answer,
                    interval: 0,
                    ease: 2.5,
                    reps: 0,
                    nextReview: Date.now(),
                    status,
                    learningStep: 0,
                    lapses: 0,
                });
            }

            const existingCards: Card[] = await window.api.readCards();
            const updatedCards: Card[] = [...existingCards, ...newCards];
            await window.api.saveCards(updatedCards);
            alert(`Imported ${newCards.length} cards successfully.${skipped ? ` Skipped ${skipped} invalid line(s).` : ""}`);
            setTextToParse("");
        } catch (err) {
            console.error("Error importing cards:", err);
            alert("Failed to import cards. Please check the console for details.");
        } 
    };




  return (
    <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
          </div>

        </div>

        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-gray-200">
            <span className="font-medium">Divider</span>
            <div className="flex items-center gap-3">
              <select
                className="w-48 px-3 py-2 rounded-lg bg-[#0b0c10] border border-white/10 text-gray-100 focus:outline-none focus:border-indigo-400"
                value={divider}
                onChange={(e) => setDivider(e.target.value)}
              >
                <option value=",">Comma ,</option>
                <option value=";">Semicolon ;</option>
                <option value="|">Pipe |</option>
                <option value="\t">Tab</option>
              </select>
              <span className="text-xs text-gray-500">Tip: Press Tab inside the box to insert the divider.</span>
            </div>
          </label>

          <div className="rounded-xl bg-[#0b0c10] border border-white/10 shadow-inner shadow-indigo-500/10">
            <textarea
              placeholder={`Photosynthesis${divider}Process plants use to convert light into energy
Cellular Respiration${divider}Process cells use to convert glucose into energy
`}
              className="w-full h-64 p-3 rounded-xl bg-transparent text-gray-100 focus:outline-none"
              value={textToParse}
              onChange={(e) => setTextToParse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart ?? 0;
                  const end = target.selectionEnd ?? 0;
                  const next = `${textToParse.slice(0, start)}${divider}${textToParse.slice(end)}`;
                  setTextToParse(next);
                  requestAnimationFrame(() => {
                    const pos = start + divider.length;
                    target.selectionStart = pos;
                    target.selectionEnd = pos;
                  });
                }
              }}
            />
            
          </div>
            <button
              className="relative inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 hover:scale-105 transition transform"
              onClick={handleImport}
            >
              Import to Deck
            </button>
        </div>
      </div>
  );
}
