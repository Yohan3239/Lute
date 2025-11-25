import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Home from "./pages/Home";
import Review from "./pages/Review";
import Decks from "./pages/Decks";
import AddCard from "./pages/AddCard";
import CardsPage from "./pages/Cards";
import EditCard from "./pages/EditCard";
import DeckDetail from "./pages/DeckDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-black text-white font-inter">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <div className="p-6 flex-1">
            <Routes>
              <Route path="/" element={<Home />} />

              {/* Reviews */}
              <Route path="/review" element={<Review />} />
              <Route path="/review/:deckId" element={<Review />} />

              {/* Decks */}
              <Route path="/decks" element={<Decks />} />
              <Route path="/decks/:deckId" element={<DeckDetail />} />

              {/* Cards */}
              <Route path="/add" element={<AddCard />} />
              <Route path="/cards" element={<CardsPage />} />
              <Route path="/cards/:id" element={<EditCard />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
