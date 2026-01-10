import { Card } from "./types";

export type MCQ = { type: "mcq"; prompt: string; options: string[]; answer: string };
export type Cloze = { type: "cloze"; prompt: string; answer: string };
export type TrueFalse = { type: "tf"; prompt: string; answer: boolean };

async function callAndParse<T>(prompt: string): Promise<T | null> {
  try {
    const raw:string = await window.api.callLLM(prompt);
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("LLM parse failed", err);
    return null;
  }
}

export async function generateMCQ(card: Card): Promise<MCQ | null> {
  const prompt = `Return ONLY valid JSON, no extra text:
{"type":"mcq","prompt":"question text","options":["A","B","C","D"],"answer":"correct option"}

Create a multiple-choice question from the flashcard. One correct answer, three plausible distractors. The "answer" field must exactly match one option.

Flashcard Q: ${card.question}
Flashcard A: ${card.answer}

JSON only:`;
  return callAndParse<MCQ>(prompt);
}

export async function generateCloze(card: Card): Promise<Cloze | null> {
  const prompt = `Return ONLY valid JSON, no extra text:
{"type":"cloze","prompt":"sentence with _____","answer":"word(s) for blank"}

Create a cloze deletion: if the Answer appears in Question, replace it with "_____". Otherwise, insert Answer naturally then replace with "_____". Keep original wording. ONE blank, 1-4 words.

Flashcard Q: ${card.question}
Flashcard A: ${card.answer}

JSON only:`;
  return callAndParse<Cloze>(prompt);
}

export async function generateTrueFalse(card: Card): Promise<TrueFalse | null> {
  const prompt = `Return ONLY valid JSON, no extra text:
{"type":"tf","prompt":"statement text","answer":true}

Create a declarative statement from the flashcard. Randomly make it true OR false (if false, change one fact). The "answer" field is a boolean.

Flashcard Q: ${card.question}
Flashcard A: ${card.answer}

JSON only:`;
  return callAndParse<TrueFalse>(prompt);
}
