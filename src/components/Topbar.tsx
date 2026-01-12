import { useLocation } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { getFormattedDate } from "../lib/dateUtils";
import { getIsProUser, useCoins } from "../lib/useCoins";
import { useEffect, useState } from "react";

type RouteMeta = {
  match: RegExp;
  title: string;
  badge?: string;
};

const routes: RouteMeta[] = [
  { match: /^\/$/, title: "Home"},
  { match: /^\/review/, title: "Review" },
  { match: /^\/decks/, title: "Decks"},
  { match: /^\/browse/, title: "Browse" },
  { match: /^\/add/, title: "Add Card"},
  { match: /^\/cards\//, title: "Edit Card"},
  { match: /^\/settings/, title: "Settings"},
  { match: /^\/import/, title: "Import"},
];

const fallbackMeta: RouteMeta = {
  match: /.*/,
  title: "Home",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user, userId } = useAuth();
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [showProInfo, setShowProInfo] = useState(false);
  useEffect(() => {
    if (userId) {
      getIsProUser(userId).then(setIsProUser);
    }
  }, [userId]);
  const coins = useCoins(userId);
  const meta = routes.find(r => r.match.test(pathname)) ?? fallbackMeta;

  const today = getFormattedDate();

  const displayName = user?.user_metadata?.name || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  return (
    <header className="w-full h-16 bg-gradient-to-r from-[#101014] via-[#0c0c10] to-[#141826] border-b border-white/5 flex items-center justify-between px-6 text-gray-100 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white leading-tight">{meta.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="User avatar"
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-300">{displayName}</span>
          </div>
        )}
        {user && (
          <div className="flex items-center gap-4">
        <span className="hidden md:inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200">
          <span className="tracking-wide">{today}</span>
          {coins !== null && (
            <div className="ml-2 flex items-center gap-1.5">
              <span>🪙 {coins}{isProUser ? "/200" : "/15"}</span>
              <span className="text-gray-400 text-xs">refills monthly</span>
            </div>
          )}
        </span>
          </div>)}

        {!isProUser && (
          <div
            className="relative flex items-center h-full"
            onMouseEnter={() => setShowProInfo(true)}
            onMouseLeave={() => setShowProInfo(false)}
          >
            <a
              href={"https://buy.stripe.com/aFafZj9gWaQe0O2eFBf3a00"}
              target="_blank"
              rel="noopener noreferrer"
              className="items-center text-xs bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-700 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition text-center"
            >
              Upgrade to Pro
            </a>
            {showProInfo && (
              <div className="absolute right-0 top-8 z-50 mt-2 w-64 rounded-lg border border-white/10 bg-[#111113] p-3 text-xs text-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="font-semibold text-amber-200 mb-1">Pro benefits</div>
                <div className="text-gray-300">- Higher quality AI model</div>
                <div className="text-gray-300">- More monthly coins (13x more!)</div>
                <div className="text-gray-300">- Priority support and experimental features</div>
                <div className="text-gray-300">- Many more Pro features coming soon, such as PDF scan to Flashcard, heatmaps and custom themes.</div>
                <div className="text-indigo-300 mt-2">Support a student indie dev ❤️</div>
              </div>
            )}

          </div>
        )}
        {isProUser && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
            <span
            title="Thank you!">Pro</span>
          </span>
        )}
        
      </div>
    </header>
  );
}
