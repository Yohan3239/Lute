import { HashRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Home from "./pages/Home";
import Review from "./pages/Review";
import Decks from "./pages/Decks";
import AddCard from "./pages/AddCard";
import EditCard from "./pages/EditCard";
import DeckDetail from "./pages/DeckDetail";
import Browse from "./pages/Browse";
import Settings from "./pages/Settings";
import Import from "./pages/Import";
export default function App() {
  return (
    <HashRouter>
      <div className="flex h-screen w-screen bg-[#0b0b0d] text-gray-100 font-inter antialiased overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <div className="p-6 flex-1 overflow-auto no-scrollbar">
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/review" element={<Review />} />
              <Route path="/review/:deckId" element={<Review />} />

              <Route path="/decks" element={<Decks />} />
              <Route path="/decks/:deckId" element={<DeckDetail />} />
              <Route path="/import" element={<Import />} />

              <Route path="/browse" element={<Browse />} />
              <Route path="/add" element={<AddCard />} />
              
              <Route path="/cards/:id" element={<EditCard />} />

              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}
