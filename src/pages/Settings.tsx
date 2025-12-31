import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type SettingsState } from "../lib/constants";

export default function Settings() {
  const ensureAtLeastOneQuestionType = (next: SettingsState, prev: SettingsState) => {
    const enabledCount = [next.enableMultipleChoice, next.enableCloze, next.enableTrueFalse].filter(Boolean).length;
    return enabledCount === 0 ? prev : next;
  };

  const [settings, setSettings] = useState<SettingsState>(() => {
    const raw = localStorage.getItem("settings");
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return {
        dailyLimit: Number(parsed.dailyLimit) || DEFAULT_SETTINGS.dailyLimit,
        defaultMode: parsed.defaultMode || DEFAULT_SETTINGS.defaultMode,
        typingTolerance: Number(parsed.typingTolerance) || DEFAULT_SETTINGS.typingTolerance,
        enableMultipleChoice:
          parsed.enableMultipleChoice !== undefined
            ? Boolean(parsed.enableMultipleChoice)
            : DEFAULT_SETTINGS.enableMultipleChoice,
        enableCloze:
          parsed.enableCloze !== undefined ? Boolean(parsed.enableCloze) : DEFAULT_SETTINGS.enableCloze,
        enableTrueFalse:
          parsed.enableTrueFalse !== undefined ? Boolean(parsed.enableTrueFalse) : DEFAULT_SETTINGS.enableTrueFalse,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="p-6 text-gray-100 space-y-6">
      <h1 className="text-2xl font-bold">Deck</h1>


      <div className="rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-[0_0_30px_-12px_rgba(99,102,241,0.25)] space-y-4">
        <label className="block text-sm font-medium text-gray-200">Daily review limit</label>
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
          <label className="block text-sm font-medium text-gray-200 mb-2">Default review mode</label>
          <select
            value={settings.defaultMode}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                defaultMode: e.target.value as SettingsState["defaultMode"],
              }))
            }
            className="w-full rounded-lg bg-[#0b0b0d] border border-white/10 px-3 py-2 text-gray-100 focus:border-indigo-400 focus:outline-none"
          >
            <option value="none">No default (choose every time)</option>
            <option value="classic">Classic Review</option>
            <option value="ai">AI Quiz</option>
          </select>
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
          <div className="text-xs text-gray-500">
            Note: This setting will apply to all decks in AI quiz mode.
          </div>
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
