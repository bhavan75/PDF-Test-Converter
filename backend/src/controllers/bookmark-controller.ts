import { Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function toggleBookmark(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    // Check if the bookmark already exists
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: req.user.id,
        questionId,
      },
    });

    if (existing) {
      // Remove it
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return res.status(200).json({ bookmarked: false, message: 'Question removed from bookmarks' });
    }

    // Add it
    await prisma.bookmark.create({
      data: {
        userId: req.user.id,
        questionId,
      },
    });

    res.status(200).json({ bookmarked: true, message: 'Question saved to bookmarks successfully' });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'An error occurred toggling the bookmark state' });
  }
}

export async function getBookmarks(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        question: {
          include: {
            pdf: {
              select: { filename: true }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten representation
    const flattened = bookmarks.map((b) => ({
      bookmarkId: b.id,
      bookmarkedAt: b.createdAt,
      ...b.question,
      pdfName: b.question.pdf?.filename || 'Deleted PDF',
      pdf: undefined, // remove nested schema
    }));

    res.status(200).json(flattened);
  } catch (error) {
    console.error('Fetch bookmarks error:', error);
    res.status(500).json({ error: 'An error occurred fetching your bookmarked questions' });
  }
}
