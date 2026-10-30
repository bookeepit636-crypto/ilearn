import { NextResponse } from 'next/server';
import { Quiz } from '@/types';
import { initialQuizzes } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadPersistentQuizzes, savePersistentQuizzes } from '@/lib/serverStorage';

declare global {
  // eslint-disable-next-line no-var
  var __quizzesStore: Quiz[] | undefined;
}

function getQuizzesStore(): Quiz[] {
  if (!globalThis.__quizzesStore) {
    globalThis.__quizzesStore = loadPersistentQuizzes();
  }
  return globalThis.__quizzesStore;
}

function setQuizzesStore(quizzes: Quiz[]) {
  globalThis.__quizzesStore = quizzes;
  savePersistentQuizzes(quizzes);
}

// GET /api/quizzes
export async function GET() {
  try {
    let store = getQuizzesStore();

    // Check disk storage for latest updates
    const diskStore = loadPersistentQuizzes();
    if (diskStore.length > 0) {
      const map = new Map<string, Quiz>();
      store.forEach((q) => map.set(q.id, q));
      diskStore.forEach((q) => map.set(q.id, q));
      store = Array.from(map.values());
      globalThis.__quizzesStore = store;
    }

    // Try fetching and merging cloud quizzes from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const map = new Map<string, Quiz>();
          store.forEach((q) => map.set(q.id, q));
          data.forEach((row: any) => {
            const existing = map.get(row.id);
            map.set(row.id, {
              id: row.id,
              title: row.title,
              courseId: existing?.courseId || row.course_id || undefined,
              lessonId: row.lesson_id,
              topicTitle: row.topic_title,
              passingScore: row.passing_score ?? 75,
              durationMinutes: row.duration_minutes ?? 15,
              questions: Array.isArray(row.questions) ? row.questions : [],
              createdAt: row.created_at
            });
          });
          store = Array.from(map.values());
          setQuizzesStore(store);
        }
      } catch (err) {
        console.warn('Supabase fetch quizzes API note:', err);
      }
    }

    return NextResponse.json(
      { success: true, quizzes: store },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// POST /api/quizzes - Create or Upsert quiz
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const quiz = (body.quiz || body) as Quiz;

    if (!quiz || !quiz.title) {
      return NextResponse.json({ success: false, error: 'Quiz title is required.' }, { status: 400 });
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return NextResponse.json({ success: false, error: 'Quiz must include at least one question.' }, { status: 400 });
    }

    const validatedQuiz: Quiz = {
      id: quiz.id || `qz-${Date.now()}`,
      title: quiz.title.trim(),
      courseId: quiz.courseId || undefined,
      lessonId: quiz.lessonId || `lsn-${Date.now()}`,
      topicTitle: quiz.topicTitle ? quiz.topicTitle.trim() : 'Accounting Quiz',
      passingScore: typeof quiz.passingScore === 'number' ? quiz.passingScore : 75,
      durationMinutes: typeof quiz.durationMinutes === 'number' ? quiz.durationMinutes : 15,
      questions: quiz.questions.map((q, idx) => ({
        id: q.id || `q-${Date.now()}-${idx}`,
        question: q.question.trim(),
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option 1', 'Option 2'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation ? q.explanation.trim() : ''
      })),
      createdAt: quiz.createdAt || new Date().toISOString()
    };

    const currentStore = getQuizzesStore();
    const existingIndex = currentStore.findIndex((q) => q.id === validatedQuiz.id);

    let updatedStore: Quiz[];
    if (existingIndex >= 0) {
      updatedStore = currentStore.map((q) => (q.id === validatedQuiz.id ? validatedQuiz : q));
    } else {
      updatedStore = [validatedQuiz, ...currentStore];
    }
    setQuizzesStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        // Notice: Column 'course_id' is excluded because it does not exist in Supabase quizzes schema
        await supabase.from('quizzes').upsert(
          {
            id: validatedQuiz.id,
            title: validatedQuiz.title,
            lesson_id: validatedQuiz.lessonId,
            topic_title: validatedQuiz.topicTitle,
            passing_score: validatedQuiz.passingScore,
            duration_minutes: validatedQuiz.durationMinutes,
            questions: validatedQuiz.questions
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        // Fallback to local and server disk store
      }
    }

    return NextResponse.json({ success: true, quiz: validatedQuiz, quizzes: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT /api/quizzes - Update existing quiz
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body as { id: string; updates: Partial<Quiz> };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing quiz id' }, { status: 400 });
    }

    const currentStore = getQuizzesStore();
    const existing = currentStore.find((q) => q.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const updatedQuiz: Quiz = {
      ...existing,
      ...updates,
      id
    };

    const updatedStore = currentStore.map((q) => (q.id === id ? updatedQuiz : q));
    setQuizzesStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('quizzes').upsert(
          {
            id: updatedQuiz.id,
            title: updatedQuiz.title,
            lesson_id: updatedQuiz.lessonId,
            topic_title: updatedQuiz.topicTitle,
            passing_score: updatedQuiz.passingScore,
            duration_minutes: updatedQuiz.durationMinutes,
            questions: updatedQuiz.questions
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, quiz: updatedQuiz, quizzes: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// DELETE /api/quizzes?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing quiz id' }, { status: 400 });
    }

    const currentStore = getQuizzesStore();
    const updatedStore = currentStore.filter((q) => q.id !== id);
    setQuizzesStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('quizzes').delete().eq('id', id);
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, quizzes: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
