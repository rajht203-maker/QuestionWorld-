import { GoogleGenAI, Type } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function handleGenerateQuestionsBackend(body: any) {
  const { subject, chapter, topic, topics, difficulty, questionType, count } = body;
  const numQuestions = Math.min(Math.max(Number(count) || 5, 1), 50);

  // Normalize selected topics list
  const selectedTopicsList: string[] = [];
  if (Array.isArray(topics) && topics.length > 0) {
    selectedTopicsList.push(...topics.filter((t: any) => typeof t === 'string' && t.trim().length > 0));
  } else if (typeof topic === 'string' && topic.trim().length > 0) {
    selectedTopicsList.push(...topic.split(',').map((s: string) => s.trim()).filter(Boolean));
  }
  const topicsSummary = selectedTopicsList.join(', ');

  const ai = getGeminiClient();

  const isVeryHard = difficulty === 'VERY HARD';
  const isHard = difficulty === 'HARD';

  let difficultyGuidelines = 'Basic conceptual questions, direct application, NCERT-focused, ideal for revision.';
  if (isHard) {
    difficultyGuidelines = 'Multi-concept questions, application-based, competency-focused, requires reasoning, Board-exam standard.';
  } else if (isVeryHard) {
    difficultyGuidelines = 'Challenging multi-step questions, higher-order thinking (HOTS), unfamiliar situations, multiple concepts combined, complex case studies, and advanced board-level reasoning. Do not make it tricky merely by confusing wording; it must test deep conceptual mastery within CBSE Class 10 boundaries.';
  }

  const topicGuideline = topicsSummary
    ? `Target Sub-Topics: [${topicsSummary}]. CRITICAL: Every generated question MUST strictly concentrate on and evaluate concepts from these specific sub-topic(s) within the chapter "${chapter}". Clearly tag each question's 'topic' field with the specific sub-topic tested.`
    : `Chapter Focus: "${chapter}". Cover core concepts within this chapter.`;

  const systemInstruction = `You are an expert CBSE Class 10 question paper setter and chief examiner.
Generate original, strictly syllabus-aligned questions for CBSE Class 10 students.
Stay strictly within the specified chapter and CBSE Class 10 NCERT curriculum.
${topicGuideline}
Follow CBSE Class 10 cognitive level. Never invent textbook facts.
Never claim generated questions are actual previous-year questions (avoid fabricated PYQs).
Avoid duplicate questions.
For MCQs, ensure exactly four distinct options (A, B, C, D) with exactly one unambiguous correct answer.
For numerical questions, verify all formulas, calculations, and units (SI units).
For Assertion & Reason, provide standard CBSE A/R format options.
Provide concise, mathematically and scientifically verified step-by-step explanations.
Difficulty instructions: ${difficultyGuidelines}`;

  const prompt = `Class: 10
Subject: ${subject}
Chapter: ${chapter}
${topicsSummary ? `Target Sub-Topics to Focus On: ${topicsSummary}` : ''}
Difficulty Level: ${difficulty}
Requested Question Type: ${questionType}
Number of Questions to Generate: ${numQuestions}

Create exactly ${numQuestions} distinct CBSE Class 10 questions meeting all requirements.${
    topicsSummary ? ` Ensure all questions test concepts from the selected sub-topic(s): ${topicsSummary}.` : ''
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            description: 'List of generated CBSE Class 10 questions',
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: 'Full question text including context or diagrammatic cues',
                },
                type: {
                  type: Type.STRING,
                  description: 'Question type (e.g. MCQ, Short Answer, Numerical, Case Study, Assertion & Reason, HOTS)',
                },
                difficulty: {
                  type: Type.STRING,
                  description: 'NORMAL, HARD, or VERY HARD',
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Four options if question type is MCQ or Assertion & Reason',
                },
                answer: {
                  type: Type.STRING,
                  description: 'Correct answer or key statement',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Detailed NCERT-aligned explanation or step-by-step mathematical derivation',
                },
                chapter: {
                  type: Type.STRING,
                  description: 'Chapter name',
                },
                topic: {
                  type: Type.STRING,
                  description: 'Specific topic within the chapter',
                },
              },
              required: ['question', 'type', 'difficulty', 'answer', 'explanation', 'chapter'],
            },
          },
        },
        required: ['questions'],
      },
    },
  });

  const text = response.text || '{}';
  return JSON.parse(text);
}

export async function handleGenerateTestPaperBackend(body: any) {
  const { subject, chapters, difficulty, totalMarks, timeLimit } = body;

  const ai = getGeminiClient();

  const prompt = `Generate a complete, official-format CBSE Class 10 Board Mock Examination Paper for:
Subject: ${subject}
Chapters: ${(chapters || []).join(', ') || 'Full Syllabus'}
Difficulty: ${difficulty}
Total Marks: ${totalMarks || 80} Marks
Time Allowed: ${timeLimit || 180} minutes

The paper must adhere to the standard CBSE Class 10 examination blueprint:
- Section A: Multiple Choice Questions (1 Mark each)
- Section B: Very Short Answer Questions (2 Marks each)
- Section C: Short Answer Questions (3 Marks each)
- Section D: Long Answer Questions (5 Marks each)
- Section E: Case Study / Integrated Assessment (4 Marks each)

Include complete question text, options for MCQs, and a comprehensive Answer Key & Marking Scheme.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.6,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          testPaper: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              chapters: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING },
              totalMarks: { type: Type.NUMBER },
              timeLimit: { type: Type.NUMBER },
              generalInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                    marksPerQuestion: { type: Type.NUMBER },
                    questions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          question: { type: Type.STRING },
                          type: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                          answer: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                          chapter: { type: Type.STRING },
                          marks: { type: Type.NUMBER },
                        },
                        required: ['question', 'type', 'answer', 'explanation'],
                      },
                    },
                  },
                  required: ['name', 'instructions', 'marksPerQuestion', 'questions'],
                },
              },
              answerKey: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    markingScheme: { type: Type.STRING },
                  },
                  required: ['answer'],
                },
              },
            },
            required: ['title', 'subject', 'totalMarks', 'timeLimit', 'generalInstructions', 'sections'],
          },
        },
        required: ['testPaper'],
      },
    },
  });

  const text = response.text || '{}';
  const parsed = JSON.parse(text);
  if (parsed.testPaper) {
    parsed.testPaper.id = `test-${Date.now()}`;
    parsed.testPaper.createdAt = new Date().toISOString();
  }
  return parsed;
}

export async function handleConvertPdfToQuizBackend(body: any) {
  const { pdfBase64, mimeType = 'application/pdf', fileName, targetSubject } = body;

  if (!pdfBase64) {
    throw new Error('No PDF file data provided.');
  }

  // Strip prefix like "data:application/pdf;base64," if present
  const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

  const ai = getGeminiClient();

  const systemInstruction = `You are a CBSE Master Educator and Examination Specialist.
Your task is to thoroughly analyze the provided question document / PDF and convert all questions into a structured simple quiz format suitable for both:
1. An interactive digital quiz (with 4 choices A, B, C, D and immediate score assessment)
2. A formal printable CBSE test paper document (with instructions, mark weightage, and answer key).

CRITICAL INSTRUCTIONS:
- Inspect the document and extract every question clearly and accurately, maintaining mathematical notations, chemical equations, and scientific terms.
- For every question, provide exactly 4 distinct, plausible options (A, B, C, D) so it functions as an interactive simple quiz question.
  - If the original question already has MCQ options, preserve them faithfully.
  - If the original question is subjective (Short Answer, Fill-in-the-blank, or Numerical), generate 4 clear, plausible options (1 correct answer and 3 realistic distractors based on common student misconceptions).
- Indicate the exact 0-indexed correct option (correctOptionIndex: 0 for A, 1 for B, 2 for C, 3 for D) and the text of correctAnswer.
- Write a step-by-step NCERT-aligned explanation for the solution.
- Identify the subject (e.g. Science, Mathematics, Social Science, English, Hindi) and Chapter.
- Suggest a descriptive title for this Quiz/Paper.`;

  const prompt = `Please extract and convert the questions in this attached PDF document into a simple quiz and printable exam paper format.
${targetSubject ? `Target Subject: ${targetSubject}` : ''}
${fileName ? `Source Document: ${fileName}` : ''}
Ensure all questions have 4 clear options (A, B, C, D), a verified correct answer with its index (0-3), and detailed step-by-step explanation.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanBase64,
        },
      },
      prompt,
    ],
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quizTitle: { type: Type.STRING },
          subject: { type: Type.STRING },
          targetClass: { type: Type.STRING },
          totalMarks: { type: Type.INTEGER },
          timeLimitMinutes: { type: Type.INTEGER },
          generalInstructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                type: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Four distinct options [A, B, C, D]',
                },
                correctAnswer: { type: Type.STRING },
                correctOptionIndex: {
                  type: Type.INTEGER,
                  description: '0 for option A, 1 for B, 2 for C, 3 for D',
                },
                explanation: { type: Type.STRING },
                marks: { type: Type.INTEGER },
                chapter: { type: Type.STRING },
                difficulty: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctAnswer', 'correctOptionIndex', 'explanation'],
            },
          },
        },
        required: ['quizTitle', 'subject', 'questions'],
      },
    },
  });

  const text = response.text || '{}';
  const parsed = JSON.parse(text);

  const quizId = `quiz-${Date.now()}`;
  const questionsWithIds = (parsed.questions || []).map((q: any, idx: number) => ({
    ...q,
    id: `q-${quizId}-${idx + 1}`,
    marks: q.marks || 1,
    difficulty: q.difficulty || 'NORMAL',
  }));

  const totalCalculatedMarks = questionsWithIds.reduce((acc: number, q: any) => acc + (q.marks || 1), 0);

  return {
    quiz: {
      id: quizId,
      title: parsed.quizTitle || 'CBSE Class 10 Converted Quiz',
      subject: parsed.subject || targetSubject || 'Science',
      targetClass: parsed.targetClass || 'Class 10',
      sourceFileName: fileName || 'Uploaded-Question-Paper.pdf',
      createdAt: new Date().toISOString(),
      totalMarks: parsed.totalMarks || totalCalculatedMarks || 20,
      timeLimitMinutes: parsed.timeLimitMinutes || Math.max(15, questionsWithIds.length * 2),
      generalInstructions: parsed.generalInstructions && parsed.generalInstructions.length > 0
        ? parsed.generalInstructions
        : [
            'All questions are compulsory.',
            'Each question carries specified marks. Select the single most appropriate option.',
            'Review step-by-step explanations after completing the quiz.',
          ],
      questions: questionsWithIds,
    },
  };
}

