// 计算 WPM（每分钟字数）
// 标准定义：1 个"单词" = 5 个字符（含空格）
export function calculateWPM(totalChars: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const minutes = durationMs / 1000 / 60;
  const words = totalChars / 5;
  return Math.round(words / minutes);
}

// 计算正确率
export function calculateAccuracy(totalChars: number, errorCount: number): number {
  if (totalChars <= 0) return 0;
  const accuracy = ((totalChars - errorCount) / totalChars) * 100;
  return Math.max(0, Math.round(accuracy * 10) / 10);
}

// 格式化时间（秒 -> mm:ss）
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 生成唯一 ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 音效相关
export { preloadSounds, playSound, setSoundVolume } from './sounds';
export type { SoundType } from './sounds';
