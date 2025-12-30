import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Session } from "../lib/session";
import { getDueCards } from "../lib/queue";
import { Card, Deck, VariantCard, Classic } from "../lib/types";
import { listDecks } from "../lib/decks";
import { generateMCQ, generateCloze, generateTrueFalse } from "../lib/llm";
import levenshtein  from "js-levenshtein";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { DEFAULT_SETTINGS } from "./Settings";

const mulberry32 = (a: number) => {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export default function Review() {
  const [searchParams] = useSearchParams();
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
  const seedRef = useRef<number | null>(null);
  const shakeControls = useAnimation();
  const [gradeFlash, setGradeFlash] = useState<"easy" | "good" | "hard" | "wrong" | null>(null);
  const [manualgradingdisabled, setManualGradingDisabled] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const reviewMode = Boolean(deckId);

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
    if (!SESSION_KEY || seedRef.current === null) return;
    const payload = { queue: s.results, index: s.position, seed: seedRef.current };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  };

  const loadPersistedSession = (dueIds: string[]): { session: Session; seed: number } | null => {
    if (!SESSION_KEY) return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.queue || typeof parsed.seed !== "number") return null;
      const queueIds: string[] = parsed.queue.map((c: VariantCard) => c.id);
      const matchesDue =
        queueIds.length === dueIds.length &&
        queueIds.every((id) => dueIds.includes(id));
      if (!matchesDue) return null;
      const restored = new Session(parsed.queue, parsed.index ?? 0);
      return { session: restored, seed: parsed.seed };
    } catch (err) {
      console.warn("Failed to load persisted session", err);
      return null;
    }
  };
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
  const settings = loadSettings();
  const defaultMode = settings?.defaultMode || DEFAULT_SETTINGS.defaultMode;
  
  useEffect(() => {
    setAnswer("");
    setShowAnswer(false);
    setGradeFlash(null);
    setManualGradingDisabled(false);
  }, [session?.current?.id]);
  // -------------------------------------------------
  // 1) Review Home (choose a deck)
  // -------------------------------------------------
  useEffect(() => {
    if (!reviewMode) {
      listDecks().then(setDecks);
      window.api.readCards().then(setCards);
    }
  }, [reviewMode]);

  // -------------------------------------------------
  // 2) Enter Review Mode (load session ONCE)
  // -------------------------------------------------
  useEffect(() => {
    if (!deckId) return;
    (async () => {
      const all = await window.api.readCards();
      const filtered = all.filter((c) => c.deckId === deckId);
      const due = getDueCards(filtered);

      const persisted = loadPersistedSession(due.map((c) => c.id));
      if (persisted) {
        seedRef.current = persisted.seed;
        sessionRef.current = persisted.session;
        setSession(persisted.session);
        setFinished(persisted.session.isFinished() || due.length === 0);
        if (due.length === 0 && SESSION_KEY) localStorage.removeItem(SESSION_KEY);
        return;
      }

      if (due.length === 0) {
        setFinished(true);
        if (SESSION_KEY) localStorage.removeItem(SESSION_KEY);
        return;
      }

      const seed = Math.floor(Math.random() * 0xffffffff);
      seedRef.current = seed;
      const rng = mulberry32(seed);

      const VariantList : VariantCard[] = await Promise.all(
        due.map(async (card) => {
          const classicVariant: Classic = { type: "classic", prompt: card.question, answer: card.answer };
          if (!isAIReview) return { ...card, variant: classicVariant }; // no variant
          const r = rng();
          const generator = r < 0.33 ? generateCloze : r < 0.66 ? generateMCQ : generateTrueFalse;
          const variant = await generator(card);
          return { ...card, variant}
        })
      );
      
      const s = new Session(VariantList);
      sessionRef.current = s;
      setSession(s);
      persistSession(s);

      setFinished(due.length === 0);
    })();
  // Re-run when deck or mode changes so classic vs AI build their own sessions
  }, [deckId, isAIReview]);


  useEffect(() => {
    setStopwatchTimer(0);
    const interval = setInterval(() => {setStopwatchTimer((t) => t + 1)}, 1000);
    return () => clearInterval(interval);
  }, [session?.current?.id]);

  // Keyboard shortcuts for classic mode (space to show, 1-4 to grade)
  useEffect(() => {

    if (isAIReview) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [showAnswer, isAIReview, manualgradingdisabled]);

  // -------------------------------------------------
  // CASE 1: Review homepage (deck list)
  // -------------------------------------------------
  if (!reviewMode) {
    const countDue = (id: string) =>
      cards.filter((c) => c.deckId === id && c.nextReview <= Date.now()).length;

    return (
      <div className="text-gray-100 p-6">
        <h1 className="text-2xl mb-4">Select Deck to review</h1>
        {defaultMode === "none" &&
          <div className="flex flex-col divide-y divide-white/5 border border-white/5 rounded-lg bg-[#111113]">
            {decks.map((deck) => (
              <div className= "flex flex-row items-center justify-between px-3 py-2" key={deck.id}>
                <div className="px-4 py-3 transition-colors flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="font-medium text-lg">{deck.name}</div>

                  <div className="opacity-60 text-sm text-gray-400">{countDue(deck.id)} due</div>
                  <div className="space-x-2">

                  </div>

                </div>
                  <div className="inline-flex rounded-xl overflow-hidden bg-[#111] ring-1 ring-white/20">
                    <Link className="px-4 py-2 bg-white/10 text-gray-100 ring-white/70 hover:bg-white/30 border-white/20 transition"
                      to={`/review/${deck.id}?mode=classic`} 
                    >
                      Classic
                    </Link>

                    <Link className="px-4 py-2 bg-emerald-400/70 hover:bg-emerald-400/90 transition border-l border-white/20"
                      to={`/review/${deck.id}?mode=ai`}
                    >
                      Quiz
                    </Link>
                  </div>
                
              </div>
            ))}
          </div>
        }
        {defaultMode !== "none" &&
          <div className="flex flex-col divide-y divide-white/5 border border-white/5 rounded-lg bg-[#111113]">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                to={`/review/${deck.id}?mode=${defaultMode}`}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="font-medium text-lg">{deck.name}</div>
                <div className="opacity-60 text-sm text-gray-400">{countDue(deck.id)} due</div>
              </Link>
            ))}
          </div>

        }
      </div>
    );
  }

  // -------------------------------------------------
  // CASE 2: Session finished
  // -------------------------------------------------
  if (finished) {
    return (
      <div className="text-gray-100 p-6">
        <h1 className="text-2xl mb-4">Session complete!</h1>
        <p className="opacity-70 mb-4 text-gray-400">You're all done for today.</p>

        <Link
          to={`/review`}
          className="px-4 py-2 rounded bg-emerald-500/80 text-emerald-50 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)] hover:bg-emerald-500"
        >
          Back to review menu
        </Link>
      </div>
    );
  }

  // -------------------------------------------------
  // CASE 3: Active review session
  // -------------------------------------------------
  if (!session) return <div className="text-gray-100 p-6">Loading...</div>;

  const card = session.current;
  if (!card) {
    setFinished(true);
    return <div className="text-gray-100 p-6">Finishing...</div>;
  }

  // -------------------------------------------------
  // Grade handler
  // -------------------------------------------------
  const handleGrade = async (grade: "easy" | "good" | "hard" | "wrong") => {
    const s = sessionRef.current;
    if (!s) return;
    setShowAnswer(true);
    const updated = s.grade(grade);
    if (!updated) return;
    setTimeout(() => {
      s.next();
      setSession(new Session([...s.results], s.position));
      if (!isAIReview) {
        setShowAnswer(false);
      }
    }, 1000);
    
    // Save updated card
    const all = await window.api.readCards();
    const saved = all.map((c) => (c.id === updated.id ? {...updated, variant: undefined } : c));
    await window.api.saveCards(saved);

    if (s.isFinished()) {
      if (SESSION_KEY) localStorage.removeItem(SESSION_KEY);
      setFinished(true);
    } else {
      // Force re-render but DO NOT recreate session
      setSession(new Session([...s.results], s.position)); // keep cursor position
      sessionRef.current = s;
      persistSession(s);
    }
  };

  function gradeSubmission(userInput: string | boolean) {
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
        levenshtein(userAnswer, correctAnswer) <= 1;

      const correctOrClose = isExact || isFuzzyClose;

      if (correctOrClose && stopwatchTimer <= 10) {
        setGradeFlash("easy");
        handleGrade("easy");
      } else if (correctOrClose && stopwatchTimer <= 30) {
        setGradeFlash("good");
        handleGrade("good");
      } else if (correctOrClose) {
        setGradeFlash("hard");
        handleGrade("hard");
      } else {
        setGradeFlash("wrong");
        handleGrade("wrong");
        shakeControls.start({
          x: [0, -18, 18, -12, 12, -8, 8, -4, 4, 0],
          transition: { duration: 0.45, ease: "easeInOut" },
        });
      }

    } else {
      // Classic mode: userInput is grade string
      handleGrade(userInput as "easy" | "good" | "hard" | "wrong");
      setGradeFlash(userInput as "easy" | "good" | "hard" | "wrong");
      if (userInput === "wrong") {
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

  return (
    <motion.div
      className="text-gray-100 p-6"
      animate={shakeControls}
      initial={{ x: 0 }}
    >
      <h1 className="text-2xl mb-4">Reviewing...</h1>

      <div className="grid gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={
              gradeFlash === "wrong"
                ? { opacity: 1, y: 0, scale: [1, 1.06, 0.9, 1.03, 1], rotate: [0, -3, 3, -2, 2, 0] }
                : { opacity: 1, y: 0 }
            }
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`p-4 rounded bg-[#111113] border border-white/10 ${
              gradeFlash === "easy"
                ? "ring-2 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)]"
                : gradeFlash === "good"
                ? "ring-2 ring-emerald-400/40 shadow-[0_0_30px_-10px_rgba(129,140,248,0.6)]"
                : gradeFlash === "hard"
                ? "ring-2 ring-amber-300/70 shadow-[0_0_30px_-10px_rgba(252,211,77,0.6)]"
                : gradeFlash === "wrong"
                ? "ring-2 ring-rose-400/70 shadow-[0_0_30px_-10px_rgba(251,113,133,0.6)]"
                : ""
            }`}
          >
            <span className="text-sm opacity-60 mb-1 text-gray-400">Question</span>
            <span className="px-2 py-0.5 text-xs rounded bg-[#16161a] border border-white/10">
              {v ? (v.type === "mcq" ? "MCQ" : v.type === "cloze" ? "Cloze" : v.type === "classic" ? "Flashcard" : "True/False") : "Flashcard"}
            </span>
            <motion.span
              className="px-2 py-0.5 text-xs rounded bg-[#16161a] border border-white/10 inline-block"
              animate={{ scale: [1, 1.05, 1], opacity: [1, 0.9, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {`Time: ${Math.floor(stopwatchTimer / 60)}:${(stopwatchTimer % 60).toString().padStart(2, '0')}`}
            </motion.span>
            <div>{card.variant?.prompt}</div>
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
              className={`px-4 py-2 rounded bg-[#16161a] border border-white/10 text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500
                        ${showAnswer && card.variant?.answer === true ? "ring-4 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)]" : ""}`}
              onClick={() => gradeSubmission(true)}
            >
              <span className="relative z-10">True</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              variants={itemVariants}
              className={`px-4 py-2 rounded bg-[#16161a] border border-white/10 text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500
                        ${showAnswer && card.variant?.answer === false ? "ring-4 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)]" : ""}`}
              onClick={() => gradeSubmission(false)}
            >
              <span className="relative z-10">False</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}


        {v?.type === "mcq" && (
          <motion.div className="p-4 border border-white/10 rounded bg-[#111113]" initial="hidden" animate="show" variants={listVariants}>
          <span className="text-sm opacity-60 mb-1 text-gray-400">Options   </span>
            <motion.ul className="mt-3 space-y-2" variants={listVariants}>
              {v.options.map((opt, i) => (
                <motion.li key={i} className="p-2 rounded bg-[#16161a] border border-white/10" variants={itemVariants}>
                  <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-2 rounded bg-[#16161a] border border-white/10 text-gray-100 hover:border-indigo-300/70 disabled:bg-gray-800 disabled:text-gray-500
                    ${showAnswer && opt === v.answer ? "ring-4 ring-emerald-400/70 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)]" : ""}`}
                  onClick={() => gradeSubmission(opt)}>{opt}</motion.button>
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
              {showAnswer && (
              <motion.div
                className="mt-3 p-2 rounded bg-[#16161a] border border-white/10"
                initial="hidden"
                animate="show"
                variants={listVariants}
              >
                <span className="text-sm opacity-60 mb-1 text-gray-400">Answer</span>
                <div className="mt-2 text-gray-100">{v.answer}</div>
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

    </motion.div>
  );
}
