import fs from 'fs';
import path from 'path';
import { Course, Quiz, VideoLesson } from '@/types';
import { initialCourses, initialQuizzes, initialVideos } from './mockData';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }
}

// ========================
// QUIZZES STORAGE
// ========================
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');

export function loadPersistentQuizzes(): Quiz[] {
  ensureDataDir();
  try {
    if (fs.existsSync(QUIZZES_FILE)) {
      const content = fs.readFileSync(QUIZZES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with initialQuizzes to ensure default system quizzes are always present
        const map = new Map<string, Quiz>();
        initialQuizzes.forEach((q) => map.set(q.id, q));
        parsed.forEach((q: Quiz) => map.set(q.id, q));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Failed to read quizzes.json, falling back to initialQuizzes:', err);
  }
  return [...initialQuizzes];
}

export function savePersistentQuizzes(quizzes: Quiz[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write quizzes.json:', err);
  }
}

// ========================
// COURSES STORAGE
// ========================
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');

export function loadPersistentCourses(): Course[] {
  ensureDataDir();
  try {
    if (fs.existsSync(COURSES_FILE)) {
      const content = fs.readFileSync(COURSES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, Course>();
        initialCourses.forEach((c) => map.set(c.id, c));
        parsed.forEach((c: Course) => map.set(c.id, c));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Failed to read courses.json, falling back to initialCourses:', err);
  }
  return [...initialCourses];
}

export function savePersistentCourses(courses: Course[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write courses.json:', err);
  }
}

// ========================
// VIDEOS STORAGE
// ========================
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

export function loadPersistentVideos(): VideoLesson[] {
  ensureDataDir();
  try {
    if (fs.existsSync(VIDEOS_FILE)) {
      const content = fs.readFileSync(VIDEOS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, VideoLesson>();
        initialVideos.forEach((v) => map.set(v.id, v));
        parsed.forEach((v: VideoLesson) => map.set(v.id, v));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Failed to read videos.json, falling back to initialVideos:', err);
  }
  return [...initialVideos];
}

export function savePersistentVideos(videos: VideoLesson[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write videos.json:', err);
  }
}

