import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import type { Conversion } from '../types';

export default function Converter() {
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
      toast.success('Conversion successful!');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Conversion failed';
      toast.error(msg);
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
            {uploading ? 'Converting, please wait…' : 'Drag & drop a file here, or click to browse'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: PDF, Word, PowerPoint, Excel, Images, Audio, HTML, and more.
          </p>
        </label>
      </div>

      {lastResult && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Last conversion</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">Original file</p>
              <p className="font-medium">{lastResult.original_filename}</p>
            </div>
            <a
              href={`/api/convert/download/${lastResult.id}`}
              download
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Download Markdown
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
