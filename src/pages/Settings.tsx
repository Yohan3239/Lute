import { useEffect, useState } from "react";

type SettingsState = {
  dailyLimit: number;
  defaultMode: "classic" | "ai" | "none";
  typingTolerance: number;
};

export const DEFAULT_SETTINGS: SettingsState = {
  dailyLimit: 20,
  defaultMode: "none",
  typingTolerance: 1,
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const raw = localStorage.getItem("settings");
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return { 
        dailyLimit: Number(parsed.dailyLimit) || DEFAULT_SETTINGS.dailyLimit,
        defaultMode: parsed.defaultMode || DEFAULT_SETTINGS.defaultMode,
        typingTolerance: Number(parsed.typingTolerance) || DEFAULT_SETTINGS.typingTolerance
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
            <option value="none">No default (ask every time)</option>
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
      </div>
    </div>
  );
}
