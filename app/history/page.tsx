'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Clock, Trash2, Search, Eye, X, Download, Printer, Copy, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';

export default function HistoryPage() {
  const [history, setHistory] = useLocalStorage<any[]>('soalgen-history', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (!selectedItem) return;
    navigator.clipboard.writeText(selectedItem.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!selectedItem) return;
    const element = document.createElement("a");
    const file = new Blob([selectedItem.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Soal_${selectedItem.subject}_${selectedItem.level}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hide-on-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Soal</h1>
          <p className="mt-2 text-gray-600">Daftar soal yang pernah Anda buat sebelumnya.</p>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Semua
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List Section */}
        <div className="lg:col-span-5 space-y-4 hide-on-print">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari mata pelajaran, topik, atau tingkat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white shadow-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">Tidak ada riwayat</p>
                <p className="text-sm mt-1">Riwayat soal yang Anda buat akan muncul di sini.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredHistory.map((item) => (
                  <li 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-600 truncate">
                          {item.subject} - {item.level}
                        </p>
                        <p className="text-base text-gray-900 truncate font-medium mt-1">
                          {item.topic}
                        </p>
                        <div className="flex items-center mt-3 text-xs text-gray-500 space-x-2">
                          <span className="bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                            {item.count} Soal {item.type === 'multiple_choice' ? 'PG' : 'Essay'}
                          </span>
                          <span>•</span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
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
        <div className="lg:col-span-7 print-full-width">
          {selectedItem ? (
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 lg:p-8 min-h-[600px] flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 hide-on-print gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedItem.subject} - {selectedItem.topic}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedItem.level} • {selectedItem.count} Soal {selectedItem.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'} • Dibuat dengan {selectedItem.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    title="Salin Teks"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    title="Download TXT"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                    title="Print / Save PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="ml-2 text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-700 prose-li:text-gray-700">
                <Markdown>{selectedItem.content}</Markdown>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 min-h-[600px] flex flex-col items-center justify-center text-gray-400 hide-on-print">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <Eye className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">Pilih Riwayat</p>
              <p className="text-sm mt-1 text-center max-w-sm">Pilih salah satu riwayat di samping untuk melihat detail soal dan mengekspornya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
