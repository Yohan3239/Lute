import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DEFAULT_SETTINGS, type SettingsState } from "../lib/constants";
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
interface DeckIdProp {
  deckId?: string;
}

export default function DeckSettings({ deckId: deckIdProp }: DeckIdProp) {
  const { deckId: paramDeckId } = useParams();
  const deckId = deckIdProp ?? paramDeckId;
  if (!deckId) {
    return <h1 className="p-6 text-xl text-gray-100">No deck selected.</h1>;
  }

  const ensureAtLeastOneQuestionType = (next: SettingsState, prev: SettingsState) => {
    const enabledCount = [next.enableMultipleChoice, next.enableCloze, next.enableTrueFalse].filter(Boolean).length;
    return enabledCount === 0 ? prev : next;
  };
  const generalSettings = loadSettings();
  const loadDeckSettings = () => {
    const raw = localStorage.getItem(`deck-${deckId}-settings`);
    if (!raw) return generalSettings;
    try {
      const parsed = JSON.parse(raw);
      return {
        dailyLimit: Number(parsed.dailyLimit) || generalSettings.dailyLimit,
        defaultMode: generalSettings.defaultMode,
        typingTolerance: Number(parsed.typingTolerance) || generalSettings.typingTolerance,
        enableMultipleChoice:
          parsed.enableMultipleChoice !== undefined
            ? Boolean(parsed.enableMultipleChoice)
            : generalSettings.enableMultipleChoice,
        enableCloze:
          parsed.enableCloze !== undefined ? Boolean(parsed.enableCloze) : generalSettings.enableCloze,
        enableTrueFalse:
          parsed.enableTrueFalse !== undefined ? Boolean(parsed.enableTrueFalse) : generalSettings.enableTrueFalse,
        defaultRunMaxLength: generalSettings.defaultRunMaxLength,
      };
    } catch {
      return generalSettings;
    }
  }
  const [settings, setSettings] = useState<SettingsState>(() => loadDeckSettings());
  useEffect(() => {
    setSettings(loadDeckSettings());
  }, [deckId])
  useEffect(() => {
    localStorage.setItem(`deck-${deckId}-settings`, JSON.stringify(settings));
  }, [settings, deckId]);

  return (
    <div className="p-6 text-gray-100 space-y-6">
          <div className="text-xs text-gray-500">
            Note: This will override the general settings.
          </div>
      <div>
                
        <label className="block text-sm font-medium text-gray-200">Daily new card limit</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={200}
            value={settings.dailyLimit}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                dailyLimit: Math.min(200, Math.max(1, Number(e.target.value))),
              }))
            }
            className="w-28 rounded-lg bg-[#0b0b0d] border border-white/10 px-3 py-2 text-gray-100 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200 mb-2">Typing tolerance (for Cloze)</label>
          <input
            type="number"
            min={0}
            max={5}
            value={settings.typingTolerance}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                typingTolerance: Math.min(5, Math.max(0, Number(e.target.value))),
              }))
            }
            className="w-28 rounded-lg bg-[#0b0b0d] border border-white/10 px-3 py-2 text-gray-100 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200 mb-2">Enable/Disable question types</label>
          <div className="space-y-2 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.enableMultipleChoice}
                onChange={(e) =>
                  setSettings((prev) => {
                    const next = { ...prev, enableMultipleChoice: e.target.checked };
                    return ensureAtLeastOneQuestionType(next, prev);
                  })
                }
              />
              <span>Enable Multiple Choice</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.enableCloze}
                onChange={(e) =>
                  setSettings((prev) => {
                    const next = { ...prev, enableCloze: e.target.checked };
                    return ensureAtLeastOneQuestionType(next, prev);
                  })
                }
              />
              <span>Enable Cloze</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.enableTrueFalse}
                onChange={(e) =>
                  setSettings((prev) => {
                    const next = { ...prev, enableTrueFalse: e.target.checked };
                    return ensureAtLeastOneQuestionType(next, prev);
                  })
                }
              />
              <span>Enable True/False</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
