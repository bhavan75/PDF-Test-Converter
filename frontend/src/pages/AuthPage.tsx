import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Mail, Lock, User as UserIcon, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signup(email, password, name);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setGoogleLoading(true);
    // Simulate authenticating Google popup
    setTimeout(async () => {
      try {
        // Automatically register/log in standard student
        await login('student@pdftest.com', 'password123');
        onSuccess();
      } catch (err: any) {
        setError('Failed to authenticate with Google');
      } finally {
        setGoogleLoading(false);
      }
    }, 1500);
  };

  const handleQuickSeed = async (role: 'student' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      if (role === 'student') {
        await login('student@pdftest.com', 'password123');
      } else {
        await login('admin@pdftest.com', 'password123');
      }
      onSuccess();
    } catch (err: any) {
      setError('Connection refused. Please start the backend server first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Dynamic branding header */}
      <div className="mb-8 text-center animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-container mb-4 text-xs font-medium text-indigo-500 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen EdTech Assessment Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 bg-clip-text text-transparent">
          PDF Test Converter
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
          Convert offline MCQ practice sheets into interactive examinations with visual metrics and reviews in seconds.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md glass-container p-8 rounded-2xl animate-slide-up shadow-xl relative overflow-hidden">
        {/* Soft background decor blur glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl"></div>
        <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl"></div>

        {/* Tab Selection */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800/80 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
              isLogin 
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
              !isLogin 
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Display Errors */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-slide-up">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Sign Up Only) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Bhavya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="student@pdftest.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md shadow-indigo-600/10 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Profile' : 'Register and Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
        </div>

        {/* Simulated Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-2.5 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 bg-white/30 dark:bg-zinc-900/30 text-gray-700 dark:text-zinc-300 rounded-lg text-sm font-semibold transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {googleLoading ? (
            <span className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></span>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800 text-center">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Quick-Start Demo Credentials
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => handleQuickSeed('student')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/5 transition-colors cursor-pointer"
            >
              Student Portal (Bhavya)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSeed('admin')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 transition-colors cursor-pointer"
            >
              Admin Controller
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2.5">
            * Seeding script will populate Bhavya's history with 4 gorgeous test analytics!
          </p>
        </div>
      </div>
    </div>
  );
};
