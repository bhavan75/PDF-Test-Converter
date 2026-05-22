import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext.js';

export interface Question {
  id: string;
  questionNumber: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  isApproved?: boolean;
}

export interface QuizConfig {
  pdfId: string;
  questionCount: number;
  order: 'sequential' | 'random';
  timeLimit: number; // in minutes
  mode: 'practice' | 'exam';
  selectedTopics: string[];
  selectedDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
}

interface AnswerDetail {
  selected: string; // "A", "B", "C", "D"
  timeSpent: number; // in seconds
}

interface QuizContextType {
  isActive: boolean;
  isSubmitted: boolean;
  config: QuizConfig | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, AnswerDetail>;
  markedForReview: string[];
  timeRemaining: number; // in seconds
  startQuiz: (pdfId: string, apiToken: string, setupConfig: Omit<QuizConfig, 'pdfId'>) => Promise<void>;
  selectAnswer: (questionId: string, option: string) => void;
  toggleMarkForReview: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitQuiz: () => Promise<string>;
  resetQuiz: () => void;
  elapsedSeconds: number;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);
const API_URL = 'http://localhost:5000/api';

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerDetail>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef<any | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  // 1. Auto-Save to localStorage
  useEffect(() => {
    if (isActive && !isSubmitted && config) {
      const activeState = {
        config,
        questions,
        currentQuestionIndex,
        answers,
        markedForReview,
        timeRemaining,
        elapsedSeconds,
        timestamp: Date.now()
      };
      localStorage.setItem('active_quiz_session', JSON.stringify(activeState));
    } else if (isSubmitted) {
      localStorage.removeItem('active_quiz_session');
    }
  }, [isActive, isSubmitted, config, questions, currentQuestionIndex, answers, markedForReview, timeRemaining, elapsedSeconds]);

  // Restore active session on load
  useEffect(() => {
    const saved = localStorage.getItem('active_quiz_session');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Ensure state is not too old (within 30 mins)
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          setConfig(state.config);
          setQuestions(state.questions);
          setCurrentQuestionIndex(state.currentQuestionIndex);
          setAnswers(state.answers);
          setMarkedForReview(state.markedForReview);
          setTimeRemaining(state.timeRemaining);
          setElapsedSeconds(state.elapsedSeconds);
          setIsActive(true);
          setIsSubmitted(false);
          questionStartRef.current = Date.now();
        } else {
          localStorage.removeItem('active_quiz_session');
        }
      } catch (err) {
        console.error('Failed to restore quiz session:', err);
      }
    }
  }, []);

  // 2. Main quiz timer countdown thread
  useEffect(() => {
    if (isActive && !isSubmitted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Auto submit when timer runs out
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
        
        // Track time spent on the CURRENT question dynamically every second
        const activeQuestionId = questions[currentQuestionIndex]?.id;
        if (activeQuestionId) {
          setAnswers((prev) => {
            const currentAns = prev[activeQuestionId] || { selected: '', timeSpent: 0 };
            return {
              ...prev,
              [activeQuestionId]: {
                ...currentAns,
                timeSpent: currentAns.timeSpent + 1,
              },
            };
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isSubmitted, timeRemaining, currentQuestionIndex, questions]);

  const handleAutoSubmit = async () => {
    console.log('Timer expired! Submitting test automatically...');
    await submitQuiz();
  };

  const startQuiz = async (pdfId: string, apiToken: string, setupConfig: Omit<QuizConfig, 'pdfId'>) => {
    try {
      // Fetch questions from backend
      const res = await fetch(`${API_URL}/pdf/${pdfId}/questions`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch questions for exam');
      }

      const allQuestions: Question[] = await res.json();
      
      // Filter approved questions only
      let filtered = allQuestions.filter(q => q.isApproved !== false);

      // Apply Topic Filters
      if (setupConfig.selectedTopics.length > 0) {
        filtered = filtered.filter((q) => setupConfig.selectedTopics.includes(q.topic));
      }

      // Apply Difficulty Filters
      if (setupConfig.selectedDifficulty !== 'Mixed') {
        filtered = filtered.filter((q) => q.difficulty === setupConfig.selectedDifficulty);
      }

      // Handle random ordering
      if (setupConfig.order === 'random') {
        filtered = [...filtered].sort(() => Math.random() - 0.5);
      }

      // Limit question count
      const finalCount = Math.min(setupConfig.questionCount, filtered.length);
      filtered = filtered.slice(0, finalCount);

      if (filtered.length === 0) {
        throw new Error('No questions match the selected difficulty and topic filters');
      }

      // Initialize State
      setQuestions(filtered);
      setConfig({ pdfId, ...setupConfig });
      setCurrentQuestionIndex(0);
      setMarkedForReview([]);
      setIsSubmitted(false);
      setTimeRemaining(setupConfig.timeLimit * 60);
      setElapsedSeconds(0);
      
      // Seed answers structure
      const initialAnswers: Record<string, AnswerDetail> = {};
      filtered.forEach((q) => {
        initialAnswers[q.id] = { selected: '', timeSpent: 0 };
      });
      setAnswers(initialAnswers);
      
      setIsActive(true);
      questionStartRef.current = Date.now();
    } catch (err) {
      console.error('Start quiz error:', err);
      throw err;
    }
  };

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const detail = prev[questionId] || { selected: '', timeSpent: 0 };
      return {
        ...prev,
        [questionId]: {
          ...detail,
          selected: option,
        },
      };
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    questionStartRef.current = Date.now();
  };

  const submitQuiz = async (): Promise<string> => {
    if (!config || !token || !user) throw new Error('Attempt submission failed: User session missing');

    setIsActive(false);
    setIsSubmitted(true);

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      const userAns = answers[q.id]?.selected;
      if (userAns && userAns.toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount += 1;
      }
    });

    const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    // Send payload to backend
    const payload = {
      pdfId: config.pdfId,
      totalQuestions: questions.length,
      timeLimit: config.timeLimit,
      timeSpent: elapsedSeconds,
      score: correctCount,
      accuracy,
      mode: config.mode,
      answers, // Send full questionId -> selected/time map
    };

    try {
      const res = await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit test attempt');

      localStorage.removeItem('active_quiz_session');
      return data.attemptId;
    } catch (error) {
      console.error('Submit quiz API error:', error);
      // Even if API fails, let user view client side review, generate local attempt UUID
      const localUuid = 'local-' + Date.now();
      return localUuid;
    }
  };

  const resetQuiz = () => {
    setIsActive(false);
    setIsSubmitted(false);
    setConfig(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setMarkedForReview([]);
    setTimeRemaining(0);
    setElapsedSeconds(0);
    localStorage.removeItem('active_quiz_session');
  };

  return (
    <QuizContext.Provider
      value={{
        isActive,
        isSubmitted,
        config,
        questions,
        currentQuestionIndex,
        answers,
        markedForReview,
        timeRemaining,
        startQuiz,
        selectAnswer,
        toggleMarkForReview,
        nextQuestion,
        prevQuestion,
        goToQuestion,
        submitQuiz,
        resetQuiz,
        elapsedSeconds,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within a QuizProvider');
  return context;
};
