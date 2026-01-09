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
You are generating a multiple-choice question from a flashcard.

Return ONLY valid JSON in this exact shape:
{
  "type": "mcq",
  "prompt": "string",
  "options": ["string", "string", "string", "string"],
  "answer": "string"
}

Rules:
- The prompt must be a clear question based on the flashcard.
- Exactly ONE option must be correct.
- The other 3 options must be plausible distractors, not random nonsense.
- "answer" should match the correct option TEXT exactly.
- Use short, concise options.
- NO text outside the JSON.
Flashcard:
Question: ${card.question}
Answer: ${card.answer}`;
  return callAndParse<MCQ>(prompt);
}

export async function generateCloze(card: Card): Promise<Cloze | null> {
  const prompt = `
Generate a cloze deletion from this flashcard.

Return ONLY valid JSON in this exact shape:
{
  "type": "cloze",
  "prompt": "string",
  "answer": "string"
}

STRICT RULES:
- Use the original Question text verbatim unless inserting the answer is required.
- If the exact Answer text appears in the Question, replace ONLY that exact text with "_____".
- If the Answer does NOT appear in the Question:
  - Insert the Answer into the Question in the most natural grammatical position,
  - Then replace ONLY the inserted Answer with "_____".
- Do NOT rephrase surrounding text.
- The blank must be a short noun phrase or term (1–4 words).
- ONLY ONE blank.
- The final sentence must read naturally when "_____" is replaced with the Answer.
- No questions about the blank itself (no "what is _____").
- NO explanation. NO extra text. JSON only.

Flashcard:
Question: ${card.question}
Answer: ${card.answer}`;
  return callAndParse<Cloze>(prompt);
}

export async function generateTrueFalse(card: Card): Promise<TrueFalse | null> {
  const prompt = `
Generate a true/false statement based on this flashcard.

Return ONLY valid JSON in this shape:
{
  "type": "tf",
  "prompt": "string",
  "answer": boolean
}

Rules:
- Create ONE declarative statement based on the flashcard.
- Randomly choose to make it true OR false.
- If false, flip or distort ONE factual element logically.
- "answer" must be a JSON boolean (true or false).
- The statement must be short, clear, and factual.
- NO text outside JSON.

Flashcard:
Question: ${card.question}
Answer: ${card.answer}
Craft one clear statement; set answer true if correct, false if intentionally flipped. JSON only.`;
  return callAndParse<TrueFalse>(prompt);
}
