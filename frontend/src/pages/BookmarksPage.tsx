import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Bookmark, FileText, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

export const BookmarksPage: React.FC = () => {
  const { token } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<Record<string, boolean>>({});

  const fetchBookmarks = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarks(data);
      }
    } catch (err) {
      console.error('Fetch bookmarks error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [token]);

  const handleRemove = async (qId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ questionId: qId })
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== qId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (qId: string) => {
    setExpandedCard((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></span>
        <p className="text-sm text-gray-500">Unfolding your study notebook...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Your Bookmark Hub</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review, analyze, and study MCQ questions you flagged during your mock practice runs.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="glass-container rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto animate-float" />
          <h3 className="text-lg font-bold">No Bookmarked Questions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Click the bookmark button during active examinations to flag complex questions for separate reviews!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => {
            const isExpanded = expandedCard[bookmark.id];
            
            return (
              <div 
                key={bookmark.id}
                className="glass-container rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 transition-all duration-300"
              >
                {/* Header info */}
                <div 
                  onClick={() => toggleExpand(bookmark.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/20 dark:hover:bg-zinc-800/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                      <Bookmark className="w-5 h-5 fill-current" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-lg">{bookmark.text}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[120px]">{bookmark.pdfName}</span>
                        <span>•</span>
                        <span>{bookmark.topic}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(bookmark.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Unbookmark Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Question expansions */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-zinc-800/60 space-y-4 animate-slide-up">
                    <p className="text-sm font-semibold leading-relaxed">{bookmark.text}</p>

                    {/* MCQ Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const isCorrect = key.toUpperCase() === bookmark.correctAnswer.toUpperCase();
                        let optClass = 'border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20';
                        
                        if (isCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
                        }

                        return (
                          <div 
                            key={key} 
                            className={`p-3 rounded-lg border-2 flex items-center gap-2.5 ${optClass}`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                              isCorrect 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-800'
                            }`}>
                              {key}
                            </span>
                            <span>{bookmark[`option${key}`]}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 text-[11px] font-semibold leading-relaxed space-y-1">
                      <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Explanation Solution
                      </h4>
                      <p className="text-gray-600 dark:text-zinc-300">
                        {bookmark.explanation || 'No explanation provided for this question.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
