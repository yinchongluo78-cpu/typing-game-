// 音效管理 Hook
const soundFiles = {
  keyPress: '/sounds/key-press.mp3',
  keyError: '/sounds/key-error.mp3',
  sentenceComplete: '/sounds/sentence-complete.mp3',
  chapterComplete: '/sounds/chapter-complete.mp3',
};

// 预加载的音频元素缓存
const audioCache: Map<string, HTMLAudioElement> = new Map();

// 预加载所有音效
export function preloadSounds(): void {
  Object.entries(soundFiles).forEach(([key, src]) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audioCache.set(key, audio);
  });
}

// 播放音效
export function playSound(type: keyof typeof soundFiles): void {
  const audio = audioCache.get(type);
  if (audio) {
    // 克隆音频以支持快速连续播放
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = audio.volume;
    clone.play().catch(() => {
      // 忽略自动播放限制错误
    });
  } else {
    // 如果没有预加载，直接创建并播放
    const newAudio = new Audio(soundFiles[type]);
    newAudio.volume = 0.5;
    newAudio.play().catch(() => {});
  }
}

// 设置音量 (0-1)
export function setSoundVolume(volume: number): void {
  audioCache.forEach((audio) => {
    audio.volume = Math.max(0, Math.min(1, volume));
  });
}

// 音效类型
export type SoundType = keyof typeof soundFiles;
