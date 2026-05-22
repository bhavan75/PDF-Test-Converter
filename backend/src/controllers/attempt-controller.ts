import { Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function saveAttempt(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { pdfId, totalQuestions, timeLimit, timeSpent, score, accuracy, mode, answers } = req.body;

    if (!pdfId || !answers) {
      return res.status(400).json({ error: 'pdfId and answers are required' });
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: req.user.id,
        pdfId,
        totalQuestions: parseInt(totalQuestions, 10),
        timeLimit: parseInt(timeLimit, 10),
        timeSpent: parseInt(timeSpent, 10),
        score: parseInt(score, 10),
        accuracy: parseFloat(accuracy),
        mode,
        answers: JSON.stringify(answers), // Save raw answers as stringified JSON
      },
    });

    res.status(201).json({
      message: 'Attempt saved successfully',
      attemptId: attempt.id,
    });
  } catch (error) {
    console.error('Save attempt error:', error);
    res.status(500).json({ error: 'An error occurred while saving the test attempt' });
  }
}

export async function getUserAttempts(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Hydrate attempts with PDF names
    const enrichedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        const pdf = await prisma.pdfUpload.findUnique({
          where: { id: attempt.pdfId },
          select: { filename: true },
        });
        return {
          ...attempt,
          pdfName: pdf?.filename || 'Deleted PDF',
        };
      })
    );

    res.status(200).json(enrichedAttempts);
  } catch (error) {
    console.error('Fetch attempts error:', error);
    res.status(500).json({ error: 'An error occurred fetching attempts history' });
  }
}

export async function getAttemptDetails(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params as { id: string };

    const attempt = await prisma.testAttempt.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    const pdf = await prisma.pdfUpload.findUnique({
      where: { id: attempt.pdfId },
      select: { filename: true },
    });

    // Fetch all questions for this PDF to present review details
    const questions = await prisma.question.findMany({
      where: { pdfId: attempt.pdfId },
      orderBy: { questionNumber: 'asc' },
    });

    const parsedAnswers = JSON.parse(attempt.answers);

    res.status(200).json({
      ...attempt,
      pdfName: pdf?.filename || 'Deleted PDF',
      questions,
      userAnswers: parsedAnswers,
    });
  } catch (error) {
    console.error('Fetch attempt details error:', error);
    res.status(500).json({ error: 'An error occurred fetching detailed test results' });
  }
}

export async function getDashboardAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (attempts.length === 0) {
      return res.status(200).json({
        totalTests: 0,
        averageScore: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        topicPerformance: [],
        difficultyPerformance: { Easy: 0, Medium: 0, Hard: 0 },
        scoreTrend: [],
        weakTopics: [],
        strongTopics: [],
      });
    }

    // Basic Stats
    const totalTests = attempts.length;
    let totalScoreSum = 0;
    let totalAccuracySum = 0;
    let totalQuestionsAnswered = 0;
    let totalTimeSpent = 0;

    attempts.forEach((a) => {
      totalScoreSum += a.score;
      totalAccuracySum += a.accuracy;
      totalQuestionsAnswered += a.totalQuestions;
      totalTimeSpent += a.timeSpent;
    });

    // Topic Performance and Difficulty analysis
    const topicStats: Record<string, { total: number; correct: number }> = {};
    const difficultyStats: Record<string, { total: number; correct: number }> = {
      Easy: { total: 0, correct: 0 },
      Medium: { total: 0, correct: 0 },
      Hard: { total: 0, correct: 0 },
    };

    for (const attempt of attempts) {
      const answersMap = JSON.parse(attempt.answers);
      const questionIds = Object.keys(answersMap);
      
      if (questionIds.length === 0) continue;

      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
      });

      questions.forEach((q) => {
        const topic = q.topic;
        const difficulty = q.difficulty;
        const userAns = answersMap[q.id]?.selected;
        const isCorrect = userAns && userAns.toUpperCase() === q.correctAnswer.toUpperCase();

        // Topic Stats
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0 };
        }
        topicStats[topic].total += 1;
        if (isCorrect) topicStats[topic].correct += 1;

        // Difficulty Stats
        if (difficultyStats[difficulty]) {
          difficultyStats[difficulty].total += 1;
          if (isCorrect) difficultyStats[difficulty].correct += 1;
        }
      });
    }

    const topicPerformance = Object.keys(topicStats).map((topic) => {
      const stats = topicStats[topic];
      const accuracy = stats.total > 0 ? parseFloat(((stats.correct / stats.total) * 100).toFixed(1)) : 0;
      return {
        topic,
        total: stats.total,
        correct: stats.correct,
        accuracy,
      };
    });

    // Categorize strong vs weak topics
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];
    
    topicPerformance.forEach((tp) => {
      if (tp.accuracy >= 75) {
        strongTopics.push(tp.topic);
      } else if (tp.accuracy < 60) {
        weakTopics.push(tp.topic);
      }
    });

    // Fallbacks if list is empty
    if (strongTopics.length === 0 && topicPerformance.length > 0) {
      const sorted = [...topicPerformance].sort((a, b) => b.accuracy - a.accuracy);
      strongTopics.push(sorted[0].topic);
    }
    if (weakTopics.length === 0 && topicPerformance.length > 0) {
      const sorted = [...topicPerformance].sort((a, b) => a.accuracy - b.accuracy);
      if (sorted[sorted.length - 1].accuracy < 80) {
        weakTopics.push(sorted[sorted.length - 1].topic);
      }
    }

    // Difficulty Accuracy
    const difficultyPerformance = {
      Easy: difficultyStats.Easy.total > 0 ? Math.round((difficultyStats.Easy.correct / difficultyStats.Easy.total) * 100) : 0,
      Medium: difficultyStats.Medium.total > 0 ? Math.round((difficultyStats.Medium.correct / difficultyStats.Medium.total) * 100) : 0,
      Hard: difficultyStats.Hard.total > 0 ? Math.round((difficultyStats.Hard.correct / difficultyStats.Hard.total) * 100) : 0,
    };

    // Timeline trend
    const scoreTrend = enrichedAttemptsTimeline(attempts);

    res.status(200).json({
      totalTests,
      averageScore: parseFloat((totalScoreSum / totalTests).toFixed(1)),
      averageAccuracy: parseFloat((totalAccuracySum / totalTests).toFixed(1)),
      totalQuestionsAnswered,
      totalTimeSpent,
      topicPerformance,
      difficultyPerformance,
      scoreTrend,
      strongTopics,
      weakTopics,
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ error: 'An error occurred calculating dashboard statistics' });
  }
}

// Maps attempts timeline for recharts line-plots
function enrichedAttemptsTimeline(attempts: any[]) {
  return attempts.map((a, idx) => {
    return {
      attemptNumber: idx + 1,
      date: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      accuracy: parseFloat(a.accuracy.toFixed(1)),
      score: a.score,
    };
  });
}
