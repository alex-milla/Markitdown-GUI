import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api, { downloadConversion } from '../api';
import { useTranslation } from '../i18n/LanguageContext';
import type { Conversion } from '../types';

function translateError(t: (key: string) => string, detail?: string): string {
  const map: Record<string, string> = {
    'Conversion failed': 'converter.error',
    'No filename provided': 'errors.generic',
  };
  if (!detail) return t('errors.generic');
  if (map[detail]) return t(map[detail]);
  // If the backend sent a descriptive message after "Conversion failed: ", show it.
  if (detail.startsWith('Conversion failed: ')) {
    return detail.slice('Conversion failed: '.length);
  }
  return detail;
}

export default function Converter() {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<Conversion | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/convert/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLastResult(res.data);
      toast.success(t('converter.success'));
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(translateError(t, detail));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition ${
          dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-white'
        }`}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <p className="text-lg font-medium text-gray-700">
            {uploading ? t('converter.uploading') : t('converter.dragDrop')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t('converter.supportedFormats')}
          </p>
          <p className="text-xs text-amber-600 mt-2">
            {t('converter.clearStructureHint')}
          </p>
        </label>
      </div>

      {lastResult && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">{t('converter.lastConversion')}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">{t('converter.originalFile')}</p>
              <p className="font-medium">{lastResult.original_filename}</p>
            </div>
            <button
              onClick={() => {
                const name = lastResult.original_filename.replace(/\.[^/.]+$/, '') + '.md';
                downloadConversion(lastResult.id, name).catch((err: any) => {
                  toast.error(err.message || t('errors.generic'));
                });
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              {t('converter.downloadMarkdown')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
