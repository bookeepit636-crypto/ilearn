'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Course,
  DownloadableMaterial,
  FAQItem,
  NotificationItem,
  Quiz,
  QuizSubmission,
  ScheduleItem,
  Topic,
  UserAccount,
  UserProfile,
  VideoLesson
} from '@/types';
import {
  initialCourses,
  initialFAQs,
  initialMaterials,
  initialNotifications,
  initialProfile,
  initialQuizzes,
  initialSchedules,
  initialSubmissions,
  initialVideos
} from '@/lib/mockData';
import { supabaseLogin, supabaseRegister, supabaseLogout } from '@/lib/supabase';

interface AppContextType {
  user: UserProfile;
  accounts: UserAccount[];
  isAuthenticated: boolean;
  courses: Course[];
  quizzes: Quiz[];
  submissions: QuizSubmission[];
  materials: DownloadableMaterial[];
  videos: VideoLesson[];
  schedules: ScheduleItem[];
  notifications: NotificationItem[];
  faqs: FAQItem[];
  searchQuery: string;
  isSearchOpen: boolean;
  isNotificationDrawerOpen: boolean;
  isMobileSidebarOpen: boolean;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password?: string, program?: string) => { success: boolean; error?: string };
  logout: () => void;
  toggleRole: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  submitQuiz: (quizId: string, answers: Record<string, number>) => QuizSubmission;
  toggleLessonCompletion: (courseId: string, lessonId: string) => void;
  addScheduleItem: (item: Omit<ScheduleItem, 'id' | 'isCompleted'>) => void;
  toggleScheduleCompletion: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addCourse: (course: Course) => void;
  updateCourseTopics: (courseId: string, topics: Topic[]) => void;
  deleteCourse: (id: string) => void;
  addVideo: (video: VideoLesson) => void;
  deleteVideo: (id: string) => void;
  addMaterial: (material: DownloadableMaterial) => void;
  deleteMaterial: (id: string) => void;
  addQuiz: (quiz: Quiz) => void;
  broadcastAnnouncement: (title: string, message: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'bookkeep_it_state_v3';

// Pre-configured fixed admin profile
export const fixedAdminProfile: UserAccount = {
  id: 'usr_admin_001',
  name: 'System Administrator',
  email: 'admin@bookkeep-it.edu',
  role: 'admin',
  password: 'admin123',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  bio: 'Lead BookKeep-It System Administrator & CPA Instructor.',
  studentId: 'ADMIN-2026-0001',
  program: 'Faculty / Admin Controller',
  completedLessonsCount: 20,
  totalQuizzesTaken: 10,
  averageQuizScore: 100,
  studyHours: 120,
  streakDays: 30
};

// Initial student account
export const initialStudentAccount: UserAccount = {
  ...initialProfile,
  password: 'student123'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(initialProfile);
  const [accounts, setAccounts] = useState<UserAccount[]>([initialStudentAccount, fixedAdminProfile]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>(initialSubmissions);
  const [materials, setMaterials] = useState<DownloadableMaterial[]>(initialMaterials);
  const [videos, setVideos] = useState<VideoLesson[]>(initialVideos);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [faqs] = useState<FAQItem[]>(initialFAQs);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (typeof parsed.isAuthenticated === 'boolean') setIsAuthenticated(parsed.isAuthenticated);
        if (parsed.courses) setCourses(parsed.courses);
        if (parsed.quizzes) setQuizzes(parsed.quizzes);
        if (parsed.submissions) setSubmissions(parsed.submissions);
        if (parsed.materials) setMaterials(parsed.materials);
        if (parsed.videos) setVideos(parsed.videos);
        if (parsed.schedules) setSchedules(parsed.schedules);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to LocalStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        user,
        accounts,
        isAuthenticated,
        courses,
        quizzes,
        submissions,
        materials,
        videos,
        schedules,
        notifications
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [user, accounts, isAuthenticated, courses, quizzes, submissions, materials, videos, schedules, notifications, isLoaded]);

  // Login handler supporting fixed admin and student accounts with Supabase sync
  const login = (email: string, password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Sync with Supabase Auth in background if configured
    supabaseLogin(trimmedEmail, password);

    // Check fixed admin credentials
    if (
      trimmedEmail.includes('admin') ||
      (trimmedEmail === 'admin@bookkeep-it.edu' || trimmedEmail === 'admin@ilearn.edu')
    ) {
      setUser(fixedAdminProfile);
      setIsAuthenticated(true);
      return { success: true };
    }

    // Check student/custom accounts or default to student
    const match = accounts.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail
    ) || initialStudentAccount;

    setUser({
      ...match,
      email: trimmedEmail || match.email
    });
    setIsAuthenticated(true);
    return { success: true };
  };

  // Register new student account with Supabase sync
  const register = (name: string, email: string, password?: string, program?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (accounts.some((acc) => acc.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // Sync with Supabase Auth in background if configured
    supabaseRegister(name, trimmedEmail, password, program);

    const newAcc: UserAccount = {
      id: `usr_${Date.now()}`,
      name,
      email: trimmedEmail,
      role: 'student',
      password: password || 'student123',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      bio: `Student enrolled in ${program || 'Bachelor of Science in Accountancy'}.`,
      studentId: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      program: program || 'Bachelor of Science in Accountancy',
      completedLessonsCount: 0,
      totalQuizzesTaken: 0,
      averageQuizScore: 0,
      studyHours: 0,
      streakDays: 1
    };

    setAccounts((prev) => [...prev, newAcc]);
    setUser(newAcc);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    supabaseLogout();
    setIsAuthenticated(false);
  };

  const toggleRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'student' ? 'admin' : 'student'
    }));
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const submitQuiz = (quizId: string, answers: Record<string, number>): QuizSubmission => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (!targetQuiz) throw new Error('Quiz not found');

    let correct = 0;
    targetQuiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const totalQuestions = targetQuiz.questions.length;
    const scorePct = Math.round((correct / totalQuestions) * 100);
    const passed = scorePct >= targetQuiz.passingScore;

    const newSubmission: QuizSubmission = {
      id: `sub-${Date.now()}`,
      quizId,
      quizTitle: targetQuiz.title,
      score: scorePct,
      passed,
      totalQuestions,
      correctAnswersCount: correct,
      submittedAt: new Date().toISOString()
    };

    setSubmissions((prev) => [newSubmission, ...prev]);

    const allSubs = [newSubmission, ...submissions];
    const avgScore = Math.round(allSubs.reduce((acc, curr) => acc + curr.score, 0) / allSubs.length);

    setUser((prev) => ({
      ...prev,
      totalQuizzesTaken: allSubs.length,
      averageQuizScore: avgScore
    }));

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: passed ? `Quiz Passed: ${targetQuiz.title}` : `Quiz Attempt Completed: ${targetQuiz.title}`,
      message: `You scored ${scorePct}% (${correct}/${totalQuestions} correct). ${passed ? 'Great job!' : 'Review the material and try again.'}`,
      category: 'quiz',
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: 'BookKeep-It Quiz Engine'
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newSubmission;
  };

  const toggleLessonCompletion = (courseId: string, lessonId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((crs) => {
        if (crs.id !== courseId) return crs;
        let completedCountDelta = 0;

        const updatedTopics = crs.topics.map((tpc) => ({
          ...tpc,
          lessons: tpc.lessons.map((lsn) => {
            if (lsn.id !== lessonId) return lsn;
            const nextCompleted = !lsn.isCompleted;
            completedCountDelta = nextCompleted ? 1 : -1;
            return { ...lsn, isCompleted: nextCompleted };
          })
        }));

        const newCompleted = Math.max(0, crs.completedLessons + completedCountDelta);

        return {
          ...crs,
          completedLessons: newCompleted,
          topics: updatedTopics
        };
      })
    );

    setUser((prev) => ({
      ...prev,
      completedLessonsCount: prev.completedLessonsCount + 1
    }));
  };

  const addScheduleItem = (item: Omit<ScheduleItem, 'id' | 'isCompleted'>) => {
    const newItem: ScheduleItem = {
      ...item,
      id: `sch-${Date.now()}`,
      isCompleted: false
    };
    setSchedules((prev) => [newItem, ...prev]);
  };

  const toggleScheduleCompletion = (id: string) => {
    setSchedules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addCourse = (course: Course) => {
    setCourses((prev) => [course, ...prev]);
  };

  const updateCourseTopics = (courseId: string, updatedTopics: Topic[]) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const totalLsnCount = updatedTopics.reduce(
          (acc, t) => acc + (t.lessons ? t.lessons.length : 0),
          0
        );
        return {
          ...c,
          topics: updatedTopics,
          totalLessons: totalLsnCount || c.totalLessons
        };
      })
    );
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const addVideo = (video: VideoLesson) => {
    setVideos((prev) => [video, ...prev]);
  };

  const deleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const addMaterial = (material: DownloadableMaterial) => {
    setMaterials((prev) => [material, ...prev]);
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const addQuiz = (quiz: Quiz) => {
    setQuizzes((prev) => [quiz, ...prev]);
  };

  const broadcastAnnouncement = (title: string, message: string) => {
    const newAnnouncement: NotificationItem = {
      id: `ann-${Date.now()}`,
      title,
      message,
      category: 'announcement',
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: user.name + ' (Administrator)'
    };
    setNotifications((prev) => [newAnnouncement, ...prev]);
  };

  const resetAllData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(initialProfile);
    setAccounts([initialStudentAccount, fixedAdminProfile]);
    setIsAuthenticated(false);
    setCourses(initialCourses);
    setQuizzes(initialQuizzes);
    setSubmissions(initialSubmissions);
    setMaterials(initialMaterials);
    setVideos(initialVideos);
    setSchedules(initialSchedules);
    setNotifications(initialNotifications);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        accounts,
        isAuthenticated,
        courses,
        quizzes,
        submissions,
        materials,
        videos,
        schedules,
        notifications,
        faqs,
        searchQuery,
        isSearchOpen,
        isNotificationDrawerOpen,
        isMobileSidebarOpen,
        setSearchQuery,
        setIsSearchOpen,
        setIsNotificationDrawerOpen,
        setIsMobileSidebarOpen,
        login,
        register,
        logout,
        toggleRole,
        updateProfile,
        submitQuiz,
        toggleLessonCompletion,
        addScheduleItem,
        toggleScheduleCompletion,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addCourse,
        updateCourseTopics,
        deleteCourse,
        addVideo,
        deleteVideo,
        addMaterial,
        deleteMaterial,
        addQuiz,
        broadcastAnnouncement,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
