export const DEFAULT_DECK_ID = "default-deck";
export type SettingsState = {
  dailyLimit: number;
  defaultMode: "classic" | "ai" | "none";
  typingTolerance: number;
  enableMultipleChoice: boolean;
  enableCloze: boolean;
  enableTrueFalse: boolean;
  defaultRunMaxLength: Number;
};

export const DEFAULT_SETTINGS: SettingsState = {
  dailyLimit: 20,
  defaultMode: "none",
  typingTolerance: 1,
  enableMultipleChoice: true,
  enableCloze: true,
  enableTrueFalse: true,
  defaultRunMaxLength: 30,
};
