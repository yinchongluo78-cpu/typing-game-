import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUserStore, useGameStore } from '../stores';
import { formatDuration } from '../utils';
import type { Record, ChapterListItem } from '../types';

export default function ResultPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { records } = useUserStore();
  const { chapters } = useGameStore();
  const [record, setRecord] = useState<Record | null>(null);
  const [chapter, setChapter] = useState<ChapterListItem | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const found = records.find(r => r.id === recordId);
    if (found) {
      setRecord(found);
      const ch = chapters.find(c => c.id === found.chapterId);
      setChapter(ch || null);
    } else {
      navigate('/');
    }
  }, [recordId, records, chapters, navigate]);

  if (!record || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  // 找到下一章
  const nextChapter = chapters.find(c => c.order === chapter.order + 1);

  // 获取评级
  const getRating = () => {
    if (record.accuracy >= 98 && record.wpm >= 60) return { text: '完美!', color: 'text-yellow-500', emoji: '🌟' };
    if (record.accuracy >= 95 && record.wpm >= 40) return { text: '优秀!', color: 'text-green-500', emoji: '🎉' };
    if (record.accuracy >= 90 && record.wpm >= 30) return { text: '良好', color: 'text-blue-500', emoji: '👍' };
    if (record.accuracy >= 80) return { text: '继续加油', color: 'text-orange-500', emoji: '💪' };
    return { text: '需要练习', color: 'text-gray-500', emoji: '📚' };
  };

  const rating = getRating();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{rating.emoji}</div>
          <h1 className={`text-3xl font-bold ${rating.color}`}>{rating.text}</h1>
          <p className="text-gray-600 mt-2">{chapter.name} 练习完成</p>
        </div>

        {/* 成绩卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">打字速度</p>
              <p className="text-4xl font-bold text-blue-600">{record.wpm}</p>
              <p className="text-gray-400 text-sm">WPM</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">正确率</p>
              <p className="text-4xl font-bold text-green-600">{record.accuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">用时</p>
              <p className="text-2xl font-semibold text-gray-700">{formatDuration(record.duration)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">错误次数</p>
              <p className="text-2xl font-semibold text-red-500">{record.errorCount}</p>
            </div>
          </div>
        </div>

        {/* 错误详情 */}
        {record.errors.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-gray-700">错误详情</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showErrors ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showErrors && (
              <div className="mt-4 space-y-2">
                {record.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-4 text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">位置 {error.position + 1}</span>
                    <span className="text-green-600">期望: "{error.expected}"</span>
                    <span className="text-red-600">输入: "{error.actual}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <Link
            to={`/play/${chapter.id}`}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-center rounded-lg font-semibold transition-colors"
          >
            再来一局
          </Link>
          {nextChapter && (
            <Link
              to={`/play/${nextChapter.id}`}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-center rounded-lg font-semibold transition-colors"
            >
              下一章: {nextChapter.name}
            </Link>
          )}
          <Link
            to="/"
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-center rounded-lg font-semibold transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
