import { AnimatePresence, motion } from "framer-motion";

interface CheatSheetProps {
  showEvents: boolean;
}
export default function CheatSheet({ showEvents }: CheatSheetProps) {
return (
<div>
{/* Toggle Button */}


{/* Cheat Sheet Panel */}
<AnimatePresence>
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
        <div className={showEvents ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "space-y-5"}>
          {/* Left Column / Main Content */}
          <div className={showEvents ? "space-y-6" : ""}>
          {/* Status Effects */}
          <div>
            <div className={showEvents ? "text-xl font-bold text-white mb-3 pb-2 border-b border-white/10" : "text-base font-bold text-white mb-2.5 pb-1.5 border-b border-white/10"}>Status Effects</div>
            <div className={showEvents ? "space-y-2.5 text-sm" : "space-y-2 text-xs"}>
              <div className="flex items-start gap-1.5">
                <span className="text-orange-300 font-medium shrink-0">🔥 BURN:</span>
                <span className="text-gray-400">+50 Base per stack</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-blue-300 font-medium shrink-0">💧 WET:</span>
                <span className="text-gray-400">+0.05 Tempo per stack</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-green-300 font-medium shrink-0">☠️ POISON:</span>
                <span className="text-gray-400">-50 Base per stack</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-300 font-medium shrink-0">❄️ FROZEN:</span>
                <span className="text-gray-400">Prevents changes to effects</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-300 font-medium shrink-0">⚡ TEMPO UP:</span>
                <span className="text-gray-400">×1.5 Tempo per stack, additive</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-gray-300 font-medium shrink-0">💨 VAPORISE:</span>
                <span className="text-gray-400">BURN+WET: ×(1 + 0.1 × avg) Tempo</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-purple-300 font-medium shrink-0">🔋 OVERCHARGED:</span>
                <span className="text-gray-400">Doubles all effect bonuses</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-red-300 font-medium shrink-0">🕸️ CURSED:</span>
                <span className="text-gray-400">Sets Tempo to 1.0 and resets streak</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-300 font-medium shrink-0">🍀 LUCKY:</span>
                <span className="text-gray-400">33% chance to ×1.2 final score</span>
              </div>
            </div>
          </div>

          {/* Artifacts */}
          <div>
            <div className={showEvents ? "text-xl font-bold text-white mb-3 pb-2 border-b border-white/10" : "text-base font-bold text-white mb-2.5 pb-1.5 pt-3 border-b border-white/10"}>Artifacts</div>
            <div className={showEvents ? "space-y-2.5 text-sm" : "space-y-2 text-xs"}>
              <div className="flex items-start gap-1.5">
                <span className="text-orange-300 font-medium shrink-0">🔥 Fire Ring:</span>
                <span className="text-gray-400">BURN +100 Base (instead of +50)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-blue-300 font-medium shrink-0">💧 Water Amulet:</span>
                <span className="text-gray-400">WET +0.1 Tempo (instead of +0.05)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-green-300 font-medium shrink-0">☠️ Snake Charm:</span>
                <span className="text-gray-400">POISON +25 Base (instead of -50)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-300 font-medium shrink-0">🌪️ Wind Bracelet:</span>
                <span className="text-gray-400">1.25x speed tempo/1.2x streak bonuses</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-300 font-medium shrink-0">❄️ Ice Talisman:</span>
                <span className="text-gray-400">When FROZEN applied, +1 to all other stacks</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-gray-300 font-medium shrink-0">💨 Steam Core:</span>
                <span className="text-gray-400">VAPORISE +100 Base per avg stack</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-300 font-medium shrink-0">🎲 Gambler's Dice:</span>
                <span className="text-gray-400">LUCKY 66% chance (instead of 33%)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-300 font-medium shrink-0">⚡ Supercharger:</span>
                <span className="text-gray-400">OVERCHARGED 2.2× bonus (instead of 2×)</span>
              </div>
            </div>
          </div>
          </div>

          {/* Right Column - Events and Scoring */}
          {showEvents && (
          <div className="space-y-6">
          {/* Events */}
          <div>
            <div className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/10">Events</div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-1.5">
                <span className="text-orange-300 font-medium shrink-0">🔥 Let the Cards Burn:</span>
                <span className="text-gray-400">Grant 8 upcoming cards 3 stacks of BURN each</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-blue-300 font-medium shrink-0">💦 Soak:</span>
                <span className="text-gray-400">Grant the next 10 upcoming cards 2 stacks of WET</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-300 font-medium shrink-0">⚡ Tempo Up:</span>
                <span className="text-gray-400">Grant 2 upcoming cards TEMPO UP each</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-300 font-medium shrink-0">❄️ Freeze:</span>
                <span className="text-gray-400">Grant 6 upcoming cards 2 stacks of FREEZE each</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-300 font-medium shrink-0">🌊 Cascade:</span>
                <span className="text-gray-400">Grant the next 8 cards 1 stacks of all positive effects</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-green-300 font-medium shrink-0">🧪 Poison the Waters:</span>
                <span className="text-gray-400">Apply 3 stacks of POISON and 6 stacks of WET to the next 6 upcoming cards</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-300 font-medium shrink-0">☯️ Yin Yang:</span>
                <span className="text-gray-400">Apply 3 stacks of POISON and 6 stacks of BURN to the next 6 upcoming cards</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-violet-300 font-medium shrink-0">💧 Purify:</span>
                <span className="text-gray-400">Clear all negative effects from the next 10 upcoming cards</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-pink-300 font-medium shrink-0">✨ Double It:</span>
                <span className="text-gray-400">Double the stacks of the next card</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-purple-300 font-medium shrink-0">🔮 All or Nothing:</span>
                <span className="text-gray-400">Grant 20 upcoming cards 2 stacks of a random effect each</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-sky-300 font-medium shrink-0">🌀 Chaos Theory:</span>
                <span className="text-gray-400">Randomize the effects on the next 10 upcoming cards</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-300 font-medium shrink-0">🔋 Charge Up:</span>
                <span className="text-gray-400">Grant 4 upcoming cards OVERCHARGED</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-teal-300 font-medium shrink-0">🪞 Mirror Image:</span>
                <span className="text-gray-400">Adds the effects on this card to the next 3 cards</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-300 font-medium shrink-0">🍀 Luck of the Draw:</span>
                <span className="text-gray-400">Grant 7 upcoming cards LUCKY</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-red-300 font-medium shrink-0">🕸️ Curse Upon Thee:</span>
                <span className="text-gray-400">Grant 3 upcoming cards CURSED and 10 upcoming cards LUCKY</span>
              </div>
            </div>
          </div>
          {/* Scoring */}
          <div>
            <div className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/10">Scoring</div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="font-semibold text-gray-300">Base × Tempo = Points → Score</div>
              <div className="pl-3 space-y-1.5">
                <div><span className="text-gray-300">Base:</span> Easy +500, Good +300, Hard +200, Wrong +100</div>
                <div><span className="text-gray-300">Tempo:</span> 1.0 + (60-seconds)/500 + streak bonuses</div>
                <div><span className="text-gray-300">Streak:</span> +0.1 Tempo per consecutive correct answer</div>
                <div><span className="text-gray-300">Note:</span> Tempo resets to 1.0 after each card</div>
              </div>
            </div>
          </div>
          </div>
          )}
        </div>
          
    </motion.div>
</AnimatePresence>
</div>
);
}
