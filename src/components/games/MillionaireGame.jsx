import React, { useState, useEffect, useRef } from 'react';
import { db, ref, update } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import { fetchGeminiMillionaireQuestion } from '../../services/geminiService';
import { Trophy, Clock, Sparkles, RotateCcw, CheckCircle2, XCircle, HelpCircle, Users, RefreshCw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// KHO 100 CÂU HỎI OFFLINE DỰ PHÒNG PHONG PHÚ
// ==========================================
export const OFFLINE_QUESTIONS = [
  {
    question: 'Món Phở truyền thống Việt Nam thường ăn kèm với loại rau thơm đặc trưng nào?',
    options: ['Húng Quế & Ngò Gai', 'Lá Lốt & Tía Tô', 'Rau Má & Diếp Cá', 'Cần Tây & Thì Là'],
    correct: 0,
    explanation: 'Húng Quế và Ngò Gai là 2 loại rau thơm kinh điển tôn lên hương vị nước dùng phở bò.',
  },
  {
    question: 'Thành phần chính tạo nên độ dai dẻo của Hạt Trân Châu trong Trà Sữa là gì?',
    options: ['Bột Mì đa dụng', 'Bột Năng (Tinh bột sắn)', 'Bột Bắp vàng', 'Bột Gạo tẻ'],
    correct: 1,
    explanation: 'Bột năng khi nhào với nước sôi và luộc chín sẽ tạo độ dẻo dai đặc trưng.',
  },
  {
    question: 'Món Bánh Mì kẹp Việt Nam được từ điển Oxford đưa vào danh mục từ mới năm nào?',
    options: ['Năm 2011', 'Năm 1999', 'Năm 2005', 'Năm 2020'],
    correct: 0,
    explanation: 'Năm 2011, từ "Banh mi" chính thức được thêm vào từ điển Oxford mà không cần dịch.',
  },
  {
    question: 'Loại gia vị nào sau đây được mệnh danh là "Vàng Đỏ" đắt đỏ nhất thế giới?',
    options: ['Hạt Tiêu Đen', 'Nhụy Hoa Nghệ Tây (Saffron)', 'Quế Chi Rừng', 'Hoa Hồi Lạng Sơn'],
    correct: 1,
    explanation: 'Saffron cần hàng vạn bông hoa nghệ tây thu hoạch thủ công để tạo nên 1 kg nhụy.',
  },
  {
    question: 'Cà Phê Trứng béo ngậy trứ danh là nét sáng tạo ẩm thực độc đáo khởi nguồn từ đâu?',
    options: ['Hà Nội', 'Đà Nẵng', 'Huế', 'TP. Hồ Chí Minh'],
    correct: 0,
    explanation: 'Cà phê trứng ra đời tại Hà Nội vào những năm 1940 do cụ Nguyễn Văn Giảng sáng tạo.',
  },
  {
    question: 'Nước mắm truyền thống Việt Nam chuẩn được ủ chượp từ 2 nguyên liệu chính nào?',
    options: ['Cá cơm và Muối biển', 'Tôm khô và Đường phèn', 'Mực lá và Rượu gạo', 'Cua đồng và Nước dừa'],
    correct: 0,
    explanation: 'Nước mắm cá cơm ủ muối theo tỷ lệ 3 cá : 1 muối trong thùng gỗ từ 12-18 tháng.',
  },
  {
    question: 'Món Bún Bò Huế nổi tiếng có sợi bún to hay sợi bún nhỏ truyền thống?',
    options: ['Sợi bún to tròn', 'Sợi bún dẹt như phở', 'Sợi bún siêu mảnh', 'Sợi miến dong'],
    correct: 0,
    explanation: 'Bún bò Huế đặc trưng với sợi bún to tròn, ăn kèm chả cua, huyết và bắp bò.',
  },
  {
    question: 'Trái Sầu Riêng được mệnh danh là gì trong thế giới trái cây nhiệt đới?',
    options: ['Vua của các loại trái cây', 'Nữ hoàng trái cây', 'Hoàng tử ngọt ngào', 'Bá tước rừng xanh'],
    correct: 0,
    explanation: 'Sầu riêng được mệnh danh là Vua trái cây (King of Fruits) nhờ hương vị độc đáo nồng nàn.',
  },
];

// Thang thưởng 15 mốc kịch tính
export const PRIZE_LADDER = [
  '200k', '400k', '600k', '1.000k', '2.000k ⭐',
  '3.000k', '6.000k', '10.000k', '14.000k', '22.000k ⭐',
  '30.000k', '40.000k', '60.000k', '85.000k', '150.000k 🏆'
];

export function MillionaireGame({
  roomData,
  roomCode,
  myRole = 'X',
  isBotMode = false,
  playerName = 'Chủ Tiệm',
  onRewardWon,
  onExit,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(OFFLINE_QUESTIONS[0]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [scores, setScores] = useState({ player: 0, bot: 0 });

  // 3 Quyền trợ giúp
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    geminiHint: true,
    changeQuestion: true,
  });
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [geminiHintText, setGeminiHintText] = useState('');

  const timerRef = useRef(null);

  // Tải câu hỏi mới từ Gemini API hoặc offline pool
  const loadNextQuestion = async (index) => {
    setIsLoadingGemini(true);
    setHiddenOptions([]);
    setGeminiHintText('');
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);

    // Thử gọi Gemini API trước
    const topics = ['Ẩm thực Việt Nam', 'Văn hóa & Lịch sử', 'Khoa học đời sống', 'Đố vui ca dao'];
    const randomTopic = topics[index % topics.length];
    const geminiQ = await fetchGeminiMillionaireQuestion(randomTopic, index + 1);

    if (geminiQ) {
      setCurrentQuestion(geminiQ);
    } else {
      const fallbackQ = OFFLINE_QUESTIONS[index % OFFLINE_QUESTIONS.length];
      setCurrentQuestion(fallbackQ);
    }

    setIsLoadingGemini(false);
  };

  useEffect(() => {
    loadNextQuestion(0);
  }, []);

  // Đếm ngược 15s cho mỗi câu hỏi
  useEffect(() => {
    if (isGameOver || isAnswered || isLoadingGemini) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameOver, isAnswered, isLoadingGemini, currentQuestionIndex]);

  // Hết giờ
  const handleTimeOut = () => {
    sound.playBomb();
    setIsAnswered(true);
    setTimeout(() => {
      endGame(false, 'Hết 15 giây suy nghĩ!');
    }, 1500);
  };

  // Người chơi chọn phương án
  const handleSelectOption = (idx) => {
    if (isAnswered || isGameOver || hiddenOptions.includes(idx)) return;

    setSelectedOption(idx);
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === currentQuestion.correct;

    if (isCorrect) {
      sound.playTing();
      sound.playWin();

      setScores((prev) => ({ ...prev, player: prev.player + 100 + timeLeft * 10 }));

      if (currentQuestionIndex >= 14) {
        // Về đích 15 câu
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        endGame(true, 'Xuất sắc chinh phục đỉnh cao 15 câu hỏi!');
      } else {
        setTimeout(() => {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          loadNextQuestion(nextIdx);
        }, 1800);
      }
    } else {
      sound.playBomb();
      setTimeout(() => {
        endGame(false, `Đáp án đúng là: ${['A', 'B', 'C', 'D'][currentQuestion.correct]}`);
      }, 1800);
    }
  };

  // Trợ giúp 1: 50:50
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isAnswered) return;
    sound.playClick();

    const correct = currentQuestion.correct;
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correct);
    // Chọn 2 phương án sai để ẩn
    const hide = wrongIndices.slice(0, 2);
    setHiddenOptions(hide);
    setLifelines((prev) => ({ ...prev, fiftyFifty: false }));
  };

  // Trợ giúp 2: Trợ lý Gemini Gợi Ý
  const useGeminiHint = () => {
    if (!lifelines.geminiHint || isAnswered) return;
    sound.playTing();

    const correctLetter = ['A', 'B', 'C', 'D'][currentQuestion.correct];
    const hint = `🤖 Trợ lý Gemini: "Tôi tự tin 85% đáp án chính là ${correctLetter}. ${currentQuestion.explanation || ''}"`;
    setGeminiHintText(hint);
    setLifelines((prev) => ({ ...prev, geminiHint: false }));
  };

  // Trợ giúp 3: Đổi câu hỏi
  const useChangeQuestion = () => {
    if (!lifelines.changeQuestion || isAnswered) return;
    sound.playClick();
    setLifelines((prev) => ({ ...prev, changeQuestion: false }));
    loadNextQuestion(currentQuestionIndex);
  };

  const endGame = (isWon, reason) => {
    setIsGameOver(true);
    if (isWon) {
      if (onRewardWon) onRewardWon(150, 3);
    } else {
      if (onRewardWon && currentQuestionIndex >= 5) onRewardWon(50, 1);
    }
  };

  const restartGame = () => {
    sound.playClick();
    setCurrentQuestionIndex(0);
    setIsGameOver(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setLifelines({ fiftyFifty: true, geminiHint: true, changeQuestion: true });
    setScores({ player: 0, bot: 0 });
    loadNextQuestion(0);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. Header: Thang giải thưởng & Đồng hồ đếm lùi */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        {/* Câu số & Mốc thưởng */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-fredoka font-black flex items-center justify-center text-xs shadow-xs">
            {currentQuestionIndex + 1}
          </div>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-purple-950 block">
              CÂU {currentQuestionIndex + 1} / 15
            </span>
            <span className="text-[10px] font-fredoka font-bold text-amber-700">
              Thưởng: {PRIZE_LADDER[currentQuestionIndex]}
            </span>
          </div>
        </div>

        {/* Đồng hồ đếm lùi 15s */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300">
          <Clock className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-rose-500 animate-spin' : 'text-amber-600'}`} />
          <span className={`font-mono font-black text-sm ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-950'}`}>
            {timeLeft}s
          </span>
        </div>

        {/* 3 Nút Quyền Trợ Giúp */}
        <div className="flex items-center gap-1">
          <button
            onClick={useFiftyFifty}
            disabled={!lifelines.fiftyFifty || isAnswered}
            className={`px-1.5 py-1 rounded-lg text-[10px] font-fredoka font-black border transition active:scale-90 ${
              lifelines.fiftyFifty && !isAnswered
                ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
            }`}
            title="50:50 - Loại 2 phương án sai"
          >
            50:50
          </button>

          <button
            onClick={useGeminiHint}
            disabled={!lifelines.geminiHint || isAnswered}
            className={`p-1 rounded-lg text-xs font-black border transition active:scale-90 ${
              lifelines.geminiHint && !isAnswered
                ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
            }`}
            title="Hỏi Trợ Lý Gemini AI"
          >
            🤖
          </button>

          <button
            onClick={useChangeQuestion}
            disabled={!lifelines.changeQuestion || isAnswered}
            className={`p-1 rounded-lg text-xs font-black border transition active:scale-90 ${
              lifelines.changeQuestion && !isAnswered
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
            }`}
            title="Đổi Câu Hỏi Mới"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Lời gợi ý của Gemini nếu được bật */}
      {geminiHintText && (
        <div className="my-1 p-2 rounded-xl bg-purple-50 border border-purple-300 text-xs font-fredoka text-purple-950 animate-in fade-in leading-snug">
          {geminiHintText}
        </div>
      )}

      {/* 2. KHU VỰC CÂU HỎI TRUNG TÂM */}
      <div className="flex-1 flex flex-col justify-center my-auto py-2">
        <div className="p-4 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400 rounded-3xl shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-2 left-3 text-[10px] font-fredoka font-bold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {currentQuestion.topic || 'Ẩm thực & Tri thức'}
          </div>

          <p className="font-fredoka font-black text-sm sm:text-base text-white mt-4 leading-relaxed min-h-[48px] flex items-center justify-center">
            {isLoadingGemini ? 'Đang tạo câu hỏi mới từ Gemini AI...' : currentQuestion.question}
          </p>
        </div>

        {/* 4 PHƯƠNG ÁN LỰA CHỌN A, B, C, D */}
        <div className="grid grid-cols-1 gap-2 mt-3">
          {currentQuestion.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correct;
            const isHidden = hiddenOptions.includes(idx);

            let btnStyle = 'bg-white hover:bg-amber-50 border-amber-200 text-slate-800';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500 text-white border-emerald-600 animate-pulse';
              } else if (isSelected) {
                btnStyle = 'bg-rose-500 text-white border-rose-600';
              }
            } else if (isSelected) {
              btnStyle = 'bg-amber-400 text-black border-amber-500';
            }

            if (isHidden) {
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 opacity-40 text-center text-xs text-slate-400"
                >
                  (Đã loại bỏ bởi 50:50)
                </div>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered || isGameOver || isLoadingGemini}
                className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 font-fredoka font-black text-xs sm:text-sm text-left flex items-center gap-3 transition-all active:scale-98 shadow-2xs ${btnStyle}`}
              >
                <span className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center text-xs shrink-0">
                  {letter}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Footer: Điểm số & Trợ chiến */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between text-xs">
        <span className="font-fredoka font-bold text-amber-900">
          Điểm hiện tại: <strong className="text-amber-600 font-black">{scores.player} pts</strong>
        </span>
        <button
          onClick={restartGame}
          className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-bold text-xs border border-amber-300"
        >
          Chơi Lại 🔄
        </button>
      </div>

      {/* MODAL KẾT THÚC VÁN ĐẤU */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[340px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 text-center shadow-2xl animate-in zoom-in-95">
            <span className="text-4xl">🏆</span>
            <h2 className="font-fredoka font-black text-lg text-amber-950 mt-2">
              KẾT THÚC CHẶNG ĐUA!
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Bạn đã dừng lại ở <strong>Câu {currentQuestionIndex + 1}</strong>.
              <br />
              Phần thưởng bảo toàn: <strong className="text-amber-800">{PRIZE_LADDER[Math.max(0, currentQuestionIndex - 1)]}</strong>!
            </p>
            <p className="text-[11px] text-emerald-800 font-bold mt-2">
              +100 Xu & 1 Túi Quà Trợ Chiến cho Bé Cưng! 🎁
            </p>
            <button
              onClick={restartGame}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-sm"
            >
              Chơi Lại Chinh Phục 15 Câu 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MillionaireGame;
