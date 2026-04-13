'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateQuestions, regenerateSingleQuestion, AIModel, Question } from '@/lib/ai';
import { Loader2, Sparkles, Copy, CheckCircle2, BookOpen, Download, Printer, Settings, RefreshCw, EyeOff, Eye, ChevronDown, Key } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [apiKeys] = useLocalStorage<Record<string, string>>('soalgen-api-keys', { gemini: '', openai: '', deepseek: '' });
  const [activeModel, setActiveModel] = useLocalStorage<AIModel>('soalgen-active-model', 'gemini');
  
  // Gunakan state biasa untuk currentHistoryId agar tidak membebani render dengan seluruh array history
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const [level, setLevel] = useState('SD');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [type, setType] = useState('multiple_choice');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Question[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  
  // New state for export options
  const [includeAnswers, setIncludeAnswers] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setResult(null);

    try {
      const generatedQuestions = await generateQuestions({
        level,
        subject,
        topic,
        count,
        type,
        model: activeModel,
        apiKeys
      });

      setResult(generatedQuestions);

      // Save to history di localStorage secara langsung (Optimasi)
      const newId = crypto.randomUUID();
      const newHistoryItem = {
        id: newId,
        date: new Date().toISOString(),
        level,
        subject,
        topic,
        count,
        type,
        model: activeModel,
        content: generatedQuestions
      };
      
      setCurrentHistoryId(newId);
      
      try {
        const currentHistory = JSON.parse(localStorage.getItem('soalgen-history') || '[]');
        localStorage.setItem('soalgen-history', JSON.stringify([newHistoryItem, ...currentHistory]));
      } catch (e) {
        console.error("Gagal menyimpan riwayat:", e);
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat generate soal.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQuestion = async (index: number) => {
    if (!result) return;
    const questionToReplace = result[index];
    setRegeneratingId(questionToReplace.id);
    setError('');
    
    try {
      const newQuestion = await regenerateSingleQuestion({
        level, subject, topic, count: 1, type, model: activeModel, apiKeys, oldQuestionText: questionToReplace.text
      });
      
      const newResult = [...result];
      newResult[index] = { ...newQuestion, id: crypto.randomUUID() };
      setResult(newResult);
      
      // Update the specific history item di localStorage secara langsung (Optimasi)
      if (currentHistoryId) {
        try {
          const currentHistory = JSON.parse(localStorage.getItem('soalgen-history') || '[]');
          const updatedHistory = currentHistory.map((item: any) => 
            item.id === currentHistoryId ? { ...item, content: newResult } : item
          );
          localStorage.setItem('soalgen-history', JSON.stringify(updatedHistory));
        } catch (e) {
          console.error("Gagal memperbarui riwayat:", e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal meregenerate soal.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const formatResultToString = (questions: Question[], withAnswers: boolean) => {
    return questions.map((q, i) => {
      let str = `Soal ${i + 1}:\n${q.text}\n`;
      if (q.options && q.options.length > 0) {
        str += q.options.join('\n') + '\n';
      }
      if (withAnswers) {
        str += `\nKunci Jawaban: ${q.answer}\n`;
      }
      return str;
    }).join('\n-----------------------------------\n\n');
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(formatResultToString(result, includeAnswers));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([formatResultToString(result, includeAnswers)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Soal_${subject}_${level}${!includeAnswers ? '_TanpaKunci' : ''}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-4 space-y-6 hide-on-print">
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center tracking-tight">
            <Sparkles className="w-6 h-6 mr-2 text-indigo-500" />
            Buat Soal Baru
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-6">Isi formulir di bawah ini untuk mulai membuat soal otomatis.</p>
          
          <form onSubmit={handleGenerate} className="space-y-6">
            {!hasApiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-base">Kunci Akses Belum Diatur</h3>
                  <p className="text-sm text-amber-700 mt-1 font-medium leading-relaxed">Anda memerlukan Kunci Akses (API Key) agar AI bisa bekerja membuatkan soal untuk Anda.</p>
                  <Link href="/settings" className="inline-flex items-center mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm transition-colors">
                    Atur Kunci Akses Sekarang &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Step 1: Topik Pembelajaran */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center mb-4">
                <span className="bg-indigo-100 text-indigo-700 w-7 h-7 rounded-full flex items-center justify-center text-sm mr-3 shadow-sm">1</span>
                Topik Pembelajaran
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tingkat Sekolah</label>
                <div className="relative">
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none font-medium text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                    <option value="Perguruan Tinggi">Perguruan Tinggi / Kuliah</option>
                    <option value="Umum">Umum</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mata Pelajaran</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Matematika, Sejarah, Bahasa Indonesia..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-slate-700 placeholder-slate-400 transition-colors hover:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Materi Spesifik</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Pecahan campuran, Perang Dunia II, Puisi lama..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none font-medium text-slate-700 placeholder-slate-400 transition-colors hover:bg-slate-50"
                  required
                />
              </div>
            </div>

            {/* Step 2: Format Soal */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center mb-4">
                <span className="bg-indigo-100 text-indigo-700 w-7 h-7 rounded-full flex items-center justify-center text-sm mr-3 shadow-sm">2</span>
                Format Soal
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Soal</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Soal</label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none font-medium text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <option value="multiple_choice">Pilihan Ganda</option>
                      <option value="essay">Essay (Uraian)</option>
                      <option value="hybrid">Campuran (PG & Essay)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Mesin AI */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center mb-4">
                <span className="bg-indigo-100 text-indigo-700 w-7 h-7 rounded-full flex items-center justify-center text-sm mr-3 shadow-sm">3</span>
                Mesin AI
              </h3>
              
              <div className="relative">
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value as AIModel)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Gratis & Cepat)</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !hasApiKey}
                className="w-full flex justify-center items-center px-4 py-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Sedang Membuat Soal...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-2" />
                    Buat Soal Sekarang
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </div>

      {/* Result Section */}
      <div className={`lg:col-span-8 print-full-width ${!includeAnswers ? 'print-hide-answers' : ''}`}>
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 lg:p-8 min-h-[600px] flex flex-col">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
            <div className="print-header">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hasil Pembuatan Soal</h2>
              <p className="text-sm text-slate-500 mt-1 hidden print:block">Mata Pelajaran: {subject} | Tingkat: {level} | Topik: {topic}</p>
            </div>
            {result && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto hide-on-print">
                {/* Toggle Answers */}
                <button
                  onClick={() => setIncludeAnswers(!includeAnswers)}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    includeAnswers 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {includeAnswers ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  {includeAnswers ? 'Tampilkan Jawaban' : 'Sembunyikan Jawaban'}
                </button>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center px-3 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Simpan TXT
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak / PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg hide-on-print">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-20"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                  <p className="text-lg font-bold">AI sedang menyusun soal untuk Anda...</p>
                  <p className="text-sm text-slate-400">Mohon tunggu sebentar.</p>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {result.map((q, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={q.id} 
                      className="p-6 lg:p-8 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow print-full-width print-no-break relative group"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <h3 className="font-extrabold text-lg text-indigo-900 bg-indigo-50 px-4 py-1.5 rounded-lg border border-indigo-100">Soal {idx + 1}</h3>
                        <button
                          onClick={() => handleRegenerateQuestion(idx)}
                          disabled={regeneratingId === q.id}
                          className="hide-on-print opacity-0 group-hover:opacity-100 transition-opacity p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center text-sm font-bold disabled:opacity-50"
                          title="Buat Ulang Soal Ini"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingId === q.id ? 'animate-spin' : ''}`} />
                          {regeneratingId === q.id ? 'Memproses...' : 'Buat Ulang'}
                        </button>
                      </div>
                      
                      <div className="text-slate-800 text-lg font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                        {q.text}
                      </div>
                      
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-3 mb-8">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-start p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all cursor-default">
                              <span className="text-slate-700 font-medium">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {includeAnswers && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 p-5 bg-emerald-50/80 border border-emerald-200 rounded-xl answer-block"
                        >
                          <span className="font-bold text-emerald-800 block mb-2 flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2" /> Kunci Jawaban & Penjelasan:
                          </span>
                          <span className="text-emerald-700 font-medium whitespace-pre-wrap leading-relaxed block mt-2">{q.answer}</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-400 py-20 hide-on-print"
                >
                  <div className="bg-slate-50 p-6 rounded-full mb-5 ring-8 ring-slate-50/50">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                  <p className="text-xl font-bold text-slate-600">Belum ada soal dibuat</p>
                  <p className="text-sm mt-2 text-center max-w-sm font-medium">Silakan isi formulir di samping dan klik "Buat Soal Sekarang" untuk memulai.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
