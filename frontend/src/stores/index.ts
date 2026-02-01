import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChapterListItem, Progress, Record, User, ErrorDetail, VocabularyItem } from '../types';

// 游戏状态 store
interface GameState {
  // 章节数据
  chapters: ChapterListItem[];
  setChapters: (chapters: ChapterListItem[]) => void;

  // 当前练习状态
  currentChapterId: string | null;
  currentSentenceIndex: number;
  userInput: string;
  errors: ErrorDetail[];
  startTime: number | null;
  isPlaying: boolean;
  isPaused: boolean;

  // 游戏操作
  startGame: (chapterId: string) => void;
  setUserInput: (input: string) => void;
  addError: (error: ErrorDetail) => void;
  nextSentence: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  chapters: [],
  setChapters: (chapters) => set({ chapters }),

  currentChapterId: null,
  currentSentenceIndex: 0,
  userInput: '',
  errors: [],
  startTime: null,
  isPlaying: false,
  isPaused: false,

  startGame: (chapterId) => set({
    currentChapterId: chapterId,
    currentSentenceIndex: 0,
    userInput: '',
    errors: [],
    startTime: null,
    isPlaying: true,
    isPaused: false,
  }),

  setUserInput: (input) => set((state) => ({
    userInput: input,
    startTime: state.startTime === null && input.length > 0 ? Date.now() : state.startTime,
  })),

  addError: (error) => set((state) => ({
    errors: [...state.errors, error],
  })),

  nextSentence: () => set((state) => ({
    currentSentenceIndex: state.currentSentenceIndex + 1,
    userInput: '',
  })),

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  endGame: () => set({ isPlaying: false }),

  resetGame: () => set({
    currentChapterId: null,
    currentSentenceIndex: 0,
    userInput: '',
    errors: [],
    startTime: null,
    isPlaying: false,
    isPaused: false,
  }),
}));

// 用户数据 store（持久化到 localStorage）
interface UserState {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  guestId: string;
  progress: Progress[];
  records: Record[];

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  loginSuccess: (user: User, token: string) => void;
  setProgress: (progress: Progress[]) => void;
  updateProgress: (chapterId: string, data: Partial<Progress>) => void;
  addRecord: (record: Record) => void;
  setRecords: (records: Record[]) => void;
  clearGuestData: () => void;
  logout: () => void;
}

const generateGuestId = () => {
  return 'guest_' + Math.random().toString(36).substring(2, 15);
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isGuest: true,
      guestId: generateGuestId(),
      progress: [],
      records: [],

      setUser: (user) => set({ user, isGuest: user === null }),

      setToken: (token) => set({ token }),

      loginSuccess: (user, token) => set({
        user,
        token,
        isGuest: false,
      }),

      setProgress: (progress) => set({ progress }),

      updateProgress: (chapterId, data) => set((state) => {
        const existingIndex = state.progress.findIndex(p => p.chapterId === chapterId);
        if (existingIndex >= 0) {
          const newProgress = [...state.progress];
          newProgress[existingIndex] = { ...newProgress[existingIndex], ...data };
          return { progress: newProgress };
        } else {
          return {
            progress: [...state.progress, {
              chapterId,
              status: 'not_started',
              bestWpm: null,
              bestAccuracy: null,
              lastPlayedAt: null,
              ...data,
            }],
          };
        }
      }),

      addRecord: (record) => set((state) => ({
        records: [...state.records, record],
      })),

      setRecords: (records) => set({ records }),

      clearGuestData: () => set({
        progress: [],
        records: [],
      }),

      logout: () => set({
        user: null,
        token: null,
        isGuest: true,
        progress: [],
        records: [],
      }),
    }),
    {
      name: 'typing-game-user',
    }
  )
);

// 词汇状态 store（持久化到 localStorage）
interface VocabularyState {
  vocabulary: VocabularyItem[];
  showAnswerMode: boolean; // 全局看答案模式开关

  // 方法
  addToVocabulary: (item: Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeFromVocabulary: (id: string) => void;
  updateVocabularyStatus: (id: string, status: 'new' | 'mastered') => void;
  toggleShowAnswerMode: () => void;
  setShowAnswerMode: (value: boolean) => void;
  getNewWords: () => VocabularyItem[];
  getMasteredWords: () => VocabularyItem[];
  isInVocabulary: (sentenceId: string) => VocabularyItem | undefined;
}

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set, get) => ({
      vocabulary: [],
      showAnswerMode: false,

      addToVocabulary: (item) => {
        const now = Date.now();
        const newItem: VocabularyItem = {
          ...item,
          id: `vocab_${now}_${Math.random().toString(36).substring(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          // 检查是否已存在相同的 sentenceId
          const existingIndex = state.vocabulary.findIndex(
            (v) => v.sentenceId === item.sentenceId
          );
          if (existingIndex >= 0) {
            // 更新现有项
            const newVocabulary = [...state.vocabulary];
            newVocabulary[existingIndex] = {
              ...newVocabulary[existingIndex],
              status: item.status,
              updatedAt: now,
            };
            return { vocabulary: newVocabulary };
          }
          return { vocabulary: [...state.vocabulary, newItem] };
        });
      },

      removeFromVocabulary: (id) =>
        set((state) => ({
          vocabulary: state.vocabulary.filter((v) => v.id !== id),
        })),

      updateVocabularyStatus: (id, status) =>
        set((state) => ({
          vocabulary: state.vocabulary.map((v) =>
            v.id === id ? { ...v, status, updatedAt: Date.now() } : v
          ),
        })),

      toggleShowAnswerMode: () =>
        set((state) => ({ showAnswerMode: !state.showAnswerMode })),

      setShowAnswerMode: (value) => set({ showAnswerMode: value }),

      getNewWords: () => get().vocabulary.filter((v) => v.status === 'new'),

      getMasteredWords: () => get().vocabulary.filter((v) => v.status === 'mastered'),

      isInVocabulary: (sentenceId) =>
        get().vocabulary.find((v) => v.sentenceId === sentenceId),
    }),
    {
      name: 'vocabulary-storage',
    }
  )
);
