import { Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllPdfs(req: AuthenticatedRequest, res: Response) {
  try {
    const pdfs = await prisma.pdfUpload.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
    res.status(200).json(pdfs);
  } catch (error) {
    console.error('Admin fetch PDFs error:', error);
    res.status(500).json({ error: 'An error occurred fetching the uploaded PDF list' });
  }
}

export async function getPdfQuestions(req: AuthenticatedRequest, res: Response) {
  try {
    const { pdfId } = req.params as { pdfId: string };

    const questions = await prisma.question.findMany({
      where: { pdfId },
      orderBy: { questionNumber: 'asc' },
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error('Admin fetch questions error:', error);
    res.status(500).json({ error: 'An error occurred fetching questions for this PDF' });
  }
}

export async function editQuestion(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { text, optionA, optionB, optionC, optionD, correctAnswer, explanation, topic, difficulty, isApproved } = req.body;

    if (!text || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({ error: 'Text, options A-D, and correct answer are required' });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: correctAnswer.toUpperCase(),
        explanation: explanation || 'No explanation provided.',
        topic: topic || 'General',
        difficulty: difficulty || 'Medium',
        isApproved: isApproved !== undefined ? isApproved : true,
      },
    });

    res.status(200).json({ message: 'Question updated successfully', question: updated });
  } catch (error) {
    console.error('Admin edit question error:', error);
    res.status(500).json({ error: 'An error occurred updating this question' });
  }
}

export async function approveQuestion(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { isApproved } = req.body;

    const updated = await prisma.question.update({
      where: { id },
      data: {
        isApproved: isApproved !== undefined ? isApproved : true,
      },
    });

    res.status(200).json({ message: 'Question approval status updated', question: updated });
  } catch (error) {
    console.error('Admin approve question error:', error);
    res.status(500).json({ error: 'An error occurred toggling question approval status' });
  }
}

export async function deleteQuestion(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };

    await prisma.question.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ error: 'An error occurred deleting this question' });
  }
}

export async function deletePdf(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };

    // Delete PDF and all cascade associations (Cascade configured in schema)
    await prisma.pdfUpload.delete({
      where: { id },
    });

    res.status(200).json({ message: 'PDF and all its questions deleted successfully' });
  } catch (error) {
    console.error('Admin delete PDF error:', error);
    res.status(500).json({ error: 'An error occurred deleting the PDF upload and questions' });
  }
}
