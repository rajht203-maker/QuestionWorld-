import { Question, QuestionType, DifficultyLevel, TestPaper } from '../types';
import { validateAndSanitizeQuestions } from '../utils/questionValidator';
import { getSampleQuestionsFor } from '../data/sampleQuestions';

export interface GenerateQuestionsParams {
  subject: string;
  chapter: string;
  topic?: string;
  subCategory?: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  count: number;
}

export interface GenerateTestPaperParams {
  subject: string;
  chapters: string[];
  difficulty: DifficultyLevel;
  totalMarks: number;
  timeLimit: number;
  questionTypes?: QuestionType[];
}

export async function generateQuestionsWithAI(
  params: GenerateQuestionsParams
): Promise<{ questions: Question[]; isFallback: boolean; message?: string }> {
  try {
    const res = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.questions) && data.questions.length > 0) {
      const sanitized = validateAndSanitizeQuestions(
        data.questions,
        params.subject,
        params.chapter,
        params.difficulty
      );
      if (sanitized.length > 0) {
        return { questions: sanitized, isFallback: false };
      }
    }

    throw new Error('AI response did not yield valid structured questions');
  } catch (error: any) {
    console.warn('AI Generation offline or failed, activating verified CBSE Question Bank fallback:', error?.message);
    const fallbackList = getSampleQuestionsFor(
      params.subject,
      params.chapter,
      params.difficulty,
      params.count
    );
    return {
      questions: fallbackList,
      isFallback: true,
      message: error?.message?.includes('API key')
        ? 'Using curated CBSE Class 10 questions. (Connect Gemini API Key in Settings to generate unlimited fresh questions)'
        : 'Generated from curated CBSE Class 10 question bank.',
    };
  }
}

export async function generateTestPaperWithAI(
  params: GenerateTestPaperParams
): Promise<{ testPaper: TestPaper; isFallback: boolean; message?: string }> {
  try {
    const res = await fetch('/api/generate-test-paper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.testPaper) {
      return { testPaper: data.testPaper, isFallback: false };
    }

    throw new Error('AI test paper generation returned invalid format');
  } catch (error: any) {
    console.warn('AI Test Paper generation fallback:', error?.message);

    // Build structured fallback test paper
    const mockQuestions = getSampleQuestionsFor(
      params.subject,
      params.chapters[0] || 'All Chapters',
      params.difficulty,
      12
    );

    const testPaper: TestPaper = {
      id: `test-${Date.now()}`,
      title: `CBSE Class 10 ${params.subject} Examination Paper`,
      subject: params.subject,
      chapters: params.chapters,
      difficulty: params.difficulty,
      totalMarks: params.totalMarks,
      timeLimit: params.timeLimit,
      generalInstructions: [
        'All questions are compulsory.',
        'This question paper consists of 5 Sections: Section A, B, C, D and E.',
        'Section A comprises multiple choice questions of 1 mark each.',
        'Section B comprises very short answer questions of 2 marks each.',
        'Section C comprises short answer questions of 3 marks each.',
        'Section D comprises long answer questions of 5 marks each.',
        'Section E comprises case-based integrated assessment units of 4 marks each.',
        'There is no overall choice. However, internal choices have been provided in some questions.',
        'Use of calculators is not permitted.'
      ],
      sections: [
        {
          name: 'Section A (1 Mark Each - Objective / MCQ)',
          instructions: 'Questions 1 to 4 are multiple choice questions.',
          marksPerQuestion: 1,
          questions: mockQuestions.slice(0, 4).map(q => ({ ...q, type: 'MCQ' as QuestionType, marks: 1 }))
        },
        {
          name: 'Section B (2 Marks Each - Very Short Answer)',
          instructions: 'Questions 5 to 6 are very short answer questions. Answers should be in 30-50 words.',
          marksPerQuestion: 2,
          questions: mockQuestions.slice(4, 6).map(q => ({ ...q, type: 'Very Short Answer' as QuestionType, marks: 2 }))
        },
        {
          name: 'Section C (3 Marks Each - Short Answer)',
          instructions: 'Questions 7 to 8 are short answer questions. Answers should be in 50-80 words.',
          marksPerQuestion: 3,
          questions: mockQuestions.slice(6, 8).map(q => ({ ...q, type: 'Short Answer' as QuestionType, marks: 3 }))
        },
        {
          name: 'Section D (5 Marks Each - Long Answer / HOTS)',
          instructions: 'Questions 9 to 10 are long answer questions. Answers should be in 80-120 words.',
          marksPerQuestion: 5,
          questions: mockQuestions.slice(8, 10).map(q => ({ ...q, type: 'Long Answer' as QuestionType, marks: 5 }))
        },
        {
          name: 'Section E (4 Marks Each - Case-Based / Source Study)',
          instructions: 'Questions 11 to 12 are case study based questions with sub-parts.',
          marksPerQuestion: 4,
          questions: mockQuestions.slice(10, 12).map(q => ({ ...q, type: 'Case Study' as QuestionType, marks: 4 }))
        }
      ],
      answerKey: mockQuestions.map(q => ({
        questionId: q.id,
        answer: q.answer,
        markingScheme: q.explanation
      })),
      createdAt: new Date().toISOString()
    };

    return {
      testPaper,
      isFallback: true,
      message: 'Generated standard CBSE Class 10 mock test paper blueprint.'
    };
  }
}
