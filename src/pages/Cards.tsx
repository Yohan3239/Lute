import { useEffect, useState } from "react";
import { Card } from "../lib/types";
import { Link } from "react-router-dom";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.readCards().then((loaded) => {
      setCards(loaded);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-100 p-6">Loading...</div>;
  if (cards.length === 0)
    return <div className="text-gray-100 p-6">No cards yet.</div>;

  return (
    <div className="text-gray-100 p-6">
      <h1 className="text-2xl mb-4">All Cards ({cards.length})</h1>

        <div className="flex flex-col divide-y divide-white/5 border border-white/5 rounded-lg bg-[#111113]">
        {cards.map((card) => (
            <Link
            key={card.id}
            to={`/cards/${card.id}`}
            className="px-4 py-3 hover:bg-white/5 transition-colors flex justify-between items-center"
            >
            <div>
                <div className="font-medium">{card.question}</div>
                <div className="opacity-50 text-sm text-gray-400">{card.answer}</div>
            </div>

            <div className="opacity-30 text-sm">›</div>
            </Link>
        ))}
        </div>

    </div>
  );
}
