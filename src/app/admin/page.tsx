'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Edit2,
  Edit3,
  Eye,
  FileQuestion,
  FileText,
  Flame,
  GraduationCap,
  ListOrdered,
  Megaphone,
  Paperclip,
  PlayCircle,
  Plus,
  PlusCircle,
  Radio,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  Video,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react';
import { useApp, isMockLiveSession } from '@/context/AppContext';
import { Course, DownloadableMaterial, Lesson, LiveSession, LiveSessionStatus, Quiz, QuizQuestion, Topic, UserAccount, UserProfile, VideoLesson } from '@/types';
import { uploadToCloudinary, uploadVideoWithAutoCompression } from '@/lib/cloudinary';
import { saveVideoBlob, deleteVideoBlob, generateVideoThumbnail } from '@/lib/videoStorage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    liveSessions,
    addCourse,
    updateCourse,
    updateCourseTopics,
    deleteCourse,
    addVideo,
    updateVideo,
    deleteVideo,
    addMaterial,
    deleteMaterial,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    broadcastAnnouncement,
    addLiveSession,
    updateLiveSession,
    deleteLiveSession,
    adminTab,
    setAdminTab
  } = useApp();

  // Course Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('ACCT 104');
  const [courseCategory, setCourseCategory] = useState<string>('Bookkeeping Cycle');
  const [courseLevel, setCourseLevel] = useState<string>('Beginner');
  const [courseInstructor, setCourseInstructor] = useState<string>(user.name ? `${user.name}, CPA` : 'Faculty Instructor, CPA');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseBgImage, setCourseBgImage] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600');
  const [isCourseBgUploading, setIsCourseBgUploading] = useState(false);
  const [courseSuccessMsg, setCourseSuccessMsg] = useState('');
  const [courseErrorMsg, setCourseErrorMsg] = useState('');

  // Course Edit Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseCategory, setEditCourseCategory] = useState('Bookkeeping Cycle');
  const [editCourseLevel, setEditCourseLevel] = useState('Beginner');
  const [editCourseInstructor, setEditCourseInstructor] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseBgImage, setEditCourseBgImage] = useState('');
  const [isEditCourseBgUploading, setIsEditCourseBgUploading] = useState(false);

  const handleCourseBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCourseErrorMsg('Please select a valid image file (.jpg, .png, .webp).');
      return;
    }
    setIsCourseBgUploading(true);
    setCourseErrorMsg('');
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

  const handleEditCourseBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    setIsEditCourseBgUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'image');
      setEditCourseBgImage(uploadedUrl);
    } catch (err) {
      console.warn('Edit Course BG upload fallback:', err);
      setEditCourseBgImage(URL.createObjectURL(file));
    } finally {
      setIsEditCourseBgUploading(false);
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
  const [lessonQuizId, setLessonQuizId] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonFileName, setLessonFileName] = useState('');
  const [lessonFileUrl, setLessonFileUrl] = useState('');

  // Quiz Builder State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizLessonId, setQuizLessonId] = useState('');
  const [quizTopicTitle, setQuizTopicTitle] = useState('Basic Accounting Principles');
  const [quizPassingScore, setQuizPassingScore] = useState(75);
  const [quizDuration, setQuizDuration] = useState(20);
  const [quizSuccessMsg, setQuizSuccessMsg] = useState('');
  const [quizErrorMsg, setQuizErrorMsg] = useState('');

  // Quiz Edit Modal State
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editQuizTitle, setEditQuizTitle] = useState('');
  const [editQuizCourseId, setEditQuizCourseId] = useState('');
  const [editQuizTopic, setEditQuizTopic] = useState('');
  const [editQuizPassingScore, setEditQuizPassingScore] = useState(75);
  const [editQuizDuration, setEditQuizDuration] = useState(20);
  const [editQuizQuestions, setEditQuizQuestions] = useState<QuizQuestion[]>([]);
  const [editQText, setEditQText] = useState('');
  const [editQOpt1, setEditQOpt1] = useState('');
  const [editQOpt2, setEditQOpt2] = useState('');
  const [editQOpt3, setEditQOpt3] = useState('');
  const [editQOpt4, setEditQOpt4] = useState('');
  const [editQCorrectIdx, setEditQCorrectIdx] = useState(0);
  const [editQExplanation, setEditQExplanation] = useState('');
  
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
  const [vidCourseId, setVidCourseId] = useState('');
  const [vidLessonId, setVidLessonId] = useState('');
  const [vidDuration, setVidDuration] = useState('15:00');
  const [vidUrl, setVidUrl] = useState('');
  const [vidUploadProgress, setVidUploadProgress] = useState(0);
  const [vidSuccessMsg, setVidSuccessMsg] = useState('');
  const [vidErrorMsg, setVidErrorMsg] = useState('');

  // Video Edit Modal State
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null);
  const [editVidTitle, setEditVidTitle] = useState('');
  const [editVidTopic, setEditVidTopic] = useState('Basic Accounting Principles');
  const [editVidCourseId, setEditVidCourseId] = useState('');
  const [editVidLessonId, setEditVidLessonId] = useState('');
  const [editVidDuration, setEditVidDuration] = useState('15:00');
  const [editVidUrl, setEditVidUrl] = useState('');
  const [editVidDesc, setEditVidDesc] = useState('');

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
  const [vidCompressionMsg, setVidCompressionMsg] = useState('');
  const [vidCompressionStats, setVidCompressionStats] = useState('');

  // Announcement State
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv|ogg)$/i.test(file.name);
    if (!isVideo) {
      setVidErrorMsg('Please select a valid video file (.mp4, .webm, .mov, etc.).');
      return;
    }

    setVidErrorMsg('');
    setUploadedVideoFile(file);
    setUploadedVideoName(file.name);
    setVidUploadProgress(10);
    setVidCompressionMsg('Analyzing video file...');
    setVidCompressionStats('');

    // Auto extract real thumbnail frame
    try {
      const thumb = await generateVideoThumbnail(file);
      setUploadedVideoThumb(thumb);
    } catch {
      // ignore
    }

    // Instantly create local stream so user has immediate preview
    const localStreamUrl = URL.createObjectURL(file);
    setVidUrl(localStreamUrl);

    setVideoFileWarning('');
    setIsVidUploading(true);

    try {
      const { url, compressionResult } = await uploadVideoWithAutoCompression(
        file,
        (pct, msg) => {
          setVidUploadProgress(pct);
          setVidCompressionMsg(msg);
        }
      );

      if (compressionResult.isCompressed) {
        setVidCompressionStats(
          `Compressed ${compressionResult.originalSizeMb.toFixed(1)}MB → ${compressionResult.compressedSizeMb.toFixed(1)}MB (${compressionResult.savingsPercent}% saved!)`
        );
        setUploadedVideoFile(compressionResult.file);
      }

      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        setVidUrl(url);
      }
    } catch (err) {
      console.warn('Cloudinary upload warning, using local stream:', err);
    } finally {
      setIsVidUploading(false);
      setVidUploadProgress(100);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVidErrorMsg('');
    setVidSuccessMsg('');

    if (isVidUploading) {
      setVidErrorMsg('Please wait for the video upload to finish before saving.');
      return;
    }
    if (!vidTitle.trim()) {
      setVidErrorMsg('Please enter a video title.');
      return;
    }
    if (!vidUrl.trim()) {
      setVidErrorMsg('Please upload a video file or provide a video URL.');
      return;
    }

    let embedUrl = vidUrl.trim();
    if (vidUrl.includes('youtube.com/watch?v=')) {
      const vidId = vidUrl.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    } else if (vidUrl.includes('youtu.be/')) {
      const vidId = vidUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    }

    const newV: VideoLesson = {
      id: `vid-${Date.now()}`,
      title: vidTitle.trim(),
      topic: vidTopic,
      duration: vidDuration || '15:00',
      videoUrl: embedUrl,
      thumbnailUrl:
        uploadedVideoThumb ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
      description: 'Instructional bookkeeping lecture prepared by ' + user.name,
      keyTakeaways: [`Key takeaway for ${vidTitle}`, 'Practical bookkeeping applications'],
      viewsCount: 0,
      courseId: vidCourseId || undefined,
      lessonId: vidLessonId || undefined,
      createdAt: new Date().toISOString()
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
    setVidCourseId('');
    setVidLessonId('');
    setVidUploadProgress(0);
    setVidSuccessMsg(`Video "${newV.title}" saved and published successfully!`);
    setTimeout(() => setVidSuccessMsg(''), 5000);
  };

  const openEditVideoModal = (vid: VideoLesson) => {
    setEditingVideo(vid);
    setEditVidTitle(vid.title);
    setEditVidTopic(vid.topic);
    setEditVidDuration(vid.duration);
    setEditVidUrl(vid.videoUrl);
    setEditVidDesc(vid.description);
    setEditVidCourseId(vid.courseId || '');
    setEditVidLessonId(vid.lessonId || '');
  };

  const handleSaveEditVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    if (!editVidTitle.trim()) {
      alert('Video title is required.');
      return;
    }

    let embedUrl = editVidUrl.trim();
    if (editVidUrl.includes('youtube.com/watch?v=')) {
      const vidId = editVidUrl.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    } else if (editVidUrl.includes('youtu.be/')) {
      const vidId = editVidUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    }

    const updated: VideoLesson = {
      ...editingVideo,
      title: editVidTitle.trim(),
      topic: editVidTopic,
      duration: editVidDuration || '15:00',
      videoUrl: embedUrl || editingVideo.videoUrl,
      description: editVidDesc.trim() || editingVideo.description,
      courseId: editVidCourseId || undefined,
      lessonId: editVidLessonId || undefined
    };

    updateVideo(updated);
    setEditingVideo(null);
    setVidSuccessMsg(`Video "${updated.title}" updated successfully!`);
    setTimeout(() => setVidSuccessMsg(''), 4000);
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
    setCourseErrorMsg('');
    setCourseSuccessMsg('');

    if (!courseTitle.trim()) {
      setCourseErrorMsg('Course title is required.');
      return;
    }

    const newCrs: Course = {
      id: `crs-${Date.now()}`,
      title: courseTitle.trim(),
      code: courseCode.trim() || 'ACCT 101',
      category: courseCategory as any,
      level: courseLevel as any,
      instructor: courseInstructor.trim() || `${user.name}, CPA`,
      thumbnail:
        courseBgImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      description: courseDesc.trim() || 'New bookkeeping learning module.',
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
              title: 'Introduction to ' + courseTitle.trim(),
              description: 'Lesson Overview',
              duration: '20 mins',
              isCompleted: false,
              contentMarkdown: '# Welcome to ' + courseTitle.trim() + '\n\nRead the lesson notes carefully.'
            }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    };

    addCourse(newCrs);
    setCourseTitle('');
    setCourseDesc('');
    setCourseSuccessMsg(`Course "${newCrs.title}" created and published successfully!`);
    setTimeout(() => setCourseSuccessMsg(''), 5000);
  };

  const openEditCourseModal = (crs: Course) => {
    setEditingCourse(crs);
    setEditCourseTitle(crs.title);
    setEditCourseCode(crs.code);
    setEditCourseCategory(crs.category);
    setEditCourseLevel(crs.level);
    setEditCourseInstructor(crs.instructor);
    setEditCourseDesc(crs.description);
    setEditCourseBgImage(crs.thumbnail);
  };

  const handleSaveEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!editCourseTitle.trim()) {
      alert('Course title is required.');
      return;
    }

    const updated: Course = {
      ...editingCourse,
      title: editCourseTitle.trim(),
      code: editCourseCode.trim() || 'ACCT 101',
      category: editCourseCategory as any,
      level: editCourseLevel as any,
      instructor: editCourseInstructor.trim() || editingCourse.instructor,
      description: editCourseDesc.trim() || editingCourse.description,
      thumbnail: editCourseBgImage || editingCourse.thumbnail
    };

    updateCourse(updated);
    setEditingCourse(null);
    setCourseSuccessMsg(`Course "${updated.title}" updated successfully!`);
    setTimeout(() => setCourseSuccessMsg(''), 4000);
  };

  // Add Question to Draft Quiz
  const handleAddQuestionToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qOpt1.trim() || !qOpt2.trim()) {
      alert('Please enter a question and at least two choices.');
      return;
    }

    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: qText.trim(),
      options: [qOpt1.trim(), qOpt2.trim(), qOpt3.trim() || 'Option 3', qOpt4.trim() || 'Option 4'],
      correctAnswerIndex: qCorrectIdx,
      explanation: qExplanation.trim() || 'Review the lesson notes for this topic.'
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
    setQuizErrorMsg('');
    setQuizSuccessMsg('');

    if (!quizTitle.trim()) {
      setQuizErrorMsg('Quiz title is required.');
      return;
    }
    if (addedQuestions.length === 0) {
      setQuizErrorMsg('Please add at least 1 question to the quiz before publishing.');
      return;
    }

    const newQuiz: Quiz = {
      id: `qz-${Date.now()}`,
      title: quizTitle.trim(),
      courseId: quizCourseId || undefined,
      lessonId: quizLessonId || `lsn-${Date.now()}`,
      topicTitle: quizTopicTitle.trim() || 'Basic Accounting Principles',
      passingScore: quizPassingScore,
      durationMinutes: quizDuration,
      questions: addedQuestions,
      createdAt: new Date().toISOString()
    };

    addQuiz(newQuiz);
    setQuizTitle('');
    setQuizCourseId('');
    setQuizLessonId('');
    setAddedQuestions([]);
    setQuizSuccessMsg(`Quiz "${newQuiz.title}" published successfully with ${newQuiz.questions.length} questions!`);
    setTimeout(() => setQuizSuccessMsg(''), 5000);
  };

  const openEditQuizModal = (qz: Quiz) => {
    setEditingQuiz(qz);
    setEditQuizTitle(qz.title);
    setEditQuizCourseId(qz.courseId || '');
    setEditQuizTopic(qz.topicTitle);
    setEditQuizPassingScore(qz.passingScore);
    setEditQuizDuration(qz.durationMinutes);
    setEditQuizQuestions([...qz.questions]);
    setEditQText('');
    setEditQOpt1('');
    setEditQOpt2('');
    setEditQOpt3('');
    setEditQOpt4('');
    setEditQCorrectIdx(0);
    setEditQExplanation('');
  };

  const handleAddQuestionToEditDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQText.trim() || !editQOpt1.trim() || !editQOpt2.trim()) {
      alert('Please enter a question and at least two choices.');
      return;
    }
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: editQText.trim(),
      options: [editQOpt1.trim(), editQOpt2.trim(), editQOpt3.trim() || 'Option 3', editQOpt4.trim() || 'Option 4'],
      correctAnswerIndex: editQCorrectIdx,
      explanation: editQExplanation.trim() || ''
    };
    setEditQuizQuestions((prev) => [...prev, newQ]);
    setEditQText('');
    setEditQOpt1('');
    setEditQOpt2('');
    setEditQOpt3('');
    setEditQOpt4('');
    setEditQExplanation('');
  };

  const handleSaveEditQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;
    if (!editQuizTitle.trim()) {
      alert('Quiz title is required.');
      return;
    }
    if (editQuizQuestions.length === 0) {
      alert('Quiz must have at least one question.');
      return;
    }

    const updated: Quiz = {
      ...editingQuiz,
      title: editQuizTitle.trim(),
      courseId: editQuizCourseId || undefined,
      topicTitle: editQuizTopic.trim() || editingQuiz.topicTitle,
      passingScore: editQuizPassingScore,
      durationMinutes: editQuizDuration,
      questions: editQuizQuestions
    };

    updateQuiz(updated);
    setEditingQuiz(null);
    setQuizSuccessMsg(`Quiz "${updated.title}" updated successfully!`);
    setTimeout(() => setQuizSuccessMsg(''), 4000);
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      deleteQuiz(id);
      setQuizSuccessMsg('Quiz deleted successfully.');
      setTimeout(() => setQuizSuccessMsg(''), 4000);
    }
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

  // Handle Video File Upload in Lesson Outline
  const handleLessonVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLessonVideoFile(file);
    try {
      const { url, compressionResult } = await uploadVideoWithAutoCompression(file);
      if (compressionResult.isCompressed) {
        setLessonVideoFile(compressionResult.file);
      }
      setLessonVideoUrl(url || URL.createObjectURL(file));
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
      quizId: lessonQuizId || undefined,
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
    setLessonQuizId('');
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
          { id: 'announcements', label: 'Announcements', icon: Megaphone, count: notifications.length },
          { id: 'live', label: 'Live Classes', icon: Radio, count: liveSessions.length }
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
          {courseSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{courseSuccessMsg}</span>
            </div>
          )}
          {courseErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{courseErrorMsg}</span>
            </div>
          )}

          <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Create & Publish Course Module
            </h3>

            <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Title *</label>
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
                <label className="block text-slate-700 font-semibold mb-1">Instructor Name</label>
                <input
                  type="text"
                  value={courseInstructor}
                  onChange={(e) => setCourseInstructor(e.target.value)}
                  placeholder="e.g. Prof. Maria Santos, CPA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Basic">Basic Bookkeeping</option>
                  <option value="Intermediate">Intermediate Accounting</option>
                  <option value="Advanced">Advanced Accounting</option>
                  <option value="Specialization">Specialization & Tax</option>
                  <option value="General">General Education</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Difficulty Level</label>
                <select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
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
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {crs.code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {crs.category}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {crs.level}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 leading-snug">{crs.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{crs.description}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Instructor: {crs.instructor || 'Staff Instructor'}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditCourseModal(crs)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Edit Course Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${crs.title}"?`)) {
                          deleteCourse(crs.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {crs.topics ? crs.topics.length : 0} Topics • {crs.totalLessons || 0} Lessons
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditCourseModal(crs)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedCourseForOutline(crs)}
                      className="px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition border border-indigo-200"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      Manage Outline & Content
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: VIDEO LIBRARY */}
      {adminTab === 'videos' && (
        <div className="space-y-6">
          {vidSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{vidSuccessMsg}</span>
            </div>
          )}
          {vidErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{vidErrorMsg}</span>
            </div>
          )}

          <div className="card-theme p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Upload & Publish Educational Video
            </h3>

            <form onSubmit={handleAddVideo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Video Title *</label>
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
                <label className="block text-slate-700 font-bold mb-1">Associate with Course</label>
                <select
                  value={vidCourseId}
                  onChange={(e) => {
                    setVidCourseId(e.target.value);
                    setVidLessonId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="">-- Standalone (No Course) --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code}: ` : ''}{c.title}
                    </option>
                  ))}
                </select>
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
                  <option value="Payroll & Taxation">Payroll & Taxation</option>
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

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-slate-700 font-bold mb-1">Or Choose Video File (.mp4, .webm, .mov)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isVidUploading}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
                />

                {vidUploadProgress > 0 && vidUploadProgress < 100 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-700">
                      <span>Uploading & processing video...</span>
                      <span>{vidUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${vidUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

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
                  <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-700">
                      <span className="truncate">{vidCompressionMsg || 'Uploading video to Cloud CDN...'}</span>
                      <span className="shrink-0">{vidUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${vidUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {vidCompressionStats && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{vidCompressionStats}</span>
                  </div>
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
              {videos.map((vid) => {
                const linkedCourse = courses.find((c) => c.id === vid.courseId);
                return (
                  <div key={vid.id} className="card-theme p-4 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-50 text-[#0077b6] border border-cyan-200">
                            {vid.topic}
                          </span>
                          {linkedCourse && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[140px]" title={linkedCourse.title}>
                              {linkedCourse.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditVideoModal(vid)}
                            className="text-slate-400 hover:text-indigo-600 p-1"
                            title="Edit video"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${vid.title}"?`)) {
                                deleteVideo(vid.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Delete video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{vid.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{vid.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <span>{vid.duration}</span>
                      <span>{vid.viewsCount} views</span>
                    </div>
                  </div>
                );
              })}
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
          {quizSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{quizSuccessMsg}</span>
            </div>
          )}
          {quizErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{quizErrorMsg}</span>
            </div>
          )}

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Quiz / Exam Title *</label>
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
                  <label className="block text-slate-700 font-bold mb-1">Associate with Course</label>
                  <select
                    value={quizCourseId}
                    onChange={(e) => {
                      setQuizCourseId(e.target.value);
                      const crs = courses.find((c) => c.id === e.target.value);
                      if (crs && crs.topics && crs.topics.length > 0 && !quizTopicTitle) {
                        setQuizTopicTitle(crs.topics[0].title);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">-- Standalone (No Course) --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `${c.code}: ` : ''}{c.title}
                      </option>
                    ))}
                  </select>
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

                <div className="grid grid-cols-2 gap-2 md:col-span-2">
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
                    <label className="block text-slate-700 font-semibold mb-1">Question Text *</label>
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
                      placeholder="Option 1 (e.g. Debit) *"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <input
                      type="text"
                      value={qOpt2}
                      onChange={(e) => setQOpt2(e.target.value)}
                      placeholder="Option 2 (e.g. Credit) *"
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
            <h4 className="text-sm font-black text-slate-800">Published Quizzes & Assessments: ({quizzes.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((qz) => {
                const linkedCourse = courses.find((c) => c.id === qz.courseId);
                return (
                  <div key={qz.id} className="card-theme p-4 rounded-2xl bg-white border border-slate-100 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Passing: {qz.passingScore}% • {qz.durationMinutes} Mins
                        </span>
                        {linkedCourse && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[130px]" title={linkedCourse.title}>
                            {linkedCourse.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{qz.title}</h4>
                      <p className="text-xs text-slate-500">{qz.questions.length} Multiple Choice Questions</p>
                      <p className="text-[11px] text-slate-400">Topic: {qz.topicTitle}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditQuizModal(qz)}
                        className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(qz.id)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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

                            {/* 4. ATTACH QUIZ / EXAM */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-bold flex items-center gap-1">
                                <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
                                🎯 Attach Quiz / Exam
                              </label>
                              <select
                                value={lessonQuizId}
                                onChange={(e) => setLessonQuizId(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                              >
                                <option value="">-- No Quiz Attached --</option>
                                {quizzes.map((q) => (
                                  <option key={q.id} value={q.id}>
                                    {q.title} ({q.questions.length} Qs, {q.passingScore}% pass)
                                  </option>
                                ))}
                              </select>
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
                          tpc.lessons.map((lsn) => {
                            const attachedQuiz = quizzes.find((q) => q.id === lsn.quizId);
                            return (
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
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
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
                                      {attachedQuiz && (
                                        <span className="text-purple-600 font-semibold flex items-center gap-0.5">
                                          <FileQuestion className="w-3 h-3" /> Quiz: {attachedQuiz.title}
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
                            );
                          })
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

      {/* TAB: LIVE CLASSES MANAGER */}
      {adminTab === 'live' && (
        <LiveClassesAdminPanel
          liveSessions={liveSessions.filter((s) => !isMockLiveSession(s))}
          courses={courses}
          accounts={accounts}
          user={user}
          addLiveSession={addLiveSession}
          updateLiveSession={updateLiveSession}
          deleteLiveSession={deleteLiveSession}
        />
      )}

      {/* MODAL 1: EDIT COURSE MODAL */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Edit Course: {editingCourse.title}
              </h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={editCourseTitle}
                    onChange={(e) => setEditCourseTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code</label>
                  <input
                    type="text"
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Instructor</label>
                  <input
                    type="text"
                    value={editCourseInstructor}
                    onChange={(e) => setEditCourseInstructor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={editCourseCategory}
                    onChange={(e) => setEditCourseCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Basic">Basic Bookkeeping</option>
                    <option value="Intermediate">Intermediate Accounting</option>
                    <option value="Advanced">Advanced Accounting</option>
                    <option value="Specialization">Specialization & Tax</option>
                    <option value="General">General Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty Level</label>
                  <select
                    value={editCourseLevel}
                    onChange={(e) => setEditCourseLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editCourseDesc}
                    onChange={(e) => setEditCourseDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Cover Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editCourseBgImage}
                      onChange={(e) => setEditCourseBgImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isEditCourseBgUploading ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditCourseBgUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {editCourseBgImage && (
                    <img
                      src={editCourseBgImage}
                      alt="Cover preview"
                      className="mt-2 w-20 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  Save Course Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Edit Video: {editingVideo.title}
              </h3>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVideo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Video Title *</label>
                <input
                  type="text"
                  required
                  value={editVidTitle}
                  onChange={(e) => setEditVidTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Associated Course</label>
                  <select
                    value={editVidCourseId}
                    onChange={(e) => setEditVidCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">-- Standalone (No Course) --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `${c.code}: ` : ''}{c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Topic / Category</label>
                  <select
                    value={editVidTopic}
                    onChange={(e) => setEditVidTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Basic Accounting Principles">Basic Accounting Principles</option>
                    <option value="Bookkeeping Cycle">Bookkeeping Cycle</option>
                    <option value="Trial Balance & Adjustments">Trial Balance & Adjustments</option>
                    <option value="Financial Statements">Financial Statements</option>
                    <option value="Payroll & Taxation">Payroll & Taxation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={editVidDuration}
                    onChange={(e) => setEditVidDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Video Stream URL</label>
                  <input
                    type="text"
                    value={editVidUrl}
                    onChange={(e) => setEditVidUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editVidDesc}
                  onChange={(e) => setEditVidDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  Save Video Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT QUIZ MODAL */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Edit Quiz: {editingQuiz.title}
              </h3>
              <button
                onClick={() => setEditingQuiz(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    required
                    value={editQuizTitle}
                    onChange={(e) => setEditQuizTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Associated Course</label>
                  <select
                    value={editQuizCourseId}
                    onChange={(e) => setEditQuizCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">-- Standalone (No Course) --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `${c.code}: ` : ''}{c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Topic</label>
                  <input
                    type="text"
                    value={editQuizTopic}
                    onChange={(e) => setEditQuizTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Passing Grade (%)</label>
                  <input
                    type="number"
                    value={editQuizPassingScore}
                    onChange={(e) => setEditQuizPassingScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editQuizDuration}
                    onChange={(e) => setEditQuizDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Questions List in Edit Modal */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Quiz Questions ({editQuizQuestions.length})</h4>
                </div>

                {editQuizQuestions.map((q: QuizQuestion, idx: number) => (
                  <div key={q.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-slate-800">Q{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        {q.options.map((opt: string, oIdx: number) => (
                          <span
                            key={oIdx}
                            className={`px-2 py-0.5 rounded ${
                              oIdx === q.correctAnswerIndex ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-white'
                            }`}
                          >
                            {opt} {oIdx === q.correctAnswerIndex ? '✓' : ''}
                          </span>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-[10px] text-slate-400 italic">Exp: {q.explanation}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditQuizQuestions((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Question Subform in Edit Modal */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <h5 className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" /> Add Another Question to this Quiz:
                </h5>

                <div>
                  <input
                    type="text"
                    value={editQText}
                    onChange={(e) => setEditQText(e.target.value)}
                    placeholder="Question text..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editQOpt1}
                    onChange={(e) => setEditQOpt1(e.target.value)}
                    placeholder="Option 1 *"
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                  <input
                    type="text"
                    value={editQOpt2}
                    onChange={(e) => setEditQOpt2(e.target.value)}
                    placeholder="Option 2 *"
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                  <input
                    type="text"
                    value={editQOpt3}
                    onChange={(e) => setEditQOpt3(e.target.value)}
                    placeholder="Option 3"
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                  <input
                    type="text"
                    value={editQOpt4}
                    onChange={(e) => setEditQOpt4(e.target.value)}
                    placeholder="Option 4"
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={editQCorrectIdx}
                    onChange={(e) => setEditQCorrectIdx(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  >
                    <option value={0}>Option 1 is Correct</option>
                    <option value={1}>Option 2 is Correct</option>
                    <option value={2}>Option 3 is Correct</option>
                    <option value={3}>Option 4 is Correct</option>
                  </select>
                  <input
                    type="text"
                    value={editQExplanation}
                    onChange={(e) => setEditQExplanation(e.target.value)}
                    placeholder="Explanation (optional)"
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddQuestionToEditDraft}
                    className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    + Add Question to Quiz
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  Save Quiz Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LIVE CLASSES ADMIN PANEL (Real Database Records & Students)
// ============================================================

function LiveClassesAdminPanel({
  liveSessions,
  courses,
  accounts,
  user,
  addLiveSession,
  updateLiveSession,
  deleteLiveSession
}: {
  liveSessions: LiveSession[];
  courses: Course[];
  accounts: UserAccount[];
  user: UserProfile;
  addLiveSession: (s: Omit<LiveSession, 'id' | 'createdAt' | 'attendeesCount'> & { id?: string }) => LiveSession;
  updateLiveSession: (id: string, u: Partial<LiveSession>) => void;
  deleteLiveSession: (id: string) => void;
}) {
  const router = useRouter();
  const [lsTitle, setLsTitle] = useState('');
  const [lsDesc, setLsDesc] = useState('');
  const [lsCourseId, setLsCourseId] = useState('');
  const [lsDuration, setLsDuration] = useState<40 | 60>(60); // 60 minutes default
  const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);

  // Real registered students from the system (zero mock data)
  const realStudents = accounts.filter((a) => a.role === 'student');

  const statusPill: Record<LiveSessionStatus, string> = {
    live: 'bg-red-500 text-white',
    scheduled: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-500'
  };

  const handleStartLiveClass = () => {
    if (!lsTitle.trim()) {
      alert('Please enter a session title');
      return;
    }

    const now = new Date();
    const duration = lsDuration === 40 ? 40 : 60;
    const startedAt = now.toISOString();
    const endAt = new Date(now.getTime() + duration * 60000).toISOString();
    const actualDate = now.toISOString().split('T')[0];
    const actualStartTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const actualEndTime = new Date(now.getTime() + duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const selectedCourse = courses.find((c) => c.id === lsCourseId);
    const generatedId = `ls-${Date.now()}`;
    const roomId = `bookkeep-it-${lsTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 35)}-${Date.now()}`;

    const created = addLiveSession({
      id: generatedId,
      title: lsTitle.trim(),
      description: lsDesc.trim() || '',
      courseId: lsCourseId || undefined,
      courseTitle: selectedCourse?.title,
      instructorName: user.name,
      instructorId: user.id,
      createdBy: user.id || user.email,
      date: actualDate,
      startTime: actualStartTime,
      endTime: actualEndTime,
      durationMinutes: duration,
      startedAt,
      endAt,
      meetingRoomId: roomId,
      status: 'live',
      participants: []
    });

    setLsTitle('');
    setLsDesc('');
    setLsCourseId('');
    setLsDuration(60);

    // Direct navigation straight into video meeting
    router.push(`/live/${created.id}`);
  };

  const handleStartNewSessionFromPrevious = (prevSession: LiveSession) => {
    const now = new Date();
    const duration = 60;
    const startedAt = now.toISOString();
    const endAt = new Date(now.getTime() + duration * 60000).toISOString();
    const actualDate = now.toISOString().split('T')[0];
    const actualStartTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const actualEndTime = new Date(now.getTime() + duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const newId = `ls-${Date.now()}`;
    const baseTitle = prevSession.title.replace(/\s*\(Part\s*\d+\)$/i, '');
    const newTitle = `${baseTitle} (Part 2)`;
    const newRoom = `bookkeep-it-${newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 35)}-${Date.now()}`;

    const created = addLiveSession({
      id: newId,
      title: newTitle,
      description: prevSession.description,
      courseId: prevSession.courseId,
      courseTitle: prevSession.courseTitle,
      instructorName: user.name,
      instructorId: user.id,
      createdBy: user.id || user.email,
      date: actualDate,
      startTime: actualStartTime,
      endTime: actualEndTime,
      durationMinutes: duration,
      startedAt,
      endAt,
      meetingRoomId: newRoom,
      status: 'live',
      participants: []
    });

    router.push(`/live/${created.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Create New Session */}
      <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            Start Live Class
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select duration and click Start. Authoritative start time and end time are automatically calculated.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleStartLiveClass(); }} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Session Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={lsTitle}
              onChange={(e) => setLsTitle(e.target.value)}
              placeholder="e.g. Trial Balance Adjustments – Live Review"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={lsDesc}
              onChange={(e) => setLsDesc(e.target.value)}
              placeholder="Brief agenda or discussion topics for this class..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6] resize-none text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Link to Course <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                value={lsCourseId}
                onChange={(e) => setLsCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
              >
                <option value="">-- Open to all students --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* SIMPLIFIED DURATION SELECTOR: ONLY 40m OR 60m */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Session Duration Choice <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLsDuration(60)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                    lsDuration === 60
                      ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">60 Minutes</span>
                  <span className={`text-[10px] ${lsDuration === 60 ? 'text-cyan-200' : 'text-slate-500'}`}>Default</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLsDuration(40)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                    lsDuration === 40
                      ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">40 Minutes</span>
                  <span className={`text-[10px] ${lsDuration === 40 ? 'text-cyan-200' : 'text-slate-500'}`}>Express</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              id="admin-start-instant-live-btn"
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition active:scale-95 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Start Live Class ({lsDuration} Minutes)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sessions List */}
      <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-base font-bold text-slate-800">
            All Live Sessions ({liveSessions.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Registered Students: <strong className="text-indigo-600">{realStudents.length}</strong>
          </span>
        </div>

        <div className="space-y-4">
          {liveSessions.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">
              No live sessions yet. Start your first live class above.
            </p>
          )}

          {liveSessions.map((session) => {
            const isRosterExpanded = expandedRosterId === session.id;
            const participantsCount = session.participants?.length ?? (session.attendeesCount ?? 0);

            return (
              <div
                key={session.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${statusPill[session.status]}`}>
                        {session.status === 'live' ? '🔴 Live Now' : session.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {session.durationMinutes} mins
                      </span>
                      {session.courseTitle && (
                        <span className="text-[10px] text-[#0077b6] font-bold">
                          {session.courseTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{session.title}</p>
                    <p className="text-xs text-slate-500">
                      {session.date} · {session.startTime}
                      {session.endTime ? ` – ${session.endTime}` : ''}
                      {session.status === 'completed' && session.endTime && (
                        <span className="ml-1 text-emerald-600 font-semibold">(Ended at {session.endTime})</span>
                      )}
                    </p>
                    {session.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{session.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* LIVE NOW: Enter Room OR End for All */}
                    {session.status === 'live' && (
                      <>
                        <button
                          id={`enter-room-btn-${session.id}`}
                          onClick={() => router.push(`/live/${session.id}`)}
                          className="px-3.5 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <Radio className="w-3 h-3" /> Enter Room
                        </button>
                        <button
                          id={`end-session-btn-${session.id}`}
                          onClick={() => {
                            const actualEnd = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            updateLiveSession(session.id, { status: 'completed', endTime: actualEnd, endedAt: new Date().toISOString() });
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> End for All
                        </button>
                      </>
                    )}

                    {/* COMPLETED: Permanent badge + Start New Session button */}
                    {session.status === 'completed' && (
                      <>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Session Completed
                        </span>
                        <button
                          onClick={() => handleStartNewSessionFromPrevious(session)}
                          className="px-3.5 py-1.5 rounded-full bg-[#0077b6] hover:bg-[#023e8a] text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Start New Session
                        </button>
                      </>
                    )}

                    {/* CANCELLED: Permanent badge */}
                    {session.status === 'cancelled' && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full border border-slate-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-slate-400" /> Cancelled
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      id={`delete-session-btn-${session.id}`}
                      onClick={() => {
                        if (confirm(`Delete "${session.title}"?`)) deleteLiveSession(session.id);
                      }}
                      className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Registered Students & Attendees Roster Drawer Toggle */}
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedRosterId(isRosterExpanded ? null : session.id)}
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold py-1 transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      Registered Students ({realStudents.length}) · Attended ({participantsCount})
                    </span>
                    {isRosterExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Room: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{session.meetingRoomId}</code>
                  </span>
                </div>

                {/* Expanded Students Roster */}
                {isRosterExpanded && (
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        Class Roster & Live Attendance
                      </p>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {participantsCount} of {realStudents.length} Joined
                      </span>
                    </div>

                    {realStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">
                        No registered students found in the database. When students register on BookKeep-It, they will automatically appear here.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                        {realStudents.map((student) => {
                          const participantRecord = session.participants?.find(
                            (p) => p.userId === student.id || p.userEmail?.toLowerCase() === student.email.toLowerCase() || p.userName === student.name
                          );
                          const hasJoined = Boolean(participantRecord);

                          return (
                            <div key={student.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-[11px] shrink-0">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{student.name}</p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {student.studentId || 'Student'} · {student.email}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {hasJoined ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Present
                                    {participantRecord?.joinedAt && (
                                      <span className="text-[9px] text-emerald-600 font-normal ml-0.5">
                                        ({new Date(participantRecord.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                    Enrolled · Not in room
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

