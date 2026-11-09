/**
 * Client service for calling server-side Gemini API endpoints with robust fallback
 */

export interface WordChainJudgeResult {
  isValid: boolean;
  comment: string;
}

export interface MillionaireQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic?: string;
}

/**
 * Thẩm định nối từ tiếng Việt qua Server-Side Gemini API
 */
export async function judgeWordChainWithGemini(
  prevWord: string,
  currentWord: string,
  playerName: string
): Promise<WordChainJudgeResult> {
  const prevClean = prevWord.trim().toLowerCase();
  const currClean = currentWord.trim().toLowerCase();

  const prevParts = prevClean.split(/\s+/);
  const currParts = currClean.split(/\s+/);

  const lastSyl = prevParts[prevParts.length - 1];
  const firstSyl = currParts[0];

  // Kiểm tra quy tắc nối từ cơ bản
  if (prevClean && lastSyl !== firstSyl) {
    return {
      isValid: false,
      comment: `Bắt đầu bằng tiếng "${lastSyl}" cơ mà! Bác đang ngủ gật à? 🚨`,
    };
  }

  if (currParts.length < 2) {
    return {
      isValid: false,
      comment: `Luật chơi là từ ghép 2 tiếng trở lên! Gõ 1 tiếng định ăn gian hả? 🚨`,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/gemini/wordchain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prevWord, currentWord, playerName }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        isValid: Boolean(data.isValid),
        comment: data.comment || 'Nối từ chuẩn bài đấy!',
      };
    }
  } catch (e) {
    console.warn('Fallback to local word chain evaluation:', e);
  }

  // Fallback offline nếu mạng chậm
  return {
    isValid: true,
    comment: 'Nối từ mượt đấy! Tiếp tục đi xem ai là người gục trước! 🔥',
  };
}

/**
 * Sinh câu hỏi Ai Là Triệu Phú qua Server-Side Gemini API
 */
export async function fetchGeminiMillionaireQuestion(
  topic = 'Ẩm thực & Văn hóa Việt Nam',
  level = 1
): Promise<MillionaireQuestion | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/gemini/millionaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, level }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.question && Array.isArray(data?.options) && data.options.length === 4) {
        return {
          question: data.question,
          options: data.options,
          correct: typeof data.correct === 'number' ? data.correct : 0,
          explanation: data.explanation || '',
          topic: data.topic || topic,
        };
      }
    }
  } catch (e) {
    console.warn('Fallback to local millionaire questions:', e);
  }

  return null;
}
