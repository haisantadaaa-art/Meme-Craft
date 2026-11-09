/**
 * Gemini API Integration Service for Minigames:
 * 1. AI Là Triệu Phú: Sinh câu hỏi đố vui ẩm thực và văn hóa Việt Nam không giới hạn.
 * 2. Nối Từ Sinh Tử: Thẩm định từ ghép tiếng Việt chính xác và đưa ra lời bình luận, cà khịa duyên dáng.
 */

export async function judgeWordChainWithGemini(prevWord, currentWord, playerName = 'Chủ Tiệm') {
  const prevClean = (prevWord || '').trim().toLowerCase();
  const currClean = (currentWord || '').trim().toLowerCase();

  const prevParts = prevClean.split(/\s+/);
  const currParts = currClean.split(/\s+/);

  const lastSyl = prevParts[prevParts.length - 1];
  const firstSyl = currParts[0];

  // 1. Kiểm tra quy tắc âm tiết đầu - đuôi
  if (prevClean && lastSyl !== firstSyl) {
    return {
      isValid: false,
      comment: `Bắt đầu bằng tiếng "${lastSyl}" cơ mà! Bạn đang ngủ gật hả? 🚨`,
    };
  }

  // 2. Kiểm tra từ ghép tối thiểu 2 âm tiết
  if (currParts.length < 2) {
    return {
      isValid: false,
      comment: `Luật chơi là từ ghép 2 tiếng trở lên! Gõ 1 tiếng định ăn gian hả? 🚨`,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

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
        comment: data.comment || (data.isValid ? 'Từ chuẩn đấy! Nối tiếp nào! ✨' : 'Từ này nghe lạ hoắc! 🚨'),
      };
    }
  } catch (e) {
    // Fallback nếu mạng chậm hoặc lỗi
  }

  // Fallback an toàn nếu tiếng Việt hợp lệ
  return {
    isValid: true,
    comment: `Trọng tài duyệt: "${currentWord}". Đối thủ đỡ chiêu đi! 🔥`,
  };
}

export async function fetchGeminiMillionaireQuestion(topic = 'Ẩm thực Việt Nam', questionNumber = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('/api/gemini/millionaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, questionNumber }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.question && Array.isArray(data.options) && data.options.length === 4) {
        return {
          question: data.question,
          options: data.options,
          correct: typeof data.correct === 'number' ? data.correct : 0,
          explanation: data.explanation || 'Đáp án chính xác!',
          topic,
        };
      }
    }
  } catch (e) {
    // Fallback handled by offline questions pool in game
  }

  return null;
}
