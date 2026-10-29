import { NextResponse } from 'next/server';
import { Course } from '@/types';
import { initialCourses } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Global in-memory courses store shared across API requests in Node runtime
declare global {
  // eslint-disable-next-line no-var
  var __coursesStore: Course[] | undefined;
}

function getCoursesStore(): Course[] {
  if (!globalThis.__coursesStore) {
    globalThis.__coursesStore = [...initialCourses];
  }
  return globalThis.__coursesStore;
}

function setCoursesStore(courses: Course[]) {
  globalThis.__coursesStore = courses;
}

// GET /api/courses
export async function GET() {
  try {
    let store = getCoursesStore();

    // If Supabase is configured, try to fetch and merge cloud courses
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const map = new Map<string, Course>();
          // Start with initial / in-memory store
          store.forEach((c) => map.set(c.id, c));
          // Overlay cloud data
          data.forEach((row: any) => {
            map.set(row.id, {
              id: row.id,
              title: row.title,
              code: row.code,
              category: row.category,
              level: row.level,
              instructor: row.instructor,
              thumbnail: row.thumbnail,
              description: row.description || '',
              totalLessons: row.total_lessons || 0,
              completedLessons: row.completed_lessons || 0,
              topics: Array.isArray(row.topics) ? row.topics : [],
              createdAt: row.created_at
            });
          });
          store = Array.from(map.values());
          setCoursesStore(store);
        }
      } catch (err) {
        console.warn('Supabase fetch courses API note:', err);
      }
    }

    return NextResponse.json(
      { success: true, courses: store },
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

// POST /api/courses - Create or Upsert course
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const course = (body.course || body) as Course;

    if (!course || !course.title) {
      return NextResponse.json({ success: false, error: 'Course title is required.' }, { status: 400 });
    }

    const calculatedTotal = course.topics && course.topics.length > 0
      ? course.topics.reduce((acc, t) => acc + (t.lessons ? t.lessons.length : 0), 0)
      : (course.totalLessons || 1);

    const completeCourse: Course = {
      id: course.id || `crs-${Date.now()}`,
      title: course.title.trim(),
      code: course.code ? course.code.trim() : 'ACCT 101',
      category: course.category || 'Bookkeeping Cycle',
      level: course.level || 'Beginner',
      instructor: course.instructor ? course.instructor.trim() : 'Faculty Instructor',
      thumbnail:
        course.thumbnail ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      description: course.description ? course.description.trim() : 'Course instructional content.',
      totalLessons: calculatedTotal,
      completedLessons: course.completedLessons || 0,
      topics: Array.isArray(course.topics) ? course.topics : [],
      createdAt: course.createdAt || new Date().toISOString()
    };

    const currentStore = getCoursesStore();
    const existingIndex = currentStore.findIndex((c) => c.id === completeCourse.id);

    let updatedStore: Course[];
    if (existingIndex >= 0) {
      updatedStore = currentStore.map((c) => (c.id === completeCourse.id ? completeCourse : c));
    } else {
      updatedStore = [completeCourse, ...currentStore];
    }
    setCoursesStore(updatedStore);

    // Sync to Supabase in background
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('courses').upsert(
          {
            id: completeCourse.id,
            title: completeCourse.title,
            code: completeCourse.code,
            category: completeCourse.category,
            level: completeCourse.level,
            instructor: completeCourse.instructor,
            thumbnail: completeCourse.thumbnail,
            description: completeCourse.description,
            total_lessons: completeCourse.totalLessons,
            completed_lessons: completeCourse.completedLessons,
            topics: completeCourse.topics
          },
          { onConflict: 'id' }
        );
        if (error) console.warn('Supabase upsert course note:', error.message);
      } catch (e: any) {
        console.warn('Supabase course sync error:', e?.message || e);
      }
    }

    return NextResponse.json({ success: true, course: completeCourse, courses: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT /api/courses - Update course details or outline
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body.courseId;
    const updates = body.updates ? body.updates : body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing course id' }, { status: 400 });
    }

    const currentStore = getCoursesStore();
    const existing = currentStore.find((c) => c.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const mergedTopics = updates.topics || existing.topics || [];
    const calculatedTotal = mergedTopics.length > 0
      ? mergedTopics.reduce((acc: number, t: any) => acc + (t.lessons ? t.lessons.length : 0), 0)
      : (updates.totalLessons || existing.totalLessons || 1);

    const updatedCourse: Course = {
      ...existing,
      ...updates,
      id,
      topics: mergedTopics,
      totalLessons: calculatedTotal
    };

    const updatedStore = currentStore.map((c) => (c.id === id ? updatedCourse : c));
    setCoursesStore(updatedStore);

    // Supabase update
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('courses').upsert(
          {
            id: updatedCourse.id,
            title: updatedCourse.title,
            code: updatedCourse.code,
            category: updatedCourse.category,
            level: updatedCourse.level,
            instructor: updatedCourse.instructor,
            thumbnail: updatedCourse.thumbnail,
            description: updatedCourse.description,
            total_lessons: updatedCourse.totalLessons,
            completed_lessons: updatedCourse.completedLessons,
            topics: updatedCourse.topics
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, course: updatedCourse, courses: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// DELETE /api/courses?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing course id' }, { status: 400 });
    }

    const currentStore = getCoursesStore();
    const updatedStore = currentStore.filter((c) => c.id !== id);
    setCoursesStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('courses').delete().eq('id', id);
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, courses: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
