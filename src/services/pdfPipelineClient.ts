import {
  ProcessingPipelineJob,
  ExtractedQuestion,
  StudentQuizAttempt,
  TargetClass,
  ExamType
} from '../types/index.ts';

const JOBS_CACHE_KEY = 'cbse_pdf_pipeline_jobs_cache';
const QUIZZES_CACHE_KEY = 'cbse_published_quizzes_cache';
const ATTEMPTS_CACHE_KEY = 'cbse_student_quiz_attempts_cache';

function getLocalCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Cache write failure for ${key}:`, e);
  }
}

/**
 * Initiates the 7-Step PDF Processing Pipeline
 */
export async function startPdfPipeline(params: {
  fileName: string;
  fileSize: string;
  fileBase64: string;
  mimeType?: string;
  targetClass: TargetClass;
  subject: string;
  chapter?: string;
  topic?: string;
  academicSession?: string;
  examType?: ExamType;
  difficultyPreference?: string;
  customInstructions?: string;
  adminEmail?: string;
}): Promise<ProcessingPipelineJob> {
  const response = await fetch('/api/pdf-pipeline/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Pipeline failed with status ${response.status}`);
  }

  const { job } = await response.json();

  // Cache job locally
  const current = getLocalCache<ProcessingPipelineJob[]>(JOBS_CACHE_KEY, []);
  setLocalCache(JOBS_CACHE_KEY, [job, ...current.filter(j => j.id !== job.id)]);

  return job;
}

/**
 * Regenerates an individual answer/marking rubric
 */
export async function regenerateQuestionAnswerClient(params: {
  question: string;
  type: string;
  subject: string;
  targetClass: string;
  chapter?: string;
  marks?: number;
  customGuidance?: string;
}) {
  const response = await fetch('/api/pdf-pipeline/regenerate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to regenerate answer.');
  }

  return await response.json();
}

/**
 * Fetches all processing jobs
 */
export async function fetchJobsList(): Promise<ProcessingPipelineJob[]> {
  try {
    const response = await fetch('/api/pdf-pipeline/jobs');
    if (response.ok) {
      const data = await response.json();
      if (data.jobs && data.jobs.length > 0) {
        setLocalCache(JOBS_CACHE_KEY, data.jobs);
        return data.jobs;
      }
    }
  } catch (err) {
    console.warn('Network error fetching jobs, using local cache:', err);
  }
  return getLocalCache<ProcessingPipelineJob[]>(JOBS_CACHE_KEY, []);
}

/**
 * Fetches job details with extracted questions
 */
export async function fetchJobDetails(jobId: string): Promise<{ job: ProcessingPipelineJob; questions: ExtractedQuestion[] } | null> {
  try {
    const response = await fetch(`/api/pdf-pipeline/jobs/${jobId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Network error fetching job details:', err);
  }

  // Fallback to local cache
  const jobs = getLocalCache<ProcessingPipelineJob[]>(JOBS_CACHE_KEY, []);
  const matched = jobs.find(j => j.id === jobId);
  if (matched) {
    return {
      job: matched,
      questions: matched.extractedQuestions || [],
    };
  }

  return null;
}

/**
 * Updates an extracted question
 */
export async function updateExtractedQuestion(questionId: string, updates: Partial<ExtractedQuestion>): Promise<void> {
  try {
    await fetch(`/api/pdf-pipeline/questions/${questionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('Question update server sync failed:', err);
  }
}

/**
 * Publishes a quiz generated from approved questions
 */
export async function publishQuizFromPipeline(quizData: any): Promise<string> {
  const response = await fetch('/api/pdf-pipeline/publish-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to publish quiz.');
  }

  const { quizId } = await response.json();

  // Cache quiz
  const quizzes = getLocalCache<any[]>(QUIZZES_CACHE_KEY, []);
  setLocalCache(QUIZZES_CACHE_KEY, [quizData, ...quizzes.filter(q => q.id !== quizId)]);

  return quizId;
}

/**
 * Fetches all published quizzes for students
 */
export async function fetchPublishedQuizzes(): Promise<any[]> {
  try {
    const response = await fetch('/api/quizzes');
    if (response.ok) {
      const data = await response.json();
      if (data.quizzes && data.quizzes.length > 0) {
        setLocalCache(QUIZZES_CACHE_KEY, data.quizzes);
        return data.quizzes;
      }
    }
  } catch (err) {
    console.warn('Error fetching quizzes:', err);
  }
  return getLocalCache<any[]>(QUIZZES_CACHE_KEY, []);
}

/**
 * Records student quiz attempt
 */
export async function recordStudentQuizAttempt(attempt: StudentQuizAttempt): Promise<void> {
  // Always cache locally
  const current = getLocalCache<StudentQuizAttempt[]>(ATTEMPTS_CACHE_KEY, []);
  setLocalCache(ATTEMPTS_CACHE_KEY, [attempt, ...current]);

  try {
    await fetch('/api/quizzes/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
    });
  } catch (err) {
    console.warn('Cloud sync for quiz attempt skipped:', err);
  }
}

/**
 * Fetches student quiz attempts
 */
export async function fetchStudentQuizAttempts(userId: string): Promise<StudentQuizAttempt[]> {
  try {
    const response = await fetch(`/api/quizzes/attempts/user/${userId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.attempts) {
        return data.attempts;
      }
    }
  } catch (err) {
    console.warn('Error fetching student attempts:', err);
  }
  const all = getLocalCache<StudentQuizAttempt[]>(ATTEMPTS_CACHE_KEY, []);
  return all.filter(a => a.userId === userId);
}
