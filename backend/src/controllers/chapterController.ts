import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { success } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// 获取所有章节列表
export async function getAllChapters(_req: Request, res: Response, next: NextFunction) {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
        sentences: true,
      },
    });

    // 计算每个章节的句子数量
    const chaptersWithCount = chapters.map((chapter) => {
      const sentences = chapter.sentences as { id: string; content: string }[];
      return {
        id: chapter.id,
        name: chapter.name,
        order: chapter.order,
        sentenceCount: Array.isArray(sentences) ? sentences.length : 0,
      };
    });

    res.json(success(chaptersWithCount));
  } catch (err) {
    next(err);
  }
}

// 获取单个章节详情（含句子）
export async function getChapterById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new AppError('章节不存在', 404);
    }

    res.json(success(chapter));
  } catch (err) {
    next(err);
  }
}
