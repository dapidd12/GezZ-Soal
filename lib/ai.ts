import { GoogleGenAI } from '@google/genai';

export type AIModel = 'gemini' | 'openai' | 'deepseek';

export interface GenerateParams {
  level: string;
  subject: string;
  topic: string;
  count: number;
  type: string;
  model: AIModel;
  apiKeys: Record<string, string>;
}

export async function generateQuestions(params: GenerateParams): Promise<string> {
  const { level, subject, topic, count, type, model, apiKeys } = params;

  const prompt = `Buatkan soal untuk tingkat sekolah ${level} dengan mata pelajaran ${subject} tentang topik "${topic}".
Jumlah soal: ${count}
Jenis soal: ${type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}

Berikan juga kunci jawabannya di bagian akhir.
Format output menggunakan Markdown yang rapi. Pisahkan bagian soal dan bagian kunci jawaban dengan jelas.`;

  if (model === 'gemini') {
    const apiKey = apiKeys.gemini || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key is missing. Please set it in Settings.');
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
  } else if (model === 'openai') {
    const apiKey = apiKeys.openai;
    if (!apiKey) throw new Error('OpenAI API Key is missing. Please set it in Settings.');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to generate with OpenAI');
    }
    const data = await res.json();
    return data.choices[0].message.content;
  } else if (model === 'deepseek') {
    const apiKey = apiKeys.deepseek;
    if (!apiKey) throw new Error('DeepSeek API Key is missing. Please set it in Settings.');

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to generate with DeepSeek');
    }
    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw new Error('Invalid model selected');
}
