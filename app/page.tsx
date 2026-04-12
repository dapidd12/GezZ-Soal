'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateQuestions, regenerateSingleQuestion, AIModel, Question } from '@/lib/ai';
import { Loader2, Sparkles, Copy, CheckCircle2, BookOpen, Download, Printer, Settings, RefreshCw, EyeOff, Eye } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [apiKeys] = useLocalStorage<Record<string, string>>('soalgen-api-keys', { gemini: '', openai: '', deepseek: '' });
  const [activeModel, setActiveModel] = useLocalStorage<AIModel>('soalgen-active-model', 'gemini');
  const [history, setHistory] = useLocalStorage<any[]>('soalgen-history', []);

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
        content: generatedQuestions
      };
      setHistory([newHistoryItem, ...history]);

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
      
      // Update the latest history item if it exists
      if (history.length > 0) {
        const newHistory = [...history];
        newHistory[0].content = newResult;
        setHistory(newHistory);
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
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center tracking-tight">
            <Sparkles className="w-6 h-6 mr-2 text-indigo-500" />
            Generator Soal
          </h2>
          
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* AI Model Selection */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5 rounded-xl border border-indigo-100/50">
              <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center justify-between">
                <span>Model AI</span>
                <Link href="/settings" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium bg-white/50 px-2 py-1 rounded-md">
                  <Settings className="w-3 h-3 mr-1" /> Pengaturan API
                </Link>
              </label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value as AIModel)}
                className="w-full px-3 py-2.5 border border-indigo-200/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-slate-700"
              >
                <option value="gemini">Google Gemini (Gratis/Cepat)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="deepseek">DeepSeek</option>
              </select>

              {!hasApiKey && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="font-semibold flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>API Key belum diatur!</p>
                  <Link href="/settings" className="underline hover:text-red-800 mt-1 block ml-4">
                    Klik di sini untuk mengatur API Key {activeModel}
                  </Link>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tingkat Sekolah</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mata Pelajaran</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Matematika, Sejarah..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Topik / Materi</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Pecahan, Perang Dunia II..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jumlah Soal</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Soal</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                >
                  <option value="multiple_choice">Pilihan Ganda</option>
                  <option value="essay">Essay</option>
                  <option value="hybrid">Hybrid (PG & Essay)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || !hasApiKey}
                className="w-full flex justify-center items-center px-4 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
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
      <div className={`lg:col-span-8 print-full-width ${!includeAnswers ? 'print-hide-answers' : ''}`}>
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 lg:p-8 min-h-[600px] flex flex-col">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 border-b border-slate-100 pb-4 hide-on-print gap-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hasil Generate</h2>
            {result && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
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
                  {includeAnswers ? 'Kunci Jawaban: Tampil' : 'Kunci Jawaban: Sembunyi'}
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
                    TXT
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    PDF / Print
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
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-20">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className="text-lg font-bold">AI sedang menyusun soal untuk Anda...</p>
                <p className="text-sm text-slate-400">Mohon tunggu sebentar.</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {result.map((q, idx) => (
                  <div key={q.id} className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm print-full-width print-no-break relative group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-extrabold text-lg text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">Soal {idx + 1}</h3>
                      <button
                        onClick={() => handleRegenerateQuestion(idx)}
                        disabled={regeneratingId === q.id}
                        className="hide-on-print opacity-0 group-hover:opacity-100 transition-opacity p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center text-sm font-bold disabled:opacity-50"
                        title="Regenerate Soal Ini"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingId === q.id ? 'animate-spin' : ''}`} />
                        {regeneratingId === q.id ? 'Memproses...' : 'Regenerate'}
                      </button>
                    </div>
                    
                    <div className="text-slate-800 text-base font-medium leading-relaxed mb-5 whitespace-pre-wrap">
                      {q.text}
                    </div>
                    
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-2.5 mb-6">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-start p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-slate-700 font-medium">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {includeAnswers && (
                      <div className="mt-6 p-5 bg-emerald-50/80 border border-emerald-100 rounded-xl answer-block">
                        <span className="font-bold text-emerald-800 block mb-2 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Kunci Jawaban & Penjelasan:
                        </span>
                        <span className="text-emerald-700 font-medium whitespace-pre-wrap leading-relaxed">{q.answer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 hide-on-print">
                <div className="bg-slate-50 p-6 rounded-full mb-5 ring-8 ring-slate-50/50">
                  <BookOpen className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-xl font-bold text-slate-600">Belum ada soal</p>
                <p className="text-sm mt-2 text-center max-w-sm font-medium">Silakan isi form di samping dan klik Generate untuk membuat soal secara otomatis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
