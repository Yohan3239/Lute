import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArtifactType } from "../lib/types";

export enum EventType {
  LET_THE_CARDS_BURN = "let_the_cards_burn",
  ALL_OR_NOTHING = "all_or_nothing",
  TEMPO_UP = "tempo_up",
  PURIFY = "purify",
  DOUBLE_IT = "double_it",
  CHAOS_THEORY = "chaos_theory",
  FREEZE = "freeze",
  CASCADE = "cascade",
  SOAK = "soak",
  YIN_YANG = "yin_yang",
  POISON_THE_WATERS = "poison_the_waters",
  CHARGE_UP = "charge_up",
  MIRROR_IMAGE = "mirror_image",
  LUCK_OF_THE_DRAW = "luck_of_the_draw",
  CURSED_LUCK = "cursed_luck",
}

type EventPopupProps = {
  isOpen: boolean;
  onClose: (selectedEvent: EventType, selectedArtifact?: ArtifactType) => void;
  selectableEventTypes: EventType[];
  isArtifactEvent?: boolean;
  selectableArtifactTypes?: ArtifactType[];
};

export default function EventPopup({ isOpen, onClose, selectableEventTypes, isArtifactEvent=false, selectableArtifactTypes= [] }: EventPopupProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (isArtifactEvent && selectableArtifactTypes.length === 0) return null;
  const getEventContent = () => {
    if (!isArtifactEvent) {
      return selectableEventTypes.map(eventType => {
        switch(eventType) {
          case EventType.LET_THE_CARDS_BURN:
            return {
              icon: "🔥",
              title: "Let the Cards Burn",
              description: `Grant 8 upcoming cards 3 stacks of BURN each`,
            };
          case EventType.ALL_OR_NOTHING:
            return {
              icon: "🔮",
              title: "All or Nothing",
              description: `Grant 20 upcoming cards 2 stacks of a random effect each`,
            };
          case EventType.TEMPO_UP:
            return {
              icon: "⚡",
              title: "Tempo Up",
              description: `Grant 2 upcoming cards TEMPO UP each`,
            };
          case EventType.PURIFY:
            return {
              icon: "💧",
              title: "Purify",
              description: `Clear all negative effects from the next 10 upcoming cards`,
            };
          case EventType.DOUBLE_IT:
            return {
              icon: "✨",
              title: "Double It",
              description: `Double the stacks of the next card`,
            };
          case EventType.CHAOS_THEORY:
            return {
              icon: "🌀",
              title: "Chaos Theory",
              description: `Randomize the effects on the next 10 upcoming cards`,
            };
          case EventType.FREEZE:
            return {
              icon: "❄️",
              title: "Freeze",
              description: `Grant 6 upcoming cards 2 stacks of FREEZE each`,
            };
          case EventType.CASCADE:
            return {
              icon: "🌊",
              title: "Cascade",
              description: `Grant the next 8 cards 1 stacks of all positive effects`,
            };
          case EventType.SOAK:
            return {
              icon: "💦",
              title: "Soak",
              description: `Grant the next 10 upcoming cards 2 stacks of WET`,
            };
          case EventType.YIN_YANG:
            return {
              icon: "☯️",
              title: "Yin Yang",
              description: `Apply 3 stacks of POISON and 6 stacks of BURN to the next 6 upcoming cards`,
            };
          case EventType.POISON_THE_WATERS:
            return {
              icon: "🧪",
              title: "Poison the Waters",
              description: `Apply 3 stacks of POISON and 6 stacks of WET to the next 6 upcoming cards`,
            };
          case EventType.CHARGE_UP:
            return {
              icon: "🔋",
              title: "Charge Up",
              description: `Grant 4 upcoming cards OVERCHARGED`,
            }
          case EventType.MIRROR_IMAGE:
            return {
              icon: "🪞",
              title: "Mirror Image",
              description: `Adds the effects on this card to the next 3 cards`,
            }
          case EventType.LUCK_OF_THE_DRAW:
            return {
              icon: "🍀",
              title: "Luck of the Draw",
              description: `Grant 7 upcoming cards LUCKY`,
            }
          case EventType.CURSED_LUCK:
            return {
              icon: "🕸️",
              title: "Curse Upon Thee",
              description: `Grant 3 upcoming cards CURSED and 10 upcoming cards LUCKY`,
            }
          default:
            return null;
        }
      });
    } else {
      return selectableArtifactTypes.map(artifactType => {
        switch(artifactType) {
          case ArtifactType.FIRE_RING:
            return {
              icon: "🔥",
              title: "Fire Ring",
              description: `BURN gives +100 Base per stack`,
            };
          case ArtifactType.WATER_AMULET:
            return {
              icon: "💧",
              title: "Water Amulet",
              description: `WET gives +0.1 Tempo per stack`,
            };
          case ArtifactType.TOXIC_CHARM:
            return {
              icon: "☠️",
              title: "Snake Charm",
              description: `POISON now increases Base instead`,
            };
          case ArtifactType.WIND_BRACELET:
            return {
              icon: "🌪️",
              title: "Wind Bracelet",
              description: `TEMPO increases faster per streak and time`,
            };
          case ArtifactType.ICE_TALISMAN:
            return {
              icon: "❄️",
              title: "Ice Talisman",
              description: `Cards when frozen cards get +1 stack for each effect`,
            };
          case ArtifactType.STEAM_CORE:
            return {
              icon: "💨",
              title: "Steam Core",
              description: `VAPORISE increases base per stack`,
            };
          case ArtifactType.GAMBLERS_DICE:
            return {
              icon: "🎲",
              title: "Gambler's Dice",
              description: `LUCKY chances are doubled`,
            };
          case ArtifactType.SUPERCHARGER:
            return {
              icon: "⚡",
              title: "Supercharger",
              description: `OVERCHARGED gives +120% effect bonus`,
            };
          
          default:
            return null;
        }
      });
    }
  };

  const content = getEventContent();
  const filteredContent = content?.filter((c) => c !== null) ?? [];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[#0b0b0f] rounded-xl p-8 max-w-2xl w-full mx-4 border border-white/10 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h2 className="text-xl font-semibold text-center mb-6 text-gray-100">
              Choose an {isArtifactEvent ? "Artifact" : "Event"} 
            </h2>
            {/* Events Grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {filteredContent.map((event, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onClose(selectableEventTypes[idx], isArtifactEvent ? selectableArtifactTypes[idx] : undefined);
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`rounded-lg p-3 border text-center cursor-pointer transition-colors ${
                    hoveredIdx === idx
                      ? "bg-white/10 border-white/30"
                      : "bg-white/5 border-white/10 hover:bg-white/8"
                  }`}
                >
                  <div className="text-3xl mb-2">{event.icon}</div>
                  <p className="text-xs font-medium text-gray-300 truncate">{event.title}</p>
                </motion.button>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[80px] flex items-center">
              <p className="text-gray-300 text-center text-sm">
                {hoveredIdx !== null ? filteredContent[hoveredIdx]?.description : `Hover over an ${isArtifactEvent ? "artifact" : "event"} to see its description`}
              </p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

