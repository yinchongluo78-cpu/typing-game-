// 句子
export interface Sentence {
  id: string;
  content: string;
  translation?: string;
}

// 章节（列表）
export interface ChapterListItem {
  id: string;
  name: string;
  order: number;
  sentenceCount: number;
}

// 章节（详情，包含句子）
export interface Chapter {
  id: string;
  name: string;
  order: number;
  sentences: Sentence[];
}

// 章节进度状态
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

// 用户进度
export interface Progress {
  chapterId: string;
  status: ProgressStatus;
  bestWpm: number | null;
  bestAccuracy: number | null;
  lastPlayedAt: string | null;
}

// 错误详情
export interface ErrorDetail {
  position: number;
  expected: string;
  actual: string;
  sentenceId: string;
}

// 练习记录
export interface Record {
  id: string;
  chapterId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  errorCount: number;
  errors: ErrorDetail[];
  createdAt: string;
}

// 用户
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
}

// 学习统计
export interface Statistics {
  totalDuration: number;
  completedChapters: number;
  averageAccuracy: number;
  averageWpm: number;
}

// 词汇项类型
export interface VocabularyItem {
  id: string;
  content: string; // 英文内容
  translation: string; // 中文翻译
  chapterId: string; // 来源章节
  sentenceId: string; // 来源句子ID
  status: 'new' | 'mastered'; // 生词 or 熟练
  createdAt: number; // 添加时间戳
  updatedAt: number; // 更新时间戳
}

// 游戏模式类型
export type GameMode = 'dictation' | 'follow'; // 默写模式 | 看答案模式
