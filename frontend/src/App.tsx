import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import Converter from './components/Converter';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import { useTranslation } from './i18n/LanguageContext';
import api from './api';
import type { User } from './types';

function App() {
  const { t, lang, setLang } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'convert' | 'history' | 'admin'>('convert');

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
    toast.success(`${t('welcome')}, ${u.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('convert');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg font-medium">{t('loading')}</span>
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
            <h1 className="text-xl font-bold text-indigo-600">{t('appName')}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="lang-select" className="text-sm text-gray-600 hidden sm:inline">{t('language')}:</label>
                <select
                  id="lang-select"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as 'es' | 'en')}
                  className="text-sm border rounded-md px-2 py-1 bg-white"
                >
                  <option value="es">{t('languages.es')}</option>
                  <option value="en">{t('languages.en')}</option>
                </select>
              </div>
              <span className="text-sm text-gray-600">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                {t('logout')}
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
              {t('convert')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('history')}
            </button>
            {user.is_admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('admin')}
              </button>
            )}
          </div>

          {activeTab === 'convert' && <Converter />}
          {activeTab === 'history' && <History />}
          {activeTab === 'admin' && user.is_admin && <AdminPanel />}
        </main>
      </div>
    </>
  );
}

export default App;
