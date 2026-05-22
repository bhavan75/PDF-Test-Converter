import React, { useEffect, useState } from 'react';
import { useQuiz } from '../context/QuizContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Clock, ShieldAlert, Maximize2, Minimize2, Bookmark, Flag, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';

interface ExamPageProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({ onNavigate }) => {
  const { token } = useAuth();
  const {
    questions,
    currentQuestionIndex,
    answers,
    markedForReview,
    timeRemaining,
    selectAnswer,
    toggleMarkForReview,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    submitQuiz,
    config,
  } = useQuiz();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [showFullscreenNotice, setShowFullscreenNotice] = useState(false);

  const activeQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Fetch bookmarks on load to show bookmark status
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/bookmarks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookmarkedQuestions(data.map((b: any) => b.id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookmarks();
  }, [token]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const full = !!document.fullscreenElement;
      setIsFullscreen(full);
      
      // Emit warning if exiting fullscreen during Exam Mode
      if (!full && config?.mode === 'exam') {
        setShowFullscreenNotice(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [config]);

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Failed to toggle fullscreen:', err);
    }
  };

  const handleToggleBookmark = async (qId: string) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/bookmarks/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ questionId: qId })
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarkedQuestions((prev) =>
          data.bookmarked ? [...prev, qId] : prev.filter((id) => id !== qId)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAttempt = async () => {
    setSubmitting(true);
    try {
      const attemptId = await submitQuiz();
      onNavigate('results', { attemptId });
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeQuestion) return null;

  const currentAnswerDetail = answers[activeQuestion.id];
  const selectedOption = currentAnswerDetail?.selected;
  
  // Stats calculations for progress header
  const answeredCount = Object.values(answers).filter((a) => a.selected).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  const isBookmarked = bookmarkedQuestions.includes(activeQuestion.id);
  const isMarkedReview = markedForReview.includes(activeQuestion.id);

  // Timer alert thresholds
  const isTimeCritical = timeRemaining < 60;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 animate-slide-up">
      {/* Proctored Warning banners */}
      {showFullscreenNotice && config?.mode === 'exam' && (
        <div className="mb-4 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-4 animate-pulse-glow pro-alert-glow">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-bold">
              Warning: Exiting proctored fullscreen mode may invalidate your current attempt record. Re-enter immediately!
            </span>
          </div>
          <button
            onClick={handleToggleFullscreen}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
          >
            Re-Lock Screen
          </button>
        </div>
      )}

      {/* Main Exam Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Persistent Side Navigation Grid */}
        <div className="glass-container p-5 rounded-2xl lg:col-span-1 h-fit flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam Progress</h3>
            
            {/* Progress details */}
            <div className="flex justify-between text-xs font-semibold mt-2.5">
              <span>Answered: {answeredCount} / {totalQuestions}</span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            
            <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            </div>

            {/* Grid checklist */}
            <div className="grid grid-cols-5 gap-2 mt-6 max-h-[250px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAns = !!answers[q.id]?.selected;
                const isReview = markedForReview.includes(q.id);

                let dotClass = 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-transparent';
                if (isAns) dotClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
                if (isReview) dotClass = 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
                if (isCurrent) dotClass += ' ring-2 ring-indigo-500 dark:ring-indigo-400 font-extrabold scale-105';

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${dotClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Guides */}
          <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/10 border border-amber-500/30"></span>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-zinc-800"></span>
              <span>Unvisited</span>
            </div>
          </div>
        </div>

        {/* Main assessment sheet */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Header controls row */}
          <div className="glass-container p-4 rounded-2xl flex items-center justify-between gap-4">
            {/* Mode Banner */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                config?.mode === 'practice'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/10'
              }`}>
                {config?.mode} Mode
              </span>
            </div>

            {/* Timer digits */}
            <div className={`flex items-center gap-2 text-base font-extrabold px-3 py-1.5 rounded-xl transition-all duration-300 border ${
              isTimeCritical
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 animate-pulse pro-alert-glow'
                : 'bg-gray-50/50 dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800'
            }`}>
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'animate-bounce' : ''}`} />
              <span>{formatTime(timeRemaining)}</span>
            </div>

            {/* Fullscreen controller */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-all duration-200 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Core Question Card */}
          <div className="glass-container p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">[{activeQuestion.topic}]</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                activeQuestion.difficulty === 'Easy' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : activeQuestion.difficulty === 'Medium' 
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
              }`}>
                {activeQuestion.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <p className="text-base md:text-lg font-bold leading-relaxed">{activeQuestion.text}</p>

            {/* Options List */}
            <div className="flex flex-col gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const optText = activeQuestion[`option${key}`];
                const isSelected = selectedOption === key;

                // Practice mode variables
                const isPractice = config?.mode === 'practice';
                const isCorrect = key.toUpperCase() === activeQuestion.correctAnswer.toUpperCase();
                
                let optBorderClass = 'border-gray-200 dark:border-zinc-800 hover:border-indigo-500/40 hover:bg-indigo-500/2';
                let checkBadge = null;

                if (isSelected) {
                  optBorderClass = 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500';
                }

                if (isPractice && selectedOption) {
                  // Reveal answers in practice mode
                  if (isCorrect) {
                    optBorderClass = 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500';
                    checkBadge = <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✔</span>;
                  } else if (isSelected) {
                    optBorderClass = 'border-red-500 bg-red-500/5 ring-1 ring-red-500';
                    checkBadge = <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">✘</span>;
                  }
                }

                return (
                  <button
                    key={key}
                    disabled={isPractice && !!selectedOption} // lock selection once submitted in practice
                    onClick={() => selectAnswer(activeQuestion.id, key)}
                    className={`p-4 rounded-xl border-2 text-left text-sm font-semibold transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer ${optBorderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-extrabold border ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-800'
                      }`}>
                        {key}
                      </span>
                      <span>{optText}</span>
                    </div>
                    {checkBadge}
                  </button>
                );
              })}
            </div>

            {/* Practice mode explanation box */}
            {config?.mode === 'practice' && selectedOption && (
              <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 space-y-1.5 animate-slide-up text-xs">
                <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Detailed Assessment Solution
                </h4>
                <p className="text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {activeQuestion.explanation || 'No explanation provided for this question.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {/* Mark for review */}
              <button
                onClick={() => toggleMarkForReview(activeQuestion.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isMarkedReview
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'border-gray-200 dark:border-zinc-800 text-gray-500 hover:border-amber-500/20'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span>{isMarkedReview ? 'Flagged' : 'Flag Review'}</span>
              </button>

              {/* Bookmark toggler */}
              <button
                onClick={() => handleToggleBookmark(activeQuestion.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isBookmarked
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-zinc-800 text-gray-500 hover:border-indigo-500/20'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            </div>

            {/* Previous, next, submit */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={prevQuestion}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={() => setShowExitWarning(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white text-sm font-bold shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {submitting ? 'Grades compiling...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="w-full max-w-sm glass-container p-6 rounded-2xl text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-extrabold">Finalize Assessment?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              You are about to close this exam room. We will calculate your metrics, accuracies, and detailed topic advisor charts immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                onClick={() => {
                  setShowExitWarning(false);
                  handleSubmitAttempt();
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
