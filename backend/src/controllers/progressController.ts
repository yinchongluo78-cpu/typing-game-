import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { success } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// 获取用户所有章节进度
export async function getAllProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const progress = await prisma.progress.findMany({
      where: { userId },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
      orderBy: {
        chapter: {
          order: 'asc',
        },
      },
    });

    res.json(success(progress));
  } catch (err) {
    next(err);
  }
}

// 更新章节进度
export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { chapterId } = req.params;
    const { status, bestWpm, bestAccuracy } = req.body;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 验证章节是否存在
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new AppError('章节不存在', 404);
    }

    // 获取现有进度
    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
    });

    const updateData: {
      status?: string;
      bestWpm?: number;
      bestAccuracy?: number;
      lastPlayedAt: Date;
    } = {
      lastPlayedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    // 只有当新值更好时才更新最佳成绩
    if (bestWpm !== undefined) {
      updateData.bestWpm =
        existingProgress?.bestWpm && existingProgress.bestWpm > bestWpm
          ? existingProgress.bestWpm
          : bestWpm;
    }

    if (bestAccuracy !== undefined) {
      updateData.bestAccuracy =
        existingProgress?.bestAccuracy && existingProgress.bestAccuracy > bestAccuracy
          ? existingProgress.bestAccuracy
          : bestAccuracy;
    }

    const progress = await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      update: updateData,
      create: {
        userId,
        chapterId,
        status: status || 'in_progress',
        bestWpm,
        bestAccuracy,
        lastPlayedAt: new Date(),
      },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });

    res.json(success(progress, '进度更新成功'));
  } catch (err) {
    next(err);
  }
}
