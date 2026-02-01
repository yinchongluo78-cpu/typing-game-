// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
}

// 句子类型
export interface Sentence {
  id: string;
  content: string;
  translation?: string;
}

// 错误详情类型
export interface ErrorDetail {
  position: number;
  expected: string;
  actual: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
}

// 扩展 Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 同步数据类型
export interface SyncRecord {
  chapterId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  errorCount: number;
  errors?: ErrorDetail[];
  createdAt: string;
}

export interface SyncProgress {
  chapterId: string;
  status: string;
  bestWpm?: number;
  bestAccuracy?: number;
  lastPlayedAt?: string;
}

export interface SyncData {
  records: SyncRecord[];
  progress: SyncProgress[];
}
