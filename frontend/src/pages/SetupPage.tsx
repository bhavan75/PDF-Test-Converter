import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useQuiz } from '../context/QuizContext.js';
import { Play, Filter, Clock, HelpCircle, AlignLeft, CheckSquare, Square, AlertCircle, ChevronLeft } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

interface SetupPageProps {
  pdfId: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ pdfId, onNavigate }) => {
  const { token } = useAuth();
  const { startQuiz } = useQuiz();

  const [pdfAnalysis, setPdfAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup form states
  const [questionCount, setQuestionCount] = useState(10);
  const [order, setOrder] = useState<'sequential' | 'random'>('random');
  const [timeLimit, setTimeLimit] = useState(15);
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [startingQuiz, setStartingQuiz] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/pdf/analysis/${pdfId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setPdfAnalysis(data);
          // Default: Select all topics
          setSelectedTopics(data.topics);
          // Default question count: Min of 20 or total questions
          setQuestionCount(Math.min(20, data.totalQuestions));
        } else {
          setError(data.error || 'Failed to load PDF details');
        }
      } catch (err) {
        console.error('Fetch PDF details error:', err);
        setError('Network failure loading PDF metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [pdfId, token]);

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleStart = async () => {
    if (!token) return;
    setError(null);
    setStartingQuiz(true);

    if (selectedTopics.length === 0) {
      setError('Please select at least one topic filter');
      setStartingQuiz(false);
      return;
    }

    try {
      await startQuiz(pdfId, token, {
        questionCount,
        order,
        timeLimit,
        mode,
        selectedTopics,
        selectedDifficulty: difficulty
      });
      onNavigate('exam');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize exam configuration');
    } finally {
      setStartingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></span>
        <p className="text-sm text-gray-500">Formulating exam blueprints...</p>
      </div>
    );
  }

  const maxQuestions = pdfAnalysis?.totalQuestions || 50;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12 space-y-6 animate-slide-up">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('upload')}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Upload
        </button>
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Configure Exam Room</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize your MCQ session bounds, rules, and question scopes.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Configurations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Form Column */}
        <div className="glass-container p-6 rounded-2xl space-y-5">
          {/* Question Count Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
              <label className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                Number of Questions
              </label>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{questionCount} / {maxQuestions}</span>
            </div>
            <input
              type="range"
              min="1"
              max={maxQuestions}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            {/* Presets */}
            <div className="flex gap-2">
              {[5, 10, 20, maxQuestions].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuestionCount(Math.min(preset, maxQuestions))}
                  className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    questionCount === Math.min(preset, maxQuestions)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-gray-200 dark:border-zinc-800 hover:border-indigo-500 hover:text-indigo-500'
                  }`}
                >
                  {preset === maxQuestions ? 'All' : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Sequential vs Random Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-indigo-500" />
              Question Selection Mode
            </label>
            <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800/80 p-1">
              <button
                type="button"
                onClick={() => setOrder('sequential')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  order === 'sequential'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sequential Order
              </button>
              <button
                type="button"
                onClick={() => setOrder('random')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  order === 'random'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Randomize Select
              </button>
            </div>
          </div>

          {/* Time Limit Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              Time Limit (Minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="300"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value, 10) || 15)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {/* Presets */}
            <div className="flex gap-2">
              {[15, 30, 60, 90].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTimeLimit(preset)}
                  className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    timeLimit === preset
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-gray-200 dark:border-zinc-800 hover:border-indigo-500 hover:text-indigo-500'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="glass-container p-6 rounded-2xl flex flex-col justify-between space-y-6">
          {/* Test Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Exam Rules Mode</label>
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => setMode('practice')}
                className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  mode === 'practice' 
                    ? 'border-indigo-500/70 bg-indigo-500/5' 
                    : 'border-gray-100 dark:border-zinc-800/80 hover:border-indigo-500/20'
                }`}
              >
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Practice Mode</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Ideal for studying. Show detailed explanations and correct answers immediately after clicking an option. No proctored boundaries.
                </p>
              </div>

              <div 
                onClick={() => setMode('exam')}
                className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  mode === 'exam' 
                    ? 'border-purple-500/70 bg-purple-500/5' 
                    : 'border-gray-100 dark:border-zinc-800/80 hover:border-purple-500/20'
                }`}
              >
                <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400">Exam Mode</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Mimic official exam centers. Timer enforces strict submission, questions are proctored, and results can be reviewed only at the end.
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty and Topic Filters */}
          <div className="space-y-4">
            {/* Difficulty select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs focus:outline-none"
              >
                <option value="Mixed">Mixed Difficulties (Recommended)</option>
                <option value="Easy">Easy questions only</option>
                <option value="Medium">Medium questions only</option>
                <option value="Hard">Hard questions only</option>
              </select>
            </div>

            {/* Topics checklist */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Topic Scope</label>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-1">
                {pdfAnalysis?.topics.map((topic: string, i: number) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-zinc-800 text-gray-400 hover:border-indigo-500/30'
                      }`}
                    >
                      {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={startingQuiz}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold text-base shadow-xl shadow-indigo-600/10 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
      >
        {startingQuiz ? (
          <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current" />
            <span>Launch Examination Portal</span>
          </>
        )}
      </button>
    </div>
  );
};
