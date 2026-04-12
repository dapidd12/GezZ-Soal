'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateQuestions, AIModel } from '@/lib/ai';
import { Loader2, Sparkles, Copy, CheckCircle2, BookOpen, Download, Printer, Settings } from 'lucide-react';
import Markdown from 'react-markdown';
import Link from 'next/link';

export default function Home() {
  const [apiKeys] = useLocalStorage<Record<string, string>>('soalgen-api-keys', { gemini: '', openai: '', deepseek: '' });
  const [activeModel, setActiveModel] = useLocalStorage<AIModel>('soalgen-active-model', 'gemini');
  const [history, setHistory] = useLocalStorage<any[]>('soalgen-history', []);

  const [level, setLevel] = useState('SD');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [type, setType] = useState('multiple_choice');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const hasApiKey = !!apiKeys[activeModel];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic) {
      setError('Mata pelajaran dan topik harus diisi.');
      return;
    }
    if (!hasApiKey) {
      setError(`API Key untuk model ${activeModel} belum diatur. Silakan atur di menu Settings.`);
      return;
    }
    
    setLoading(true);
    setError('');
    setResult('');

    try {
      const generatedText = await generateQuestions({
        level,
        subject,
        topic,
        count,
        type,
        model: activeModel,
        apiKeys
      });

      setResult(generatedText);

      // Save to history
      const newHistoryItem = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        level,
        subject,
        topic,
        count,
        type,
        model: activeModel,
        content: generatedText
      };
      setHistory([newHistoryItem, ...history]);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat generate soal.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Soal_${subject}_${level}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-4 space-y-6 hide-on-print">
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
            Generator Soal
          </h2>
          
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* AI Model Selection - Made Prominent */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-semibold text-blue-900 mb-2 flex items-center justify-between">
                <span>Model AI</span>
                <Link href="/settings" className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-normal">
                  <Settings className="w-3 h-3 mr-1" /> Pengaturan API
                </Link>
              </label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value as AIModel)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="gemini">Google Gemini (Gratis/Cepat)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="deepseek">DeepSeek</option>
              </select>

              {!hasApiKey && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                  <p className="font-medium">API Key belum diatur!</p>
                  <Link href="/settings" className="underline hover:text-red-800">
                    Klik di sini untuk mengatur API Key {activeModel}
                  </Link>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Sekolah</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
                <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Matematika, Sejarah..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topik / Materi</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Pecahan, Perang Dunia II..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Soal</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Soal</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="multiple_choice">Pilihan Ganda</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading || !hasApiKey}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Menyusun Soal...
                  </>
                ) : (
                  'Generate Soal Sekarang'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Result Section */}
      <div className="lg:col-span-8 print-full-width">
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 lg:p-8 min-h-[600px] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 hide-on-print gap-4">
            <h2 className="text-xl font-bold text-gray-900">Hasil Generate</h2>
            {result && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  TXT
                </button>
                <button
                  onClick={handlePrintPdf}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  PDF / Print
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg hide-on-print">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-lg font-medium">AI sedang menyusun soal untuk Anda...</p>
                <p className="text-sm text-gray-400">Mohon tunggu sebentar.</p>
              </div>
            ) : result ? (
              <div className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-700 prose-li:text-gray-700">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 hide-on-print">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <BookOpen className="w-12 h-12 text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-500">Belum ada soal</p>
                <p className="text-sm mt-1 text-center max-w-sm">Silakan isi form di samping dan klik Generate untuk membuat soal secara otomatis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
