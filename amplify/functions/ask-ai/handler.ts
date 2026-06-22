import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/ask-ai';

const SYSTEM_PROMPT = `You are JEE Blueprint AI Tutor for Indian JEE Main and Advanced students.
Rules:
- Explain in simple English, Hindi, or Marathi when helpful.
- Give step-by-step explanation, but keep it concise.
- For Maths, Physics, and Chemistry doubts, show formulas and method.
- If the student asks for a full answer to an active test, guide with hints first.
- Keep advice safe, practical, and focused on study.`;

const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest'
];

function fallbackAnswer(question: string) {
  const q = question.toLowerCase();
  if (q.includes('integration')) {
    return `Gemini API quota is not active, so this is a free fallback answer.\n\nIntegration revision:\n1) Revise standard formulas.\n2) Practice substitution, integration by parts, and partial fractions separately.\n3) Solve 15 definite integration property questions daily.\n4) In each PYQ, identify the method: substitution / parts / property.\n5) In your mistake notebook, write the formula and the exact stuck step.`;
  }
  if (q.includes('chemical bonding') || q.includes('bonding')) {
    return `Gemini API quota is not active, so this is a free fallback answer.\n\nChemical Bonding priority:\n1) VSEPR shapes\n2) Hybridisation\n3) MOT basics\n4) Bond order and magnetic nature\n5) Dipole moment\n\nFirst revise NCERT + short notes, then solve chapter-wise PYQs.`;
  }
  if (q.includes('plan') || q.includes('revision') || q.includes('strategy')) {
    return `Gemini API quota is not active, so this is a free fallback answer.\n\nSimple 7-day plan:\nDay 1-2: Theory + formulas\nDay 3-4: PYQ practice\nDay 5: Repeat weak questions\nDay 6: Chapter test\nDay 7: Mistake notebook revision\n\nRule: concept → PYQ → test → analysis.`;
  }
  return `Gemini API quota is not active, so this is a free fallback answer.\n\nYour doubt: ${question}\n\nApproach:\n1) Identify the chapter.\n2) Revise formula/theory.\n3) Review 5 solved examples.\n4) Solve 15 PYQs.\n5) Write the exact stuck step and ask again.`;
}

export const handler: Schema['askAi']['functionHandler'] = async (event) => {
  const question = (event.arguments.question || '').trim();
  const context = event.arguments.context || '';

  if (!question) return 'Please type your doubt first.';
  if (!env.GEMINI_API_KEY) return fallbackAnswer(question);

  let lastError = '';

  for (const model of MODELS) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Student context: ${context}\n\nStudent doubt: ${question}` }],
            },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        lastError = json?.error?.message || `Gemini API request failed on ${model}`;
        const lower = lastError.toLowerCase();
        if (response.status === 429 || lower.includes('quota') || lower.includes('rate') || lower.includes('not found') || lower.includes('deprecated') || lower.includes('shut down')) {
          continue;
        }
        return `AI service issue: ${lastError}\n\n${fallbackAnswer(question)}`;
      }

      const text = (json?.candidates || [])
        .flatMap((candidate: any) => candidate?.content?.parts || [])
        .map((part: any) => part?.text || '')
        .join('\n\n')
        .trim();

      if (text) return text;
    } catch (error: any) {
      lastError = error?.message || 'Unknown Gemini connection error';
    }
  }

  return `${fallbackAnswer(question)}\n\nNote: Real Gemini AI requires usable quota/billing to be active in the Google AI Studio project. Last API message: ${lastError || 'No quota available.'}`;
};
