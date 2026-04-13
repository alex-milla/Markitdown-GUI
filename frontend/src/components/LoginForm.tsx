import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import type { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setBusy(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      await api.post(endpoint, { username, password });
      // Log in automatically to get the token
      const loginRes = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', loginRes.data.access_token);
      // Fetch current user info
      const meRes = await api.get('/auth/me');
      onLogin(meRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Unexpected error';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? 'Create account' : 'Sign in'}
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            placeholder="your_name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
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
          {busy ? 'Please wait…' : isRegister ? 'Register' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsRegister((v) => !v)}
          className="text-indigo-600 font-medium hover:underline"
        >
          {isRegister ? 'Sign in' : 'Register'}
        </button>
      </p>
    </div>
  );
}
