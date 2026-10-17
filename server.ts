import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleGenerateQuestionsBackend,
  handleGenerateTestPaperBackend,
  handleConvertPdfToQuizBackend,
} from './src/server/geminiBackend.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side API endpoint for Gemini question generation
app.post('/api/generate-questions', async (req, res) => {
  try {
    const result = await handleGenerateQuestionsBackend(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API /api/generate-questions error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate questions.' });
  }
});

// Server-side API endpoint for CBSE Test Paper generation
app.post('/api/generate-test-paper', async (req, res) => {
  try {
    const result = await handleGenerateTestPaperBackend(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API /api/generate-test-paper error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate test paper.' });
  }
});

// Server-side API endpoint for Converting Question PDF to Simple Quiz and PDF
app.post('/api/convert-pdf-to-quiz', async (req, res) => {
  try {
    const result = await handleConvertPdfToQuizBackend(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API /api/convert-pdf-to-quiz error:', error);
    res.status(500).json({ error: error?.message || 'Failed to convert PDF into quiz.' });
  }
});

// ================= AI QUESTION PDF ANALYZER & PIPELINE ENDPOINTS ================= //
import {
  executePdfAnalysisPipeline,
  regenerateQuestionAnswer,
} from './src/server/pdfAnalyzerBackend.ts';
import { db } from './src/db/index.ts';
import { processingJobs, extractedQuestions, quizzes, quizAttempts } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

// Trigger the 7-Step PDF Processing Pipeline
app.post('/api/pdf-pipeline/analyze', async (req, res) => {
  try {
    const job = await executePdfAnalysisPipeline(req.body);
    res.json({ job });
  } catch (error: any) {
    console.error('API /api/pdf-pipeline/analyze error:', error);
    res.status(500).json({ error: error?.message || 'Pipeline analysis failed.' });
  }
});

// Regenerate single question answer / marking rubric
app.post('/api/pdf-pipeline/regenerate-answer', async (req, res) => {
  try {
    const result = await regenerateQuestionAnswer(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API /api/pdf-pipeline/regenerate-answer error:', error);
    res.status(500).json({ error: error?.message || 'Failed to regenerate answer.' });
  }
});

// List all processing jobs from PostgreSQL
app.get('/api/pdf-pipeline/jobs', async (req, res) => {
  try {
    const jobs = await db.select().from(processingJobs).orderBy(desc(processingJobs.createdAt));
    res.json({ jobs });
  } catch (error: any) {
    console.error('API /api/pdf-pipeline/jobs error:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch processing jobs.' });
  }
});

// Get single job with extracted questions
app.get('/api/pdf-pipeline/jobs/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const jobRows = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId));
    if (jobRows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    const questionsRows = await db.select().from(extractedQuestions).where(eq(extractedQuestions.jobId, jobId));
    res.json({
      job: jobRows[0],
      questions: questionsRows,
    });
  } catch (error: any) {
    console.error(`API /api/pdf-pipeline/jobs/${req.params.jobId} error:`, error);
    res.status(500).json({ error: error?.message || 'Failed to fetch job details.' });
  }
});

// Update / edit extracted question
app.post('/api/pdf-pipeline/questions/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const updates = req.body;
    await db.update(extractedQuestions).set({
      ...updates,
    }).where(eq(extractedQuestions.id, questionId));
    res.json({ success: true });
  } catch (error: any) {
    console.error(`API /api/pdf-pipeline/questions/${req.params.questionId} error:`, error);
    res.status(500).json({ error: error?.message || 'Failed to update question.' });
  }
});

// Publish Quiz from approved questions into database
app.post('/api/pdf-pipeline/publish-quiz', async (req, res) => {
  try {
    const {
      id = `quiz_${Date.now()}`,
      title,
      subject,
      targetClass = 'Class 10',
      sourceFileName = 'Processed-Document.pdf',
      totalMarks = 20,
      timeLimitMinutes = 30,
      generalInstructions = [],
      questions,
      jobId,
      createdBy,
    } = req.body;

    await db.insert(quizzes).values({
      id,
      title,
      subject,
      targetClass,
      sourceFileName,
      totalMarks,
      timeLimitMinutes,
      generalInstructionsJson: generalInstructions,
      questionsJson: questions,
      jobId: jobId || null,
      createdBy: createdBy || 'admin',
    }).onConflictDoUpdate({
      target: quizzes.id,
      set: {
        title,
        questionsJson: questions,
        totalMarks,
        timeLimitMinutes,
      },
    });

    if (jobId) {
      await db.update(processingJobs).set({
        publishedQuizId: id,
      }).where(eq(processingJobs.id, jobId));
    }

    res.json({ success: true, quizId: id });
  } catch (error: any) {
    console.error('API /api/pdf-pipeline/publish-quiz error:', error);
    res.status(500).json({ error: error?.message || 'Failed to publish quiz.' });
  }
});

// List all published quizzes for students
app.get('/api/quizzes', async (req, res) => {
  try {
    const list = await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
    res.json({ quizzes: list });
  } catch (error: any) {
    console.error('API /api/quizzes error:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch quizzes.' });
  }
});

// Get single quiz for student testing
app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const quizRows = await db.select().from(quizzes).where(eq(quizzes.id, req.params.quizId));
    if (quizRows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    res.json({ quiz: quizRows[0] });
  } catch (error: any) {
    console.error(`API /api/quizzes/${req.params.quizId} error:`, error);
    res.status(500).json({ error: error?.message || 'Failed to fetch quiz.' });
  }
});

// Record student quiz attempt & analytics
app.post('/api/quizzes/attempts', async (req, res) => {
  try {
    const attempt = req.body;
    const attemptId = attempt.id || `att_${Date.now()}`;
    await db.insert(quizAttempts).values({
      id: attemptId,
      quizId: attempt.quizId,
      quizTitle: attempt.quizTitle,
      userId: attempt.userId || 'anonymous',
      userName: attempt.userName || 'Student',
      userEmail: attempt.userEmail || '',
      userAnswersJson: attempt.userAnswers || {},
      markedForReviewJson: attempt.markedForReview || [],
      score: attempt.score || 0,
      totalMarks: attempt.totalMarks || 10,
      percentage: attempt.percentage || 0,
      correctCount: attempt.correctCount || 0,
      incorrectCount: attempt.incorrectCount || 0,
      unansweredCount: attempt.unansweredCount || 0,
      timeSpentSeconds: attempt.timeSpentSeconds || 0,
      chapterPerformanceJson: attempt.chapterPerformance || [],
      difficultyPerformanceJson: attempt.difficultyPerformance || [],
      weakTopicsJson: attempt.weakTopics || [],
    }).onConflictDoNothing();

    res.json({ success: true, attemptId });
  } catch (error: any) {
    console.error('API /api/quizzes/attempts error:', error);
    res.status(500).json({ error: error?.message || 'Failed to record attempt.' });
  }
});

// Get student quiz attempt history
app.get('/api/quizzes/attempts/user/:userId', async (req, res) => {
  try {
    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, req.params.userId)).orderBy(desc(quizAttempts.submittedAt));
    res.json({ attempts });
  } catch (error: any) {
    console.error('API /api/quizzes/attempts error:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch user attempts.' });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`QuestionWorld - class 10 full-stack server running on http://0.0.0.0:${port}`);
});
