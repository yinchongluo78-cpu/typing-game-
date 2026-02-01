import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore, useUserStore, useVocabularyStore } from '../stores';
import {
  fetchChapter,
  saveRecord as saveRecordApi,
  updateProgressApi,
  preloadTTS,
  playPreloadedAudio,
  playTTS,
  clearAudioCache,
} from '../services/api';
import { calculateWPM, calculateAccuracy, generateId, preloadSounds, playSound } from '../utils';
import type { Chapter, Record } from '../types';

export default function PlayPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showCurrentAnswer, setShowCurrentAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const pauseStartRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    currentSentenceIndex,
    userInput,
    errors,
    startTime,
    isPlaying,
    isPaused,
    startGame,
    setUserInput,
    addError,
    nextSentence,
    pauseGame,
    resumeGame,
    endGame,
  } = useGameStore();

  const { updateProgress, addRecord, isGuest } = useUserStore();
  const { showAnswerMode, toggleShowAnswerMode, addToVocabulary, isInVocabulary } =
    useVocabularyStore();

  const currentSentence = chapter?.sentences[currentSentenceIndex];
  const totalSentences = chapter?.sentences.length || 0;
  const isLastSentence = currentSentenceIndex >= totalSentences - 1;

  // 获取当前句子的词汇状态
  const currentVocabItem = currentSentence ? isInVocabulary(currentSentence.id) : undefined;

  // 计算经过时间
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !isPaused && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime - pausedTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, startTime, pausedTime]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 预加载下一句语音
  const preloadNextSentence = useCallback(async () => {
    if (!chapter || isLastSentence) return;
    const nextSentenceData = chapter.sentences[currentSentenceIndex + 1];
    if (nextSentenceData) {
      try {
        const audio = await preloadTTS(nextSentenceData.content);
        nextAudioRef.current = audio;
      } catch (error) {
        console.error('预加载下一句语音失败:', error);
      }
    }
  }, [chapter, currentSentenceIndex, isLastSentence]);

  // 加载章节数据并预加载第一句语音
  useEffect(() => {
    preloadSounds();
    if (chapterId) {
      setIsReady(false);
      clearAudioCache();
      fetchChapter(chapterId).then(async (data) => {
        if (data) {
          setChapter(data);
          if (data.sentences.length > 0) {
            try {
              const audio = await preloadTTS(data.sentences[0].content);
              currentAudioRef.current = audio;
              if (data.sentences.length > 1) {
                const nextAudio = await preloadTTS(data.sentences[1].content);
                nextAudioRef.current = nextAudio;
              }
            } catch (error) {
              console.error('预加载语音失败:', error);
            }
          }
          setIsReady(true);
          startGame(chapterId);
        } else {
          navigate('/');
        }
      });
    }
    return () => {
      clearAudioCache();
    };
  }, [chapterId, navigate, startGame]);

  // 当准备好且开始游戏时，自动播放第一句
  useEffect(() => {
    if (isReady && isPlaying && currentSentenceIndex === 0 && currentAudioRef.current) {
      setIsPlayingAudio(true);
      playPreloadedAudio(currentAudioRef.current)
        .catch((error) => console.error('自动播放失败:', error))
        .finally(() => {
          setIsPlayingAudio(false);
          inputRef.current?.focus();
        });
    }
  }, [isReady, isPlaying, currentSentenceIndex]);

  // 当切换到新句子时，播放当前句子并预加载下一句
  useEffect(() => {
    if (!isReady || currentSentenceIndex === 0) return;
    setShowCurrentAnswer(false);
    setIsCorrect(null);

    if (nextAudioRef.current) {
      currentAudioRef.current = nextAudioRef.current;
      nextAudioRef.current = null;
      setIsPlayingAudio(true);
      playPreloadedAudio(currentAudioRef.current)
        .catch((error) => console.error('播放失败:', error))
        .finally(() => {
          setIsPlayingAudio(false);
          inputRef.current?.focus();
        });
    }
    preloadNextSentence();
  }, [currentSentenceIndex, isReady, preloadNextSentence]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isPlaying && !isPaused && !isPlayingAudio && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying, isPaused, isPlayingAudio]);

  // 计算总字符数
  const getTotalChars = useCallback(() => {
    if (!chapter) return 0;
    return chapter.sentences.reduce((sum, s) => sum + s.content.length, 0);
  }, [chapter]);

  // 手动播放当前句子语音
  const handlePlayAudio = useCallback(async () => {
    if (!currentSentence || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await playTTS(currentSentence.content);
    } catch (error) {
      console.error('播放语音失败:', error);
    } finally {
      setIsPlayingAudio(false);
      inputRef.current?.focus();
    }
  }, [currentSentence, isPlayingAudio]);

  // 完成练习
  const finishGame = useCallback(async () => {
    if (!chapter || !startTime) return;
    const endTime = Date.now();
    const totalDuration = endTime - startTime - pausedTime;
    const totalChars = getTotalChars();
    const wpm = calculateWPM(totalChars, totalDuration);
    const accuracy = calculateAccuracy(totalChars, errors.length);

    const record: Record = {
      id: generateId(),
      chapterId: chapter.id,
      wpm,
      accuracy,
      duration: Math.round(totalDuration / 1000),
      errorCount: errors.length,
      errors,
      createdAt: new Date().toISOString(),
    };

    addRecord(record);
    updateProgress(chapter.id, {
      status: 'completed',
      bestWpm: wpm,
      bestAccuracy: accuracy,
      lastPlayedAt: new Date().toISOString(),
    });

    if (!isGuest) {
      await Promise.all([
        saveRecordApi({
          chapterId: chapter.id,
          wpm,
          accuracy,
          duration: Math.round(totalDuration / 1000),
          errorCount: errors.length,
          errors,
        }),
        updateProgressApi(chapter.id, {
          status: 'completed',
          bestWpm: wpm,
          bestAccuracy: accuracy,
          lastPlayedAt: new Date().toISOString(),
        }),
      ]);
    }

    endGame();
    navigate(`/result/${record.id}`);
  }, [chapter, startTime, pausedTime, errors, getTotalChars, addRecord, updateProgress, isGuest, endGame, navigate]);

  // 提交答案
  const handleSubmit = useCallback(() => {
    if (!currentSentence || isPaused) return;

    const trimmedInput = userInput.trim().toLowerCase();
    const correctAnswer = currentSentence.content.trim().toLowerCase();

    if (trimmedInput === correctAnswer) {
      // 正确
      playSound('keyPress');
      setIsCorrect(true);
      setScore((prev) => prev + 100);

      setTimeout(() => {
        if (isLastSentence) {
          playSound('chapterComplete');
          finishGame();
        } else {
          playSound('sentenceComplete');
          nextSentence();
        }
      }, 500);
    } else {
      // 错误
      playSound('keyError');
      setIsCorrect(false);
      setShowCurrentAnswer(true);
      addError({
        position: 0,
        expected: currentSentence.content,
        actual: userInput,
        sentenceId: currentSentence.id,
      });
    }
  }, [currentSentence, isPaused, userInput, isLastSentence, finishGame, nextSentence, addError]);

  // 处理输入
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isPaused) return;
      setUserInput(e.target.value);
      setIsCorrect(null);
    },
    [isPaused, setUserInput]
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // 跳过当前题（错误后再次提交）
  const handleSkip = useCallback(() => {
    if (isLastSentence) {
      finishGame();
    } else {
      nextSentence();
    }
  }, [isLastSentence, finishGame, nextSentence]);

  // 标记为掌握
  const handleMarkMastered = useCallback(() => {
    if (!currentSentence || !chapter) return;
    addToVocabulary({
      content: currentSentence.content,
      translation: currentSentence.translation || '',
      chapterId: chapter.id,
      sentenceId: currentSentence.id,
      status: 'mastered',
    });
  }, [currentSentence, chapter, addToVocabulary]);

  // 标记为生词
  const handleMarkNew = useCallback(() => {
    if (!currentSentence || !chapter) return;
    addToVocabulary({
      content: currentSentence.content,
      translation: currentSentence.translation || '',
      chapterId: chapter.id,
      sentenceId: currentSentence.id,
      status: 'new',
    });
  }, [currentSentence, chapter, addToVocabulary]);

  // 显示答案
  const handleShowAnswer = useCallback(() => {
    setShowCurrentAnswer(true);
  }, []);

  // 暂停/继续
  const togglePause = useCallback(() => {
    if (isPaused) {
      if (pauseStartRef.current) {
        setPausedTime((prev) => prev + (Date.now() - pauseStartRef.current!));
        pauseStartRef.current = null;
      }
      resumeGame();
    } else {
      pauseStartRef.current = Date.now();
      pauseGame();
    }
  }, [isPaused, pauseGame, resumeGame]);

  // 退出
  const handleExit = useCallback(() => {
    if (chapter) {
      updateProgress(chapter.id, {
        status: 'in_progress',
        lastPlayedAt: new Date().toISOString(),
      });
    }
    navigate('/');
  }, [chapter, updateProgress, navigate]);

  // 生成下划线显示
  const renderUnderlines = () => {
    if (!currentSentence) return null;
    const words = currentSentence.content.split(' ');
    const inputWords = userInput.split(' ');

    return (
      <div className="flex flex-wrap justify-center gap-4">
        {words.map((word, wordIndex) => {
          const inputWord = inputWords[wordIndex] || '';
          return (
            <div key={wordIndex} className="flex flex-col items-center">
              <span className="text-2xl font-mono tracking-wider min-h-[2rem]">
                {inputWord || '\u00A0'}
              </span>
              <div
                className={`h-0.5 transition-colors ${
                  isCorrect === true
                    ? 'bg-green-500'
                    : isCorrect === false
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                }`}
                style={{ width: `${Math.max(word.length * 14, 40)}px` }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // 加载中状态
  if (!chapter || !currentSentence || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">正在准备语音...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 顶部信息栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← 返回
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{chapter.name}</h1>
              <p className="text-gray-500 text-sm">
                ({currentSentenceIndex + 1}/{totalSentences})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 看答案模式开关 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">看答案模式</span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  showAnswerMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                onClick={toggleShowAnswerMode}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    showAnswerMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
            <button
              onClick={togglePause}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm transition-colors"
            >
              {isPaused ? '继续' : '暂停'}
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSentenceIndex + 1) / totalSentences) * 100}%` }}
          />
        </div>

        {/* 分数和时间 */}
        <div className="text-center mb-8">
          <span className="text-gray-600">分数: </span>
          <span className="text-2xl font-bold text-blue-600">{score.toLocaleString()}</span>
          <span className="mx-4 text-gray-400">|</span>
          <span className="text-gray-600">⏱ {formatTime(elapsedTime)}</span>
        </div>

        {/* 暂停遮罩 */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">已暂停</h2>
              <button
                onClick={togglePause}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                继续练习
              </button>
            </div>
          </div>
        )}

        {/* 打字区域 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* 中文翻译（大字） */}
          <div className="text-center mb-6">
            <p className="text-3xl font-medium text-gray-800">
              {currentSentence.translation || '(无翻译)'}
            </p>
          </div>

          {/* 英文答案（默认隐藏，看答案模式或点击显示后显示） */}
          <div className="text-center mb-6 min-h-[2rem]">
            {(showAnswerMode || showCurrentAnswer) && (
              <p
                className={`text-xl font-mono ${
                  isCorrect === false ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {currentSentence.content}
              </p>
            )}
          </div>

          {/* 下划线输入区域 */}
          <div className="mb-6">{renderUnderlines()}</div>

          {/* 隐藏的实际输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isPaused}
            className={`w-full text-xl font-mono text-center p-4 border-2 rounded-lg focus:outline-none transition-colors ${
              isCorrect === true
                ? 'border-green-500 bg-green-50'
                : isCorrect === false
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="输入英文..."
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {/* 错误提示 */}
          {isCorrect === false && (
            <div className="mt-4 text-center">
              <p className="text-red-500 text-sm">答案错误，请重新输入或点击提交跳过</p>
            </div>
          )}

          {/* 功能按钮栏 */}
          <div className="flex justify-center gap-4 mt-6">
            {/* 播放发音 */}
            <button
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isPlayingAudio
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
              }`}
              title="播放发音"
            >
              <span>🔊</span>
              <span className="text-sm">播放</span>
            </button>

            {/* 掌握 */}
            <button
              onClick={handleMarkMastered}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentVocabItem?.status === 'mastered'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-50 hover:bg-green-100 text-green-600'
              }`}
              title="标记为掌握"
            >
              <span>✓</span>
              <span className="text-sm">掌握</span>
            </button>

            {/* 生词 */}
            <button
              onClick={handleMarkNew}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentVocabItem?.status === 'new'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600'
              }`}
              title="标记为生词"
            >
              <span>★</span>
              <span className="text-sm">生词</span>
            </button>

            {/* 提交 */}
            <button
              onClick={isCorrect === false ? handleSkip : handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title={isCorrect === false ? '跳过' : '提交 (Enter)'}
            >
              <span>→</span>
              <span className="text-sm">{isCorrect === false ? '跳过' : '提交'}</span>
            </button>

            {/* 显示答案 */}
            <button
              onClick={handleShowAnswer}
              disabled={showAnswerMode || showCurrentAnswer}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showAnswerMode || showCurrentAnswer
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
              }`}
              title="显示答案"
            >
              <span>👁</span>
              <span className="text-sm">答案</span>
            </button>
          </div>

          {/* 错误计数 */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            错误次数: <span className={errors.length > 0 ? 'text-red-500' : ''}>{errors.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
