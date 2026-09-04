'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileQuestion,
  Home,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
  XCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Quiz, QuizSubmission } from '@/types';

export default function QuizPage() {
  const { quizzes, submitQuiz, submissions } = useApp();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);

  // Live Timer State (in seconds)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);

  // Start Quiz Timer
  useEffect(() => {
    if (!activeQuiz || submissionResult) return;

    const totalSecs = (activeQuiz.durationMinutes || 15) * 60;
    setTimeLeftSeconds(totalSecs);

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, submissionResult]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleAutoSubmit = () => {
    if (!activeQuiz) return;
    const result = submitQuiz(activeQuiz.id, userAnswers);
    setSubmissionResult(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz) return;

    const result = submitQuiz(activeQuiz.id, userAnswers);
    setSubmissionResult(result);

    if (result.passed) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti exception:', e);
      }
    }
  };

  const resetQuizState = () => {
    setActiveQuiz(null);
    setUserAnswers({});
    setSubmissionResult(null);
    setTimeLeftSeconds(0);
  };

  const jumpToQuestion = (questionId: string) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const answeredCount = activeQuiz ? Object.keys(userAnswers).length : 0;
  const totalQuestionsCount = activeQuiz ? activeQuiz.questions.length : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <FileQuestion className="w-6 h-6 text-[#0077b6]" />
          Bookkeeping Quiz & Assessment Hub
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluate your understanding of debits, credits, trial balance, and financial statement calculations with immediate feedback.
        </p>
      </div>

      {/* FULLSCREEN QUIZ / EXAM RUNNER MODAL (PURE LIGHT WHITE THEME) */}
      {activeQuiz && (
        <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-slate-50 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          {/* Top Header Bar (White Theme with Timer in Top Right) */}
          <header className="bg-white border-b border-slate-200 px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 shadow-xs gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#00b4d8] text-white flex items-center justify-center font-black text-sm sm:text-base shadow-sm shrink-0">
                <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-[#0077b6] tracking-wider block truncate">
                  {activeQuiz.topicTitle}
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-md">{activeQuiz.title}</h2>
              </div>
            </div>

            {/* TOP RIGHT LIVE COUNTDOWN TIMER & CONTROLS */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {!submissionResult && (
                <div
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl border flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-xs sm:text-sm shadow-xs ${
                    timeLeftSeconds < 120
                      ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                      : 'bg-cyan-50 border-cyan-200 text-[#0077b6]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0077b6]" />
                  <span className="hidden sm:inline">Time Remaining:</span>
                  <span className="text-xs sm:text-base font-black">{formatTime(timeLeftSeconds)}</span>
                </div>
              )}

              <button
                onClick={resetQuizState}
                className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition"
                title="Exit Quiz"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </header>

          {/* Fullscreen Body Content (Stationary Non-Moving Cards) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 flex justify-center bg-slate-50">
            <div className="w-full max-w-3xl space-y-6">
              {submissionResult ? (
                /* GRADED RESULTS VIEW WITH RETURN TO DASHBOARD BUTTONS */
                <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6 text-center shadow-xl animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-cyan-50 border-2 border-[#00b4d8] flex items-center justify-center">
                    {submissionResult.passed ? (
                      <Sparkles className="w-10 h-10 text-[#0077b6]" />
                    ) : (
                      <AlertCircle className="w-10 h-10 text-amber-500" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                        submissionResult.passed
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}
                    >
                      {submissionResult.passed ? 'PASSED ASSESSMENT' : 'NEEDS REVIEW'}
                    </span>
                    <h3 className="text-4xl font-black text-slate-900">{submissionResult.score}%</h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      You answered{' '}
                      <span className="font-bold text-[#0077b6]">
                        {submissionResult.correctAnswersCount}
                      </span>{' '}
                      out of <span className="font-bold">{submissionResult.totalQuestions}</span> questions correctly.
                    </p>
                  </div>

                  {/* Answer Explanations List */}
                  <div className="text-left space-y-4 pt-6 border-t border-slate-100 max-h-80 overflow-y-auto pr-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detailed Answers & Explanations:
                    </h4>
                    {activeQuiz.questions.map((q, qIdx) => {
                      const selectedOpt = userAnswers[q.id];
                      const isCorrect = selectedOpt === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-2xl border ${
                            isCorrect
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-red-50/60 border-red-200'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <h5 className="text-xs font-bold text-slate-800 leading-tight">
                              {qIdx + 1}. {q.question}
                            </h5>
                          </div>

                          <p className="text-xs text-slate-600 pl-6 mb-2">
                            Your answer: <span className="font-semibold">{q.options[selectedOpt] || 'None'}</span>
                          </p>

                          <div className="pl-6 pt-2 border-t border-slate-200/60 text-xs text-emerald-800 font-medium">
                            💡 <span className="font-bold">Explanation:</span> {q.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ACTION BUTTONS: RETURN TO DASHBOARD & COURSES */}
                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setUserAnswers({});
                        setSubmissionResult(null);
                        const totalSecs = (activeQuiz.durationMinutes || 15) * 60;
                        setTimeLeftSeconds(totalSecs);
                      }}
                      className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Quiz
                    </button>

                    <Link
                      href="/"
                      onClick={resetQuizState}
                      className="px-6 py-2.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition"
                    >
                      <Home className="w-4 h-4" />
                      Return to Dashboard
                    </Link>

                    <Link
                      href="/courses"
                      onClick={resetQuizState}
                      className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 transition"
                    >
                      <BookOpen className="w-4 h-4" />
                      Back to Courses
                    </Link>
                  </div>
                </div>
              ) : (
                /* FULLSCREEN QUESTION RUNNER FORM (STATIONARY CARDS, NO HOVER MOVEMENT) */
                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                  {activeQuiz.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      id={`question-${q.id}`}
                      className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0077b6]">
                        <span className="w-6 h-6 rounded-full bg-cyan-100 text-[#0077b6] flex items-center justify-center text-xs font-black">
                          {qIdx + 1}
                        </span>
                        Question {qIdx + 1} of {activeQuiz.questions.length}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                        {q.question}
                      </h3>

                      <div className="space-y-3 pt-2">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userAnswers[q.id] === optIdx;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 text-xs font-medium ${
                                isSelected
                                  ? 'bg-blue-50 border-[#0077b6] text-[#0077b6] font-bold shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#0077b6] bg-[#0077b6]' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <span className="text-xs sm:text-sm">{option}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-black text-sm shadow-md shadow-cyan-500/20 transition"
                    >
                      Submit Exam Answers
                    </button>
                  </div>
                </form>
              )}
            </div>
          </main>

          {/* BOTTOM QUESTION PROGRESS GRID (ITEMS 1-N WITH SHADED ANSWERED INDICATORS) */}
          {!submissionResult && (
            <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#0077b6]" />
                <span>
                  Progress: <strong className="text-[#0077b6]">{answeredCount}</strong> of{' '}
                  <strong className="text-slate-900">{totalQuestionsCount}</strong> Answered
                </span>
              </div>

              {/* Numbered Item Grid (1 - 50) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                {activeQuiz.questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => jumpToQuestion(q.id)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold shrink-0 transition flex items-center justify-center ${
                        isAnswered
                          ? 'bg-[#0077b6] text-white shadow-xs font-black'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                      }`}
                      title={`Question ${idx + 1}: ${isAnswered ? 'Answered ✓' : 'Unanswered'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </footer>
          )}
        </div>
      )}

      {/* QUIZ LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const submission = submissions.find((s) => s.quizId === quiz.id);

          return (
            <div
              key={quiz.id}
              className="card-theme p-6 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between space-y-4 hover:border-[#00b4d8] transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#0077b6] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100">
                    {quiz.topicTitle}
                  </span>
                  {submission && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        submission.passed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {submission.score}% Score
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-[#0077b6] transition">
                  {quiz.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.questions.length} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.durationMinutes} mins
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Passing Score: <strong className="text-slate-700">{quiz.passingScore}%</strong>
                </span>

                <button
                  onClick={() => {
                    setActiveQuiz(quiz);
                    setUserAnswers({});
                    setSubmissionResult(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition"
                >
                  {submission ? 'Retake Exam' : 'Start Exam'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
