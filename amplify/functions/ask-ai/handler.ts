import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/ask-ai';

const SYSTEM_PROMPT = `You are JEE Blueprint AI Tutor for Indian JEE Main and Advanced students.
Rules:
- Explain in simple English, Hindi, or Marathi when helpful.
- Give step-by-step explanation, but keep it concise.
- For Maths, Physics, and Chemistry doubts, show formulas and method.
- Do not pretend to be a human teacher.
- If the student asks for a full answer to an active test, guide with hints first.
- Keep advice safe, practical, and focused on study.`;

export const handler: Schema['askAi']['functionHandler'] = async (event) => {
  const question = (event.arguments.question || '').trim();
  const context = event.arguments.context || '';

  if (!question) return 'Please type your doubt first.';

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: `Student context: ${context}\n\nStudent doubt: ${question}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 900,
        },
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      const message = json?.error?.message || 'Gemini API request failed.';
      return `AI error: ${message}`;
    }

    const text = (json?.candidates || [])
      .flatMap((candidate: any) => candidate?.content?.parts || [])
      .map((part: any) => part?.text || '')
      .join('\n\n')
      .trim();

    return text || 'AI returned an empty answer. Try asking again with more details.';
  } catch (error: any) {
    return `AI connection error: ${error?.message || 'Unknown error'}`;
  }
};
