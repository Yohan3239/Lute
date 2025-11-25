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

  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (cards.length === 0)
    return <div className="text-white p-6">No cards yet.</div>;

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl mb-4">All Cards ({cards.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
            <Link to={`/cards/${card.id}`}>
                <div
                    key={card.id}
                    className="p-4 rounded-lg bg-[#111] border border-white/10 hover:border-purple-400 transition cursor-pointer"
                >
                    <div className="font-semibold text-lg">{card.question}</div>
                    <div className="opacity-60 mt-2">{card.answer}</div>

                    <div className="text-xs opacity-40 mt-3">
                    interval: {card.interval}d · ease: {card.ease.toFixed(2)}
                    </div>
                </div>
            </Link>
        ))}
      </div>
    </div>
  );
}
