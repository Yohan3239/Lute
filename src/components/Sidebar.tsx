import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-52 bg-[#0f0f0f] h-full text-white flex flex-col p-6 gap-4 border-r border-white/10">
      <h2 className="text-2xl font-bold mb-4">Lute</h2>

      <Link className="hover:text-purple-400 transition" to="/">Home</Link>
      <Link className="hover:text-purple-400 transition" to="/review">Review</Link>
      <Link className="hover:text-purple-400 transition" to="/decks">Decks</Link>
      <Link to="/add" className="hover:text-purple-400 transition">
        Add Card
      </Link>
      <Link to="/browse" className="hover:text-purple-400 transition">
        Browse
      </Link>
    </div>
  );
}
