'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Key, Save, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useLocalStorage<Record<string, string>>('soalgen-api-keys', {
    gemini: '',
    openai: '',
    deepseek: ''
  });
  const [activeModel, setActiveModel] = useLocalStorage<string>('soalgen-active-model', 'gemini');
  
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan AI</h1>
        <p className="mt-2 text-gray-600">Konfigurasi model AI dan API Key untuk generate soal.</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 lg:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pilih Model AI Default</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`border rounded-xl p-5 cursor-pointer transition-all ${
                  activeModel === model.id
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{model.name}</h3>
                  {activeModel === model.id && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{model.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Konfigurasi API Key</h2>
          <p className="text-sm text-gray-500 mb-6">
            API Key disimpan secara lokal di browser Anda dan tidak pernah dikirim ke server kami.
          </p>

          <div className="space-y-6">
            {models.map((model) => (
              <div key={model.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Key className="w-4 h-4 mr-2 text-gray-500" />
                    {model.name} API Key
                  </h3>
                  <a
                    href={model.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2 sm:mt-0 font-medium"
                  >
                    Dapatkan API Key <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                
                <p className="text-xs text-blue-800 mb-4 bg-blue-100/50 p-3 rounded-lg border border-blue-100 leading-relaxed">
                  <span className="font-bold">Petunjuk:</span> {model.instructions}
                </p>

                <input
                  type="password"
                  value={localKeys[model.id] || ''}
                  onChange={(e) => setLocalKeys({ ...localKeys, [model.id]: e.target.value })}
                  placeholder={`Masukkan ${model.name} API Key...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
          {saved && <span className="text-green-600 text-sm font-medium mr-4 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Tersimpan</span>}
          <button
            onClick={handleSave}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
