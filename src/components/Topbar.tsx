import { useLocation } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { getFormattedDate } from "../lib/dateUtils";
import { useCoins } from "../lib/useCoins";

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
        <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200">
          <span className="tracking-wide">{today}</span>
          {coins !== null && (
            <span className="ml-2">AI Coins: {coins}</span>
          )}
        </span>
      </div>
    </header>
  );
}
