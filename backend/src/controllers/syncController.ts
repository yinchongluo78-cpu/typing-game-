import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { success } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { SyncData, SyncRecord, SyncProgress } from '../types';

// 同步游客数据到云端
export async function syncData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const { records, progress } = req.body as SyncData;

    const results = {
      recordsSynced: 0,
      progressSynced: 0,
    };

    // 同步练习记录
    if (records && Array.isArray(records)) {
      for (const record of records as SyncRecord[]) {
        // 验证章节是否存在
        const chapter = await prisma.chapter.findUnique({
          where: { id: record.chapterId },
        });

        if (chapter) {
          await prisma.record.create({
            data: {
              userId,
              chapterId: record.chapterId,
              wpm: record.wpm,
              accuracy: record.accuracy,
              duration: record.duration,
              errorCount: record.errorCount,
              errors: (record.errors as object[]) || [],
              createdAt: new Date(record.createdAt),
            },
          });
          results.recordsSynced++;
        }
      }
    }

    // 同步进度
    if (progress && Array.isArray(progress)) {
      for (const prog of progress as SyncProgress[]) {
        // 验证章节是否存在
        const chapter = await prisma.chapter.findUnique({
          where: { id: prog.chapterId },
        });

        if (chapter) {
          // 获取现有进度
          const existingProgress = await prisma.progress.findUnique({
            where: {
              userId_chapterId: {
                userId,
                chapterId: prog.chapterId,
              },
            },
          });

          // 合并进度，保留最佳成绩
          const mergedData = {
            status: prog.status,
            bestWpm:
              existingProgress?.bestWpm && prog.bestWpm
                ? Math.max(existingProgress.bestWpm, prog.bestWpm)
                : prog.bestWpm || existingProgress?.bestWpm,
            bestAccuracy:
              existingProgress?.bestAccuracy && prog.bestAccuracy
                ? Math.max(existingProgress.bestAccuracy, prog.bestAccuracy)
                : prog.bestAccuracy || existingProgress?.bestAccuracy,
            lastPlayedAt: prog.lastPlayedAt ? new Date(prog.lastPlayedAt) : new Date(),
          };

          await prisma.progress.upsert({
            where: {
              userId_chapterId: {
                userId,
                chapterId: prog.chapterId,
              },
            },
            update: mergedData,
            create: {
              userId,
              chapterId: prog.chapterId,
              ...mergedData,
            },
          });
          results.progressSynced++;
        }
      }
    }

    res.json(success(results, '数据同步成功'));
  } catch (err) {
    next(err);
  }
}
