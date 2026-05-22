import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { QuizProvider, useQuiz } from './context/QuizContext.js';
import { AuthPage } from './pages/AuthPage.js';
import { Dashboard } from './pages/Dashboard.js';
import { UploadPage } from './pages/UploadPage.js';
import { SetupPage } from './pages/SetupPage.js';
import { ExamPage } from './pages/ExamPage.js';
import { ResultPage } from './pages/ResultPage.js';
import { BookmarksPage } from './pages/BookmarksPage.js';
import { AdminPage } from './pages/AdminPage.js';

import { 
  BookOpen, 
  LayoutDashboard, 
  UploadCloud, 
  Bookmark, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  Menu,
  X
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isActive: isQuizActive } = useQuiz();

  // Initialize state from URL path
  const getInitialView = () => {
    const path = window.location.pathname;
    if (path.startsWith('/user/')) return path.replace('/user/', '');
    if (path.startsWith('/admin')) return 'admin';
    return 'dashboard';
  };

  // Navigation states
  const [currentView, setCurrentView] = useState<string>(getInitialView());
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle Browser Back/Forward buttons
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        setNavigationParams(event.state.params);
      } else {
        setCurrentView(getInitialView());
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    // Update URL on initial load if needed
    if (!window.history.state && window.location.pathname !== '/login') {
      const path = currentView === 'admin' ? '/admin' : `/user/${currentView}`;
      window.history.replaceState({ view: currentView, params: null }, '', path);
    }
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  // Custom State-based Router
  const handleNavigate = (view: string, params: any = null) => {
    setCurrentView(view);
    setNavigationParams(params);
    setMobileMenuOpen(false); // Close mobile navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update Browser URL Path
    const path = view === 'admin' ? '/admin' : `/user/${view}`;
    window.history.pushState({ view, params }, '', path);
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
    window.history.pushState({ view: 'dashboard' }, '', '/user/dashboard');
  };

  // Sync unauthenticated state with /login URL
  React.useEffect(() => {
    if (!user && window.location.pathname !== '/login') {
      window.history.replaceState({ view: 'login' }, '', '/login');
    }
  }, [user]);

  // If user is not authenticated, render login page
  if (!user) {
    return <AuthPage onSuccess={handleLoginSuccess} />;
  }

  // Determine which page component to display
  const renderActivePage = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'upload':
        return <UploadPage onNavigate={handleNavigate} />;
      case 'setup':
        return <SetupPage pdfId={navigationParams?.pdfId} onNavigate={handleNavigate} />;
      case 'exam':
        return <ExamPage onNavigate={handleNavigate} />;
      case 'results':
        return <ResultPage attemptId={navigationParams?.attemptId} onNavigate={handleNavigate} />;
      case 'bookmarks':
        return <BookmarksPage />;
      case 'admin':
        return <AdminPage onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  // UX Choice: Hide standard header completely when an exam is active
  if (isQuizActive) {
    return (
      <main className="min-h-screen pt-6 pb-12">
        {renderActivePage()}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 w-full glass-container border-b border-gray-100 dark:border-zinc-800/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo Branding */}
          <div 
            onClick={() => handleNavigate('dashboard')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              PDF Test Converter
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNavigate('upload')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'upload' || currentView === 'setup'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Convert PDF</span>
            </button>

            <button
              onClick={() => handleNavigate('bookmarks')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'bookmarks'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Bookmarks</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavigate('admin')}
                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Audit</span>
              </button>
            )}
          </nav>

          {/* Right Action Utilities */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-100 dark:border-zinc-800/80 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Brief info */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-150 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold max-w-[90px] truncate">{user.name}</p>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</span>
              </div>
            </div>

            {/* Log Out */}
            <button
              onClick={logout}
              className="p-2 rounded-lg border border-red-500/10 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Log Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburguer Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Theme toggler */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-100 dark:border-zinc-800/80 text-gray-500 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-gray-100 dark:border-zinc-800/80 text-gray-500 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 py-4 space-y-3 font-semibold text-xs animate-slide-up">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full py-2.5 px-4 rounded-lg text-left flex items-center gap-2.5 ${
                currentView === 'dashboard' ? 'bg-indigo-500/10 text-indigo-500 font-bold' : 'text-gray-500'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNavigate('upload')}
              className={`w-full py-2.5 px-4 rounded-lg text-left flex items-center gap-2.5 ${
                currentView === 'upload' || currentView === 'setup' ? 'bg-indigo-500/10 text-indigo-500 font-bold' : 'text-gray-500'
              }`}
            >
              <UploadCloud className="w-4.5 h-4.5" />
              <span>Convert PDF Question sheet</span>
            </button>

            <button
              onClick={() => handleNavigate('bookmarks')}
              className={`w-full py-2.5 px-4 rounded-lg text-left flex items-center gap-2.5 ${
                currentView === 'bookmarks' ? 'bg-indigo-500/10 text-indigo-500 font-bold' : 'text-gray-500'
              }`}
            >
              <Bookmark className="w-4.5 h-4.5" />
              <span>Bookmark Hub</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavigate('admin')}
                className={`w-full py-2.5 px-4 rounded-lg text-left flex items-center gap-2.5 ${
                  currentView === 'admin' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'text-gray-500'
                }`}
              >
                <ShieldAlert className="w-4.5 h-4.5" />
                <span>Admin Audit Board</span>
              </button>
            )}

            <hr className="border-gray-100 dark:border-zinc-800/80 my-2" />

            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{user.name}</p>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{user.role}</span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 rounded-lg border border-red-500/10 text-red-500 flex items-center gap-1 font-bold text-[10px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Layout Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto py-8">
        {renderActivePage()}
      </main>

      {/* Modern Compact Footer */}
      <footer className="w-full py-6 mt-12 border-t border-gray-100 dark:border-zinc-800/60 text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
        <span>© 2026 PDF Test Converter • Next-Gen AI EdTech Engine</span>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <AppContent />
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
