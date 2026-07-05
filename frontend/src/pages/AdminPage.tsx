import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { API_BASE_URL } from '../config.js';
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  ChevronRight, 
  Filter, 
  ArrowLeft, 
  Save, 
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

interface PdfItem {
  id: string;
  filename: string;
  filepath: string;
  status: string;
  totalQuestions: number;
  topics: string; // Comma-separated
  createdAt: string;
  _count?: {
    questions: number;
  };
}

interface QuestionItem {
  id: string;
  pdfId: string;
  questionNumber: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  topic: string;
  difficulty: string;
  isApproved: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { token, isAdmin } = useAuth();
  
  // State
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<PdfItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters and Search for questions
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [approvalFilter, setApprovalFilter] = useState<string>('All');

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editForm, setEditForm] = useState<{
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    topic: string;
    difficulty: string;
    explanation: string;
    isApproved: boolean;
  }>({
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    topic: '',
    difficulty: 'Medium',
    explanation: '',
    isApproved: true
  });

  const [savingEdit, setSavingEdit] = useState(false);

  // Load initial PDF uploads list
  const fetchPdfs = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pdfs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPdfs(data);
      } else {
        setErrorMessage(data.error || 'Failed to fetch uploaded PDFs');
      }
    } catch (err) {
      console.error('Fetch PDFs error:', err);
      setErrorMessage('Network error fetching uploads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPdfs();
    }
  }, [token, isAdmin]);

  // Load questions for specific PDF
  const handleSelectPdf = async (pdf: PdfItem) => {
    setSelectedPdf(pdf);
    setQuestionsLoading(true);
    setErrorMessage(null);
    setSearchQuery('');
    setDifficultyFilter('All');
    setTopicFilter('All');
    setApprovalFilter('All');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pdfs/${pdf.id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data);
      } else {
        setErrorMessage(data.error || 'Failed to load PDF questions');
      }
    } catch (err) {
      console.error('Fetch PDF questions error:', err);
      setErrorMessage('Network error loading questions.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Toggle Single Question Approval State
  const handleToggleApprove = async (q: QuestionItem) => {
    try {
      const newStatus = !q.isApproved;
      const res = await fetch(`${API_BASE_URL}/api/admin/questions/${q.id}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isApproved: newStatus })
      });
      
      const data = await res.json();
      if (res.ok) {
        setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, isApproved: newStatus } : item));
        showSuccess(`Question #${q.questionNumber} approval toggled.`);
      } else {
        setErrorMessage(data.error || 'Failed to toggle approval');
      }
    } catch (err) {
      console.error('Approve toggle error:', err);
      setErrorMessage('Error toggling approval.');
    }
  };

  // Delete Single Question
  const handleDeleteQuestion = async (questionId: string, questionNum: number) => {
    if (!window.confirm(`Are you sure you want to delete question #${questionNum}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        setQuestions(prev => prev.filter(item => item.id !== questionId));
        showSuccess(`Question #${questionNum} deleted successfully.`);
      } else {
        setErrorMessage(data.error || 'Failed to delete question');
      }
    } catch (err) {
      console.error('Delete question error:', err);
      setErrorMessage('Error deleting question.');
    }
  };

  // Delete PDF completely
  const handleDeletePdf = async (pdfId: string, filename: string) => {
    if (!window.confirm(`DANGER: Are you sure you want to delete the PDF "${filename}"?\n\nThis will cascade delete all extracted questions and historical test attempts for this PDF!`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pdfs/${pdfId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        setPdfs(prev => prev.filter(item => item.id !== pdfId));
        if (selectedPdf?.id === pdfId) {
          setSelectedPdf(null);
          setQuestions([]);
        }
        showSuccess('PDF upload and cascade questions deleted.');
      } else {
        setErrorMessage(data.error || 'Failed to delete PDF');
      }
    } catch (err) {
      console.error('Delete PDF error:', err);
      setErrorMessage('Error deleting PDF.');
    }
  };

  // Open Edit Dialog Modal
  const openEditModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditForm({
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      isApproved: q.isApproved
    });
  };

  // Submit Edited Question Details
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !token) return;

    setSavingEdit(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (res.ok) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...editForm } : q));
        setEditingQuestion(null);
        showSuccess(`Question #${editingQuestion.questionNumber} updated successfully!`);
      } else {
        setErrorMessage(data.error || 'Failed to save question edits');
      }
    } catch (err) {
      console.error('Save question edit error:', err);
      setErrorMessage('Error saving question details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Extract unique topics among active questions for filters
  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic))).filter(Boolean);

  // Filtered list of questions based on search query and criteria
  const filteredQuestions = questions.filter(q => {
    const textMatches = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        q.optionA.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        q.optionB.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        q.optionC.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        q.optionD.toLowerCase().includes(searchQuery.toLowerCase());
                        
    const difficultyMatches = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    const topicMatches = topicFilter === 'All' || q.topic === topicFilter;
    const approvalMatches = approvalFilter === 'All' || 
                            (approvalFilter === 'Approved' && q.isApproved) || 
                            (approvalFilter === 'Pending' && !q.isApproved);

    return textMatches && difficultyMatches && topicMatches && approvalMatches;
  });

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-black">Access Denied</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This portal is restricted to system administrators. Please sign in with administrative privileges to manage PDF resources.
        </p>
        <button 
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          Return to Student Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-6 animate-slide-up">
      {/* Toast Alert Banners */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500 text-white shadow-xl text-xs font-bold animate-slide-up">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500 text-white shadow-xl text-xs font-bold animate-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Admin Control Panel</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Audit extracted MCQs, adjust answers, verify solutions, and manage document resources.
          </p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Student Dashboard
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <span className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></span>
          <p className="text-xs text-gray-400 font-semibold">Loading system registry...</p>
        </div>
      ) : !selectedPdf ? (
        /* 1. PDF Grid List Layout */
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Processed Question Sheets ({pdfs.length})</h3>
          
          {pdfs.length === 0 ? (
            <div className="glass-container rounded-2xl p-10 text-center max-w-md mx-auto space-y-4">
              <FileText className="w-12 h-12 text-zinc-400 mx-auto" />
              <h4 className="font-bold">No Uploaded Sheets Registered</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When students or instructors upload examination papers, they will appear here for administrative inspection and curation.
              </p>
              <button
                onClick={() => onNavigate('upload')}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
              >
                Upload First PDF
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfs.map((pdf) => {
                const topicList = pdf.topics ? pdf.topics.split(',') : [];
                return (
                  <div key={pdf.id} className="glass-container p-5 rounded-2xl hover:border-indigo-500/35 transition-all duration-300 flex flex-col justify-between h-52 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full"></div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-500" />
                          <h4 className="font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{pdf.filename}</h4>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePdf(pdf.id, pdf.filename);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 z-10"
                          title="Purge PDF & Cascade questions"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <span>Extracted Questions: <strong className="text-indigo-500 text-xs">{pdf.totalQuestions || pdf._count?.questions || 0}</strong></span>
                        <span>•</span>
                        <span>{new Date(pdf.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Display Topics tags */}
                      {topicList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-16 overflow-y-auto scrollbar-none">
                          {topicList.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 text-[9px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/20">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectPdf(pdf)}
                      className="w-full mt-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Audit MCQ Registry</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 2. Questions Audit Table / List for the selected PDF */
        <div className="space-y-6">
          {/* Breadcrumb / Top control bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedPdf(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/60 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                title="Go back to PDF list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Auditing Document</span>
                <h3 className="text-lg font-bold truncate max-w-sm sm:max-w-md">{selectedPdf.filename}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-zinc-200/10">
                Total Loaded: <strong className="text-indigo-500">{questions.length}</strong>
              </span>
              <button
                onClick={() => handleDeletePdf(selectedPdf.id, selectedPdf.filename)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Sheet
              </button>
            </div>
          </div>

          {/* Filtering and search console */}
          <div className="glass-container p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            {/* Search inputs */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search question content or options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Filter Topic dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:outline-none text-xs focus:border-indigo-500"
              >
                <option value="All" className="dark:bg-zinc-900">All Topics</option>
                {uniqueTopics.map((t, idx) => (
                  <option key={idx} value={t} className="dark:bg-zinc-900">{t}</option>
                ))}
              </select>
            </div>

            {/* Filter Difficulty */}
            <div className="flex items-center gap-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:outline-none text-xs focus:border-indigo-500"
              >
                <option value="All" className="dark:bg-zinc-900">All Difficulty</option>
                <option value="Easy" className="dark:bg-zinc-900">Easy</option>
                <option value="Medium" className="dark:bg-zinc-900">Medium</option>
                <option value="Hard" className="dark:bg-zinc-900">Hard</option>
              </select>
            </div>

            {/* Approval Status Filter */}
            <div className="flex items-center gap-2 text-xs">
              <ThumbsUp className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:outline-none text-xs focus:border-indigo-500"
              >
                <option value="All" className="dark:bg-zinc-900">All Approvals</option>
                <option value="Approved" className="dark:bg-zinc-900">Approved Only</option>
                <option value="Pending" className="dark:bg-zinc-900">Pending Review</option>
              </select>
            </div>
          </div>

          {/* Audit Results list table */}
          {questionsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></span>
              <p className="text-xs text-gray-400">Streaming question matrices...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800/80 text-center text-xs text-gray-400">
              No questions matching the filter criteria found in this archive. Try clearing your search parameters.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Filtered Results ({filteredQuestions.length})</span>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <div 
                    key={q.id} 
                    className={`glass-container rounded-2xl p-5 border transition-all duration-300 ${
                      !q.isApproved 
                        ? 'border-orange-500/20 bg-orange-500/1' 
                        : 'hover:border-indigo-500/20'
                    }`}
                  >
                    {/* Top line header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800/80 pb-3 mb-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500 font-bold">
                          MCQ #{q.questionNumber}
                        </span>
                        
                        {/* Topic Tag */}
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-semibold text-gray-500 dark:text-zinc-400 text-[10px]">
                          {q.topic}
                        </span>

                        {/* Difficulty Tag */}
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          q.difficulty === 'Easy' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : q.difficulty === 'Medium' 
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Approve Switch */}
                        <button
                          onClick={() => handleToggleApprove(q)}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                            q.isApproved 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
                          }`}
                        >
                          {q.isApproved ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Approved</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 shrink-0" />
                              <span>Pending Review</span>
                            </>
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 rounded-md hover:bg-indigo-500/15 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border border-zinc-200/10"
                          title="Edit Question Attributes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteQuestion(q.id, q.questionNumber)}
                          className="p-1.5 rounded-md hover:bg-red-500/15 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border border-zinc-200/10"
                          title="Purge Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Body */}
                    <div className="space-y-4">
                      <p className="text-sm font-bold leading-relaxed">{q.text}</p>
                      
                      {/* Grid for Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {[
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD },
                        ].map((opt) => {
                          const isCorrect = q.correctAnswer.toUpperCase() === opt.key;
                          return (
                            <div 
                              key={opt.key}
                              className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                                isCorrect 
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold' 
                                  : 'border-gray-100 dark:border-zinc-800/80 text-gray-600 dark:text-zinc-300'
                              }`}
                            >
                              <span><strong className="mr-1.5 uppercase font-extrabold">{opt.key}.</strong> {opt.text}</span>
                              {isCorrect && <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Dropdown section */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/30 dark:bg-zinc-800/10 text-xs space-y-1.5">
                          <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                            Solution & Explanatory Proof
                          </h5>
                          <p className="text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRUD Edit Modal Portal (Frosted glass modal overlays) */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-container max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border-indigo-500/20 shadow-2xl p-6 space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-3">
              <div>
                <h4 className="text-base font-bold flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-indigo-500" />
                  Edit Question #{editingQuestion.questionNumber}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Modify text structure, multiple choices, answers, and classifications.</p>
              </div>
              <button 
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-500 dark:text-gray-400">Question Content</label>
                <textarea
                  required
                  rows={3}
                  value={editForm.text}
                  onChange={(e) => setEditForm(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-semibold"
                />
              </div>

              {/* Grid for Options input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Option A</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionA}
                    onChange={(e) => setEditForm(prev => ({ ...prev, optionA: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Option B</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionB}
                    onChange={(e) => setEditForm(prev => ({ ...prev, optionB: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Option C</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionC}
                    onChange={(e) => setEditForm(prev => ({ ...prev, optionC: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Option D</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionD}
                    onChange={(e) => setEditForm(prev => ({ ...prev, optionD: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Key metadata line */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                
                {/* Correct Option */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Correct Answer</label>
                  <select
                    value={editForm.correctAnswer}
                    onChange={(e) => setEditForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="A" className="dark:bg-zinc-900">A</option>
                    <option value="B" className="dark:bg-zinc-900">B</option>
                    <option value="C" className="dark:bg-zinc-900">C</option>
                    <option value="D" className="dark:bg-zinc-900">D</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Easy" className="dark:bg-zinc-900">Easy</option>
                    <option value="Medium" className="dark:bg-zinc-900">Medium</option>
                    <option value="Hard" className="dark:bg-zinc-900">Hard</option>
                  </select>
                </div>

                {/* Topic field */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Topic Area</label>
                  <input
                    type="text"
                    required
                    value={editForm.topic}
                    onChange={(e) => setEditForm(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>

                {/* Approved state toggle */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 dark:text-gray-400">Approval State</label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editForm.isApproved} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, isApproved: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-500"></div>
                      <span className="ml-2 text-xs font-bold text-gray-600 dark:text-gray-300">{editForm.isApproved ? 'Approved' : 'Pending'}</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Explanation textarea */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-gray-500 dark:text-gray-400">Solution & Explanatory Proof</label>
                <textarea
                  rows={3}
                  value={editForm.explanation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  placeholder="Explain why the selected option is correct..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Commit Edits</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
