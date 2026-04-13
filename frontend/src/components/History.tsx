import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { downloadConversion } from '../api';
import { useTranslation } from '../i18n/LanguageContext';
import type { Conversion } from '../types';

function formatBytes(bytes: number | null) {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function History() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    api
      .get('/convert/history')
      .then((res) => setItems(res.data))
      .catch(() => {
        toast.error(t('errors.loadHistory'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [t]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('historyTable.confirmDelete'))) return;
    try {
      await api.delete(`/convert/history/${id}`);
      toast.success(t('historyTable.deleted'));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(detail || t('errors.generic'));
    }
  };

  if (loading) {
    return <p className="text-gray-600">{t('historyTable.loading')}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
        {t('historyTable.empty')}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">{t('historyTable.originalFile')}</th>
            <th className="px-4 py-3 font-medium">{t('historyTable.size')}</th>
            <th className="px-4 py-3 font-medium">{t('historyTable.date')}</th>
            <th className="px-4 py-3 font-medium text-right">{t('historyTable.action')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{item.original_filename}</td>
              <td className="px-4 py-3 text-gray-600">{formatBytes(item.file_size)}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(item.created_at)}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => {
                      const name = item.original_filename.replace(/\.[^/.]+$/, '') + '.md';
                      downloadConversion(item.id, name).catch((err: any) => {
                        toast.error(err.message || t('errors.generic'));
                      });
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    {t('historyTable.download')}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition"
                  >
                    {t('historyTable.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
