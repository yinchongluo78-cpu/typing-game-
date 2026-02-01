import { Router } from 'express';
import { getAllChapters, getChapterById } from '../controllers/chapterController';

const router = Router();

// 获取所有章节列表
router.get('/', getAllChapters);

// 获取单个章节详情（含句子）
router.get('/:id', getChapterById);

export default router;
