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
  const prompt = `
Given this flashcard, respond with JSON only in the MCQ shape:
{ "type":"mcq","prompt":"...","options":["A","B","C","D"],"answer":"A" }
Question: ${card.question}
Answer: ${card.answer}
Use 4 concise options, one correct. JSON only.`;
  return callAndParse<MCQ>(prompt);
}

export async function generateCloze(card: Card): Promise<Cloze | null> {
  const prompt = `
Given this flashcard, respond with JSON only in the cloze shape:
{ "type":"cloze","prompt":"..._____...","answer":"What the _____ replaced" }
Question: ${card.question}
Answer: ${card.answer}
Replace the key fact with _____ in prompt. JSON only. Can be multiple words, but try to keep it one word if possible.`;
  return callAndParse<Cloze>(prompt);
}

export async function generateTrueFalse(card: Card): Promise<TrueFalse | null> {
  const prompt = `
Given this flashcard, respond with JSON only in the true/false shape:
{ "type":"tf","prompt":"...","answer":true|false }
Question: ${card.question}
Answer: ${card.answer}
Craft one clear statement; set answer true if correct, false if intentionally flipped. JSON only.`;
  return callAndParse<TrueFalse>(prompt);
}
