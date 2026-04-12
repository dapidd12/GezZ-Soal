'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Key, Save, ExternalLink, CheckCircle2, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [apiKeys, setApiKeys] = useLocalStorage<Record<string, string>>('soalgen-api-keys', {
    gemini: '',
    openai: '',
    deepseek: ''
  });
  const [activeModel, setActiveModel] = useLocalStorage<string>('soalgen-active-model', 'gemini');
  
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync local state when component mounts (to avoid hydration mismatch)
  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys]);

  const handleSave = () => {
    setApiKeys(localKeys);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const models = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Cepat dan gratis untuk penggunaan dasar.',
      url: 'https://aistudio.google.com/app/apikey',
      instructions: 'Login ke Google AI Studio, buat project baru atau pilih yang sudah ada, lalu klik "Create API Key".'
    },
    {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      description: 'Kualitas tinggi dengan model GPT-4o-mini.',
      url: 'https://platform.openai.com/api-keys',
      instructions: 'Login ke OpenAI Platform, masuk ke menu API Keys, lalu klik "Create new secret key". Pastikan Anda memiliki saldo (billing).'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Alternatif cerdas dengan harga terjangkau.',
      url: 'https://platform.deepseek.com/api_keys',
      instructions: 'Login ke DeepSeek Platform, masuk ke menu API Keys, lalu klik "Create new API key".'
    }
  ];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-indigo-500" />
          Pengaturan AI
        </h1>
        <p className="mt-2 text-slate-600 font-medium">Konfigurasi model AI dan Kunci Akses (API Key) untuk membuat soal.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 sm:p-6">
        <h3 className="font-bold text-indigo-900 mb-2 text-lg">Apa itu Kunci Akses (API Key)? 🤔</h3>
        <p className="text-indigo-800 text-sm leading-relaxed font-medium">
          API Key adalah semacam "kata sandi" khusus yang mengizinkan aplikasi ini untuk meminta bantuan AI (seperti Google Gemini atau ChatGPT) dalam membuatkan soal untuk Anda. 
          <br className="hidden sm:block" />
          <strong>Jangan khawatir!</strong> Untuk Google Gemini, Anda bisa mendapatkannya secara gratis dan cepat.
        </p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Pilih Model AI Default</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {models.map((model) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`border rounded-2xl p-5 cursor-pointer transition-all ${
                  activeModel === model.id
                    ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 shadow-sm'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{model.name}</h3>
                  {activeModel === model.id && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{model.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Konfigurasi API Key</h2>
          <p className="text-sm text-slate-500 font-medium mb-6">
            API Key disimpan secara lokal di browser Anda dan tidak pernah dikirim ke server kami.
          </p>

          <div className="space-y-6">
            {models.map((model) => (
              <div key={model.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center">
                    <Key className="w-4 h-4 mr-2 text-slate-500" />
                    {model.name} API Key
                  </h3>
                  <a
                    href={model.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mt-2 sm:mt-0 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Dapatkan API Key <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>
                
                <p className="text-xs text-indigo-800 mb-5 bg-indigo-100/50 p-3.5 rounded-xl border border-indigo-100 font-medium leading-relaxed">
                  <span className="font-bold">Petunjuk:</span> {model.instructions}
                </p>

                <input
                  type="password"
                  value={localKeys[model.id] || ''}
                  onChange={(e) => setLocalKeys({ ...localKeys, [model.id]: e.target.value })}
                  placeholder={`Masukkan ${model.name} API Key...`}
                  className="w-full px-4 py-3.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
          {saved && <span className="text-emerald-600 text-sm font-bold mr-4 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5"/> Tersimpan</span>}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="inline-flex items-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan Pengaturan
          </motion.button>
        </div>
      </div>
    </div>
  );
}
