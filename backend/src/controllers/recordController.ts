import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { success } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// 保存练习记录
export async function createRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const { chapterId, wpm, accuracy, duration, errorCount, errors } = req.body;

    // 验证章节是否存在
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new AppError('章节不存在', 404);
    }

    // 创建记录
    const record = await prisma.record.create({
      data: {
        userId,
        chapterId,
        wpm,
        accuracy,
        duration,
        errorCount,
        errors: errors || [],
      },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 更新用户进度
    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
    });

    const progressData = {
      status: 'completed',
      lastPlayedAt: new Date(),
      bestWpm: existingProgress?.bestWpm ? Math.max(existingProgress.bestWpm, wpm) : wpm,
      bestAccuracy: existingProgress?.bestAccuracy
        ? Math.max(existingProgress.bestAccuracy, accuracy)
        : accuracy,
    };

    await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      update: progressData,
      create: {
        userId,
        chapterId,
        ...progressData,
      },
    });

    res.status(201).json(success(record, '记录保存成功'));
  } catch (err) {
    next(err);
  }
}

// 获取用户历史记录
export async function getRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const { chapterId, limit = 20, offset = 0 } = req.query;

    const where: { userId: string; chapterId?: string } = { userId };
    if (chapterId && typeof chapterId === 'string') {
      where.chapterId = chapterId;
    }

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          chapter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.record.count({ where }),
    ]);

    res.json(
      success({
        records,
        total,
        limit: Number(limit),
        offset: Number(offset),
      })
    );
  } catch (err) {
    next(err);
  }
}

// 获取单条记录详情
export async function getRecordById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const record = await prisma.record.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!record) {
      throw new AppError('记录不存在', 404);
    }

    res.json(success(record));
  } catch (err) {
    next(err);
  }
}
