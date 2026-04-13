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
    'No filename provided': 'errors.generic',
    'File not found': 'errors.generic',
    'File missing on disk': 'errors.generic',
  };
  const key = detail && map[detail] ? map[detail] : 'errors.generic';
  return t(key);
}

export default function LoginForm({ onLogin }: Props) {
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error(t('errors.fillFields'));
      return;
    }
    setBusy(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      await api.post(endpoint, { username, password });
      const loginRes = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', loginRes.data.access_token);
      const meRes = await api.get('/auth/me');
      onLogin(meRes.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(translateError(t, detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? t('login.registerTitle') : t('login.title')}
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('login.username')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            placeholder="your_name"
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
          {busy ? '…' : isRegister ? t('login.registerSubmit') : t('login.submit')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {isRegister ? t('login.hasAccount') : t('login.noAccount')}{' '}
        <button
          type="button"
          onClick={() => setIsRegister((v) => !v)}
          className="text-indigo-600 font-medium hover:underline"
        >
          {isRegister ? t('login.loginLink') : t('login.registerLink')}
        </button>
      </p>
    </div>
  );
}
