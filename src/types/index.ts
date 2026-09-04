export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  studentId: string;
  program: string;
  completedLessonsCount: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  studyHours: number;
  streakDays: number;
}

export interface UserAccount extends UserProfile {
  password?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  lessonId: string;
  topicTitle: string;
  passingScore: number;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number; // percentage e.g. 85
  passed: boolean;
  totalQuestions: number;
  correctAnswersCount: number;
  submittedAt: string;
}

export interface DownloadableMaterial {
  id: string;
  title: string;
  category: string; // e.g., 'PDF Notes', 'Worksheets', 'Practice Exercises', 'Templates'
  fileType: 'pdf' | 'xlsx' | 'docx' | 'zip';
  fileSize: string;
  downloadUrl: string;
  description: string;
  downloadsCount: number;
  uploadedAt: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  topic: string;
  duration: string;
  videoUrl: string; // YouTube embed or video URL
  thumbnailUrl: string;
  description: string;
  keyTakeaways: string[];
  viewsCount: number;
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  videoUrl?: string;
  quizId?: string;
  downloadIds?: string[];
  contentMarkdown: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  category: 'Bookkeeping Cycle' | 'Basic Accounting Principles' | 'Financial Statements' | 'Payroll & Tax';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  thumbnail: string;
  instructor: string;
  totalLessons: number;
  completedLessons: number;
  topics: Topic[];
}

export interface ScheduleItem {
  id: string;
  title: string;
  type: 'quiz' | 'lesson' | 'review' | 'deadline';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description: string;
  isCompleted: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'announcement' | 'quiz' | 'course' | 'system';
  createdAt: string;
  isRead: boolean;
  sender: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Bookkeeping' | 'Quizzes & Grades' | 'Technical Support' | 'Account & Settings';
}
