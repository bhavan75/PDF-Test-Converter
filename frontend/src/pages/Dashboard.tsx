import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Award, Clock, FileText, CheckCircle2, TrendingUp, ShieldAlert, Target, Sparkles, BookOpen, RefreshCw, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

interface DashboardProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

interface AnalyticsData {
  totalTests: number;
  averageScore: number;
  averageAccuracy: number;
  totalQuestionsAnswered: number;
  totalTimeSpent: number;
  topicPerformance: Array<{
    topic: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  difficultyPerformance: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  scoreTrend: Array<{
    attemptNumber: number;
    date: string;
    accuracy: number;
    score: number;
  }>;
  strongTopics: string[];
  weakTopics: string[];
}

interface AttemptHistory {
  id: string;
  pdfId: string;
  pdfName: string;
  totalQuestions: number;
  timeLimit: number;
  timeSpent: number;
  score: number;
  accuracy: number;
  mode: string;
  createdAt: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [history, setHistory] = useState<AttemptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Analytics
      const resAnal = await fetch(`${API_BASE_URL}/api/attempts/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataAnal = await resAnal.json();
      
      // 2. Fetch History
      const resHist = await fetch(`${API_BASE_URL}/api/attempts/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataHist = await resHist.json();

      if (resAnal.ok && resHist.ok) {
        setAnalytics(dataAnal);
        setHistory(dataHist);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></span>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading your EdTech Dashboard...</p>
      </div>
    );
  }

  // Ensure we have some default states
  const totalTests = analytics?.totalTests || 0;
  const avgAccuracy = analytics?.averageAccuracy || 0;
  const avgScore = analytics?.averageScore || 0;
  const timeSpentString = analytics ? formatTime(analytics.totalTimeSpent) : '0m';

  // Topic progress details
  const strongTopics = analytics?.strongTopics || [];
  const weakTopics = analytics?.weakTopics || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-12 animate-slide-up">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{user?.name}</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your strengths, review weak topics, and gauge your preparation levels.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Stats
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            Upload PDF Question Sheet
          </button>
        </div>
      </div>

      {totalTests === 0 ? (
        /* Empty Dashboard Experience */
        <div className="glass-container rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-indigo-500 mx-auto animate-float" />
          <h3 className="text-xl font-bold">Your Study Archive is Empty</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We need a MCQ practice test to generate statistics. Upload your first PDF to generate custom diagnostic dashboards!
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Upload PDF Now
          </button>
        </div>
      ) : (
        /* Fully Seeding active analytics */
        <>
          {/* Key Metrics Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-container p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tests Taken</p>
                <p className="text-2xl font-bold mt-0.5">{totalTests}</p>
              </div>
            </div>

            <div className="glass-container p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Accuracy</p>
                <p className="text-2xl font-bold mt-0.5">{avgAccuracy.toFixed(1)}%</p>
              </div>
            </div>

            <div className="glass-container p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Score</p>
                <p className="text-2xl font-bold mt-0.5">{avgScore.toFixed(1)}</p>
              </div>
            </div>

            <div className="glass-container p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Study Time</p>
                <p className="text-2xl font-bold mt-0.5">{timeSpentString}</p>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Score Trend SVG Line Chart */}
            <div className="glass-container p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Preparation Score Trend
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Accuracy percentage across your sequential attempts</p>
              </div>
              
              {/* Responsive SVG Line Plot */}
              <div className="w-full h-56 mt-6 relative">
                {analytics && analytics.scoreTrend && analytics.scoreTrend.length > 0 ? (
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(156,163,175,0.15)" strokeWidth="1" strokeDasharray="3" />
                    <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(156,163,175,0.15)" strokeWidth="1" strokeDasharray="3" />
                    <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(156,163,175,0.15)" strokeWidth="1" strokeDasharray="3" />
                    <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(156,163,175,0.15)" strokeWidth="1" />

                    {/* Generate graph coordinate paths */}
                    {(() => {
                      const trend = analytics.scoreTrend;
                      const points = trend.map((val, idx) => {
                        const x = 40 + (idx / Math.max(1, trend.length - 1)) * 440;
                        // Map accuracy (0-100) to y-axis (170 down to 20)
                        const y = 170 - (val.accuracy / 100) * 150;
                        return { x, y, label: val.accuracy, date: val.date };
                      });

                      const pathD = points.reduce((acc, p, idx) => {
                        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                      }, '');

                      // Gradient area fill
                      const fillD = points.length > 0 
                        ? `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`
                        : '';

                      return (
                        <>
                          <defs>
                            <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.25)" />
                              <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                            </linearGradient>
                          </defs>
                          
                          {/* Gradient Fill */}
                          {fillD && <path d={fillD} fill="url(#scoreGlow)" />}

                          {/* Line Path */}
                          {pathD && <path d={pathD} fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2.5" />}

                          {/* Data points */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4.5" fill="rgb(99, 102, 241)" stroke="white" strokeWidth="1.5" />
                              {/* Label text */}
                              <text x={p.x} y={p.y - 10} fill="currentColor" fontSize="8" fontWeight="semibold" textAnchor="middle" className="fill-gray-600 dark:fill-gray-300">
                                {p.label.toFixed(0)}%
                              </text>
                              {/* Date tag under graph */}
                              <text x={p.x} y="188" fill="currentColor" fontSize="8" fontWeight="medium" textAnchor="middle" className="fill-gray-400 dark:fill-zinc-500">
                                {p.date}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                    Not enough entries for trendline
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty Chart */}
            <div className="glass-container p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  Difficulty-wise Accuracy
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Performance index across easy vs hard questions</p>
              </div>

              {/* Custom SVG Bar Chart */}
              <div className="w-full h-48 mt-8">
                {analytics && analytics.difficultyPerformance ? (
                  <div className="h-full flex items-end justify-around pb-6 pt-4 px-2 relative">
                    {/* Grid lines */}
                    <div className="absolute left-0 right-0 top-4 border-t border-gray-100 dark:border-zinc-800/60"></div>
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-4 border-t border-gray-100 dark:border-zinc-800/60"></div>

                    {/* Easy Bar */}
                    <div className="flex flex-col items-center gap-2 z-10 w-1/4">
                      <span className="text-xs font-bold text-emerald-500">{analytics.difficultyPerformance.Easy}%</span>
                      <div 
                        className="w-8 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-md shadow-emerald-500/10"
                        style={{ height: `${Math.max(12, analytics.difficultyPerformance.Easy * 0.9)}px` }}
                      ></div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Easy</span>
                    </div>

                    {/* Medium Bar */}
                    <div className="flex flex-col items-center gap-2 z-10 w-1/4">
                      <span className="text-xs font-bold text-indigo-500">{analytics.difficultyPerformance.Medium}%</span>
                      <div 
                        className="w-8 rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-md shadow-indigo-500/10"
                        style={{ height: `${Math.max(12, analytics.difficultyPerformance.Medium * 0.9)}px` }}
                      ></div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Medium</span>
                    </div>

                    {/* Hard Bar */}
                    <div className="flex flex-col items-center gap-2 z-10 w-1/4">
                      <span className="text-xs font-bold text-purple-500">{analytics.difficultyPerformance.Hard}%</span>
                      <div 
                        className="w-8 rounded-t bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-1000 shadow-md shadow-purple-500/10"
                        style={{ height: `${Math.max(12, analytics.difficultyPerformance.Hard * 0.9)}px` }}
                      ></div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Hard</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No difficulty metadata found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Double Column for Strengths/Weaknesses and Historical list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Strengths, Weaknesses, and study recommendations */}
            <div className="glass-container p-6 rounded-2xl flex flex-col justify-between h-full space-y-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-float" />
                  Study Analytics & Advisor
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automated recommendations based on test accuracy</p>
              </div>

              {/* Strengths and Weaknesses tags */}
              <div className="space-y-4">
                {/* Strengths */}
                {strongTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Strong Topics (≥75% Accuracy)</span>
                    <div className="flex flex-wrap gap-2">
                      {strongTopics.map((topic, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {weakTopics.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Weak Topics (&lt;60% Accuracy)</span>
                    <div className="flex flex-wrap gap-2">
                      {weakTopics.map((topic, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/10">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic study suggestions card */}
              <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-xs space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full blur-md"></div>
                <h4 className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <ShieldAlert className="w-4 h-4" />
                  Study Advisor Recommendations
                </h4>
                <p className="text-gray-600 dark:text-zinc-300 leading-relaxed">
                  {weakTopics.length > 0 ? (
                    <>
                      You are struggling in <span className="font-bold text-orange-500">{weakTopics.join(' and ')}</span>. 
                      Take a quick 10-question sequential test on these topics in <strong>Practice Mode</strong> to review answers and explanations after each question!
                    </>
                  ) : (
                    <>
                      Amazing work! You show excellent balanced proficiency across all processed PDF topics. 
                      Try challenging yourself with a randomized <strong>Exam Mode</strong> test focusing purely on <strong>Hard difficulty</strong> questions!
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Recent History table list */}
            <div className="glass-container p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Recent Quiz Attempts
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your recently submitted mock exams</p>
              </div>

              {/* History List */}
              <div className="mt-4 divide-y divide-gray-100 dark:divide-zinc-800/80 max-h-[300px] overflow-y-auto pr-1">
                {history.map((attempt) => (
                  <div key={attempt.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-zinc-800/20 px-1 rounded-lg transition-colors duration-150">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">{attempt.pdfName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
                        <span>{new Date(attempt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="uppercase">{attempt.mode}</span>
                        <span>•</span>
                        <span>{formatTime(attempt.timeSpent)} spent</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {attempt.score}/{attempt.totalQuestions}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold">{attempt.accuracy.toFixed(0)}% Accuracy</p>
                      </div>
                      
                      <button
                        onClick={() => onNavigate('results', { attemptId: attempt.id })}
                        className="p-1.5 rounded-md hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-400 transition-colors cursor-pointer"
                        title="Review Detailed Metrics"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
