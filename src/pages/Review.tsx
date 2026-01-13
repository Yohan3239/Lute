import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Session } from "../lib/session";
import { getDueCards, getNewCount } from "../lib/queue";
import { Card, Deck, VariantCard, Classic, statusDatatype, ArtifactType } from "../lib/types";
import { listDecks } from "../lib/decks";
import { generateMCQ, generateCloze, generateTrueFalse } from "../lib/llm";
import levenshtein  from "js-levenshtein";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { DEFAULT_SETTINGS } from "../lib/constants";
import { GameState, initialGameState, calculateBasePoints, calculateTimePoints, calculateMultPoints, savePointstoScore, calculateMultiplierStreak, calculateTimeMult, calculateReturnPoints, calculateBurnPoints, calculatePoisonPoints, calculateWetMultiplier, calculateVaporiseMultiplier, calculateTempoUpMultiplier, setPreviouslyCorrect, calculateLuckyPoints } from "../lib/gameLogic";
import { Grade } from "../lib/srs";
import { useFitText } from "../lib/useFitText";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { getTodayString, isConsecutiveDay } from "../lib/dateUtils";
import { decrementCoins, getIsProUser, useCoins } from "../lib/useCoins";
import EventPopup, { EventType } from "../components/EventPopup";
import { loadSound, playSound } from "../lib/audio";
import CheatSheet from "./CheatSheet";
import dingProcSound from "/ding_proc.wav?url";

const REQUEUE_WINDOW_MS = 20 * 60 * 1000; // bring back cards due within ~20 minutes

type ProcPopupProps = {
  id: string;
  text: string;
  type: "points" | "mult" | "return" | "wet" | "burn" | "poison" | "vaporise" | "tempo up" | "lucky",
  createdAt: number;
  offsetX?: number;
  scaleFactor?: number;
}
export function getSaveExists(deck: Deck) {
  const sessionInfos = getSessionInfo();
  const classicSaveExists: Boolean = (sessionInfos.some((s) => (s.mode === "classic" && s.deckId === deck.id)))
  const aiSaveExists: Boolean = (sessionInfos.some((s) => (s.mode === "ai" && s.deckId === deck.id)))

  return {classicSaveExists, aiSaveExists};
}

function getSessionInfo() {
return Object.keys(localStorage).filter((i) => i.startsWith("reviewSession-")).map((key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    const remaining = Math.max(0, (data.queue?.length ?? 0) - (data.index ?? 0));
    if (!data.queue || remaining <= 0) return null;
    const parts = key.split("-");
    const deckIdFromKey = parts.slice(2).join("-"); // preserves hyphens
    return {
      key,
      deckId: data.deckId || deckIdFromKey,
      mode: data.isAIMode ? "ai" : "classic",
      isFull: data.isFullMode,
      remaining,
    };
  } catch {
    return null;
  } 
}).filter(Boolean) as Array<{ deckId: string; mode: string; isFull: boolean; remaining: number }>;

}
function ProcPopups({ popups }: { popups: ProcPopupProps[] }) {
  const bgFor = (type: ProcPopupProps["type"]) =>
    type === "mult"
      ? "bg-gradient-to-br from-indigo-500/50 via-sky-500/30 to-emerald-300/20 border-indigo-200/50 text-indigo-50 shadow-[0_0_18px_rgba(129,140,248,0.5),0_0_40px_rgba(56,189,248,0.3)]"
      : type === "points"
        ? "bg-gradient-to-br from-rose-500/50 via-fuchsia-500/30 to-amber-300/25 border-rose-200/50 text-rose-50 shadow-[0_0_18px_rgba(244,114,182,0.5),0_0_40px_rgba(251,191,36,0.25)]"
        : type === "return"
        ? "bg-gradient-to-br from-amber-400/55 via-yellow-300/35 to-lime-200/20 border-amber-200/60 text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.55),0_0_40px_rgba(253,224,71,0.35)]"
        : type === "wet"
        ? "bg-gradient-to-br from-blue-500/55 via-cyan-400/35 to-sky-300/25 border-blue-200/60 text-blue-50 shadow-[0_0_18px_rgba(59,130,246,0.55),0_0_40px_rgba(14,165,233,0.35)]"
        : type === "burn"
        ? "bg-gradient-to-br from-red-500/55 via-orange-400/35 to-yellow-300/25 border-red-200/60 text-red-50 shadow-[0_0_18px_rgba(239,68,68,0.55),0_0_40px_rgba(251,191,36,0.35)]"
        : type === "poison"
        ? "bg-gradient-to-br from-green-500/55 via-lime-400/35 to-emerald-300/25 border-green-200/60 text-green-50 shadow-[0_0_18px_rgba(34,197,94,0.55),0_0_40px_rgba(132,204,22,0.35)]"
        : type === "vaporise"
        ? "bg-gradient-to-br from-white/60 via-gray-300/40 to-gray-200/30 border-white/70 text-gray-900 shadow-[0_0_18px_rgba(243,244,246,0.6),0_0_40px_rgba(203,213,225,0.4)]"
        : type === "tempo up"
        ? "bg-gradient-to-br from-yellow-400/55 via-yellow-300/35 to-yellow-200/25 border-yellow-200/60 text-yellow-50 shadow-[0_0_18px_rgba(234,179,8,0.55),0_0_40px_rgba(202,138,4,0.35)]"
        : type === "lucky"
        ? "bg-gradient-to-br from-green-500/55 via-lime-400/35 to-emerald-300/25 border-green-200/60 text-green-50 shadow-[0_0_18px_rgba(34,197,94,0.55),0_0_40px_rgba(132,204,22,0.35)]"
        : "bg-gradient-to-br from-green-500/55 via-lime-400/35 to-emerald-300/25 border-green-200/60 text-green-50 shadow-[0_0_18px_rgba(34,197,94,0.55),0_0_40px_rgba(132,204,22,0.35)]";
      

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {popups.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: -28, scale: 0.9 * (p.scaleFactor ?? 1) }}
            animate={{ opacity: 1, y: -58, scale: 1.08 * (p.scaleFactor ?? 1) }}
            exit={{ opacity: 0, y: -60, scale: 0.92 * (p.scaleFactor ?? 1) }}
            transition={{ duration: 0.22}}
            className="absolute top-0 -translate-x-1/2 "
            style={{ x: p.offsetX ?? 0 }}
          >
            <div className={`relative px-4 py-2 rounded-xl border text-sm font-semibold tracking-wide shadow-[0_14px_38px_rgba(0,0,0,0.5)] backdrop-blur-sm ring-1 ring-white/15 ${bgFor(p.type)}`}>
              {p.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  className?: string;
  pulseKey?: number | string;
  floatDigits?: boolean;
};
function AnimatedNumber({ value, decimals = 0, className, pulseKey, floatDigits = false }: AnimatedNumberProps) {
  const prevValueRef = useRef(value);
  const [pulseMagnitude, setPulseMagnitude] = useState(0);

  const [display, setDisplay] = useState(() =>
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()
  );

  useEffect(() => {
    setDisplay(decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString());
  }, [value, decimals]);

  useEffect(() => {
    const delta = Math.abs(value - prevValueRef.current);
    prevValueRef.current = value;
    const magnitude = 0.3 + Math.log10(delta + 1) * 0.4;
    setPulseMagnitude(magnitude);
  }, [value, pulseKey]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 1 }}
      style={{ display: "inline-block" }}              // <-- important for scale to visually show
    >
      {floatDigits ? (
        <span style={{ display: "inline-flex", gap: "0.15em" }}>
          {display.split("").map((char, i) => (
            <motion.span
              key={`${pulseKey ?? ""}-pulse-${i}-${char}`}
              style={{ display: "inline-block" }}
              animate={{
                scale: [1, 1.2 + pulseMagnitude, 1.2 + pulseMagnitude, 1],
                y: [0, -10, -10, 0],
                x: [0, 10, 10, 0],
                rotate: [0, -10, -10, 0],
              }}
              transition={{
                duration: 0.20,
                times: [0, 0.2, 1, 1],
                ease: "easeOut",
                delay: i * 0.025,
              }}
            >
              <motion.span
                key={`${pulseKey ?? ""}-digit-${i}-${char}`}
                style={{ display: "inline-block" }}
                initial={{ y: 0, x: 0, rotate: 0 }}
                animate={{
                  y: [0, -8, 6, -6, 4, 0],
                  x: [-7, -6, -5, -4, -6, -7],
                  rotate: [0, 1.5, -1, 1, -1.5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12,
                }}
              >
                {char}
              </motion.span>
            </motion.span>
          ))}
        </span>
      ) : (
        <span style={{ display: "inline-flex", gap: "0.06em" }}>
          {display.split("").map((char, i) => (
            <motion.span
              key={`${pulseKey ?? ""}-digit-${i}-${char}`}
              style={{ display: "inline-block" }}
              
              animate={{
                scale: [1, 1.2 + pulseMagnitude, 1.2 + pulseMagnitude, 1],
                y: [0, -20, -20, 0],
                x: [0, 10, 10, 0],
                rotate: [0, -10, -10, 0],
              }}
              transition={{
                duration: 0.20,
                times: [0, 0.2, 1, 1],
                ease: "easeOut",
                delay: i * 0.025,
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      )}
    </motion.span>
  );
}
export default function Review() {
  const { userId } = useAuth();
  const coins = useCoins(userId);

  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "classic";
  const isAIReview = mode === "ai";
  const { deckId } = useParams();
  // Separate cache per mode so AI + classic don't conflict
  const SESSION_KEY = deckId ? `reviewSession-${mode}-${deckId}` : "";

  const [session, setSession] = useState<Session | null>(null);
  const [finished, setFinished] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]); 
  const [answer, setAnswer] = useState("");
  const [stopwatchTimer, setStopwatchTimer] = useState(0)
  // Prevents recreating the session during grading
  const sessionRef = useRef<Session | null>(null);
  const promptContainerRef = useRef<HTMLDivElement | null>(null);
  const promptTextRef = useRef<HTMLDivElement | null>(null);
  const answerContainerRef = useRef<HTMLDivElement | null>(null);
  const answerTextRef = useRef<HTMLDivElement | null>(null);
  const [game, setGame] = useState<GameState>(() => initialGameState());

  const shakeControls = useAnimation();
  const [gradeFlash, setGradeFlash] = useState<"easy" | "good" | "hard" | "wrong" | null>(null);
  const [pointsPulse, setPointsPulse] = useState(0);
  const [multPulse, setMultPulse] = useState(0);
  const [popups, setPopups] = useState<ProcPopupProps[]>([]);

  const [manualgradingdisabled, setManualGradingDisabled] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [eventNotification, setEventNotification] = useState<EventType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isProUser, setIsProUser] = useState<boolean>(false);
  useEffect(() => {
    if (userId) {
      getIsProUser().then(setIsProUser);
    }
  }, [userId]);

  const [isArtifactEvent, setIsArtifactEvent] = useState<boolean>(() => {
    const saved = localStorage.getItem(`isArtifactEvent-${deckId}`);
    return saved === 'true';
  });
  const [eventPopup, setEventPopup] = useState<boolean>(() => {
    const saved = localStorage.getItem(`eventPopupOpen-${deckId}`);
    return saved === 'true';
  });
  const [procSoundBuffer, setProcSoundBuffer] = useState<AudioBuffer | null>(null);
  const [selectableArtifactTypes, setSelectableArtifactTypes] = useState<ArtifactType[]>(() => {
    const saved = localStorage.getItem(`selectableArtifacts-${deckId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectableEventTypes, setSelectableEventTypes] = useState<EventType[]>(() => {
    const saved = localStorage.getItem(`selectableEvents-${deckId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist event modal state
  useEffect(() => {
    localStorage.setItem(`eventPopupOpen-${deckId}`, eventPopup.toString());
  }, [eventPopup, deckId]);

  // Persist selectable event types
  useEffect(() => {
    localStorage.setItem(`selectableEvents-${deckId}`, JSON.stringify(selectableEventTypes));
  }, [selectableEventTypes, deckId]);

  // Persist selectable artifact types
  useEffect(() => {
    localStorage.setItem(`selectableArtifacts-${deckId}`, JSON.stringify(selectableArtifactTypes));
  }, [selectableArtifactTypes, deckId]);

  // Persist isArtifactEvent state
  useEffect(() => {
    localStorage.setItem(`isArtifactEvent-${deckId}`, isArtifactEvent.toString());
  }, [isArtifactEvent, deckId]);



  const today = getTodayString();
  const reviewMode = Boolean(deckId);
  const promptText = session?.current?.variant?.prompt ?? "";
  const answerText =
    session?.current?.variant?.type === "classic"
      ? session?.current?.variant?.answer ?? ""
      : "";
  useFitText(promptTextRef, promptContainerRef, { minSize: 20, maxSize: 56 }, [
    reviewMode,
    session?.current?.id,
    promptText,
  ]);
  useFitText(answerTextRef, answerContainerRef, { minSize: 12, maxSize: 20 }, [
    reviewMode,
    showAnswer,
    session?.current?.id,
    answerText,
  ]);
  function spawnPopup(
    text: string,
    type: ProcPopupProps["type"],
    scaleFactor = 1,
    ttl = 600
  ) {
    const id = crypto.randomUUID();
    const offsetX = Math.floor(Math.random() * 30 - 15); // small drift so they don't stack
    const popup: ProcPopupProps = { id, text, type, createdAt: Date.now(), offsetX, scaleFactor };
    setPopups((prev) => [...prev, popup]);

    window.setTimeout(() => {
      setPopups((prev) => prev.filter((x) => x.id !== id));
    }, ttl);
  }
  const listVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.05, ease: "easeOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0 },
  };

  const persistSession = (s: Session) => {
    if (!SESSION_KEY) return;
    const payload = {
      queue: s.results,
      index: s.position,
      gameState: s.gameState,
      deckId: s.deck,
      isAIMode: s.isAI,
      isFullMode: s.isFull,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  };

  const loadPersistedSession = (): { session: Session; gameState: GameState } | null => {
    if (!SESSION_KEY) return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.queue) return null;

      const index = Math.min(Math.max(parsed.index ?? 0, 0), parsed.queue.length);

      const safeGameState: GameState = parsed.gameState ?? initialGameState();
      const restored = new Session(
        parsed.queue,
        index,
        safeGameState,
        parsed.deckId ?? deckId ?? "",
        parsed.isAIMode ?? isAIReview,
        parsed.isFullMode ?? runMaxLength === 30,
      )
      return { session: restored, gameState: safeGameState };
    } catch (err) {
      console.warn("Failed to load persisted session", err);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  };
  const endSessionEarly = () => {
    if (!SESSION_KEY) return;
    const confirm = window.confirm("End this session? Current score will be lost. Session result will not be saved.");
    if (!confirm) return;
    localStorage.removeItem(SESSION_KEY);
    sessionRef.current = null;
    setSession(null);
    setFinished(true);
  }

  const loadSettings = () => {
    const raw = localStorage.getItem("settings");
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };
  // Load settings
  const generalSettings = loadSettings();

  const loadDeckSettings = () => {
    const raw = localStorage.getItem(`deck-${deckId}-settings`);
    if (!raw) return generalSettings;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return generalSettings;
    }
  };

  const prev = loadDeckSettings();
  const defaultMode = prev?.defaultMode ?? generalSettings.defaultMode ?? DEFAULT_SETTINGS.defaultMode;
  const typingTolerance = prev?.typingTolerance ?? generalSettings.typingTolerance ?? DEFAULT_SETTINGS.typingTolerance;
  const enableMultipleChoice = prev?.enableMultipleChoice ?? generalSettings.enableMultipleChoice ?? DEFAULT_SETTINGS.enableMultipleChoice;
  const enableCloze = prev?.enableCloze ?? generalSettings.enableCloze ?? DEFAULT_SETTINGS.enableCloze;
  const enableTrueFalse = prev?.enableTrueFalse ?? generalSettings.enableTrueFalse ?? DEFAULT_SETTINGS.enableTrueFalse;
  const defaultRunMaxLength = prev?.defaultRunMaxLength ?? generalSettings.defaultRunMaxLength ?? DEFAULT_SETTINGS.defaultRunMaxLength;
  const [runMaxLength, setRunMaxLength] = useState(() => defaultRunMaxLength);

  // Streak bump on review end
  const streakLoggedRef = useRef(false);
  function streakBump() {
    if (streakLoggedRef.current) return;
    streakLoggedRef.current = true;
    const today = getTodayString();
    const last = localStorage.getItem("lastStreakDate") || "1970-01-01";
    const currentStreak = Number(localStorage.getItem("globalStreak")) || 0;
    if (last === today) {
      return; // already counted today
    } else if (isConsecutiveDay(last, today)) {
      localStorage.setItem("lastStreakDate", today);
      localStorage.setItem("globalStreak", (currentStreak + 1).toString());
    } else {
      localStorage.setItem("lastStreakDate", today);
      localStorage.setItem("globalStreak", "1");
    }
  }

  useEffect(() => {
    loadSound(dingProcSound)
      .then(buffer => setProcSoundBuffer(buffer))
      .catch(console.error);
  }, []);



  useEffect(() => {
    setAnswer("");
    setShowAnswer(false);
    setGradeFlash(null);
    setManualGradingDisabled(false);
    streakLoggedRef.current = false;
  }, [session?.current?.id]);
  // -------------------------------------------------
  // 1) Review Home (choose a deck)
  // -------------------------------------------------
  useEffect(() => {
    if (!reviewMode) {
      listDecks().then(setDecks);
      setRunMaxLength(defaultRunMaxLength);
      window.api.readCards().then(setCards);
    }
  }, [reviewMode]);

  // -------------------------------------------------
  // 2) Enter Review Mode (load session ONCE)
  // -------------------------------------------------
  useEffect(() => {
    if (!deckId) return;
    setLoadError(null);
    
    const classicKey = `reviewSession-classic-${deckId}`;
    const aiKey = `reviewSession-ai-${deckId}`;

    const classicRaw = localStorage.getItem(classicKey);
    const aiRaw = localStorage.getItem(aiKey);

    const lockedMode =
      classicRaw ? "classic" :
      aiRaw ? "ai" :
      null;
    if (lockedMode && mode !== lockedMode) {
      setSearchParams({ mode: lockedMode }, { replace: true });
      return;
    }
    (async () => {
      const all = await window.api.readCards();
      const filtered = all.filter((c) => c.deckId === deckId);
      const due = getDueCards(filtered, deckId).slice(0, runMaxLength);
      const persisted = loadPersistedSession();

      if (persisted) {
        const { session: persistedSession, gameState: persistedGameState } = persisted;

        if (!persistedSession.isFinished()) {
          sessionRef.current = persistedSession;
          setGame(persistedGameState);
          setSession(persistedSession);
          // Clear popup states only if at the very beginning (to prevent duplicate artifact selection)
          setFinished(false);
          return;
        }

        // Session finished: if nothing is due now, stay finished; otherwise rebuild a fresh session below.
        if (due.length === 0) {
          setFinished(true);
          if (SESSION_KEY) localStorage.removeItem(SESSION_KEY);
          return;
        }

        if (SESSION_KEY) localStorage.removeItem(SESSION_KEY);
      }

      if (due.length === 0) {
        setFinished(true);
        if (SESSION_KEY) localStorage.removeItem(SESSION_KEY);
        return;
      }

      const VariantList : VariantCard[] = await Promise.all(
        due.map(async (card) => {
          const classicVariant: Classic = { type: "classic", prompt: card.question, answer: card.answer };
          if (!isAIReview) return { ...card, variant: classicVariant, runReturnedCount: 0 }; // no variant
          const options = [];

          if (enableCloze) options.push(() => generateCloze(card, isProUser));
          if (enableMultipleChoice) options.push(() => generateMCQ(card, isProUser));
          if (enableTrueFalse) options.push(() => generateTrueFalse(card, isProUser));

          if (options.length === 0) {
            throw new Error("No card types enabled");
          }

          const choice = options[Math.floor(Math.random() * options.length)];
          const variant = await choice();
          return { ...card, variant, runReturnedCount: 0 };
        })
      );

      if (isAIReview && VariantList.some((card) => !card.variant)) {
        console.error("AI generation failed; skipping coin charge.");
        setEventPopup(false);
        setIsArtifactEvent(false);
        setLoadError("AI generation failed. Please try again.");
        return;
      }
      
      const newArtifacts: ArtifactType[] = [];
      while (newArtifacts.length < 3) {
        const types = Object.values(ArtifactType);
        const randomType = types[Math.floor(Math.random() * types.length)];
        if (!newArtifacts.includes(randomType)) {
          newArtifacts.push(randomType);
        }
      }

      setSelectableArtifactTypes(newArtifacts);
      setIsArtifactEvent(true);
      setEventPopup(true);

      // Start with empty artifacts - user will select from popup
      const s = new Session(VariantList, 0, initialGameState(), deckId || "", isAIReview, (runMaxLength === 30));
      if (isAIReview && userId) {
        await decrementCoins(runMaxLength === 30 ? 2 : 1);
      }
      sessionRef.current = s;
      setGame(initialGameState());
      setSession(s);
      persistSession(s);

      setFinished(false);
    })();
  // Re-run when deck or mode changes so classic vs AI build their own sessions
  }, [deckId, mode, setSearchParams, runMaxLength, isAIReview, enableCloze, enableMultipleChoice, enableTrueFalse, typingTolerance]);


  useEffect(() => {
    setStopwatchTimer(0);
    const interval = setInterval(() => {setStopwatchTimer((t) => t + 1)}, 1000);
    return () => clearInterval(interval);
  }, [session?.current?.id]);

  // Keyboard shortcuts for classic mode (space to show, 1-4 to grade)
  useEffect(() => {

    if (!isAIReview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (eventPopup) return;
        if (manualgradingdisabled) return; 

        // Don't hijack typing
        if (e.target instanceof HTMLInputElement) return;

        // Space = show answer
        if (!showAnswer && e.key === " ") {
          e.preventDefault();
          setShowAnswer(true);
          return;
        }

        if (showAnswer) {
          if (e.key === "1") gradeSubmission("wrong");
          if (e.key === "2") gradeSubmission("hard");
          if (e.key === "3") gradeSubmission("good");
          if (e.key === "4") gradeSubmission("easy");
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }

    // AI mode keyboard shortcuts
    const v = session?.current?.variant;
    if (!v) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (eventPopup) return;
      if (manualgradingdisabled) return;
      if (e.target instanceof HTMLInputElement) return;

      // True/False: 1=True, 2=False
      if (v.type === "tf") {
        if (e.key === "1") gradeSubmission(true);
        if (e.key === "2") gradeSubmission(false);
      }

      // MCQ: 1-4 for options
      if (v.type === "mcq") {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < v.options.length) {
          gradeSubmission(v.options[idx]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, isAIReview, manualgradingdisabled, eventPopup, session?.current?.variant]);

  // -------------------------------------------------
  // CASE 1: Review homepage (deck list)
  // -------------------------------------------------
  if (!reviewMode) {
    const countDue = (id: string) =>
      cards.filter((c) => c.deckId === id && c.nextReview <= Date.now() && c.status !== "new").length;
    const countNew = (id: string) => {
      const availableNew = cards.filter((c) => c.deckId === id && c.status === "new").length;
      return getNewCount(id, availableNew);
    };
    const notEnoughCoins = (coins ?? 0) < (runMaxLength === 30 ? 2 : 1);
    const sessionInfos = getSessionInfo().filter(
      (s): s is NonNullable<ReturnType<typeof getSessionInfo>[number]> => Boolean(s)
    );


    return (
      <div className="text-gray-100 p-6">
        <div className= "text-gray-100 p-6 flex flex-row justify-between">
          <h1 className="text-2xl mb-4">Select Deck to review</h1>
          <div className="flex items-center gap-3 text-gray-100 text-xl">
            <span className="opacity-80">Sprint (15)</span>
            <div className="relative inline-block w-[4.25rem] h-8">
              <input
                id="switch-component"
                type="checkbox"
                checked={runMaxLength === 30}
                onChange={(e) => setRunMaxLength(e.target.checked ? 30 : 15)}
                className="peer appearance-none w-[4.25rem] h-8 bg-indigo-200 rounded-full checked:bg-indigo-500 cursor-pointer transition-colors duration-300 z-0"
              />
              <label
                htmlFor="switch-component"
                className="absolute top-0 left-0 w-8 h-8 bg-white rounded-full border border-slate-300 shadow-sm transition-transform duration-300 peer-checked:translate-x-9 peer-checked:border-slate-800 cursor-pointer z-10"
              />
            </div>
            <span className="opacity-80">Full (30)</span>
          </div>
        </div>

        {defaultMode === "none" &&
          <div className="flex flex-col divide-y divide-white/5 border border-white/5 rounded-lg bg-[#111113] shadow-[0_0_30px_-12px_rgba(99,102,241,0.25)]">
            {decks.map((deck) => {
              const classicSaveExists = sessionInfos.some((s) => s.mode === "classic" && s.deckId === deck.id);
              const aiSaveExists = sessionInfos.some((s) => s.mode === "ai" && s.deckId === deck.id);
              const due = countDue(deck.id);
              const newCards = countNew(deck.id);
              const nothingToDo = due === 0 && newCards === 0;
              return (
                               <div className= "flex flex-row items-center justify-between px-3 py-2" key={deck.id}>
                <div className="px-4 py-3 transition-colors flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="font-medium text-lg">{deck.name}</div>
                  {(() => {
                    const active = sessionInfos.find((s) => s.deckId === deck.id);
                    return active ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-100 border border-emerald-300/30 text-xs uppercase tracking-wide">
                        <span className="font-semibold">{active.mode} {active.isFull ? "Full" : "Sprint"} session</span>
                        <span className="text-emerald-200/80">{active.remaining} left</span> 
                      </div>
                    ) : null;

                  })()}

                  <div className="opacity-60 text-sm text-gray-400">{due} due  {newCards > 0 ? `| +${newCards} new` : ""} </div>
                  <div className="space-x-2">

                  </div>

                </div>
                  <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20">
                    <Link className={`${aiSaveExists || nothingToDo ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""} flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-gray-100 ring-white/70 hover:bg-white/30 border-white/20 transition`}
                      to={`/review/${deck.id}?mode=classic`}
                      onClick={(e) => {
                        if (aiSaveExists || nothingToDo) {
                          e.preventDefault();
                        }
                      }} 
                    >
                      {aiSaveExists ? "Active" : "Classic"}
                    </Link>

                    {(() => {
                      const canStartAI = userId && ((coins ?? 0) >= (runMaxLength === 30 ? 2 : 1));
                      const aiLocked = classicSaveExists || !canStartAI || nothingToDo;
                      return (
                        <Link className={`${aiLocked ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""} flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap bg-gradient-to-r from-indigo-500/80 via-indigo-500/70 to-indigo-400/70 text-white font-semibold px-4 py-2 border-l border-white/20 shadow-lg shadow-indigo-500/15 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-400 transition`}
                          to={`/review/${deck.id}?mode=ai`} 
                          onClick={(e) => {
                            if (aiLocked) {
                              e.preventDefault();
                            }
                          }} 
                        >
                          {classicSaveExists ? "Active" : !userId ? "Login" : "Quiz"}{defaultRunMaxLength === 30 ? " 2🪙" : " 1🪙"}
                        </Link>
                      );
                    })()}
                  </div>
                
              </div> 
                );
            })}
              
          </div>
        }
        {defaultMode !== "none" &&
          <div className="flex flex-col divide-y divide-white/5 border border-white/5 rounded-lg bg-[#111113] shadow-[0_0_30px_-12px_rgba(99,102,241,0.25)]">
            {decks.map((deck) => {
              const currentMode = defaultMode.toLowerCase();
              const otherMode = currentMode === "ai" ? "classic" : "ai";
              const otherModeActive = sessionInfos.some((s) => s.deckId === deck.id && s.mode === otherMode);
              const thisModeActive = sessionInfos.some((s) => s.deckId === deck.id && s.mode === currentMode);
              const due = countDue(deck.id);
              const newCards = countNew(deck.id);
              const nothingToDo = due === 0 && newCards === 0;
              const canStartAI = userId && (coins !== null && coins >= (runMaxLength === 30 ? 2 : 1) || thisModeActive);
              const shouldLock = otherModeActive || (defaultMode === "ai" && !canStartAI) || nothingToDo;

              return (
                <Link
                  key={deck.id}
                  to={`/review/${deck.id}?mode=${defaultMode}`}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${shouldLock ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""}`}
                  onClick={(e) => {
                      if (shouldLock) {
                        e.preventDefault(); 
                    }
                  }}
                >
                  <div className="font-medium text-lg flex flex-row gap-6">
                    <span>{deck.name}</span>
                    {(() => {
                      const active = sessionInfos.find((s) => s.deckId === deck.id && currentMode === s.mode);
                      const dueNew = `${due} due | ${newCards} new`;
                      return (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                          {active ? (
                            <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-100 border border-emerald-300/30 text-[11px] uppercase tracking-wide">
                              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                              <span className="font-semibold">{active.mode} {active.isFull ? "Full" : "Sprint"} session</span>
                              <span className="text-emerald-200/80"> {active.remaining} left</span>
                            </span>
                          ) : null}
                          <span className="opacity-70">{dueNew}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {otherModeActive ? (
                    <div className="opacity-60 text-sm text-gray-400">
                      Other mode active
                    </div>
                  ) : defaultMode === "ai" && !userId ? (
                    <div className="opacity-60 text-sm text-gray-400">
                      Login
                    </div>
                  ) : (
                    defaultMode === "ai" && notEnoughCoins && shouldLock && !thisModeActive ? (
                      <div className="opacity-60 text-sm text-gray-400">
                        No coins
                      </div>
                    ) : 
                    thisModeActive ? (
                    <div className="opacity-60 text-sm text-gray-400">
                        Continue Session
                    </div>
                    ) : 
                      defaultMode === "ai" ? (
                        <div className="opacity-60 text-sm text-gray-400">
                          {runMaxLength === 30 ? "2🪙" : "1🪙"}
                        </div>
                      ) : null
                    )
                  }
                  
                </Link>
              );
            })}
          </div>

        }
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-gray-100 p-6">
        <div className="p-6 rounded-lg bg-[#111113] border border-white/10 max-w-xl">
          <div className="text-lg font-semibold mb-2">AI generation failed</div>
          <div className="text-sm text-gray-400 mb-4">{loadError}</div>
          <Link
            to="/review"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 border border-white/10 text-gray-100 hover:bg-white/20 transition"
          >
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------
  // CASE 2: Session finished
  // -------------------------------------------------
  if (finished) {
    

    return (
      <div className="h-full overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-lg w-full">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Session Complete!
          </h1>
          
          

          {/* Stats Card (if you want to add stats later) */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <AnimatedNumber floatDigits value={Math.floor(game?.score ?? 0)} className="text-6xl font-bold text-emerald-400 mb-1" />
                <div className="text-sm text-gray-400 uppercase tracking-wider">Final Score</div>
                {!userId &&
                  <div className="text-sm text-gray-400/30">Log in to save your score</div>
                }

              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/review`}
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2">
                Back to Reviews
              </span>
            </Link>
            <Link
              to={`/`}
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold shadow-lg hover:shadow-gray-500/50 hover:scale-105 transition-all duration-200 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------
  // CASE 3: Active review session
  // -------------------------------------------------
  if (!session) return <div className="text-gray-100 p-6">Loading...</div>;

  const card = session.current;

  if (!card) {
    return <div className="text-gray-100 p-6">Finishing...</div>;
  }
  type Step = {name:string, fn:Function}
  function makeSteps(grade: Grade, timeTaken: number, isReturned: boolean, statusData: Record<string, number>[]):Step[] {
    const getStatusValue = (key: string) => statusData?.find((entry) => key in entry)?.[key] ?? null;
    const burnStacks = getStatusValue("burn");
    const wetStacks = getStatusValue("wet");
    const poisonStacks = getStatusValue("poison");
    const vaporiseStacks = burnStacks && wetStacks ? (burnStacks+wetStacks)/2 : null;
    const tempoUpStacks = getStatusValue("tempo up");
    const overchargedStacks = getStatusValue("overcharged");
    const cursedStacks = getStatusValue("cursed");
    const luckyStacks = getStatusValue("lucky");
    const luck = Math.random() < (game.artifacts.includes(ArtifactType.GAMBLERS_DICE) ? 0.66 : 0.33);
    return [

    {name: "base", fn:(prev: GameState) => calculateBasePoints(prev, grade)},

    {name: "timePoints", fn:(prev: GameState) => calculateTimePoints(prev, timeTaken)},

    ...(isReturned&&(grade === "good" || grade === "easy") ? [{name: "returnPoints", fn:(prev: GameState) => calculateReturnPoints(prev)}] : []),

    {name: "timeMult", fn:(prev: GameState) => calculateTimeMult(prev, timeTaken)},


    {name: "streak", fn:(prev: GameState) => calculateMultiplierStreak(prev, grade, prev.previouslyCorrect, cursedStacks? cursedStacks : 0)},
    
    ...(vaporiseStacks ? [{name: "vaporise", fn:(prev: GameState) => calculateVaporiseMultiplier(prev, vaporiseStacks)}] : []),
    
    ...(burnStacks && !vaporiseStacks ? [{name: "burn", fn:(prev: GameState) => calculateBurnPoints(prev, burnStacks, overchargedStacks ? overchargedStacks : 0)}] : []),

    ...(poisonStacks ? [{name: "poison", fn:(prev: GameState) => calculatePoisonPoints(prev, poisonStacks, overchargedStacks ? overchargedStacks : 0)}] : []),
    ...(wetStacks && !vaporiseStacks ? [{name: "wet", fn:(prev: GameState) => calculateWetMultiplier(prev, wetStacks, overchargedStacks ? overchargedStacks : 0)}] : []),
    
    ...(tempoUpStacks ? [{name: "tempo up", fn:(prev: GameState) => calculateTempoUpMultiplier(prev, tempoUpStacks, overchargedStacks ? overchargedStacks : 0)}] : []),
    
    {name: "mult", fn:(prev: GameState) => calculateMultPoints(prev)},
    
    ...(luck && luckyStacks ? [{name: "lucky", fn:(prev: GameState) => calculateLuckyPoints(prev)}] : []),

    {name: "save", fn:(prev: GameState) => savePointstoScore(prev)}
  ]

  }
  // -------------------------------------------------
  // Grade handler
  // -------------------------------------------------
  const handleGrade = async (grade: "easy" | "good" | "hard" | "wrong", timeTaken: number) => {
    const s = sessionRef.current;
    if (!s) return;

    if (card.status === "new") {
      localStorage.setItem(`newCount-${deckId}-${today}`, String(Number(localStorage.getItem(`newCount-${deckId}-${today}`) ?? 0) + 1));
    }
    const updated = s.grade(grade, card.runReturnedCount);
    if (!updated) return;
    // delay the advance so the user can see feedback, but move using the latest game state
    
    // Save updated card
    const all = await window.api.readCards();
    const saved = all.map((c) => (c.id === updated.id ? {...updated, variant: undefined,  runReturnedCount: undefined, statusData: undefined} : c));
    await window.api.saveCards(saved);

    const isReturn = (card.runReturnedCount ?? 0) > 0;
    const steps = makeSteps(grade, timeTaken, isReturn, card.statusData ?? []);
    let state = game ?? initialGameState();
    let incDelay = 500;
    let shrinkFactor = 0.85;
    let scaleFactor = 1;
    let scaleInc = 0.05;
    let semitones = grade === "easy" ? 5 : grade === "good" ? 3 : grade === "hard" ? 2 : 0;
    for (const step of steps) {
      const before = state;
      state = step.fn(state);
      if (procSoundBuffer) {
        playSound(procSoundBuffer, 0.15, 1, semitones+=1);
      }
      if (step.name === "streak" || step.name === "timeMult" || step.name === "vaporise") {
        setMultPulse((p) => p+1);

      } else {
        setPointsPulse((p) => p+1);
      }
      
      if (step.name === "base") spawnPopup(`+${state.points - before.points} ${grade.toUpperCase()}`, "points", scaleFactor);
      if (step.name === "timePoints") spawnPopup(`+${state.points - before.points} SPEED`, "points", scaleFactor);
      if (step.name === "timeMult") spawnPopup(`+${(state.multiplier - before.multiplier).toFixed(2)} SPEED`, "mult", scaleFactor);
      if (step.name === "streak") spawnPopup(`+${(state.multiplier - before.multiplier).toFixed(1)} STREAK`, "mult", scaleFactor);
      if (step.name === "mult") spawnPopup(`x${state.multiplier.toFixed(2)} TEMPO`, "points", scaleFactor);
      if (step.name === "returnPoints") spawnPopup(`+${state.points - before.points} REPRISE`, "return", scaleFactor);
      if (step.name === "wet") spawnPopup(`+${(state.multiplier - before.multiplier).toFixed(2)} WET`, "wet", scaleFactor);
      if (step.name === "burn") spawnPopup(`+${state.points - before.points} BURN`, "burn", scaleFactor);
      if (step.name === "poison") spawnPopup(`${state.artifacts.includes(ArtifactType.TOXIC_CHARM) ? "+" : ""}${state.points - before.points} POISON`, "poison", scaleFactor);
      if (step.name === "vaporise") spawnPopup(`x${(state.multiplier / before.multiplier).toFixed(2)} VAPORISE`, "vaporise", scaleFactor);
      if (step.name === "tempo up") spawnPopup(`x${(state.multiplier / before.multiplier).toFixed(2)} TEMPO UP`, "tempo up", scaleFactor);
      if (step.name === "lucky") spawnPopup(`x${(state.points / before.points).toFixed(2)} LUCKY`, "lucky", scaleFactor);
      
      setGame(state);
      await new Promise(r => setTimeout(r, incDelay)); // optional delay
      incDelay*=shrinkFactor;
      scaleFactor+=scaleInc;
    }
    state = setPreviouslyCorrect(state, grade !== "wrong");
    setGame(state);
    const now = Date.now();
    const requeueThreshold = now + REQUEUE_WINDOW_MS;
    const REQUEUE_INSERT_FLOOR = Math.floor((updated.nextReview - now) / 15000);
    if (updated.nextReview <= requeueThreshold) {
      const queue = s.results;
      const insertAt = Math.min(s.position + Math.max(1, Math.floor((updated.nextReview - now) / 15000)), queue.length);
      if (queue.length >= s.position + REQUEUE_INSERT_FLOOR && insertAt <= queue.length) {
        const returnedCount = updated.runReturnedCount ?? 0;
        const returnedCard = {...updated, runReturnedCount: returnedCount+1};
        
        queue.splice(insertAt, 0, { ...returnedCard });
      }

    }
    
    if (s.noNextCard()) {
      
      const finishDelayMs = 1000;
      window.setTimeout(async () => {
        if (userId) {
          await supabase.from("runs").insert({
            user_id: userId,
            final_score: Math.floor(state.score),
            mode: isAIReview ? "ai" : "classic",
            run_size: runMaxLength,
          }); 
        }


        
        streakBump();
        
        if (SESSION_KEY) localStorage.removeItem(SESSION_KEY);
        setFinished(true);
        sessionRef.current = null;
        setSession(null);
      }, finishDelayMs);

        } else {
          setGame(state);
          const nextIndex = s.position + 1;
          const nextSession = new Session([...s.results], nextIndex, state, deckId || "", isAIReview, (runMaxLength === 30));
          sessionRef.current = nextSession;
      if (nextIndex % 6 === 0 && !(nextIndex % 5 === 0)) {
        const types = Object.values(EventType);
        const randomType = types[Math.floor(Math.random() * types.length)];
        fireEvent(randomType);
        setEventNotification(randomType);
        setTimeout(() => setEventNotification(null), 3000);
      }
      if (nextIndex % 5 === 0) {
        const newEvents: EventType[] = [];
        while (newEvents.length < 3) {
          const types = Object.values(EventType);
          const randomType = types[Math.floor(Math.random() * types.length)];
          if (!newEvents.includes(randomType)) {
            newEvents.push(randomType);
          }
        }
        setIsArtifactEvent(false);
        setSelectableEventTypes(newEvents);
        setEventPopup(true);

        // Transition will happen in EventPopup onClose after event selection

      } else {
        // No event popup - transition immediately  
        setTimeout(() => {
          setSession(nextSession);
          if (!isAIReview) {
            setShowAnswer(false);
          }
        }, 600);
      }

      persistSession(nextSession);
    }
  };

  const gradeSubmission = async (userInput: string | boolean) => {
    if (eventPopup) return;
    if (manualgradingdisabled) return;
    setManualGradingDisabled(true);
    if (!card || !card.variant) return;

    const v = card.variant;
    if (isAIReview) {
      const userAnswer = (typeof(userInput) == "boolean") ? userInput : userInput.trim().toLowerCase();
      const correctAnswer = (card?.variant?.type !== "tf") ? card?.variant?.answer.trim().toLowerCase() : (card?.variant?.answer);
      setShowAnswer(true);
      const isExact = userAnswer === correctAnswer;

      // Allow fuzzy only for cloze; MCQ/TF must be exact
      const isFuzzyClose =
        v.type === "cloze" &&
        typeof userAnswer === "string" &&
        typeof correctAnswer === "string" &&
        levenshtein(userAnswer, correctAnswer) <= typingTolerance;

      const correctOrClose = isExact || isFuzzyClose;

      if (correctOrClose && stopwatchTimer <= 10) {
        setGradeFlash("easy");
        await handleGrade("easy", stopwatchTimer);
      } else if (correctOrClose && stopwatchTimer <= 30) {
        setGradeFlash("good");
        await handleGrade("good", stopwatchTimer);
      } else if (correctOrClose) {
        setGradeFlash("hard");
        await handleGrade("hard", stopwatchTimer);
      } else {
        setGradeFlash("wrong");
        await handleGrade("wrong", stopwatchTimer);
        shakeControls.start({
          x: [0, -18, 18, -12, 12, -8, 8, -4, 4, 0],
          transition: { duration: 0.45, ease: "easeInOut" },
        });
      }

    } else {
      // Classic mode: userInput is grade string
      const grade = userInput as "easy" | "good" | "hard" | "wrong";
      setGradeFlash(grade);
      await handleGrade(grade, stopwatchTimer);
      if (grade === "wrong") {
        shakeControls.start({
          x: [0, -18, 18, -12, 12, -8, 8, -4, 4, 0],
          transition: { duration: 0.45, ease: "easeInOut" },
        });
      }
    }
    setTimeout(() => {
    setGradeFlash(null)
    setShowAnswer(false);
    setManualGradingDisabled(false);
    }, 1000);
    
  }
  const v = card.variant;
  const isReturned = (card.runReturnedCount ?? 0) > 0;

  const getEventName = (event: EventType): string => {
    switch(event) {
      case EventType.LET_THE_CARDS_BURN: return "Let the Cards Burn";
      case EventType.ALL_OR_NOTHING: return "All or Nothing";
      case EventType.TEMPO_UP: return "Tempo Up";
      case EventType.PURIFY: return "Purify";
      case EventType.DOUBLE_IT: return "Double It";
      case EventType.CHAOS_THEORY: return "Chaos Theory";
      case EventType.FREEZE: return "Freeze";
      case EventType.CASCADE: return "Cascade";
      case EventType.SOAK: return "Soak";
      case EventType.YIN_YANG: return "Yin Yang";
      case EventType.POISON_THE_WATERS: return "Poison the Waters";
      case EventType.CHARGE_UP: return "Charge Up";
      case EventType.LUCK_OF_THE_DRAW: return "Luck of the Draw";
      case EventType.MIRROR_IMAGE: return "Mirror Image";      
      default: return "Unknown Event";
    }
  };



  function fireEvent(event: EventType) {
    if (!card) return;

    card.statusData ??= [];

    const s = sessionRef.current;

    function ProcNextCards(targetCards: number, procCount: number, statusKey: statusDatatype) {
      if (!s) return;
      
      for (let i = 0; i < targetCards; i++) {
        const card = s.results[s.position + i];
        if (!card) continue;
        
        // Initialize statusData if undefined
        card.statusData ??= [];
        
        const isFrozen = card.statusData.some((status: any) => "frozen" in status);
        if (isFrozen) continue; // Skip frozen cards
        
        card.statusData ??= [];
        const existing = card.statusData.find((status: any) => statusKey in status);
        if (existing) {
          // Add to existing status count
          existing[statusKey] = (existing[statusKey] ?? 0) + procCount;
        } else {
          // Create new status record
          card.statusData.push({ [statusKey]: procCount } as Record<statusDatatype, any>);
        }

        // ICE_TALISMAN: When frozen is added, boost all existing effects by 1
        if (statusKey === "frozen" && game?.artifacts.includes(ArtifactType.ICE_TALISMAN)) {
          card.statusData.forEach((status: any) => {
            const key = Object.keys(status)[0];
            if (key !== "frozen") {
              status[key]++;
            }
          });
        }
      }
    }
    if (s && event) {
      if (event === EventType.LET_THE_CARDS_BURN) {
        ProcNextCards(8, 3, "burn");
      } else if (event === EventType.SOAK) {
        ProcNextCards(10, 2, "wet");
      } else if (event === EventType.TEMPO_UP) {
        ProcNextCards(2, 1, "tempo up");
      } else if (event === EventType.FREEZE) {
        ProcNextCards(6, 1, "frozen");
      } else if (event === EventType.CASCADE) {
        ProcNextCards(8, 1, "burn");
        ProcNextCards(8, 1, "wet");
      } else if (event === EventType.POISON_THE_WATERS) {
        ProcNextCards(6, 6, "wet");
        ProcNextCards(6, 3, "poison");
      } else if (event === EventType.YIN_YANG) {
        ProcNextCards(6, 6, "burn");
        ProcNextCards(6, 3, "poison");
      } else if (event === EventType.DOUBLE_IT) {
        const card = s.results[s.position];
        if (!card) return;
        if (!card.statusData) return;
        const isFrozen = card.statusData.some((status: any) => "frozen" in status);
        if (isFrozen) return; // Skip frozen card

        card.statusData.forEach((status: any) => {
          const key = Object.keys(status)[0];
          status[key] = status[key] * 2;
        });
      } else if (event === EventType.PURIFY) {
        const negativeStatusKeys: statusDatatype[] = ["poison"];
        for (let i = 0; i < 10; i++) {
          const card = s.results[s.position + i];
          if (!card) continue;
          if (!card.statusData) continue;
          const isFrozen = card.statusData.some((status: any) => "frozen" in status);
          if (isFrozen) continue; // Skip frozen cards
          card.statusData = card.statusData.filter((status: any) => {
            const key = Object.keys(status)[0] as statusDatatype | undefined;
            return !key || !negativeStatusKeys.includes(key);
          });
        }
      } else if (event === EventType.ALL_OR_NOTHING) {
        const statusKeyOptions: statusDatatype[] = ["burn", "wet", "poison"];

        for (let i = 0; i < 20; i++) {
          const statusKey = statusKeyOptions[Math.floor(Math.random() * statusKeyOptions.length)];
          const card = s.results[s.position + i];
          if (!card) continue;
          
          // Initialize statusData if undefined
          card.statusData ??= [];
          
          const isFrozen = card.statusData.some((status: any) => "frozen" in status);
          if (isFrozen) continue; // Skip frozen cards
          
          const existing = card.statusData.find((status: any) => statusKey in status);
          if (existing) {
            // Add to existing status count
            existing[statusKey] = (existing[statusKey] ?? 0) + 2;
          } else {
            // Create new status record
            card.statusData.push({ [statusKey]: 2 } as Record<statusDatatype, any>);
          }
        }
      } else if (event === EventType.CHAOS_THEORY) {
        // Randomize the effects on the next 10 upcoming cards
        const statusKeyOptions: statusDatatype[] = ["burn", "wet", "poison"];
        for (let i = 0; i < 10; i++) {
          const card = s.results[s.position + i];
          if (!card) continue;
          if (!card.statusData) continue;
          const isFrozen = card.statusData.some((status: any) => "frozen" in status);
          if (isFrozen) continue; // Skip frozen cards
          
          // Collect total stacks then reassign randomly
          let totalStacks = 0;
          card.statusData.forEach((status: any) => {
            const key = Object.keys(status)[0];
            totalStacks += status[key] ?? 0;
          });
          
          // Clear and reassign with random effects
          card.statusData = [];
          while (totalStacks > 0) {
            const statusKey = statusKeyOptions[Math.floor(Math.random() * statusKeyOptions.length)];
            const stacksToAdd = Math.min(totalStacks, Math.floor(Math.random() * 3) + 1);
            const existing = card.statusData.find((s: any) => statusKey in s);
            if (existing) {
              existing[statusKey] = (existing[statusKey] ?? 0) + stacksToAdd;
            } else {
              card.statusData.push({ [statusKey]: stacksToAdd } as Record<statusDatatype, any>);
            }
            totalStacks -= stacksToAdd;
          }
        }
      } else if (event === EventType.CHARGE_UP) {
        ProcNextCards(4, 1, "overcharged");
      } else if (event === EventType.MIRROR_IMAGE) {
        const currentCard = s.results[s.position];
        for (let i = 0; i < 3; i++) {
          const nextCard = s.results[s.position + i];
          if (currentCard && nextCard) {
            const currentEffects = currentCard.statusData ?? [];
            const nextEffects = nextCard.statusData ?? [];
            
            // Merge effects, combining stacks of the same type
            const merged = [...nextEffects];
            currentEffects.forEach((currentStatus: any) => {
              const key = Object.keys(currentStatus)[0] as statusDatatype;
              const existing = merged.find((s: any) => key in s);
              if (existing) {
                existing[key] += currentStatus[key];
              } else {
                merged.push({ [key]: currentStatus[key] } as Record<statusDatatype, any>);
              }
            });
            
            nextCard.statusData = merged;
          }
        }
      } else if (event === EventType.LUCK_OF_THE_DRAW) {
        ProcNextCards(7, 1, "lucky");
      } else if (event === EventType.CURSED_LUCK) {
        ProcNextCards(5, 1, "cursed");
        ProcNextCards(10, 1, "lucky");
      }


    }
    if (sessionRef.current) {
      persistSession(sessionRef.current);
    }
  }

  return (

      
    <div>
      <motion.div
        className="text-gray-100 p-4 max-w-7xl mx-auto"
        animate={shakeControls}
        initial={{ x: 0 }}
      > 
        <div className="flex flex-row justify-between mb-4">
          <h1 className="text-3xl">Reviewing...</h1>
          <div className="flex gap-4">
            <div className="px-3 py-2 rounded bg-[#0d0f14] border border-white/10 text-gray-300 items-center">
              {`${Math.floor(stopwatchTimer / 60)}:${(stopwatchTimer % 60).toString().padStart(2, '0')}`}
            </div>
            <button
              className="px-3 py-2 rounded-md bg-rose-500/15 text-rose-100 border border-rose-300/40 hover:bg-rose-500/25 transition"
              onClick={endSessionEarly}
            >
              End session
            </button>
          </div>

        </div>

        <div className="flex flex-row gap-6">
        <div className="flex-[2] grid gap-4">
  <AnimatePresence mode="wait">
    <motion.div
      key={card.id}
      initial={{ opacity: 0, y: -30 }}
      onClick={() => {
        if (eventPopup) return;
        if (isAIReview) return;
        if (v?.type !== "classic") return;
        if (!showAnswer) setShowAnswer(true);
      }}
      animate={
        gradeFlash === "wrong"
          ? { opacity: 1, y: 0, scale: [1, 1.06, 0.9, 1.03, 1], rotate: [0, -3, 3, -2, 2, 0] }
          : { opacity: 1, y: 0 }
      }
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.13, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl bg-[#0b0b0f] border border-white/10 aspect-[1.7] w-full flex flex-col overflow-hidden min-h-0
        shadow-[0_18px_55px_rgba(0,0,0,0.45)]
        before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none
        before:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(0,0,0,0.55)]
        ${
          gradeFlash === "easy"
            ? "ring-2 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]"
            : gradeFlash === "good"
            ? "ring-2 ring-indigo-400/40 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]"
            : gradeFlash === "hard"
            ? "ring-2 ring-amber-300/70 shadow-[0_0_30px_-10px_rgba(252,211,77,0.6)]"
            : gradeFlash === "wrong"
            ? "ring-2 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)]"
            : ""
        } ${!showAnswer && v?.type === "classic" ? "cursor-pointer" : ""}`}
    >
      {/* Outer padding belongs to the "margin" of the card */}
      <div className="relative p-12 min-h-0 flex-1">
        {isReturned && (
          <motion.div
            className="pointer-events-none absolute inset-5 rounded-[24px] bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.22),transparent_48%),radial-gradient(circle_at_82%_22%,rgba(251,191,36,0.18),transparent_44%),radial-gradient(circle_at_50%_82%,rgba(245,158,11,0.24),transparent_54%)] blur-[30px] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_22px_55px_-30px_rgba(245,158,11,0.55),0_0_40px_16px_rgba(251,191,36,0.26)]"
            initial={{ opacity: 0.88, scale: 0.992 }}
            animate={{
              opacity: [0.72, 1, 0.75, 0.96],
              scale: [0.985, 1.032, 1.005, 0.99],
              rotate: [0, 0.25, -0.18, 0],
            }}
            transition={{ duration: 2.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        )}

        {/* Header row pinned */}
        <div className="absolute top-3.5 left-6 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md bg-zinc-900/70 ring-1 ring-white/10 uppercase tracking-wide text-gray-300">
            {v ? (v.type === "mcq" ? "MCQ" : v.type === "cloze" ? "Cloze" : v.type === "classic" ? "Flashcard" : "True/False") : "Flashcard"}
          </span>

          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md bg-zinc-900/50 ring-1 ring-white/10 uppercase tracking-wide text-gray-300">
            {card.status}
          </span>

          {isReturned && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md bg-amber-500/10 ring-1 ring-amber-300/70 uppercase tracking-wide text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.22)]">
              REPRISE
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md bg-zinc-900/50 ring-1 ring-white/10 uppercase tracking-wide text-gray-300">
            {`Card ${session?.position + 1} / ${session?.results.length ?? 0}`}
          </span>
        </div>

              {/* Inner face */}
        <div className="relative z-10 h-full min-h-0 rounded-xl bg-[#0f1014] ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="h-full p-4 flex items-start min-h-0">
            <div
              ref={promptContainerRef}
              className="flex items-center justify-center w-full h-full min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
            >
              <div
                ref={promptTextRef}
                className=" w-full text-gray-50 text-center break-words whitespace-pre-wrap [overflow-wrap:anywhere] leading-snug"
              >
                {card.variant?.prompt ?? ""}
              </div>
            </div>
          </div>
        </div>
      
          {/* status data */}
        <div className="absolute bottom-3.5 right-6  flex items-center gap-2">
          {card.statusData?.map((status: any, index: number) => {
            const keys = Object.keys(status);
            const tone = keys.includes("burn")
              ? "amber"
              : keys.includes("wet")
              ? "blue"
              : keys.includes("poison")
              ? "emerald"
              : keys.includes("frozen")
              ? "indigo"
              : keys.includes("tempo up")
              ? "yellow"
              : keys.includes("lucky")
              ? "green"
              : keys.includes("overcharged")
              ? "purple"
              : keys.includes("cursed")
              ? "red"
              : "amber";
            const badgeClass =
              tone === "amber"
                ? "bg-amber-500/10 ring-amber-300/70 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.22)]"
                : tone === "indigo"
                ? "bg-indigo-500/10 ring-indigo-300/70 text-indigo-100 shadow-[0_0_18px_rgba(129,140,248,0.25)]"
                : tone === "blue"
                ? "bg-blue-500/10 ring-blue-300/70 text-blue-100 shadow-[0_0_18px_rgba(59,130,246,0.22)]"
                : tone === "yellow"
                ? "bg-yellow-500/10 ring-yellow-300/70 text-yellow-100 shadow-[0_0_18px_rgba(234,179,8,0.22)]"
                : tone === "green"
                ? "bg-green-500/10 ring-green-300/70 text-green-100 shadow-[0_0_18px_rgba(34,197,94,0.22)]"
                : tone === "purple"
                ? "bg-purple-500/10 ring-purple-300/70 text-purple-100 shadow-[0_0_18px_rgba(168,85,247,0.22)]"
                : tone === "red"
                ? "bg-red-500/10 ring-red-300/70 text-red-100 shadow-[0_0_18px_rgba(239,68,68,0.22)]"
                : "bg-emerald-500/10 ring-emerald-300/70 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.22)]";
            return (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-0.5 text-xs rounded-md ring-1 uppercase tracking-wide ${badgeClass}`}
              >
                {Object.entries(status).map(([key, value]) => `${key} ${value}`).join(", ")}
              </span>
            );
          })}

        </div>

        
      </div>

      {/* Optional subtle grain */}
      <div className="absolute inset-0 pointer-events-none opacity-15
        [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_2px,transparent_2px,transparent_6px)]
      " />
    </motion.div>
  </AnimatePresence>

          

        {v?.type === "tf" && (
          <motion.div
            className="p-4 border border-white/10 rounded bg-[#111113]"
            initial="hidden"
            animate="show"
            variants={listVariants}
          >
            <span className="text-sm opacity-60 mb-1 text-gray-400">Options</span>
            <motion.div className="mt-3 grid grid-cols-2 gap-3" variants={listVariants}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                variants={itemVariants}
                className={`px-4 py-2 rounded bg-[#16161a] border border-white/10 text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-between
                          ${showAnswer && card.variant?.answer === true ? "ring-4 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]" : ""}`}
                onClick={() => gradeSubmission(true)}
              >
                <span className="relative z-10">True</span>
                <span className="opacity-50 text-xs">1</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                variants={itemVariants}
                className={`px-4 py-2 rounded bg-[#16161a] border border-white/10 text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-between
                          ${showAnswer && card.variant?.answer === false ? "ring-4 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]" : ""}`}
                onClick={() => gradeSubmission(false)}
              >
                <span className="relative z-10">False</span>
                <span className="opacity-50 text-xs">2</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}


          {v?.type === "mcq" && (
            <motion.div className="p-4 border border-white/10 rounded bg-[#111113]" initial="hidden" animate="show" variants={listVariants}>
            <span className="text-sm opacity-60 mb-1 text-gray-400">Options</span>
              <motion.ul className="mt-3 space-y-2" variants={listVariants}>
                {v.options.map((opt, i) => (
                  <motion.li key={i} className="p-2 rounded bg-[#16161a] border border-white/10" variants={itemVariants}>
                    <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full px-4 py-2 rounded bg-[#16161a] text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-between
                      ${showAnswer && opt === v.answer ? "ring-4 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]" : ""}`}
                    onClick={() => gradeSubmission(opt)}>
                      <span>{opt}</span>
                      <span className="opacity-50 text-xs">{i + 1}</span>
                    </motion.button>
                  </motion.li>

                ))}
              </motion.ul>
            </motion.div>
          )}
          
          {v?.type === "cloze" && (
            <div>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-3 rounded bg-[#111113] border border-white/10 text-gray-100 focus:outline-none"
                placeholder="Type your answer and press Enter to submit"
                onKeyDown={(e) => e.key === "Enter" && gradeSubmission(answer)}

              />    
                {showAnswer && (
                  <div className="text-sm text-indigo-200 bg-[#16161a] border border-white/10 rounded p-2 mt-2">
                    Answer: <span className="font-semibold">{v.answer}</span>
                  </div>
                )}
            </div>
          )}
          {v?.type === "classic" && (


              <div>
                <div>
                  {!showAnswer && (
                    <div className="text-sm opacity-60 mb-1 text-gray-400 flex flex-col">
                      Press Space or click the card to reveal, 1-4 to grade.
                    </div>
                  )

                  }
                </div>
                {showAnswer && (
                <motion.div
                  className="mt-3 w-full p-6 rounded-lg bg-[#16161a] border border-white/10 flex flex-col"
                  initial="hidden"
                  animate="show"
                  variants={listVariants}
                >
                  <div
                    ref={answerContainerRef}
                    className="mt-2 min-w-0 max-h-[24vh] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
                  >
                    <div
                      ref={answerTextRef}
                      className="w-full text-gray-100 leading-snug whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                    >
                      {v.answer}
                    </div>

                    

                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {["wrong", "hard", "good", "easy"].map((grade) => (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        variants={itemVariants}
                        className={`px-4 py-2 rounded bg-[#16161a] border border-white/10 text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500
                          ${gradeFlash === grade ? "ring-4 ring-indigo-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)]" : ""}`}
                        onClick={() => gradeSubmission(grade)}
                      >
                        <span className="relative z-10">{grade}</span>
                      </motion.button>
                      
                    ))}
                    
                  </div>
                </motion.div>


                )}
                
              </div>
          )}
        </div>
        <div 
        className="inline-flex flex-col flex-[1] p-5 h-full gap-4 rounded-2xl bg-gradient-to-b from-[#111113] via-[#0f1115] to-[#0c0d12] border border-white/10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] transform origin-top">
                    

          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center">
              <div className="relative flex-1 py-2 rounded-xl bg-[#0d0f14] border border-white/10 text-center text-5xl font-semibold text-gray-200 ring-rose-300/80 ring-4 ">
                <AnimatedNumber value={game.points} pulseKey={pointsPulse} floatDigits />
                <ProcPopups popups={popups.filter(p => p.type === "points" || p.type === "return" || p.type === "burn" || p.type === "poison" || p.type === "lucky")}/>
              </div>
            </div>
            <div className="flex flex-row items-center justify-center gap-4">
              <motion.div              
              className="rounded-lg bg-[#111113] text-center text-4xl font-semibold text-rose-300 tracking-wide"
              style={{ textShadow: "0 0 3px #ffffffff" }}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Base
              </motion.div>
              <motion.div              
              className="rounded-lg bg-[#111113] text-center text-5xl font-bold text-white-400 tracking-wide"
              style={{ textShadow: "0 0 9px #ffffffff" }}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                ×
              </motion.div>
              <motion.div              
              className="rounded-lg bg-[#111113] text-center text-4xl font-bold text-indigo-300 tracking-wide"
              style={{ textShadow: "0 0 3px #ffffffff" }}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Tempo
              </motion.div>

            </div>
            <div className="flex items-center">
              <div className="relative flex-1 p-4 py-2 rounded-xl bg-[#0d0f14] border border-white/10 text-center text-5xl font-semibold text-gray-200 ring-indigo-300/80 ring-4">
                <AnimatedNumber value={game.multiplier} decimals={2} pulseKey={multPulse} floatDigits />
                <ProcPopups popups={popups.filter(p => p.type === "mult" || p.type === "wet" || p.type === "vaporise" || p.type === "tempo up")}/>
              </div>
            </div>
            
          </div>
          <div className="w-full p-5 rounded-2xl bg-[#0b0d12] border border-white/10 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-2">Total Score</div>
            <div className="text-6xl font-bold text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]">
              <AnimatedNumber value={game.score} floatDigits />
            </div>
          </div>

          {/* Artifacts Display */}
          {game?.artifacts && game.artifacts.length > 0 && (
            <div className="w-full p-3 rounded-xl bg-[#0b0d12] border border-white/10">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 text-center">Artifacts</div>
              <div className="flex justify-center gap-2">
                {game.artifacts.map((artifact, idx) => (
                  <div 
                    key={idx} 
                    className="text-2xl p-2 rounded-lg bg-white/5 border border-white/10"
                    title={artifact}
                  >
                    {artifact === "fire_ring" && "🔥"}
                    {artifact === "water_amulet" && "💧"}
                    {artifact === "toxic_charm" && "☠️"}
                    {artifact === "ice_talisman" && "❄️"}
                    {artifact === "wind_bracelet" && "🌪️"}
                    {artifact === "steam_core"  && "💨"}
                    {artifact === "gamblers_dice" && "🎲"}
                    {artifact === "supercharger" && "⚡"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Notification */}
          <AnimatePresence>
            {eventNotification && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full p-3 rounded-xl bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-sm border border-white/20 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              >
                <div className="flex items-center justify-center gap-3 text-white">
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wider opacity-80">Random Event</div>
                    <div className="font-semibold">{getEventName(eventNotification)}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
         <button
          onClick={() => setShowCheatSheet(!showCheatSheet)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition flex items-center justify-between"
        >
          <span>📖 Guide</span>
          <span className="text-xs">{showCheatSheet ? '▼' : '▶'}</span>
        </button>         
        {showCheatSheet && 
        <CheatSheet showEvents={false}></CheatSheet>
        }
        </div>


      </div>
      
      </motion.div>

      <EventPopup 
        isOpen={eventPopup}
        onClose={(event, artifact) => {
          if (!isArtifactEvent) {
            fireEvent(event);
            setEventPopup(false);
          } else if (artifact) {

            // Add to current session
            if (sessionRef.current) {
              const updatedState = {...sessionRef.current.gameState, artifacts: [...sessionRef.current.gameState.artifacts, artifact]};
              sessionRef.current.setGame(updatedState);
              setGame(updatedState);
              persistSession(sessionRef.current);
            }
            const newEvents: EventType[] = [];
            while (newEvents.length < 3) {
              const types = Object.values(EventType);
              const randomType = types[Math.floor(Math.random() * types.length)];
              if (!newEvents.includes(randomType)) {
                newEvents.push(randomType);
              }
            }
            setSelectableEventTypes(newEvents);
            // After artifact selection, show event popup
            setIsArtifactEvent(false);
            setEventPopup(true);
            return; // Don't transition yet, wait for event selection
          } else {
            setEventPopup(false);
          }
          setIsArtifactEvent(false);
          
          // Transition to next card after event selection
          const nextSession = sessionRef.current;
          if (nextSession) {
            setTimeout(() => {
              setSession(nextSession);
              if (!isAIReview) {
                setShowAnswer(false);
              }
            }, 600);
          }
        }}
        selectableEventTypes={selectableEventTypes}
        selectableArtifactTypes={selectableArtifactTypes}
        isArtifactEvent={isArtifactEvent}
      />
      
    </div>
    
  );
}
