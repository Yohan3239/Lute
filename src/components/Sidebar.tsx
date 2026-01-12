import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

const navItems = [
  {
    label: "Home",
    to: "/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
        <path d="M9.5 21V12.5h5V21" />
      </svg>
    )
  },
  {
    label: "Review",
    to: "/review",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 5.5h8.5" />
        <path d="M5 10h11" />
        <path d="M5 14.5h6.5" />
        <path d="M5 19h8.5" />
        <path d="M15.5 5.5h3.5v14h-3.5z" />
      </svg>
    )
  },
  {
    label: "Decks",
    to: "/decks",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 7h13.5a2.5 2.5 0 0 1 0 5H4z" />
        <path d="M4 12h13a2.5 2.5 0 0 1 0 5H4z" />
        <path d="M4 17h12.5a2.5 2.5 0 0 1 0 5H4z" />
      </svg>
    )
  },
  {
    label: "Browse",
    to: "/browse",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="5.25" />
        <path d="m15.5 15.5 3.5 3.5" />
      </svg>
    )
  },
  {
    label: "Settings",
    to: "/settings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.89 3.31.876 2.42 2.42a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.89 1.543-.876 3.31-2.42 2.42a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.89-3.31-.876-2.42-2.42a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.89-1.543.876-3.31 2.42-2.42a1.724 1.724 0 0 0 2.572-1.065Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    label: "Game Guide",
    to: "/gameguide",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
      </svg>
    ),  
  }

];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { userId, loading, signInWithGoogle } = useAuth();
  // Don't block UI - just show login prompt if not authenticated
  if (loading) return <div>Loading...</div>;

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <aside className="relative w-64 bg-gradient-to-b from-[#111113] via-[#0d0d11] to-[#0b0b0d] h-full text-gray-100 flex flex-col p-6 gap-6 border-r border-white/5 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-14 h-32 w-32 bg-indigo-500/25 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-40 w-32 bg-purple-500/10 blur-3xl" />
      </div>

      <h1
        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-lavender-400 to-peach-400 leading-snug"
      >
        Lute
      </h1>

      <div className="relative flex-1">
        <div className="space-y-1">
          {navItems.map(item => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white border border-white/15 shadow-inner shadow-indigo-500/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    active
                      ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-100"
                      : "border-white/10 bg-white/5 text-gray-300 group-hover:border-white/20"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>


      </div>
      
      
      
      <Link
        to="/add"
        className="relative inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 hover:scale-105 transition transform "
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        Add a new card
      </Link>

      {!userId &&
        <button 
        className=" hover:bg-white/20 bg-white/10 text-white border border-white/15 shadow-inner shadow-indigo-500/10 group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
        onClick={signInWithGoogle}>Sign in with Google</button>
      }
    

    </aside>
  );
}

