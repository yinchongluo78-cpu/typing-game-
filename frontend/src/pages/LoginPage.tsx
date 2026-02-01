import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, syncGuestData, fetchProgress, fetchRecords } from '../services/api';
import { useUserStore } from '../stores';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const {
    loginSuccess,
    progress: guestProgress,
    records: guestRecords,
    setProgress,
    setRecords,
    clearGuestData,
  } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success && result.data) {
      loginSuccess(result.data.user, result.data.token);

      // 检查是否有游客数据需要同步
      if (guestProgress.length > 0 || guestRecords.length > 0) {
        setSyncing(true);
        const syncResult = await syncGuestData({
          progress: guestProgress,
          records: guestRecords.map(r => ({
            chapterId: r.chapterId,
            wpm: r.wpm,
            accuracy: r.accuracy,
            duration: r.duration,
            errorCount: r.errorCount,
            errors: r.errors,
            createdAt: r.createdAt,
          })),
        });

        if (syncResult.success) {
          clearGuestData();
        }
        setSyncing(false);
      }

      // 从服务器加载用户数据
      const [progressResult, recordsResult] = await Promise.all([
        fetchProgress(),
        fetchRecords(),
      ]);

      if (progressResult.success && progressResult.data) {
        setProgress(progressResult.data);
      }
      if (recordsResult.success && recordsResult.data) {
        setRecords(recordsResult.data);
      }

      setLoading(false);
      navigate('/');
    } else {
      setLoading(false);
      setError(result.message || '登录失败，请检查邮箱和密码');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">登录</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {(guestProgress.length > 0 || guestRecords.length > 0) && (
              <p className="text-blue-600 text-sm bg-blue-50 p-2 rounded">
                检测到本地有 {guestRecords.length} 条练习记录，登录后将自动同步到云端
              </p>
            )}

            <button
              type="submit"
              disabled={loading || syncing}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors"
            >
              {syncing ? '同步数据中...' : loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            还没有账号？
            <Link to="/register" className="text-blue-500 hover:underline ml-1">立即注册</Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
              以游客身份继续
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
