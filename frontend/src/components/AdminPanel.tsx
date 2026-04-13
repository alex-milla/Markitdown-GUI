import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTranslation } from '../i18n/LanguageContext';
import type { User } from '../types';

export default function AdminPanel() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const [upgradePending, setUpgradePending] = useState(false);
  const [upgradeLog, setUpgradeLog] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(detail || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUpgradeStatus = async () => {
    try {
      const res = await api.get('/auth/upgrade/status');
      setUpgradePending(res.data.pending);
      setUpgradeLog(res.data.log);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUpgradeStatus();
    const interval = setInterval(fetchUpgradeStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      toast.error(t('errors.fillFields'));
      return;
    }
    setCreating(true);
    try {
      await api.post('/auth/register', { username: newUsername, password: newPassword });
      toast.success(t('adminPanel.userCreated'));
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(detail || t('errors.generic'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('adminPanel.confirmDelete'))) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success(t('adminPanel.userDeleted'));
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(detail || t('errors.generic'));
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await api.post('/auth/upgrade');
      toast.success(res.data.detail);
      setUpgradePending(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(detail || t('errors.generic'));
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('adminPanel.systemTitle')}</h3>
          <button
            onClick={handleUpgrade}
            disabled={upgrading || upgradePending}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {upgradePending ? t('adminPanel.upgradePending') : t('adminPanel.upgradeBtn')}
          </button>
        </div>
        {upgradePending && (
          <p className="text-sm text-amber-600 mb-2">{t('adminPanel.upgradePendingMsg')}</p>
        )}
        {upgradeLog && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t('adminPanel.upgradeLog')}</p>
            <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-md max-h-48 overflow-auto whitespace-pre-wrap">
              {upgradeLog}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">{t('adminPanel.createUser')}</h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700">{t('adminPanel.username')}</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700">{t('adminPanel.password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {creating ? '…' : t('adminPanel.createSubmit')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">{t('adminPanel.username')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Admin</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">{t('historyTable.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">{t('loading')}</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">{t('adminPanel.noUsers')}</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{u.is_admin ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:underline"
                    >
                      {t('adminPanel.deleteUser')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
