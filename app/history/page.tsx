'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Clock, Trash2, Search, Eye, X, Download, Printer, Copy, CheckCircle2, Loader2, EyeOff } from 'lucide-react';
import Markdown from 'react-markdown';

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useLocalStorage<any[]>('soalgen-history', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [includeAnswers, setIncludeAnswers] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredHistory = history.filter(item => 
    item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus riwayat ini?')) {
      setHistory(history.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const clearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
      setHistory([]);
      setSelectedItem(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getContentString = (content: any, withAnswers: boolean) => {
    if (typeof content === 'string') return content;
    return content.map((q: any, i: number) => {
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
    if (!selectedItem) return;
    navigator.clipboard.writeText(getContentString(selectedItem.content, includeAnswers));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!selectedItem) return;
    const element = document.createElement("a");
    const file = new Blob([getContentString(selectedItem.content, includeAnswers)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Soal_${selectedItem.subject}_${selectedItem.level}${!includeAnswers ? '_TanpaKunci' : ''}.txt`;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hide-on-print">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Clock className="w-8 h-8 mr-3 text-indigo-500" />
            Riwayat Soal
          </h1>
          <p className="mt-2 text-slate-600 font-medium">Daftar soal yang pernah Anda buat sebelumnya.</p>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="inline-flex items-center px-4 py-2 border border-red-200 shadow-sm text-sm font-bold rounded-xl text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Semua
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List Section */}
        <div className={`lg:col-span-5 space-y-4 hide-on-print ${selectedItem ? 'hidden lg:block' : 'block'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari mata pelajaran, topik, atau tingkat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white shadow-sm placeholder-slate-400 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-bold">Tidak ada riwayat</p>
                <p className="text-sm mt-1 font-medium">Riwayat soal yang Anda buat akan muncul di sini.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredHistory.map((item) => (
                  <li 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-5 hover:bg-slate-50 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-indigo-600 truncate">
                          {item.subject} - {item.level}
                        </p>
                        <p className="text-base text-slate-900 truncate font-semibold mt-1">
                          {item.topic}
                        </p>
                        <div className="flex items-center mt-3 text-xs text-slate-500 space-x-2">
                          <span className="bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm font-semibold">
                            {item.count} Soal {item.type === 'multiple_choice' ? 'PG' : item.type === 'essay' ? 'Essay' : 'Hybrid'}
                          </span>
                          <span>•</span>
                          <span className="font-medium">{formatDate(item.date)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detail Section */}
        <div className={`lg:col-span-7 print-full-width ${!selectedItem ? 'hidden lg:block' : 'block'} ${!includeAnswers ? 'print-hide-answers' : ''}`}>
          {selectedItem ? (
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl min-h-[600px] flex flex-col overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-100 bg-slate-50/50 hide-on-print gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedItem.subject} - {selectedItem.topic}</h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {selectedItem.level} • {selectedItem.count} Soal {selectedItem.type === 'multiple_choice' ? 'Pilihan Ganda' : selectedItem.type === 'essay' ? 'Essay' : 'Hybrid'} • Dibuat dengan {selectedItem.model}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-wrap gap-3 hide-on-print items-center justify-between">
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

                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    title="Salin Teks"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center px-3 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    title="Download TXT"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    TXT
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
                    title="Print / Save PDF"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    PDF / Print
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 lg:p-8 bg-white">
                {typeof selectedItem.content === 'string' ? (
                  <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-700 prose-li:text-slate-700">
                    <Markdown>{selectedItem.content}</Markdown>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedItem.content.map((q: any, idx: number) => (
                      <div key={q.id} className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm print-full-width print-no-break">
                        <h3 className="font-extrabold text-lg text-slate-900 bg-slate-100 px-3 py-1 rounded-lg inline-block mb-4">Soal {idx + 1}</h3>
                        <div className="text-slate-800 text-base font-medium leading-relaxed mb-5 whitespace-pre-wrap">
                          {q.text}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-2.5 mb-6">
                            {q.options.map((opt: string, i: number) => (
                              <div key={i} className="flex items-start p-3.5 rounded-xl border border-slate-100 bg-slate-50">
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
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 min-h-[600px] flex flex-col items-center justify-center text-slate-400 hide-on-print">
              <div className="bg-slate-50 p-6 rounded-full mb-5 ring-8 ring-slate-50/50">
                <Eye className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-xl font-bold text-slate-600">Pilih Riwayat</p>
              <p className="text-sm mt-2 text-center max-w-sm font-medium">Pilih salah satu riwayat di samping untuk melihat detail soal dan mengekspornya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
