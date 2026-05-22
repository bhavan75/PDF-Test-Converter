import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { extractTextFromPdf } from '../services/pdf-extractor.js';
import { parseMCQsFromText } from '../services/mcq-parser.js';

export async function uploadPdf(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    const { filename, path: filepath } = req.file;

    // 1. Create a DB record in 'processing' status
    const pdfRecord = await prisma.pdfUpload.create({
      data: {
        filename,
        filepath,
        status: 'processing',
        topics: '',
      },
    });

    console.log(`Processing file ${filename} with ID: ${pdfRecord.id}`);

    // 2. Extract text (supports text-based or scanned OCR PDF)
    const { text, isScanned } = await extractTextFromPdf(filepath);
    console.log(`PDF text extraction finished. Scanned/OCR: ${isScanned}. Text length: ${text.length}`);

    // 3. Parse MCQs from text
    const extractedQuestions = await parseMCQsFromText(text);
    console.log(`Parsed ${extractedQuestions.length} questions from text.`);

    if (extractedQuestions.length === 0) {
      // Update DB to failed
      await prisma.pdfUpload.update({
        where: { id: pdfRecord.id },
        data: { status: 'failed' },
      });
      return res.status(422).json({ error: 'Could not extract any multiple-choice questions from the PDF format' });
    }

    // 4. Save extracted questions in DB
    const questionCreations = extractedQuestions.map((q) => {
      return prisma.question.create({
        data: {
          pdfId: pdfRecord.id,
          questionNumber: q.questionNumber,
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'No explanation provided.',
          topic: q.topic,
          difficulty: q.difficulty,
          isApproved: true, // Auto-approved on upload, admins can toggle in panel
        },
      });
    });

    await Promise.all(questionCreations);

    // Extract unique topics
    const uniqueTopics = Array.from(new Set(extractedQuestions.map((q) => q.topic))).join(',');

    // 5. Update DB record to 'completed'
    const updatedPdf = await prisma.pdfUpload.update({
      where: { id: pdfRecord.id },
      data: {
        status: 'completed',
        totalQuestions: extractedQuestions.length,
        topics: uniqueTopics || 'General',
      },
    });

    res.status(200).json({
      message: 'PDF processed successfully',
      pdfId: updatedPdf.id,
      filename: updatedPdf.filename,
      totalQuestions: updatedPdf.totalQuestions,
      topics: updatedPdf.topics.split(','),
      isScanned,
    });
  } catch (error) {
    console.error('PDF upload and process error:', error);
    res.status(500).json({ error: 'An error occurred during PDF processing' });
  }
}

export async function getPdfAnalysis(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const pdf = await prisma.pdfUpload.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            topic: true,
            difficulty: true,
          },
        },
      },
    }) as any;

    if (!pdf) {
      return res.status(404).json({ error: 'PDF processing record not found' });
    }

    // Count topics and difficulties
    const topicCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };

    pdf.questions.forEach((q: { topic: string; difficulty: string }) => {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    });

    res.status(200).json({
      id: pdf.id,
      filename: pdf.filename,
      status: pdf.status,
      totalQuestions: pdf.totalQuestions,
      topics: pdf.topics.split(','),
      topicBreakdown: topicCounts,
      difficultyBreakdown: difficultyCounts,
      createdAt: pdf.createdAt,
    });
  } catch (error) {
    console.error('Fetch PDF analysis error:', error);
    res.status(500).json({ error: 'An error occurred fetching PDF details' });
  }
}
