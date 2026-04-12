import { GoogleGenAI, Type } from '@google/genai';

export type AIModel = 'gemini' | 'openai' | 'deepseek';

export interface Question {
  id: string;
  text: string;
  options: string[];
  answer: string;
}

export interface GenerateParams {
  level: string;
  subject: string;
  topic: string;
  count: number;
  type: string;
  model: AIModel;
  apiKeys: Record<string, string>;
}

const jsonPromptInstruction = `WAJIB kembalikan response dalam format JSON dengan struktur berikut:
{
  "questions": [
    {
      "id": "unik-id",
      "text": "Pertanyaan...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."], // Kosongkan array ini jika jenis soal adalah Essay
      "answer": "Jawaban dan penjelasan singkat"
    }
  ]
}
Pastikan output HANYA berupa JSON valid tanpa markdown block (\`\`\`json) atau teks tambahan lainnya.`;

export async function generateQuestions(params: GenerateParams): Promise<Question[]> {
  const { level, subject, topic, count, type, model, apiKeys } = params;

  const typeDescription = type === 'multiple_choice' ? 'Pilihan Ganda' : type === 'essay' ? 'Essay' : 'Campuran (Setengah Pilihan Ganda, Setengah Essay)';

  const prompt = `Buatkan soal untuk tingkat sekolah ${level} dengan mata pelajaran ${subject} tentang topik "${topic}".
Jumlah soal: ${count}
Jenis soal: ${typeDescription}

${jsonPromptInstruction}`;

  return await callAIModel(model, apiKeys, prompt);
}

export async function regenerateSingleQuestion(params: GenerateParams & { oldQuestionText: string }): Promise<Question> {
  const { level, subject, topic, type, model, apiKeys, oldQuestionText } = params;

  // Let the AI infer the type based on the old question, or stick to the general type if it's not hybrid
  const typeDescription = type === 'multiple_choice' ? 'Pilihan Ganda' : type === 'essay' ? 'Essay' : 'Sama dengan jenis soal sebelumnya (Pilihan Ganda atau Essay)';

  const prompt = `Buatkan 1 soal alternatif yang sejenis/setara dengan soal berikut: "${oldQuestionText}".
Tingkat sekolah: ${level}
Mata pelajaran: ${subject}
Topik: ${topic}
Jenis soal: ${typeDescription}

${jsonPromptInstruction}`;

  const questions = await callAIModel(model, apiKeys, prompt);
  if (questions && questions.length > 0) {
    return questions[0];
  }
  throw new Error("Gagal meng-generate soal pengganti.");
}

async function callAIModel(model: AIModel, apiKeys: Record<string, string>, prompt: string): Promise<Question[]> {
  let jsonString = '';

  if (model === 'gemini') {
    const apiKey = apiKeys.gemini || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key is missing. Please set it in Settings.');
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING }
                },
                required: ["id", "text", "options", "answer"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });
    jsonString = response.text || '{}';
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
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to generate with OpenAI');
    }
    const data = await res.json();
    jsonString = data.choices[0].message.content;
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
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to generate with DeepSeek');
    }
    const data = await res.json();
    jsonString = data.choices[0].message.content;
  }

  try {
    const cleanedJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    return parsed.questions || [];
  } catch (e) {
    console.error("Failed to parse JSON:", jsonString);
    throw new Error("Format response dari AI tidak valid. Silakan coba lagi.");
  }
}
