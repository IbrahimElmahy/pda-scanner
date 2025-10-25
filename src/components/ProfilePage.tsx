import React, { useState } from 'react';
import { changePassword } from '../services/api';
import { User } from '../types';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور الجديدتان غير متطابقتين.' });
      return;
    }
    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.' });
        return;
    }

    setIsLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: response.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">الملف الشخصي</h2>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <p className="text-lg text-gray-600">
          مرحباً بك، <span className="font-bold">{user.username}</span>!
        </p>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="mb-4 text-xl font-semibold">تغيير كلمة المرور</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {message && (
            <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          <div>
            <label htmlFor="currentPassword"className="block text-sm font-medium text-gray-700">كلمة المرور الحالية</label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">تأكيد كلمة المرور الجديدة</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-lg font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <button
          onClick={onLogout}
          className="w-full px-6 py-3 text-lg font-medium text-red-700 bg-red-100 border border-transparent rounded-md shadow-sm hover:bg-red-200"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
