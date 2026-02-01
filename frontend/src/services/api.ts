import type { Chapter, ChapterListItem, Record as GameRecord, Progress, User } from '../types';

// 根据环境选择 API 地址
const API_BASE = import.meta.env.PROD
  ? 'https://typing-game-production-b46f.up.railway.app/api'
  : 'http://localhost:3001/api';

// 获取存储的 token
function getToken(): string | null {
  const stored = localStorage.getItem('typing-game-user');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.state?.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as { [key: string]: string })['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    return response.json();
  } catch (error) {
    return { success: false, message: '网络请求失败' };
  }
}

// ============ 章节 API ============

// 获取所有章节（列表）
export async function fetchChapters(): Promise<ChapterListItem[]> {
  const result = await request<ChapterListItem[]>('/chapters');
  if (result.success && result.data) {
    return result.data;
  }
  // 降级到本地数据
  const response = await fetch('/data/chapters.json');
  const chapters = await response.json();
  // 转换本地数据格式
  return chapters.map((c: Chapter) => ({
    id: c.id,
    name: c.name,
    order: c.order,
    sentenceCount: c.sentences.length,
  }));
}

// 获取单个章节（详情，包含句子）
export async function fetchChapter(id: string): Promise<Chapter | null> {
  const result = await request<Chapter>(`/chapters/${id}`);
  if (result.success && result.data) {
    return result.data;
  }
  // 降级到本地数据
  const response = await fetch('/data/chapters.json');
  const chapters = await response.json();
  return chapters.find((c: Chapter) => c.id === id) || null;
}

// ============ 认证 API ============

export interface AuthResponse {
  user: User;
  token: string;
}

// 登录
export async function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// 注册
export async function register(email: string, password: string, nickname: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
}

// 获取当前用户
export async function getCurrentUser() {
  return request<User>('/auth/me');
}

// ============ 练习记录 API ============

export interface SaveRecordData {
  chapterId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  errorCount: number;
  errors: Array<{
    position: number;
    expected: string;
    actual: string;
    sentenceId: string;
  }>;
}

// 保存练习记录
export async function saveRecord(data: SaveRecordData) {
  return request<GameRecord>('/records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 获取历史记录
export async function fetchRecords(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<GameRecord[]>(`/records${query}`);
}

// 获取单条记录
export async function fetchRecord(id: string) {
  return request<GameRecord>(`/records/${id}`);
}

// ============ 进度 API ============

// 获取所有进度
export async function fetchProgress() {
  return request<Progress[]>('/progress');
}

// 更新进度
export async function updateProgressApi(chapterId: string, data: Partial<Progress>) {
  return request<Progress>(`/progress/${chapterId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============ 数据同步 API ============

export interface SyncData {
  progress: Progress[];
  records: Omit<GameRecord, 'id'>[];
}

// 同步游客数据到云端
export async function syncGuestData(data: SyncData) {
  return request<{ syncedRecords: number; syncedProgress: number }>('/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ 语音合成 API ============

// 获取语音合成音频 URL
export function getTTSUrl(text: string, voice: string = 'Wendy'): string {
  return `${API_BASE}/tts/synthesize?text=${encodeURIComponent(text)}&voice=${voice}`;
}

// 音频缓存
const audioCache = new Map<string, HTMLAudioElement>();

// 预加载语音（返回 Audio 对象）
export async function preloadTTS(text: string, voice: string = 'Wendy'): Promise<HTMLAudioElement> {
  const cacheKey = `${text}_${voice}`;

  // 如果已缓存，直接返回
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const url = getTTSUrl(text, voice);
  const audio = new Audio();

  return new Promise((resolve, reject) => {
    audio.oncanplaythrough = () => {
      audioCache.set(cacheKey, audio);
      resolve(audio);
    };
    audio.onerror = () => reject(new Error('预加载失败'));
    audio.src = url;
    audio.load();
  });
}

// 播放已预加载的语音
export async function playPreloadedAudio(audio: HTMLAudioElement): Promise<void> {
  // 重置播放位置
  audio.currentTime = 0;

  return new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('播放失败'));
    audio.play().catch(reject);
  });
}

// 播放语音（如果已预加载则使用缓存，否则直接播放）
export async function playTTS(text: string, voice: string = 'Wendy'): Promise<void> {
  const cacheKey = `${text}_${voice}`;

  // 如果已缓存，使用缓存的音频
  if (audioCache.has(cacheKey)) {
    return playPreloadedAudio(audioCache.get(cacheKey)!);
  }

  // 否则直接加载并播放
  const url = getTTSUrl(text, voice);
  const audio = new Audio(url);
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('播放失败'));
    audio.play().catch(reject);
  });
}

// 清除音频缓存
export function clearAudioCache(): void {
  audioCache.clear();
}
