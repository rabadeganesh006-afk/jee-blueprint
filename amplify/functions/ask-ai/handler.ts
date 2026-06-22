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
    return `Gemini API quota active नाही, म्हणून free fallback answer देतो.\n\nIntegration revision:\n1) Standard formulas revise कर.\n2) Substitution, by parts, partial fraction वेगळे practice कर.\n3) Definite integration properties रोज 15 questions solve कर.\n4) PYQ मध्ये method identify कर: substitution / parts / property.\n5) Mistake notebook मध्ये formula + stuck step लिही.`;
  }
  if (q.includes('chemical bonding') || q.includes('bonding')) {
    return `Gemini API quota active नाही, म्हणून free fallback answer देतो.\n\nChemical Bonding priority:\n1) VSEPR shapes\n2) Hybridisation\n3) MOT basics\n4) Bond order and magnetic nature\n5) Dipole moment\n\nपहिले NCERT + short notes, नंतर chapter-wise PYQ.`;
  }
  if (q.includes('plan') || q.includes('revision') || q.includes('strategy')) {
    return `Gemini API quota active नाही, म्हणून free fallback answer देतो.\n\nSimple 7-day plan:\nDay 1-2: Theory + formulas\nDay 3-4: PYQ practice\nDay 5: Weak questions repeat\nDay 6: Chapter test\nDay 7: Mistake notebook revise\n\nRule: concept → PYQ → test → analysis.`;
  }
  return `Gemini API quota active नाही, म्हणून free fallback answer देतो.\n\nतुझा doubt: ${question}\n\nApproach:\n1) Chapter identify कर.\n2) Formula/theory revise कर.\n3) 5 solved examples बघ.\n4) 15 PYQ solve कर.\n5) exact stuck step लिहून पुन्हा विचार.`;
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

  return `${fallbackAnswer(question)}\n\nNote: Real Gemini AI साठी Google AI Studio project मध्ये usable quota/billing active असणे गरजेचे आहे. Last API message: ${lastError || 'No quota available.'}`;
};
