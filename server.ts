import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize GoogleGenAI SDK on the server side
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Server-side Gemini AI initialized successfully.');
  } catch (err) {
    console.warn('Could not initialize server-side Gemini client:', err);
  }
}

// 1. Endpoint: AI Là Triệu Phú - Sinh câu hỏi vô tận theo thời gian thực
app.post('/api/gemini/millionaire', async (req, res) => {
  try {
    const { topic = 'Ẩm thực và văn hóa Việt Nam', level = 1 } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured' });
    }

    const prompt = `
Bạn là Ban Biên Tập chương trình "Ai Là Triệu Phú" phiên bản Việt Nam cực kỳ hấp dẫn và hài hước.
Hãy tạo 1 câu hỏi trắc nghiệm mới lạ, không trùng lặp thuộc chủ đề "${topic}", độ khó cấp độ ${level}/15.

Yêu cầu:
- Câu hỏi rõ ràng, thú vị, mang tính giải trí và trí tuệ.
- 4 phương án lựa chọn A, B, C, D (phương án hợp lý, có phương án đánh lừa thông minh).
- Chỉ định rõ chỉ số đáp án đúng (correctIndex từ 0 đến 3).
- Giải thích ngắn gọn và thú vị tại sao đáp án đó đúng (dưới 30 từ).

Trả về định dạng JSON đúng schema:
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correct: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            topic: { type: Type.STRING },
          },
          required: ['question', 'options', 'correct', 'explanation'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating millionaire question:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 2. Endpoint: Trọng tài Gemini Thẩm định Nối Từ Tiếng Việt
app.post('/api/gemini/wordchain', async (req, res) => {
  try {
    const { prevWord = '', currentWord = '', playerName = 'Người chơi' } = req.body;

    const prevClean = String(prevWord).trim().toLowerCase();
    const currClean = String(currentWord).trim().toLowerCase();

    const prevParts = prevClean.split(/\s+/);
    const currParts = currClean.split(/\s+/);

    const lastSyl = prevParts[prevParts.length - 1];
    const firstSyl = currParts[0];

    // Quy tắc ngữ pháp cơ bản
    if (prevClean && lastSyl !== firstSyl) {
      return res.json({
        isValid: false,
        comment: `Phải bắt đầu bằng chữ "${lastSyl}" chứ! Đang ngủ gật hả? 🚨`,
      });
    }

    if (currParts.length < 2) {
      return res.json({
        isValid: false,
        comment: `Luật chơi là từ ghép 2 tiếng trở lên cơ mà! Gõ 1 tiếng tính ăn gian à? 🚨`,
      });
    }

    if (!ai) {
      return res.json({
        isValid: true,
        comment: 'Nối từ chuẩn bài đấy! Tiếp tục đi xem ai là người gục trước!',
      });
    }

    const prompt = `
Bạn là "Trọng Tài Cà Khịa" hài hước trong mini-game Nối Từ Tiếng Việt.
Từ của người trước: "${prevClean}"
Từ của người chơi (${playerName}) vừa gửi: "${currClean}"

Hãy thẩm định:
1. "${currClean}" có phải là một từ/cụm từ có nghĩa, phổ biến trong tiếng Việt (từ điển, tiếng lóng giới trẻ, văn hóa dân gian) không?
2. Bắt các từ vô nghĩa ghép ẩu (ví dụ "gà bay", "bàn nhảy", "xe khóc"), từ chế bậy hoặc lặp lại.
3. Nếu HỢP LỆ: Khen ngợi dí dỏm 1 câu ngắn (dưới 15 từ).
4. Nếu KHÔNG HỢP LỆ: Cà khịa cực gắt 1 câu ngắn (dưới 20 từ) chỉ rõ vì sao sai.

Trả về JSON:
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            comment: { type: Type.STRING },
          },
          required: ['isValid', 'comment'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error judging word chain:', error);
    // Fallback nếu có lỗi mạng
    return res.json({
      isValid: true,
      comment: 'Trọng tài mạng hơi lag, tạm thời tính hợp lệ nhé!',
    });
  }
});

// Setup Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Full-stack server running at http://0.0.0.0:${port}`);
  });
}

startServer();
