'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Course,
  DownloadableMaterial,
  FAQItem,
  LiveSession,
  LiveSessionStatus,
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
  initialLiveSessions,
  initialMaterials,
  initialNotifications,
  initialProfile,
  initialQuizzes,
  initialSchedules,
  initialSubmissions,
  initialVideos
} from '@/lib/mockData';
import {
  supabaseLogin,
  supabaseRegister,
  supabaseLogout,
  fetchVideosFromSupabase,
  saveVideoToSupabase,
  deleteVideoFromSupabase,
  fetchLiveSessionsFromSupabase,
  saveLiveSessionToSupabase,
  deleteLiveSessionFromSupabase,
  fetchAccountsFromApi,
  saveAccountToApi
} from '@/lib/supabase';
import { deleteVideoBlob } from '@/lib/videoStorage';
import { sendQuizSubmissionNotification } from '@/lib/notifications';

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
  liveSessions: LiveSession[];
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
  adminTab: AdminTabType;
  setAdminTab: (tab: AdminTabType) => void;
  // Live Sessions
  addLiveSession: (session: Omit<LiveSession, 'id' | 'createdAt' | 'attendeesCount'> & { id?: string }) => LiveSession;
  updateLiveSession: (id: string, updates: Partial<LiveSession>) => void;
  deleteLiveSession: (id: string) => void;
}

export type AdminTabType = 'users' | 'courses' | 'videos' | 'materials' | 'quizzes' | 'announcements' | 'live';

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'bookkeep_it_state_v8';

export interface UserProgressRecord {
  completedLessonIds: string[];
  submissions: QuizSubmission[];
}

export const normalizeCourse = (crs: Course): Course => {
  const actualTotal = crs.topics && crs.topics.length > 0
    ? crs.topics.reduce((sum, t) => sum + (t.lessons ? t.lessons.length : 0), 0)
    : (crs.totalLessons || 1);
  const actualCompleted = crs.topics && crs.topics.length > 0
    ? crs.topics.reduce((sum, t) => sum + (t.lessons ? t.lessons.filter((l) => l.isCompleted).length : 0), 0)
    : (crs.completedLessons || 0);

  return {
    ...crs,
    totalLessons: actualTotal > 0 ? actualTotal : 1,
    completedLessons: actualCompleted
  };
};

export const applyProgressToCourses = (baseCourses: Course[], completedIds: string[] = []): Course[] => {
  return baseCourses.map((crs) => {
    let completedInCourse = 0;
    const updatedTopics = (crs.topics || []).map((tpc) => ({
      ...tpc,
      lessons: (tpc.lessons || []).map((lsn) => {
        const isDone = completedIds.includes(lsn.id);
        if (isDone) completedInCourse++;
        return {
          ...lsn,
          isCompleted: isDone
        };
      })
    }));

    const total = crs.topics && crs.topics.length > 0
      ? crs.topics.reduce((sum, t) => sum + (t.lessons ? t.lessons.length : 0), 0)
      : (crs.totalLessons || 1);

    return {
      ...crs,
      totalLessons: total > 0 ? total : 1,
      completedLessons: completedInCourse,
      topics: updatedTopics
    };
  });
};

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

// Purge helper for old hardcoded mock sessions so they never linger in any user's localStorage
export const isMockLiveSession = (s: any): boolean => {
  if (!s || typeof s !== 'object') return false;
  const id = String(s.id || '');
  const title = String(s.title || '');
  const room = String(s.meetingRoomId || '');
  const instructor = String(s.instructorName || '');
  return (
    id === 'ls-001' ||
    id === 'ls-002' ||
    id === 'ls-003' ||
    id === 'ls-004' ||
    id === 'ls-005' ||
    room.includes('trial-balance-ls001') ||
    room.includes('financial-statements-ls002') ||
    room.includes('debits-credits-ls003') ||
    title.includes('Trial Balance Adjustments – Live Review') ||
    title.includes('Financial Statements Masterclass') ||
    title.includes('Debits & Credits Crash Course') ||
    (instructor.includes('Eleanor Vance') && id.startsWith('ls-00'))
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(initialProfile);
  const [accounts, setAccounts] = useState<UserAccount[]>([initialStudentAccount, fixedAdminProfile]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const [courses, setCourses] = useState<Course[]>(() => initialCourses.map(normalizeCourse));
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [materials, setMaterials] = useState<DownloadableMaterial[]>(initialMaterials);
  const [videos, setVideos] = useState<VideoLesson[]>(initialVideos);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [faqs] = useState<FAQItem[]>(initialFAQs);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgressRecord>>({});
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTabType>('courses');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const storedProgress: Record<string, UserProgressRecord> = parsed.userProgress || {};
        setUserProgress(storedProgress);

        let activeUser = parsed.user || initialProfile;
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (typeof parsed.isAuthenticated === 'boolean') setIsAuthenticated(parsed.isAuthenticated);

        // Course structure from storage or initialCourses
        let baseCoursesList = initialCourses.map(normalizeCourse);
        if (parsed.courses) {
          const savedCourses = parsed.courses.map(normalizeCourse);
          const customCourses = savedCourses.filter(
            (sc: Course) => !initialCourses.some((ic) => ic.id === sc.id || ic.title.toLowerCase() === sc.title.toLowerCase())
          );
          baseCoursesList = [...initialCourses.map(normalizeCourse), ...customCourses];
        }

        // Apply active user's progress
        const userProg = storedProgress[activeUser.id] || { completedLessonIds: [], submissions: [] };
        const userCourses = applyProgressToCourses(baseCoursesList, userProg.completedLessonIds || []);
        setCourses(userCourses);
        setSubmissions(userProg.submissions || []);

        const avgScore = (userProg.submissions && userProg.submissions.length > 0)
          ? Math.round(userProg.submissions.reduce((a: number, b: QuizSubmission) => a + b.score, 0) / userProg.submissions.length)
          : (activeUser.averageQuizScore || 0);

        setUser({
          ...activeUser,
          completedLessonsCount: (userProg.completedLessonIds || []).length,
          totalQuizzesTaken: (userProg.submissions || []).length,
          averageQuizScore: avgScore
        });

        if (parsed.quizzes) setQuizzes(parsed.quizzes);
        if (parsed.materials) setMaterials(parsed.materials);
        if (parsed.videos) {
          const updatedVideos = initialVideos.map((initVid) => {
            const existing = parsed.videos.find((v: VideoLesson) => v.id === initVid.id);
            return existing ? { ...existing, videoUrl: initVid.videoUrl } : initVid;
          });
          const customVideos = parsed.videos.filter(
            (pv: VideoLesson) => !initialVideos.some((iv) => iv.id === pv.id)
          );
          setVideos([...customVideos, ...updatedVideos]);
        }
        if (parsed.schedules) setSchedules(parsed.schedules);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.liveSessions && Array.isArray(parsed.liveSessions)) {
          // Actively purge any old mock demo sessions from existing users' localStorage
          const cleanSessions = parsed.liveSessions.filter((s: LiveSession) => !isMockLiveSession(s));
          setLiveSessions(cleanSessions);
          try {
            parsed.liveSessions = cleanSessions;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync shared videos, live sessions, and registered accounts
  useEffect(() => {
    let isMounted = true;
    const syncCloudVideos = async () => {
      try {
        const cloudVideos = await fetchVideosFromSupabase();
        if (isMounted && cloudVideos && cloudVideos.length > 0) {
          setVideos((prevVideos) => {
            const map = new Map<string, VideoLesson>();
            initialVideos.forEach((iv) => map.set(iv.id, iv));
            prevVideos.forEach((pv) => map.set(pv.id, pv));
            cloudVideos.forEach((cv) => map.set(cv.id, cv));
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn('Could not sync cloud videos:', e);
      }
    };
    syncCloudVideos();

    // Sync registered accounts dynamically across sessions
    const syncRegisteredAccounts = async () => {
      try {
        const remoteAccounts = await fetchAccountsFromApi();
        if (isMounted && remoteAccounts && Array.isArray(remoteAccounts) && remoteAccounts.length > 0) {
          setAccounts((prev) => {
            const map = new Map<string, UserAccount>();
            prev.forEach((a) => map.set(a.id, a));
            remoteAccounts.forEach((ra: UserAccount) => {
              if (!map.has(ra.id)) {
                map.set(ra.id, ra);
              }
            });
            return Array.from(map.values());
          });
        }
      } catch {
        // ignore
      }
    };
    syncRegisteredAccounts();

    const isTerminalStatus = (status?: LiveSessionStatus) => status === 'completed' || status === 'cancelled';

    const syncCloudLiveSessions = async () => {
      try {
        const cloudSessions = await fetchLiveSessionsFromSupabase();
        if (isMounted && cloudSessions && Array.isArray(cloudSessions)) {
          setLiveSessions((prevSessions) => {
            const map = new Map<string, LiveSession>();
            prevSessions
              .filter((s) => !isMockLiveSession(s))
              .forEach((s) => map.set(s.id, s));

            cloudSessions
              .filter((s) => !isMockLiveSession(s))
              .forEach((incoming) => {
                const existing = map.get(incoming.id);
                if (existing) {
                  // If existing session is in terminal state (completed or cancelled),
                  // NEVER allow a stale incoming state (scheduled or live) to revert it!
                  if (isTerminalStatus(existing.status) && !isTerminalStatus(incoming.status)) {
                    map.set(incoming.id, {
                      ...incoming,
                      status: existing.status,
                      endTime: existing.endTime || incoming.endTime,
                      participants: incoming.participants || existing.participants || []
                    });
                  } else {
                    map.set(incoming.id, {
                      ...existing,
                      ...incoming,
                      participants: incoming.participants || existing.participants || []
                    });
                  }
                } else {
                  map.set(incoming.id, incoming);
                }
              });
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn('Could not sync cloud live sessions:', e);
      }
    };

    // Initial fetch
    syncCloudLiveSessions();

    // 1. Cross-tab BroadcastChannel for 0ms latency sync across tabs
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('bookkeepit_live_sync');
        channel.onmessage = () => {
          syncCloudLiveSessions();
        };
      }
    } catch {
      // ignore
    }

    // 2. Storage event listener for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bookkeepit_app_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.liveSessions && Array.isArray(parsed.liveSessions)) {
            setLiveSessions(parsed.liveSessions.filter((s: LiveSession) => !isMockLiveSession(s)));
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Periodic real-time polling every 3.5 seconds to keep all student devices synced
    const pollInterval = setInterval(() => {
      syncCloudLiveSessions();
    }, 3500);

    // 4. Instant sync on window focus and visibility change
    const handleFocus = () => {
      syncCloudLiveSessions();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncCloudLiveSessions();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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
        notifications,
        userProgress,
        liveSessions: liveSessions.filter((s) => !isMockLiveSession(s))
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [user, accounts, isAuthenticated, courses, quizzes, submissions, materials, videos, schedules, notifications, userProgress, liveSessions, isLoaded]);

  // Login handler supporting fixed admin and student accounts with Supabase sync
  // Login handler supporting admin and registered student accounts
  const login = (email: string, password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Sync with Supabase Auth in background if configured
    supabaseLogin(trimmedEmail, password);

    // Check admin credentials
    if (
      trimmedEmail === 'admin@bookkeep-it.edu' ||
      trimmedEmail === 'admin@ilearn.edu' ||
      trimmedEmail === 'admin@gmail.com'
    ) {
      if (password && password !== 'admin123') {
        return {
          success: false,
          error: 'Incorrect administrator password. Please verify and try again.'
        };
      }
      setUser(fixedAdminProfile);
      setIsAuthenticated(true);
      return { success: true };
    }

    // Check student/custom accounts
    const match = accounts.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail
    );

    if (!match) {
      return {
        success: false,
        error: `No account found for "${email}". Please click the "Create Account" tab above to register first.`
      };
    }

    if (password && match.password && match.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.'
      };
    }

    const progress = userProgress[match.id] || { completedLessonIds: [], submissions: [] };
    
    setCourses((prev) => applyProgressToCourses(prev, progress.completedLessonIds || []));
    setSubmissions(progress.submissions || []);

    const avgScore = (progress.submissions && progress.submissions.length > 0)
      ? Math.round(progress.submissions.reduce((a, b) => a + b.score, 0) / progress.submissions.length)
      : (match.averageQuizScore || 0);

    setUser({
      ...match,
      completedLessonsCount: (progress.completedLessonIds || []).length,
      totalQuizzesTaken: (progress.submissions || []).length,
      averageQuizScore: avgScore
    });
    setIsAuthenticated(true);
    return { success: true };
  };

  // Register new student account with clean fresh 0% progress
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

    // Initialize fresh empty progress for new account
    setUserProgress((prev) => ({
      ...prev,
      [newAcc.id]: { completedLessonIds: [], submissions: [] }
    }));

    // Reset all courses to 0% progress and clear submissions for new student
    setCourses((prev) => applyProgressToCourses(prev, []));
    setSubmissions([]);

    // Sync with server accounts store so admin immediately sees real registered student
    saveAccountToApi(newAcc);

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

    const currentProg = userProgress[user.id] || { completedLessonIds: [], submissions: [] };
    const updatedSubs = [newSubmission, ...currentProg.submissions.filter((s) => s.quizId !== targetQuiz.id)];

    setUserProgress((prev) => ({
      ...prev,
      [user.id]: {
        ...currentProg,
        submissions: updatedSubs
      }
    }));

    setSubmissions(updatedSubs);

    const avgScore = Math.round(updatedSubs.reduce((acc, curr) => acc + curr.score, 0) / updatedSubs.length);

    setUser((prev) => ({
      ...prev,
      totalQuizzesTaken: updatedSubs.length,
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

    // Send email notification to Admin Gmail via Resend
    sendQuizSubmissionNotification({
      studentName: user.name,
      studentEmail: user.email,
      studentId: user.studentId,
      program: user.program,
      quizTitle: targetQuiz.title,
      score: scorePct,
      passed,
      correctAnswersCount: correct,
      totalQuestions,
      submittedAt: newSubmission.submittedAt
    }).catch((err) => {
      console.warn('Resend email notification trigger notice:', err);
    });

    return newSubmission;
  };

  const toggleLessonCompletion = (courseId: string, lessonId: string) => {
    const currentProg = userProgress[user.id] || { completedLessonIds: [], submissions: [] };
    const isCurrentlyDone = currentProg.completedLessonIds.includes(lessonId);
    const updatedIds = isCurrentlyDone
      ? currentProg.completedLessonIds.filter((id) => id !== lessonId)
      : [...currentProg.completedLessonIds, lessonId];

    setUserProgress((prev) => ({
      ...prev,
      [user.id]: {
        ...currentProg,
        completedLessonIds: updatedIds
      }
    }));

    setCourses((prevCourses) => applyProgressToCourses(prevCourses, updatedIds));

    setUser((prev) => ({
      ...prev,
      completedLessonsCount: updatedIds.length
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
    setVideos((prev) => [video, ...prev.filter((v) => v.id !== video.id)]);
    // Persist to Supabase database in background
    saveVideoToSupabase(video).catch((err) => {
      console.warn('Supabase saveVideo note:', err);
    });
  };

  const deleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    deleteVideoBlob(id);
    deleteVideoFromSupabase(id).catch((err) => {
      console.warn('Supabase deleteVideo note:', err);
    });
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
    setLiveSessions([]);
  };

  // Live Session CRUD
  const addLiveSession = (session: Omit<LiveSession, 'id' | 'createdAt' | 'attendeesCount'> & { id?: string }): LiveSession => {
    const now = new Date();
    const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const nowDate = now.toISOString().split('T')[0];

    const newSession: LiveSession = {
      ...session,
      id: session.id || `ls-${Date.now()}`,
      date: session.date || nowDate,
      startTime: session.status === 'live' && !session.startTime ? nowTime : (session.startTime || nowTime),
      attendeesCount: session.participants ? session.participants.length : 0,
      participants: session.participants || [],
      createdAt: new Date().toISOString()
    };

    setLiveSessions((prev) => [newSession, ...prev]);
    // Sync to Supabase Cloud and /api/live in background
    saveLiveSessionToSupabase(newSession);

    try {
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('bookkeepit_live_sync');
        bc.postMessage({ type: 'sync', session: newSession });
        bc.close();
      }
    } catch {}

    // Broadcast notification to students
    const notif: NotificationItem = {
      id: `notif-ls-${Date.now()}`,
      title: session.status === 'live' ? `🔴 LIVE NOW: ${session.title}` : `Live Class Scheduled: ${session.title}`,
      message: `${session.instructorName} has ${session.status === 'live' ? 'started a live class right now' : `scheduled a live class on ${newSession.date} at ${newSession.startTime}`}.${session.courseTitle ? ` Course: ${session.courseTitle}.` : ''}`,
      category: 'announcement',
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: session.instructorName
    };
    setNotifications((prev) => [notif, ...prev]);
    return newSession;
  };

  const updateLiveSession = (id: string, updates: Partial<LiveSession>) => {
    const isTerminalStatus = (status?: LiveSessionStatus) => status === 'completed' || status === 'cancelled';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    let updatedSession: LiveSession | null = null;
    setLiveSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          // Terminal State Invariant: Completed or Cancelled status can NEVER revert to live or scheduled
          if (isTerminalStatus(s.status) && (updates.status === 'live' || updates.status === 'scheduled')) {
            console.warn(`Prevented reverting terminal session ${id} from ${s.status} to ${updates.status}`);
            return s;
          }

          // Auto-record actual start time when starting live session
          let finalStartTime = updates.startTime || s.startTime;
          if (updates.status === 'live' && !updates.startTime && s.status !== 'live') {
            finalStartTime = nowTime;
          }

          // Auto-record actual end time when ending live session
          let finalEndTime = updates.endTime || s.endTime;
          if (updates.status === 'completed' && !updates.endTime) {
            finalEndTime = nowTime;
          }

          const participantsList = updates.participants || s.participants || [];
          const attendeesCount = updates.attendeesCount !== undefined ? updates.attendeesCount : participantsList.length;

          updatedSession = {
            ...s,
            ...updates,
            startTime: finalStartTime,
            endTime: finalEndTime,
            participants: participantsList,
            attendeesCount,
            updatedAt: new Date().toISOString()
          };
          return updatedSession;
        }
        return s;
      })
    );

    if (updatedSession) {
      saveLiveSessionToSupabase(updatedSession);
    }

    try {
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('bookkeepit_live_sync');
        bc.postMessage({ type: 'sync', id, updates });
        bc.close();
      }
    } catch {}

    // If a session goes live, send a high-priority notification
    if (updates.status === 'live') {
      const session = liveSessions.find((s) => s.id === id) || updatedSession;
      if (session) {
        const notif: NotificationItem = {
          id: `notif-live-${Date.now()}`,
          title: `🔴 LIVE NOW: ${session.title}`,
          message: `${session.instructorName} has started the live class. Join now from the Live Classes page!`,
          category: 'announcement',
          createdAt: new Date().toISOString(),
          isRead: false,
          sender: session.instructorName
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    }
  };

  const deleteLiveSession = (id: string) => {
    setLiveSessions((prev) => prev.filter((s) => s.id !== id));
    deleteLiveSessionFromSupabase(id);

    try {
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('bookkeepit_live_sync');
        bc.postMessage({ type: 'delete', id });
        bc.close();
      }
    } catch {}
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
        liveSessions,
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
        resetAllData,
        adminTab,
        setAdminTab,
        addLiveSession,
        updateLiveSession,
        deleteLiveSession
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
