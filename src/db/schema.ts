import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synchronized from Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('student'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Uploaded Documents Library
export const uploadedDocuments = pgTable('uploaded_documents', {
  id: text('id').primaryKey(),
  fileName: text('file_name').notNull(),
  fileSize: text('file_size').notNull(),
  mimeType: text('mime_type').default('application/pdf'),
  targetClass: text('target_class').default('Class 10'),
  subject: text('subject').notNull(),
  chapter: text('chapter'),
  topic: text('topic'),
  academicSession: text('academic_session').default('2025-2026'),
  examType: text('exam_type').default('Board Exam'),
  difficultyPreference: text('difficulty_preference').default('MODERATE'),
  customInstructions: text('custom_instructions'),
  fileBase64: text('file_base64'),
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI Processing Pipeline Jobs (7-Step Pipeline)
export const processingJobs = pgTable('processing_jobs', {
  id: text('id').primaryKey(),
  documentId: text('document_id'),
  fileName: text('file_name').notNull(),
  status: text('status').default('pending').notNull(), // pending, validating, extracting, structuring, validating_questions, analyzing, verifying_answers, quality_check, completed, failed, cancelled
  currentStepIndex: integer('current_step_index').default(1),
  currentStepName: text('current_step_name').default('File Validation'),
  progressPercent: integer('progress_percent').default(0),
  stepsJson: jsonb('steps_json'),
  logsJson: jsonb('logs_json'),
  passedChecksJson: jsonb('passed_checks_json'),
  reviewWarningsJson: jsonb('review_warnings_json'),
  analysisJson: jsonb('analysis_json'),
  error: text('error'),
  publishedQuizId: text('published_quiz_id'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Extracted & Verified Questions
export const extractedQuestions = pgTable('extracted_questions', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull(),
  questionNumber: text('question_number'),
  pageNumber: integer('page_number').default(1),
  question: text('question').notNull(),
  type: text('type').default('MCQ').notNull(),
  optionsJson: jsonb('options_json'),
  correctAnswer: text('correct_answer').notNull(),
  correctOptionIndex: integer('correct_option_index'),
  explanation: text('explanation').notNull(),
  stepMarking: text('step_marking'),
  formula: text('formula'),
  marks: integer('marks').default(1).notNull(),
  negativeMarks: integer('negative_marks').default(0),
  difficulty: text('difficulty').default('MODERATE').notNull(),
  chapter: text('chapter').default('General').notNull(),
  topic: text('topic').default('General').notNull(),
  cognitiveLevel: text('cognitive_level').default('Understanding'),
  diagramDescription: text('diagram_description'),
  diagramBase64: text('diagram_base64'),
  confidenceScore: integer('confidence_score').default(95),
  warningsJson: jsonb('warnings_json'),
  isApproved: boolean('is_approved').default(false),
  isFlaggedForReview: boolean('is_flagged_for_review').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Published & Converted Quizzes
export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  targetClass: text('target_class').default('Class 10').notNull(),
  sourceFileName: text('source_file_name').default('Question-Paper.pdf'),
  totalMarks: integer('total_marks').default(20).notNull(),
  timeLimitMinutes: integer('time_limit_minutes').default(30).notNull(),
  generalInstructionsJson: jsonb('general_instructions_json'),
  questionsJson: jsonb('questions_json').notNull(),
  jobId: text('job_id'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Student Quiz Attempts & Analytics
export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull(),
  quizTitle: text('quiz_title').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name'),
  userEmail: text('user_email'),
  userAnswersJson: jsonb('user_answers_json').notNull(),
  markedForReviewJson: jsonb('marked_for_review_json'),
  score: integer('score').notNull(),
  totalMarks: integer('total_marks').notNull(),
  percentage: integer('percentage').notNull(),
  correctCount: integer('correct_count').notNull(),
  incorrectCount: integer('incorrect_count').notNull(),
  unansweredCount: integer('unanswered_count').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
  chapterPerformanceJson: jsonb('chapter_performance_json'),
  difficultyPerformanceJson: jsonb('difficulty_performance_json'),
  weakTopicsJson: jsonb('weak_topics_json'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quizAttempts: many(quizAttempts),
}));

export const processingJobsRelations = relations(processingJobs, ({ many }) => ({
  questions: many(extractedQuestions),
}));

export const extractedQuestionsRelations = relations(extractedQuestions, ({ one }) => ({
  job: one(processingJobs, {
    fields: [extractedQuestions.jobId],
    references: [processingJobs.id],
  }),
}));
