import { Question, QuestionType, DifficultyLevel } from '../types';

export function safelyParseJSON<T = any>(input: string): T | null {
  if (!input || typeof input !== 'string') return null;

  // Trim and strip Markdown code blocks if present
  let cleaned = input.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt relaxed regex extraction if surrounded by other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Try fixing trailing commas
        try {
          const fixedTrailingCommas = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
          return JSON.parse(fixedTrailingCommas) as T;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

export function validateAndSanitizeQuestions(
  rawList: any[],
  fallbackSubject: string,
  fallbackChapter: string,
  fallbackDifficulty: DifficultyLevel
): Question[] {
  if (!Array.isArray(rawList)) return [];

  const validated: Question[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') continue;

    const questionText = String(item.question || '').trim();
    if (!questionText) continue;

    const answer = String(item.answer || '').trim();
    const explanation = String(item.explanation || 'Refer to NCERT Class 10 guidelines for full derivation.').trim();
    const chapter = String(item.chapter || fallbackChapter).trim();
    const subject = String(item.subject || fallbackSubject).trim();
    const topic = item.topic ? String(item.topic).trim() : undefined;

    let difficulty: DifficultyLevel = fallbackDifficulty;
    if (['NORMAL', 'HARD', 'VERY HARD'].includes(item.difficulty)) {
      difficulty = item.difficulty as DifficultyLevel;
    }

    const type: QuestionType = (item.type as QuestionType) || 'Short Answer';

    let options: string[] | undefined = undefined;
    if (Array.isArray(item.options) && item.options.length >= 2) {
      options = item.options.map((opt: any) => String(opt).trim());
    }

    validated.push({
      id: item.id || `q-${Date.now()}-${i + 1}`,
      question: questionText,
      type,
      difficulty,
      options,
      answer,
      explanation,
      chapter,
      topic,
      subject
    });
  }

  return validated;
}
