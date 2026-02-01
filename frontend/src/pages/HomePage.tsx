import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore, useUserStore, useVocabularyStore } from '../stores';
import { fetchChapters } from '../services/api';

export default function HomePage() {
  const { chapters, setChapters } = useGameStore();
  const { progress, user, isGuest } = useUserStore();
  const { vocabulary } = useVocabularyStore();

  // 词汇统计
  const newWordsCount = vocabulary.filter(v => v.status === 'new').length;
  const masteredWordsCount = vocabulary.filter(v => v.status === 'mastered').length;

  useEffect(() => {
    fetchChapters().then(setChapters);
  }, [setChapters]);

  const getProgressForChapter = (chapterId: string) => {
    return progress.find(p => p.chapterId === chapterId);
  };

  const getStatusBadge = (chapterId: string) => {
    const p = getProgressForChapter(chapterId);
    if (!p || p.status === 'not_started') {
      return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">未开始</span>;
    }
    if (p.status === 'in_progress') {
      return <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-700 rounded">进行中</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-200 text-green-700 rounded">已完成</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">英语打字练习</h1>
            <p className="text-gray-600">选择一个章节开始练习</p>
          </div>
          <div className="flex items-center gap-3">
            {isGuest ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  注册
                </Link>
              </>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">{user?.nickname?.[0] || '👤'}</span>
                </div>
                <span className="text-gray-700">{user?.nickname}</span>
              </Link>
            )}
          </div>
        </div>

        {/* 游客提示 */}
        {isGuest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              当前为游客模式，数据仅保存在本地浏览器。
              <Link to="/login" className="text-blue-600 hover:underline ml-1">登录</Link>
              可同步进度到云端。
            </p>
          </div>
        )}

        {/* 词汇快捷入口 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            to="/vocabulary"
            className="flex items-center justify-between bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">生词本</p>
                <p className="text-sm text-gray-500">{newWordsCount} 个生词</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/mastered"
            className="flex items-center justify-between bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">熟练词</p>
                <p className="text-sm text-gray-500">{masteredWordsCount} 个熟练</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 章节列表 */}
        <div className="grid gap-4">
          {chapters.map((chapter) => {
            const p = getProgressForChapter(chapter.id);
            return (
              <Link
                key={chapter.id}
                to={`/play/${chapter.id}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{chapter.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{chapter.sentenceCount} 个句子</p>
                    {p && p.status === 'completed' && p.bestWpm && p.bestAccuracy && (
                      <p className="text-sm text-blue-600 mt-2">
                        最佳成绩: {p.bestWpm} WPM · {p.bestAccuracy}% 正确率
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(chapter.id)}
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            加载中...
          </div>
        )}
      </div>
    </div>
  );
}
