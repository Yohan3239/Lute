import { Card } from "./types";

export type MCQ = { type: "mcq"; prompt: string; options: string[]; answer: string };
export type Cloze = { type: "cloze"; prompt: string; answer: string };
export type TrueFalse = { type: "tf"; prompt: string; answer: boolean };

async function callAndParse<T>(prompt: string, isProUser: boolean): Promise<T | null> {
  try {
    const raw:string = await window.api.callLLM(prompt, isProUser);
    return JSON.parse(raw) as T;
  } catch (err) {
    
    console.error("LLM parse failed", err);
    return null;
  }
}

export async function generateMCQ(card: Card, isProUser: boolean): Promise<MCQ | null> {
  const prompt = `You are a flashcard quiz generator. Output ONLY valid JSON, nothing else.

Format: {"type":"mcq","prompt":"question","options":["A","B","C","D"],"answer":"exact match of correct option"}

Rules:
- Create a clear, specific question testing the flashcard knowledge
- The correct answer must be "${card.answer}" or a close variation
- Generate 3 plausible but incorrect distractors
- "answer" field must EXACTLY match one of the options (copy-paste it)
- Keep answers short (1-5 words ideally)
- Randomize correct answer position

Flashcard:
Q: ${card.question}
A: ${card.answer}

ONLY IN VALID JSON:`;
  return callAndParse<MCQ>(prompt, isProUser);
}

export async function generateCloze(card: Card, isProUser: boolean): Promise<Cloze | null> {
  const prompt = `You are a flashcard quiz generator. Output ONLY valid JSON, nothing else.

Format: {"type":"cloze","prompt":"sentence with _____ blank","answer":"exact fill-in word(s)"}

Rules:
- Create a sentence where the answer "${card.answer}" fills the blank
- Use _____ (5 underscores) for the blank
- The "answer" field must be EXACTLY what the user should type: "${card.answer}"
- Keep the answer short: 1-3 words maximum
- Make the sentence natural and educational

Flashcard:
Q: ${card.question}
A: ${card.answer}

ONLY IN VALID JSON:`;
  return callAndParse<Cloze>(prompt, isProUser);
}

export async function generateTrueFalse(card: Card, isProUser: boolean): Promise<TrueFalse | null> {
  const prompt = `You are a flashcard quiz generator. Output ONLY valid JSON, nothing else.

Format: {"type":"tf","prompt":"declarative statement","answer":true}

Rules:
- Convert the flashcard into a clear true/false statement
- Randomly decide: true (accurate statement) OR false (change one key fact)
- "answer" must be boolean: true or false (no quotes)
- Make false statements believable but clearly wrong if you know the material
- Keep statements concise and unambiguous

Flashcard:
Q: ${card.question}
A: ${card.answer}

JSON:`;
  return callAndParse<TrueFalse>(prompt, isProUser);
}
