import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTranslation } from '../i18n/LanguageContext';
import type { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

function translateError(t: (key: string) => string, detail?: string): string {
  const map: Record<string, string> = {
    'Username already registered': 'errors.usernameExists',
    'Invalid credentials': 'errors.invalidCredentials',
    'Could not validate credentials': 'errors.invalidCredentials',
    'Current password is incorrect': 'errors.invalidCredentials',
    'No filename provided': 'errors.generic',
    'File not found': 'errors.generic',
    'File missing on disk': 'errors.generic',
    'Admin access required': 'errors.adminOnly',
  };
  const key = detail && map[detail] ? map[detail] : 'errors.generic';
  return t(key);
}

export default function LoginForm({ onLogin }: Props) {
  const { t } = useTranslation();
  const [mustChange, setMustChange] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error(t('errors.fillFields'));
      return;
    }
    setBusy(true);
    try {
      const loginRes = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', loginRes.data.access_token);
      if (loginRes.data.must_change_password) {
        setMustChange(true);
        setCurrentPassword(password);
      } else {
        const meRes = await api.get('/auth/me');
        onLogin(meRes.data);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(translateError(t, detail));
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error(t('errors.fillFields'));
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(t('login.passwordChanged'));
      const meRes = await api.get('/auth/me');
      onLogin(meRes.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(translateError(t, detail));
    } finally {
      setBusy(false);
    }
  };

  if (mustChange) {
    return (
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('login.changePasswordTitle')}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('login.currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('login.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {busy ? '…' : t('login.changePasswordSubmit')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border">
      <h2 className="text-2xl font-bold mb-6 text-center">{t('login.title')}</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('login.username')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            placeholder="admin"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          {busy ? '…' : t('login.submit')}
        </button>
      </form>
    </div>
  );
}
