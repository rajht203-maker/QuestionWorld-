export type SubjectKey = 'mathematics' | 'science' | 'social_science' | 'english' | 'hindi' | string;

export type DifficultyLevel = 'NORMAL' | 'HARD' | 'VERY HARD';

export type QuestionType =
  | 'MCQ'
  | 'Very Short Answer'
  | 'Short Answer'
  | 'Long Answer'
  | 'Assertion & Reason'
  | 'Case Study'
  | 'Competency-Based'
  | 'Numerical'
  | 'Source-Based'
  | 'HOTS'
  | 'Mixed';

export type AppMode = 'PRACTICE' | 'EXAM' | 'QUICK';

export type TimerMode = 'pomodoro' | 'short_break' | 'deep_study' | 'mock_sprint' | 'custom';

export interface StudyTimerSession {
  mode: TimerMode;
  durationMinutes: number;
  subject: string;
  completedAt: string;
}

export interface ChapterProgress {
  chapterId: string;
  chapterName: string;
  unit?: string;
  questionsCount: number;
  isCompleted: boolean;
  lastPracticed?: string;
}

export interface SubjectProgress {
  subjectKey: SubjectKey;
  subjectName: string;
  totalChapters: number;
  completedChaptersCount: number;
  completionPercentage: number;
  totalQuestionsPracticed: number;
  chapters: ChapterProgress[];
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: string[]; // for MCQ
  answer: string;
  explanation: string;
  chapter: string;
  topic?: string;
  subject: string;
  marks?: number;
}

export interface QuestionHistoryItem {
  id: string;
  userId?: string;
  subject: string;
  chapter: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  count: number;
  questions: Question[];
  createdAt: string;
  title: string;
}

export interface TestPaperSection {
  name: string;
  instructions: string;
  marksPerQuestion: number;
  questions: Question[];
}

export interface TestPaper {
  id: string;
  title: string;
  subject: string;
  chapters: string[];
  difficulty: DifficultyLevel;
  totalMarks: number;
  timeLimit: number; // in minutes
  generalInstructions: string[];
  sections: TestPaperSection[];
  answerKey: { questionId: string; answer: string; markingScheme?: string }[];
  createdAt: string;
}

export interface StudentProfile {
  userId?: string;
  name: string;
  targetClass: string;
  preferredSubject: string;
  email?: string;
  photoURL?: string;
}

export interface ExamResult {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  accuracy: number;
  timeSpentSeconds: number;
  topicPerformance: { [topicOrChapter: string]: { correct: number; total: number } };
  userAnswers: { [questionId: string]: string };
}

export interface Chapter {
  id: string;
  name: string;
  unit?: string;
  topics?: string[];
}

export interface SubjectConfig {
  name: string;
  key: SubjectKey;
  description: string;
  iconName: string;
  subCategories?: {
    name: string;
    key: string;
    chapters: Chapter[];
  }[];
  chapters?: Chapter[];
  supportedTypes: QuestionType[];
}

export interface AdminUser {
  email: string;
  role: 'super_admin' | 'admin';
  addedBy?: string;
  addedAt: string;
  displayName?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  explanation: string;
  marks: number;
  chapter?: string;
  difficulty?: DifficultyLevel;
}

export interface ConvertedQuiz {
  id: string;
  title: string;
  subject: string;
  targetClass: string;
  sourceFileName: string;
  fileSize?: string;
  createdAt: string;
  createdBy?: string;
  totalMarks: number;
  timeLimitMinutes: number;
  generalInstructions: string[];
  questions: QuizQuestion[];
}

export interface CustomSubject extends SubjectConfig {
  id: string;
  isCustom?: boolean;
  boardCode?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface AppAnnouncement {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  linkText?: string;
}

export interface AppExamRules {
  strictExamMode: boolean;
  competencyQuestionRatio: number; // e.g. 50 (%)
  passingScorePercent: number; // e.g. 33 (%)
  allowPdfDownload: boolean;
  showAiSolutionsImmediately: boolean;
}

export interface AppSettings {
  activeAcademicSession: string; // e.g. "2025-2026"
  availableSessions: string[];
  activeTerm: string; // e.g. "Term 2 / Pre-Board" | "Final Board Exam 2026"
  announcement: AppAnnouncement;
  examRules: AppExamRules;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  content: string;
  subject?: string;
  tag?: 'Doubt' | 'Study Notes' | 'Question Paper' | 'Tips & Tricks' | 'Solution' | 'General';
  imageUrl?: string;
  attachmentName?: string;
  attachmentUrl?: string; // base64 or storage url
  attachmentType?: string; // e.g. 'application/pdf' or image or txt
  likesCount: number;
  likedBy: string[]; // array of user emails or uids
  commentsCount: number;
  comments: CommunityComment[];
  isDisabled?: boolean;
  disabledReason?: string;
  disabledBy?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityRestriction {
  id: string;
  userEmail: string;
  isRestricted: boolean;
  reason?: string;
  restrictedBy?: string;
  restrictedAt?: string;
  canPost: boolean;
  canComment: boolean;
}

// ================= AI QUESTION PDF ANALYZER & PIPELINE TYPES ================= //

export type TargetClass = 'Class 9' | 'Class 10';

export type ExamType =
  | 'Board Exam'
  | 'Sample Paper'
  | 'Previous Year Question (PYQ)'
  | 'Pre-Board'
  | 'Mid-Term'
  | 'Unit Test'
  | 'Worksheet'
  | 'Chapter Question Bank'
  | 'Olympiad / Competition';

export type QuestionCategory =
  | 'MCQ'
  | 'Assertion-Reason'
  | 'Very Short Answer'
  | 'Short Answer'
  | 'Long Answer'
  | 'Case-Based'
  | 'Numerical'
  | 'Diagram-Based'
  | 'Source-Based'
  | 'True/False'
  | 'Fill-in-the-Blanks'
  | 'Match-the-Following';

export type ProcessingStatus =
  | 'pending'
  | 'validating'
  | 'extracting'
  | 'structuring'
  | 'validating_questions'
  | 'analyzing'
  | 'verifying_answers'
  | 'quality_check'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PipelineStepState {
  index: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'passed' | 'warning' | 'failed';
  details?: string;
  timestamp?: string;
}

export interface ExtractedQuestion {
  id: string;
  questionNumber?: string;
  pageNumber?: number;
  question: string;
  type: QuestionCategory;
  options?: string[]; // 4 options for MCQs & Assertion-Reason
  correctAnswer: string;
  correctOptionIndex?: number;
  explanation: string;
  stepMarking?: string; // step-by-step mark breakdown
  formula?: string; // relevant mathematical or physical formula
  marks: number;
  negativeMarks?: number;
  difficulty: 'EASY' | 'MODERATE' | 'DIFFICULT';
  chapter: string;
  topic: string;
  cognitiveLevel?: 'Recall' | 'Understanding' | 'Application' | 'Analysis' | 'Evaluation';
  diagramDescription?: string;
  diagramBase64?: string;
  confidenceScore: number; // 0 to 100
  warnings: string[];
  isApproved?: boolean;
  isFlaggedForReview?: boolean;
  sourceReference?: string;
}

export interface PaperAcademicAnalysis {
  totalQuestions: number;
  totalMarks: number;
  estimatedTimeMinutes: number;
  pagesCount: number;
  chapterDistribution: { chapter: string; count: number; marks: number }[];
  topicCoverage: string[];
  questionTypeDistribution: { type: string; count: number; percentage: number }[];
  difficultyDistribution: { level: string; count: number; percentage: number }[];
  cognitiveTaxonomy: { category: string; count: number; percentage: number }[];
  competencyQuestionsCount: number;
  caseBasedQuestionsCount: number;
  importantFormulas: string[];
  keyDefinitions: string[];
  syllabusAlignmentScore: number; // 0 - 100
  syllabusMismatches: string[];
  identifiedKnowledgeGaps: string[];
  duplicateQuestionsCount: number;
  summaryExecutive: string;
}

export interface PipelineLog {
  timestamp: string;
  step: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
}

export interface ProcessingPipelineJob {
  id: string;
  fileName: string;
  fileSize: string;
  fileBase64?: string;
  mimeType: string;
  targetClass: TargetClass;
  subject: string;
  chapter?: string;
  topic?: string;
  academicSession: string;
  examType: ExamType;
  difficultyPreference: string;
  customInstructions?: string;
  status: ProcessingStatus;
  currentStepIndex: number; // 1 to 7
  currentStepName: string;
  progressPercent: number;
  steps: PipelineStepState[];
  logs: PipelineLog[];
  passedChecks: string[];
  reviewWarnings: string[];
  extractedQuestions: ExtractedQuestion[];
  analysis?: PaperAcademicAnalysis;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy?: string;
  publishedQuizId?: string;
  error?: string;
}

export interface StudentQuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userAnswers: { [questionId: string]: number };
  markedForReview: string[];
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  chapterPerformance: { chapter: string; correct: number; total: number; percentage: number }[];
  difficultyPerformance: { difficulty: string; correct: number; total: number }[];
  weakTopics: string[];
  submittedAt: string;
  isCompleted: boolean;
}

export type GeneratedPdfDocumentType =
  | 'original'
  | 'question_bank'
  | 'qa_marking'
  | 'questions_only'
  | 'mcq_practice'
  | 'chapter_revision'
  | 'analysis_report'
  | 'mock_test';



