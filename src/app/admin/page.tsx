'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileQuestion,
  FileText,
  Flame,
  GraduationCap,
  ListOrdered,
  Megaphone,
  Paperclip,
  Plus,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  Video,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Course, DownloadableMaterial, Lesson, Quiz, QuizQuestion, Topic, VideoLesson } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveVideoBlob, deleteVideoBlob, generateVideoThumbnail } from '@/lib/videoStorage';

export default function AdminPage() {
  const {
    user,
    accounts,
    submissions,
    courses,
    videos,
    materials,
    quizzes,
    notifications,
    addCourse,
    updateCourseTopics,
    deleteCourse,
    addVideo,
    deleteVideo,
    addMaterial,
    deleteMaterial,
    addQuiz,
    broadcastAnnouncement,
    adminTab,
    setAdminTab
  } = useApp();

  // Course Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('ACCT 104');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseBgImage, setCourseBgImage] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600');
  const [isCourseBgUploading, setIsCourseBgUploading] = useState(false);

  const handleCourseBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCourseBgUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'image');
      setCourseBgImage(uploadedUrl);
    } catch (err) {
      console.warn('Course BG upload fallback:', err);
      setCourseBgImage(URL.createObjectURL(file));
    } finally {
      setIsCourseBgUploading(false);
    }
  };

  // Course Outline Manager State
  const [selectedCourseForOutline, setSelectedCourseForOutline] = useState<Course | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  const [activeTopicForLesson, setActiveTopicForLesson] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState('20 mins');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonFileName, setLessonFileName] = useState('');
  const [lessonFileUrl, setLessonFileUrl] = useState('');

  // Quiz Builder State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTopicTitle, setQuizTopicTitle] = useState('Basic Accounting Principles');
  const [quizPassingScore, setQuizPassingScore] = useState(75);
  const [quizDuration, setQuizDuration] = useState(20);
  
  // Question Builder Form State
  const [qText, setQText] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qOpt4, setQOpt4] = useState('');
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [addedQuestions, setAddedQuestions] = useState<QuizQuestion[]>([]);

  // Video Form State
  const [vidTitle, setVidTitle] = useState('');
  const [vidTopic, setVidTopic] = useState('Basic Accounting Principles');
  const [vidDuration, setVidDuration] = useState('15:00');
  const [vidUrl, setVidUrl] = useState('');

  // Material Form State
  const [matTitle, setMatTitle] = useState('');
  const [matCategory, setMatCategory] = useState('Worksheets');
  const [matFileType, setMatFileType] = useState<'pdf' | 'xlsx' | 'docx' | 'zip'>('pdf');
  const [matSize, setMatSize] = useState('1.5 MB');

  // Video & Material Cloudinary Upload State
  const [isVidUploading, setIsVidUploading] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState('');
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoThumb, setUploadedVideoThumb] = useState<string>('');
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const [isMatUploading, setIsMatUploading] = useState(false);
  const [videoFileWarning, setVideoFileWarning] = useState('');

  // Announcement State
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedVideoFile(file);
    setUploadedVideoName(file.name);

    // Auto extract real thumbnail frame
    try {
      const thumb = await generateVideoThumbnail(file);
      setUploadedVideoThumb(thumb);
    } catch {
      // ignore
    }

    // Instantly create local stream so the user never has an empty URL or blocked publish
    const localStreamUrl = URL.createObjectURL(file);
    setVidUrl(localStreamUrl);

    // Cloudinary Free Tier unsigned browser uploads support up to 100MB.
    // If file > 100MB, warn admin clearly that it will only be local unless hosted on YouTube.
    const sizeMb = file.size / (1024 * 1024);
    if (file.size > 100 * 1024 * 1024) {
      setVideoFileWarning(
        `This file is ${sizeMb.toFixed(1)}MB, which exceeds Cloudinary's 100MB free cloud upload limit. It is currently stored locally on this laptop only and CANNOT be viewed on phones or other devices. To make it viewable on mobile and for all students, upload it to YouTube (set to Unlisted) and paste the link above!`
      );
      return;
    }

    setVideoFileWarning('');
    setIsVidUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'video');
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        setVidUrl(url);
      }
    } catch (err) {
      console.warn('Cloudinary upload warning, using local stream:', err);
    } finally {
      setIsVidUploading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVidUploading) {
      alert('Please wait for the video upload to complete before publishing.');
      return;
    }
    if (!vidTitle || !vidUrl) {
      alert('Please enter a video title and URL or upload a video file.');
      return;
    }
    let embedUrl = vidUrl;
    if (vidUrl.includes('youtube.com/watch?v=')) {
      const vidId = vidUrl.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    } else if (vidUrl.includes('youtu.be/')) {
      const vidId = vidUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    }
    const newV: VideoLesson = {
      id: `vid-${Date.now()}`,
      title: vidTitle,
      topic: vidTopic,
      duration: vidDuration || '15:00',
      videoUrl: embedUrl,
      thumbnailUrl:
        uploadedVideoThumb ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
      description: 'Instructional bookkeeping lecture prepared by ' + user.name,
      keyTakeaways: ['Key takeaway for ' + vidTitle, 'Practical bookkeeping applications'],
      viewsCount: 0
    };

    if (uploadedVideoFile) {
      await saveVideoBlob(newV.id, uploadedVideoFile);
    }

    addVideo(newV);
    setVidTitle('');
    setVidUrl('');
    setUploadedVideoName('');
    setUploadedVideoFile(null);
    setUploadedVideoThumb('');
    alert('Video published to classroom successfully!');
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle) {
      alert('Please enter a template or material title.');
      return;
    }
    const newM: DownloadableMaterial = {
      id: `mat-${Date.now()}`,
      title: matTitle,
      category: matCategory,
      fileType: matFileType,
      fileSize: matSize || '1.5 MB',
      downloadUrl: '#',
      description: 'Educational material and practice template for offline accounting study.',
      downloadsCount: 0,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    addMaterial(newM);
    setMatTitle('');
    alert('Material published to Downloads & Templates successfully!');
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle) return;

    const newCrs: Course = {
      id: `crs-${Date.now()}`,
      title: courseTitle,
      code: courseCode,
      category: 'Bookkeeping Cycle',
      level: 'Beginner',
      instructor: user.name + ', CPA',
      thumbnail:
        courseBgImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      description: courseDesc || 'New bookkeeping learning module.',
      totalLessons: 1,
      completedLessons: 0,
      topics: [
        {
          id: `tpc-${Date.now()}`,
          title: 'Module Overview & Fundamentals',
          description: 'Core concepts and introduction',
          lessons: [
            {
              id: `lsn-${Date.now()}`,
              topicId: `tpc-${Date.now()}`,
              title: 'Introduction to ' + courseTitle,
              description: 'Lesson Overview',
              duration: '20 mins',
              isCompleted: false,
              contentMarkdown: '# Welcome to ' + courseTitle + '\n\nRead the lesson notes carefully.'
            }
          ]
        }
      ]
    };

    addCourse(newCrs);
    setCourseTitle('');
    setCourseDesc('');
    alert('Course published successfully!');
  };

  // Add Question to Draft Quiz
  const handleAddQuestionToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText || !qOpt1 || !qOpt2) {
      alert('Please enter a question and at least two choices.');
      return;
    }

    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: qText,
      options: [qOpt1, qOpt2, qOpt3 || 'Option 3', qOpt4 || 'Option 4'],
      correctAnswerIndex: qCorrectIdx,
      explanation: qExplanation || 'Review the lesson notes for this topic.'
    };

    setAddedQuestions((prev) => [...prev, newQ]);
    setQText('');
    setQOpt1('');
    setQOpt2('');
    setQOpt3('');
    setQOpt4('');
    setQExplanation('');
  };

  // Submit and Publish Final Quiz
  const handleCreateQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle) return;
    if (addedQuestions.length === 0) {
      alert('Please add at least 1 question to the quiz before publishing.');
      return;
    }

    const newQuiz: Quiz = {
      id: `qz-${Date.now()}`,
      title: quizTitle,
      lessonId: `lsn-${Date.now()}`,
      topicTitle: quizTopicTitle,
      passingScore: quizPassingScore,
      durationMinutes: quizDuration,
      questions: addedQuestions
    };

    addQuiz(newQuiz);
    setQuizTitle('');
    setAddedQuestions([]);
    alert(`Quiz "${newQuiz.title}" published successfully with ${newQuiz.questions.length} questions!`);
  };

  // Add Topic to Selected Course Outline
  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForOutline || !newTopicTitle) return;

    const newTopic: Topic = {
      id: `tpc-${Date.now()}`,
      title: newTopicTitle,
      description: newTopicDesc || 'Topic learning unit',
      lessons: []
    };

    const updatedTopics = [...selectedCourseForOutline.topics, newTopic];
    updateCourseTopics(selectedCourseForOutline.id, updatedTopics);
    setSelectedCourseForOutline({
      ...selectedCourseForOutline,
      topics: updatedTopics
    });

    setNewTopicTitle('');
    setNewTopicDesc('');
  };

  // Handle Lesson File Selection
  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'raw');
      setLessonFileName(file.name);
      setLessonFileUrl(uploadedUrl);

      const newMat: DownloadableMaterial = {
        id: `dl-${Date.now()}`,
        title: file.name,
        category: 'Worksheets & Notes',
        fileType: file.name.endsWith('.xlsx') ? 'xlsx' : file.name.endsWith('.docx') ? 'docx' : 'pdf',
        fileSize: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        downloadUrl: uploadedUrl,
        description: `Attached file worksheet for ${selectedCourseForOutline?.title}`,
        downloadsCount: 0,
        uploadedAt: new Date().toISOString().split('T')[0]
      };
      addMaterial(newMat);
    } catch (err) {
      console.warn('File upload fallback:', err);
      setLessonFileName(file.name);
      setLessonFileUrl(URL.createObjectURL(file));
    }
  };

  // Handle Video File Upload
  const handleLessonVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLessonVideoFile(file);
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'auto');
      setLessonVideoUrl(uploadedUrl);
    } catch (err) {
      console.warn('Video upload fallback to local stream:', err);
      setLessonVideoUrl(URL.createObjectURL(file));
    }
  };

  // Add Lesson with Text, Video, and Uploaded File Attachments
  const handleAddLessonToTopic = async (topicId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForOutline || !lessonTitle) return;

    const newLesson: Lesson = {
      id: `lsn-${Date.now()}`,
      topicId,
      title: lessonTitle,
      description: lessonFileName ? `Attached File: ${lessonFileName}` : 'Lesson details & study notes',
      duration: lessonDuration || '15 mins',
      isCompleted: false,
      videoUrl: lessonVideoUrl || undefined,
      downloadIds: lessonFileUrl ? [`dl-${Date.now()}`] : undefined,
      contentMarkdown: lessonContent || `# ${lessonTitle}\n\nStudy lecture notes and review the attached lesson files below.`
    };

    if (lessonVideoFile) {
      await saveVideoBlob(newLesson.id, lessonVideoFile);
    }

    const updatedTopics = selectedCourseForOutline.topics.map((tpc) => {
      if (tpc.id !== topicId) return tpc;
      return {
        ...tpc,
        lessons: [...tpc.lessons, newLesson]
      };
    });

    updateCourseTopics(selectedCourseForOutline.id, updatedTopics);
    setSelectedCourseForOutline({
      ...selectedCourseForOutline,
      topics: updatedTopics
    });

    setLessonTitle('');
    setLessonVideoUrl('');
    setLessonContent('');
    setLessonFileName('');
    setLessonFileUrl('');
    setActiveTopicForLesson(null);
  };

  // Delete Topic from Outline
  const handleDeleteTopic = (topicId: string) => {
    if (!selectedCourseForOutline) return;
    const updatedTopics = selectedCourseForOutline.topics.filter((t) => t.id !== topicId);
    updateCourseTopics(selectedCourseForOutline.id, updatedTopics);
    setSelectedCourseForOutline({
      ...selectedCourseForOutline,
      topics: updatedTopics
    });
  };

  // Delete Lesson from Topic in Outline
  const handleDeleteLesson = (topicId: string, lessonId: string) => {
    if (!selectedCourseForOutline) return;
    deleteVideoBlob(lessonId);
    const updatedTopics = selectedCourseForOutline.topics.map((tpc) => {
      if (tpc.id !== topicId) return tpc;
      return {
        ...tpc,
        lessons: tpc.lessons.filter((l) => l.id !== lessonId)
      };
    });

    updateCourseTopics(selectedCourseForOutline.id, updatedTopics);
    setSelectedCourseForOutline({
      ...selectedCourseForOutline,
      topics: updatedTopics
    });
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annMsg) return;
    broadcastAnnouncement(annTitle, annMsg);
    setAnnTitle('');
    setAnnMsg('');
    alert('Announcement broadcasted to all student inboxes!');
  };

  const generateCSVReport = () => {
    const header = 'Student Name,Student ID,Program,Quizzes Taken,Average Quiz Score (%),Completed Lessons,Study Hours\n';
    const row = `"${user.name}","${user.studentId}","${user.program}",${user.totalQuizzesTaken},${user.averageQuizScore},${user.completedLessonsCount},${user.studyHours}\n`;
    
    const blob = new Blob([header + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BookKeep-It_Student_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user.role !== 'admin') {
    return (
      <div className="card-theme p-12 rounded-3xl bg-white border border-slate-100 text-center max-w-xl mx-auto space-y-4">
        <ShieldCheck className="w-12 h-12 text-[#0077b6] mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Admin Authentication Required</h2>
        <p className="text-xs text-slate-500">
          Switch to Admin Mode using the toggle switch in the top header navbar to access Admin control functions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrator Control Center
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">BookKeep-It System Administration</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage courses, publish quizzes & exams, attach videos & files to lessons, and monitor student progress.
          </p>
        </div>

        <button
          onClick={generateCSVReport}
          className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition shrink-0"
        >
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Admin Tab Selection */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-2">
        {[
          { id: 'courses', label: 'Manage Courses', icon: BookOpen, count: courses.length },
          { id: 'videos', label: 'Video Library', icon: Video, count: videos.length },
          { id: 'materials', label: 'Templates & Files', icon: Download, count: materials.length },
          { id: 'quizzes', label: 'Quiz & Exam Builder', icon: FileQuestion, count: quizzes.length },
          { id: 'users', label: 'Student Accounts', icon: Users, count: accounts.filter((a) => a.role === 'student').length },
          { id: 'announcements', label: 'Announcements', icon: Megaphone, count: notifications.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20 font-mono">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MANAGE COURSES & OUTLINE BUILDER */}
      {adminTab === 'courses' && (
        <div className="space-y-6">
          <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Create & Publish Course Module
            </h3>

            <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Payroll Bookkeeping & Tax"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="ACCT 104"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Description</label>
                <input
                  type="text"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="e.g. Learn how to process payroll and tax entries."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                  🖼️ Upload Course Cover / Background Image (Cloudinary Integrated)
                </label>
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2 text-xs shadow-2xs">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>{isCourseBgUploading ? 'Uploading Cover Image...' : 'Choose Cover Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCourseBgUpload}
                      className="hidden"
                    />
                  </label>
                  {courseBgImage && (
                    <div className="flex items-center gap-2">
                      <img
                        src={courseBgImage}
                        alt="Course Cover Preview"
                        className="w-16 h-10 rounded-xl object-cover border-2 border-indigo-300 shadow-sm"
                      />
                      <span className="text-[11px] text-emerald-600 font-bold">✓ Cover Image Loaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                >
                  Publish Course Module
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((crs) => (
              <div
                key={crs.id}
                className="card-theme p-5 rounded-2xl bg-white border border-slate-100 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {crs.code}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 mt-1.5">{crs.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{crs.description}</p>
                  </div>

                  <button
                    onClick={() => deleteCourse(crs.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {crs.topics ? crs.topics.length : 0} Topics • {crs.totalLessons || 0} Lessons
                  </span>

                  <button
                    onClick={() => setSelectedCourseForOutline(crs)}
                    className="px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition border border-indigo-200"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    Manage Outline, Videos & Files
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: VIDEO LIBRARY */}
      {adminTab === 'videos' && (
        <div className="space-y-6">
          <div className="card-theme p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Upload & Publish Educational Video
            </h3>

            <form onSubmit={handleAddVideo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="e.g. Understanding Debits and Credits"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Topic / Category</label>
                <select
                  value={vidTopic}
                  onChange={(e) => setVidTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="Basic Accounting Principles">Basic Accounting Principles</option>
                  <option value="Bookkeeping Cycle">Bookkeeping Cycle</option>
                  <option value="Trial Balance & Adjustments">Trial Balance & Adjustments</option>
                  <option value="Financial Statements">Financial Statements</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Duration (e.g. 15:00)</label>
                <input
                  type="text"
                  value={vidDuration}
                  onChange={(e) => setVidDuration(e.target.value)}
                  placeholder="15:00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Video URL (YouTube or Direct)</label>
                <input
                  type="text"
                  value={vidUrl}
                  onChange={(e) => {
                    setVidUrl(e.target.value);
                    if (e.target.value) setUploadedVideoName('');
                  }}
                  placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Or Choose Video File (.mp4, .webm)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isVidUploading}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
                />
                {videoFileWarning && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Large Video Alert ({uploadedVideoName})</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      {videoFileWarning}
                    </p>
                  </div>
                )}

                {uploadedVideoName && !isVidUploading && !videoFileWarning && (
                  <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">
                      {vidUrl.startsWith('http') ? 'Cloud CDN Video Ready' : 'Local Video Ready'}: {uploadedVideoName}
                    </span>
                  </div>
                )}
                {isVidUploading && (
                  <p className="text-[10px] text-indigo-600 mt-1 animate-pulse font-bold flex items-center gap-1">
                    <span>Uploading video to Cloudinary Cloud CDN... please wait</span>
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isVidUploading}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-white font-bold text-xs shadow-md transition ${
                    isVidUploading
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {isVidUploading ? 'Uploading Video... Please Wait' : 'Publish Video'}
                </button>
              </div>
            </form>
          </div>

          {/* Video List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Published Instructional Videos ({videos.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((vid) => (
                <div key={vid.id} className="card-theme p-4 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-50 text-[#0077b6] border border-cyan-200">
                        {vid.topic}
                      </span>
                      <button
                        onClick={() => deleteVideo(vid.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{vid.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{vid.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>{vid.duration}</span>
                    <span>{vid.viewsCount} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: TEMPLATES & PRACTICE FILES */}
      {adminTab === 'materials' && (
        <div className="space-y-6">
          <div className="card-theme p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Downloadable Accounting Template or Notes
            </h3>

            <form onSubmit={handleAddMaterial} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Template / Material Title</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g. General Journal Excel Workbook"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={matCategory}
                  onChange={(e) => setMatCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="Worksheets">Worksheets</option>
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Practice Exercises">Practice Exercises</option>
                  <option value="Financial Statements">Financial Statements</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">File Type</label>
                <select
                  value={matFileType}
                  onChange={(e) => setMatFileType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word (.docx)</option>
                  <option value="zip">ZIP Archive (.zip)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>

          {/* Materials List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Available Templates & Files ({materials.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((mat) => (
                <div key={mat.id} className="card-theme p-4 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {mat.fileType.toUpperCase()}
                      </span>
                      <button
                        onClick={() => deleteMaterial(mat.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{mat.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{mat.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>{mat.category}</span>
                    <span>{mat.downloadsCount} downloads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUIZ & EXAM BUILDER */}
      {adminTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-indigo-600" />
                Create & Publish Quiz / Exam
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {addedQuestions.length} Questions Added to Draft
              </span>
            </div>

            {/* Quiz General Settings */}
            <form onSubmit={handleCreateQuizSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Quiz / Exam Title</label>
                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g. Exam 1: Assets & Liabilities Assessment"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Topic</label>
                  <input
                    type="text"
                    value={quizTopicTitle}
                    onChange={(e) => setQuizTopicTitle(e.target.value)}
                    placeholder="e.g. Basic Accounting Principles"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Passing Grade (%)</label>
                    <input
                      type="number"
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={quizDuration}
                      onChange={(e) => setQuizDuration(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Add Question Sub-Form */}
              <div className="p-4.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <h4 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" /> Add Question to Quiz:
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Question Text</label>
                    <input
                      type="text"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      placeholder="e.g. What is the normal balance of an Asset account?"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={qOpt1}
                      onChange={(e) => setQOpt1(e.target.value)}
                      placeholder="Option 1 (e.g. Debit)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <input
                      type="text"
                      value={qOpt2}
                      onChange={(e) => setQOpt2(e.target.value)}
                      placeholder="Option 2 (e.g. Credit)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <input
                      type="text"
                      value={qOpt3}
                      onChange={(e) => setQOpt3(e.target.value)}
                      placeholder="Option 3 (Optional)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <input
                      type="text"
                      value={qOpt4}
                      onChange={(e) => setQOpt4(e.target.value)}
                      placeholder="Option 4 (Optional)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Select Correct Answer</label>
                      <select
                        value={qCorrectIdx}
                        onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                      >
                        <option value={0}>Option 1 is Correct</option>
                        <option value={1}>Option 2 is Correct</option>
                        <option value={2}>Option 3 is Correct</option>
                        <option value={3}>Option 4 is Correct</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Explanation (Feedback)</label>
                      <input
                        type="text"
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        placeholder="Why this choice is correct..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddQuestionToDraft}
                      className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                    >
                      + Add Question to Draft
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Questions List */}
              {addedQuestions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs">Questions in this Quiz Draft:</h5>
                  {addedQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-700">Q{idx + 1}. {q.question}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Correct Choice: <strong className="text-emerald-600">{q.options[q.correctAnswerIndex]}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddedQuestions((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20"
                >
                  Publish Quiz / Exam to Students
                </button>
              </div>
            </form>
          </div>

          {/* List of Published Quizzes */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-800">Published Quizzes & Assessments:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((qz) => (
                <div key={qz.id} className="card-theme p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Passing: {qz.passingScore}% • {qz.durationMinutes} Mins
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">{qz.title}</h4>
                    <p className="text-xs text-slate-500">{qz.questions.length} Multiple Choice Questions</p>
                  </div>

                  <button
                    onClick={() => alert('Quiz published and live for students!')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    Live
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: STUDENT ACCOUNTS MONITORING */}
      {adminTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white border border-slate-100 card-theme">
              <span className="text-xs font-bold text-slate-500">Enrolled Students</span>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {accounts.filter((a) => a.role === 'student').length}
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold">Active Learners</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-100 card-theme">
              <span className="text-xs font-bold text-slate-500">Quiz Submissions</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{submissions.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Recorded Exams</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-100 card-theme">
              <span className="text-xs font-bold text-slate-500">Average Class Score</span>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {submissions.length > 0
                  ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)
                  : 85}%
              </div>
              <span className="text-[11px] text-[#0077b6] font-semibold">Passing Standard: 75%</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-100 card-theme">
              <span className="text-xs font-bold text-slate-500">Total Courses</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{courses.length}</div>
              <span className="text-[11px] text-cyan-600 font-semibold">Curriculum Modules</span>
            </div>
          </div>

          <div className="card-theme p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Student Performance & Accounts Directory
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Student ID</th>
                    <th className="py-3 px-3">Program</th>
                    <th className="py-3 px-3">Lessons Done</th>
                    <th className="py-3 px-3">Avg Quiz Score</th>
                    <th className="py-3 px-3">Study Hours</th>
                    <th className="py-3 px-3">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts
                    .filter((acc) => acc.role === 'student')
                    .map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-800">{st.name}</div>
                              <div className="text-[10px] text-slate-400">{st.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-600">
                          {st.studentId}
                        </td>
                        <td className="py-3 px-3">{st.program}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-[#0077b6] font-bold">
                            {st.completedLessonsCount} lessons
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              st.averageQuizScore >= 75
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {st.averageQuizScore}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{st.studyHours} hrs</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <Flame className="w-3.5 h-3.5" />
                            {st.streakDays}d
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT BROADCAST TAB */}
      {adminTab === 'announcements' && (
        <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Broadcast Announcement / System Message
          </h3>

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Announcement Title</label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Schedule Update: Midterm Exam Date Announced"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Announcement Message</label>
              <textarea
                rows={4}
                required
                value={annMsg}
                onChange={(e) => setAnnMsg(e.target.value)}
                placeholder="Type your system announcement message to be delivered to all student mailboxes..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Broadcast Announcement to All Students
              </button>
            </div>
          </form>
        </div>
      )}

      {/* COURSE OUTLINE & LESSON BUILDER MODAL */}
      {selectedCourseForOutline && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 to-[#0077b6] text-white flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] sm:text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {selectedCourseForOutline.code}
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-white mt-1 truncate">
                  Course Outline: {selectedCourseForOutline.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedCourseForOutline(null)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
              {/* Add New Topic Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-600" /> Add New Topic / Unit to Outline
                </h4>
                <form onSubmit={handleAddTopic} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Topic Title</label>
                    <input
                      type="text"
                      required
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder="e.g. Topic 1: The Accounting Equation"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Topic Description</label>
                    <input
                      type="text"
                      value={newTopicDesc}
                      onChange={(e) => setNewTopicDesc(e.target.value)}
                      placeholder="Summary of what this unit covers"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                    >
                      + Add Topic
                    </button>
                  </div>
                </form>
              </div>

              {/* Topics & Lessons Tree List */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800">Current Course Modules & Topics:</h4>

                {selectedCourseForOutline.topics.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No topics created yet. Add a topic unit above to get started.
                  </p>
                ) : (
                  selectedCourseForOutline.topics.map((tpc, index) => (
                    <div
                      key={tpc.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">
                            Unit {index + 1}
                          </span>
                          <h5 className="text-base font-bold text-slate-800">{tpc.title}</h5>
                          <p className="text-xs text-slate-500">{tpc.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTopicForLesson(activeTopicForLesson === tpc.id ? null : tpc.id)}
                            className="px-3 py-1 rounded-full bg-blue-50 text-[#0077b6] hover:bg-blue-100 text-xs font-bold border border-blue-200 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Lesson, Video & Files
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(tpc.id)}
                            className="p-1 text-slate-400 hover:text-red-500"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Add Lesson Form with Text, Video, and File Attachments */}
                      {activeTopicForLesson === tpc.id && (
                        <form
                          onSubmit={(e) => handleAddLessonToTopic(tpc.id, e)}
                          className="p-4.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 text-xs animate-in fade-in"
                        >
                          <h6 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                            <BookOpen className="w-4 h-4 text-[#0077b6]" /> Add Lesson Content to &quot;{tpc.title}&quot;:
                          </h6>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Lesson Title</label>
                              <input
                                type="text"
                                required
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                                placeholder="e.g. Understanding Assets, Liabilities & Equity"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Duration</label>
                              <input
                                type="text"
                                value={lessonDuration}
                                onChange={(e) => setLessonDuration(e.target.value)}
                                placeholder="20 mins"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                              />
                            </div>

                            {/* 1. TEXT NOTES CONTENT */}
                            <div className="md:col-span-2">
                              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                                📝 Lecture Text & Study Notes (Markdown)
                              </label>
                              <textarea
                                rows={4}
                                value={lessonContent}
                                onChange={(e) => setLessonContent(e.target.value)}
                                placeholder="# Lesson Overview&#10;&#10;### 1. Key Principles&#10;Write detailed lecture notes, definitions, formulas, and bullet points here."
                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 font-mono text-xs"
                              />
                            </div>

                            {/* 2. VIDEO URL & VIDEO FILE UPLOAD */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-bold flex items-center gap-1">
                                📹 Attach Video (URL or File Upload)
                              </label>
                              <input
                                type="text"
                                value={lessonVideoUrl}
                                onChange={(e) => setLessonVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/embed/Q_6A1ieXgp4"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                              />
                              <div className="flex items-center gap-2 pt-1">
                                <label className="cursor-pointer px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Upload Video File</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleLessonVideoFileUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>

                            {/* 3. DOWNLOADABLE FILE ATTACHMENT */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-bold flex items-center gap-1">
                                📁 Attach Worksheet / File (PDF, Excel, Word)
                              </label>
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 w-full">
                                  <Paperclip className="w-4 h-4 text-emerald-600" />
                                  <span className="truncate">
                                    {lessonFileName ? lessonFileName : 'Choose PDF or Excel Worksheet'}
                                  </span>
                                  <input
                                    type="file"
                                    accept=".pdf,.xlsx,.docx,.zip"
                                    onChange={handleLessonFileUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              {lessonFileName && (
                                <p className="text-[10px] text-emerald-600 font-bold">
                                  ✓ Attached: {lessonFileName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-blue-200/60">
                            <button
                              type="button"
                              onClick={() => setActiveTopicForLesson(null)}
                              className="px-4 py-2 rounded-full bg-slate-200 text-slate-700 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 rounded-full bg-[#0077b6] text-white font-bold shadow-md shadow-blue-500/20"
                            >
                              Save Lesson & Attachments
                            </button>
                          </div>
                        </form>
                      )}

                      {/* List of Lessons */}
                      <div className="space-y-2 pt-1">
                        {tpc.lessons.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No lessons in this topic yet.</p>
                        ) : (
                          tpc.lessons.map((lsn) => (
                            <div
                              key={lsn.id}
                              className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-[#0077b6]" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{lsn.title}</span>
                                    <span className="text-[10px] text-slate-400">({lsn.duration})</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                    {lsn.videoUrl && (
                                      <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                                        <Video className="w-3 h-3" /> Video Attached
                                      </span>
                                    )}
                                    {lsn.downloadIds && lsn.downloadIds.length > 0 && (
                                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                        <Paperclip className="w-3 h-3" /> File Worksheet Attached
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteLesson(tpc.id, lsn.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-200/60"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCourseForOutline(null)}
                className="px-6 py-2 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Done Editing Course Content & Outline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
