import { Link, useNavigate } from 'react-router-dom';
import { useUserStore, useGameStore } from '../stores';
import { formatDuration } from '../utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isGuest, records, progress, logout } = useUserStore();
  const { chapters } = useGameStore();

  // 计算统计数据
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const completedChapters = progress.filter(p => p.status === 'completed').length;
  const averageAccuracy = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.accuracy, 0) / records.length * 10) / 10
    : 0;
  const averageWpm = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.wpm, 0) / records.length)
    : 0;

  // 获取章节名称
  const getChapterName = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || chapterId;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        {/* 用户信息 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">
                  {isGuest ? '👤' : user?.nickname?.[0] || '👤'}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {isGuest ? '游客用户' : user?.nickname}
                </h1>
                {isGuest ? (
                  <p className="text-gray-500 text-sm">
                    <Link to="/login" className="text-blue-500 hover:underline">登录</Link> 可同步进度到云端
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                )}
              </div>
            </div>
            {!isGuest && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                退出登录
              </button>
            )}
          </div>
        </div>

        {/* 学习统计 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">学习统计</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">总练习时长</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(totalDuration)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">完成章节</p>
              <p className="text-2xl font-bold text-gray-800">{completedChapters}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">平均正确率</p>
              <p className="text-2xl font-bold text-green-600">{averageAccuracy}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">平均速度</p>
              <p className="text-2xl font-bold text-blue-600">{averageWpm} WPM</p>
            </div>
          </div>
        </div>

        {/* 历史记录 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">历史记录</h2>
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无练习记录</p>
          ) : (
            <div className="space-y-3">
              {[...records].reverse().slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{getChapterName(record.chapterId)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{record.wpm} WPM</p>
                    <p className="text-sm text-green-600">{record.accuracy}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
