import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import Converter from './components/Converter';
import History from './components/History';
import api from './api';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'convert' | 'history'>('convert');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    toast.success(`Welcome, ${u.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('convert');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg font-medium">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <div className="min-h-screen flex items-center justify-center p-4">
          <LoginForm onLogin={handleLogin} />
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-indigo-600">MarkItDown GUI</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('convert')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'convert'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              Convert
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              History
            </button>
          </div>

          {activeTab === 'convert' ? <Converter /> : <History />}
        </main>
      </div>
    </>
  );
}

export default App;
