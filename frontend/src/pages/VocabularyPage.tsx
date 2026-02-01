import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVocabularyStore, useGameStore } from '../stores';
import { playTTS } from '../services/api';
import type { VocabularyItem } from '../types';

export default function VocabularyPage() {
  const { vocabulary, updateVocabularyStatus, removeFromVocabulary } = useVocabularyStore();
  const { chapters } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // 获取生词列表
  const newWords = useMemo(() => {
    return vocabulary
      .filter((v) => v.status === 'new')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [vocabulary]);

  // 搜索过滤
  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return newWords;
    const term = searchTerm.toLowerCase();
    return newWords.filter(
      (v) =>
        v.content.toLowerCase().includes(term) ||
        v.translation.toLowerCase().includes(term)
    );
  }, [newWords, searchTerm]);

  // 获取章节名称
  const getChapterName = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.name || '未知章节';
  };

  // 播放语音
  const handlePlay = async (item: VocabularyItem) => {
    if (playingId === item.id) return;
    setPlayingId(item.id);
    try {
      await playTTS(item.content);
    } catch (error) {
      console.error('播放失败:', error);
    } finally {
      setPlayingId(null);
    }
  };

  // 标记为熟练
  const handleMarkMastered = (id: string) => {
    updateVocabularyStatus(id, 'mastered');
  };

  // 删除词汇
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个词汇吗？')) {
      removeFromVocabulary(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">生词本</h1>
              <p className="text-gray-500 text-sm">共 {newWords.length} 个生词</p>
            </div>
          </div>
          <Link
            to="/mastered"
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            熟练词 ({vocabulary.filter(v => v.status === 'mastered').length})
          </Link>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索生词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 词汇列表 */}
        {filteredWords.length > 0 ? (
          <div className="space-y-4">
            {filteredWords.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-800">{item.content}</p>
                    <p className="text-gray-600 mt-1">{item.translation}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      来自: {getChapterName(item.chapterId)} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {/* 播放按钮 */}
                    <button
                      onClick={() => handlePlay(item)}
                      disabled={playingId === item.id}
                      className={`p-2 rounded-lg transition-colors ${
                        playingId === item.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="播放语音"
                    >
                      {playingId === item.id ? (
                        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                    {/* 标记熟练按钮 */}
                    <button
                      onClick={() => handleMarkMastered(item.id)}
                      className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                      title="标记为熟练"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchTerm ? (
              <p className="text-gray-500">没有找到匹配的生词</p>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">还没有添加生词</p>
                <Link
                  to="/"
                  className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  开始练习
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
