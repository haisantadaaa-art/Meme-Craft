import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import { fetchGeminiMillionaireQuestion } from '../../services/geminiApi';
import { getTieredFallbackQuestion } from '../../data/millionaireQuestionsPool';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Users,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  BrainCircuit,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Thang thưởng 15 mốc kịch tính của Ai Là Triệu Phú
export const PRIZE_LADDER = [
  '200k', '400k', '600k', '1.000k', '2.000k ⭐',
  '3.000k', '6.000k', '10.000k', '14.000k', '22.000k ⭐',
  '30.000k', '40.000k', '60.000k', '85.000k', '150.000k 🏆',
];

export function MillionaireGame({
  roomCode = '',
  myRole = 'p1',
  isBotMode = true,
  playerName = 'Chủ Tiệm',
  onRewardWon,
  onExit,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(() =>
    getTieredFallbackQuestion(1, new Set())
  );
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState('');
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [scores, setScores] = useState({ player: 0, opponent: 0 });
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Set chống trùng lặp câu hỏi triệt để trong ván đấu
  const usedQuestionsSet = useRef(new Set());

  // 3 Quyền trợ giúp kinh điển
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    geminiHint: true,
    changeQuestion: true,
  });
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [geminiHintText, setGeminiHintText] = useState('');

  const sessionRef = useRef(null);
  const timerRef = useRef(null);

  // Hàm tải câu hỏi mới đảm bảo KHÔNG TRÙNG LẶP và ĐÚNG PHÂN TẦNG ĐỘ KHÓ
  const loadNextQuestion = useCallback(async (index) => {
    setIsLoadingGemini(true);
    setHiddenOptions([]);
    setGeminiHintText('');
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(20);

    const level = index + 1; // 1 đến 15
    const topics = [
      'Ẩm thực truyền thống Việt Nam',
      'Đặc sản 3 miền Bắc Trung Nam',
      'Văn hóa ẩm thực & Lịch sử cung đình',
      'Món ngon đường phố & Trà sữa',
    ];
    const randomTopic = topics[index % topics.length];

    let pickedQuestion = null;

    try {
      // Gọi Gemini API kèm danh sách các câu đã dùng để loại trừ
      const excludedArray = Array.from(usedQuestionsSet.current).slice(-10);
      const geminiQ = await fetchGeminiMillionaireQuestion(randomTopic, level, excludedArray);

      if (geminiQ && geminiQ.question) {
        const cleanText = geminiQ.question.trim().toLowerCase();
        if (!usedQuestionsSet.current.has(cleanText)) {
          usedQuestionsSet.current.add(cleanText);
          pickedQuestion = geminiQ;
        }
      }
    } catch (e) {
      // Ignored, fallback to tiered pool
    }

    // Nếu Gemini không phản hồi hoặc trả câu trùng -> Dùng ngay Fallback Pool 150+ câu phân tầng
    if (!pickedQuestion) {
      pickedQuestion = getTieredFallbackQuestion(level, usedQuestionsSet.current);
      if (pickedQuestion?.question) {
        usedQuestionsSet.current.add(pickedQuestion.question.trim().toLowerCase());
      }
    }

    setCurrentQuestion(pickedQuestion);
    setIsLoadingGemini(false);

    // Đồng bộ P2P nếu đang đấu Online
    if (!isBotMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        questionIndex: index,
        question: pickedQuestion,
        scores,
        isGameOver: false,
      });
    }
  }, [isBotMode, scores]);

  // Khởi tạo ván đấu
  useEffect(() => {
    usedQuestionsSet.current.clear();
    loadNextQuestion(0);
  }, [loadNextQuestion]);

  // Kết nối P2P online nếu có roomCode
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'millionaire',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '💡' },
      (gameState) => {
        if (!gameState) return;
        if (typeof gameState.questionIndex === 'number' && gameState.questionIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(gameState.questionIndex);
        }
        if (gameState.question) {
          setCurrentQuestion(gameState.question);
          setSelectedOption(null);
          setIsAnswered(false);
          setTimeLeft(20);
        }
        if (gameState.scores) setScores(gameState.scores);
        if (gameState.isGameOver) {
          setIsGameOver(true);
          setGameResultMsg(gameState.resultMsg || 'Trận đấu kết thúc!');
        }
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName, currentQuestionIndex]);

  // Đếm ngược 20s cho mỗi câu hỏi
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

  // Hết giờ suy nghĩ
  const handleTimeOut = () => {
    sound.playBomb();
    setIsAnswered(true);
    setTimeout(() => {
      endGame(false, 'Hết 20 giây suy nghĩ! Dừng cuộc chơi.');
    }, 1200);
  };

  // Người chơi chọn 1 phương án
  const handleSelectOption = (idx) => {
    if (isAnswered || isGameOver || hiddenOptions.includes(idx)) return;

    setSelectedOption(idx);
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === currentQuestion.correct;

    if (isCorrect) {
      sound.playTing();
      sound.playWin();

      const earnedPts = 100 + timeLeft * 10;
      const nextScores = { ...scores, player: scores.player + earnedPts };
      setScores(nextScores);

      if (currentQuestionIndex >= 14) {
        // Vô địch 15/15 câu hỏi!
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        endGame(true, 'XUẤT SẮC CHINH PHỤC ĐỈNH CAO 15 CÂU HỎI! 🏆');
      } else {
        setTimeout(() => {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          loadNextQuestion(nextIdx);
        }, 1500);
      }
    } else {
      sound.playBomb();
      setTimeout(() => {
        endGame(false, `Rất tiếc! Đáp án chính xác là: ${['A', 'B', 'C', 'D'][currentQuestion.correct]}`);
      }, 1500);
    }
  };

  // Quyền trợ giúp 1: 50:50
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isAnswered || isGameOver) return;
    sound.playClick();

    const correct = currentQuestion.correct;
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correct);
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);

    setHiddenOptions(toHide);
    setLifelines((prev) => ({ ...prev, fiftyFifty: false }));
  };

  // Quyền trợ giúp 2: Cố Vấn MC Gemini
  const useGeminiHint = () => {
    if (!lifelines.geminiHint || isAnswered || isGameOver) return;
    sound.playClick();

    const hint = currentQuestion.explanation || 'Hãy chú ý từ khóa đặc trưng trong câu hỏi!';
    setGeminiHintText(`🤖 MC Lại Văn Sâm tư vấn: "${hint}"`);
    setLifelines((prev) => ({ ...prev, geminiHint: false }));
  };

  // Quyền trợ giúp 3: Đổi câu hỏi khác cùng cấp độ
  const useChangeQuestion = () => {
    if (!lifelines.changeQuestion || isAnswered || isGameOver) return;
    sound.playClick();
    setLifelines((prev) => ({ ...prev, changeQuestion: false }));
    loadNextQuestion(currentQuestionIndex);
  };

  // Kết thúc ván đấu
  const endGame = (isWin, message) => {
    setIsGameOver(true);
    setGameResultMsg(message);

    if (isWin && !rewardClaimed && onRewardWon) {
      setRewardClaimed(true);
      onRewardWon(200, 5);
    }

    if (!isBotMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        isGameOver: true,
        resultMsg: message,
      });
    }
  };

  // Chơi lại ván mới
  const handleRestart = () => {
    sound.playClick();
    usedQuestionsSet.current.clear();
    setCurrentQuestionIndex(0);
    setIsGameOver(false);
    setGameResultMsg('');
    setRewardClaimed(false);
    setScores({ player: 0, opponent: 0 });
    setLifelines({
      fiftyFifty: true,
      geminiHint: true,
      changeQuestion: true,
    });
    loadNextQuestion(0);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];
  const currentPrize = PRIZE_LADDER[currentQuestionIndex] || '200k';

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. HEADER CHUẨN: [🔙 Về Sảnh] + TÊN GAME + MỐC THƯỞNG */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-1.5">
        <button
          onClick={() => {
            sound.playClick();
            if (onExit) onExit();
          }}
          className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-black text-xs flex items-center gap-1 transition active:scale-95 border border-amber-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Sảnh</span>
        </button>

        <div className="text-center leading-tight">
          <span className="font-fredoka font-black text-xs text-purple-950 block">
            AI LÀ TRIỆU PHÚ
          </span>
          <span className="text-[9px] text-purple-700 font-bold">
            {isBotMode ? 'Đấu Trí Đỉnh Cao 💡' : `Phòng Online #${roomCode}`}
          </span>
        </div>

        <button
          onClick={handleRestart}
          title="Chơi lại từ câu số 1"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. THANH TIẾN TRÌNH 15 CÂU HỎI & MỐC THƯỞNG */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-2 rounded-2xl border border-purple-400/40 shadow-xs shrink-0 my-1">
        <div className="flex items-center justify-between text-xs font-fredoka font-black mb-1">
          <span className="flex items-center gap-1 text-amber-300">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            CÂU {currentQuestionIndex + 1} / 15
          </span>
          <span className="bg-amber-400 text-black px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
            Mốc: {currentPrize}
          </span>
          <span className="flex items-center gap-1 text-cyan-200 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {timeLeft}s
          </span>
        </div>

        {/* Thanh vạch tiến trình */}
        <div className="w-full bg-purple-950/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / 15) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. 3 QUYỀN TRỢ GIÚP KINH ĐIỂN */}
      <div className="flex items-center justify-center gap-2 my-1 shrink-0">
        <button
          onClick={useFiftyFifty}
          disabled={!lifelines.fiftyFifty || isAnswered || isGameOver}
          className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-fredoka font-black flex items-center justify-center gap-1 transition active:scale-95 shadow-xs ${
            lifelines.fiftyFifty
              ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950'
              : 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed line-through'
          }`}
        >
          <span>50:50</span>
        </button>

        <button
          onClick={useGeminiHint}
          disabled={!lifelines.geminiHint || isAnswered || isGameOver}
          className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-fredoka font-black flex items-center justify-center gap-1 transition active:scale-95 shadow-xs ${
            lifelines.geminiHint
              ? 'bg-purple-100 hover:bg-purple-200 border-purple-400 text-purple-950'
              : 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed line-through'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-purple-700" />
          <span>Hỏi MC</span>
        </button>

        <button
          onClick={useChangeQuestion}
          disabled={!lifelines.changeQuestion || isAnswered || isGameOver}
          className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-fredoka font-black flex items-center justify-center gap-1 transition active:scale-95 shadow-xs ${
            lifelines.changeQuestion
              ? 'bg-blue-100 hover:bg-blue-200 border-blue-400 text-blue-950'
              : 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed line-through'
          }`}
        >
          <span>Đổi Câu</span>
        </button>
      </div>

      {/* Lời tư vấn từ MC */}
      {geminiHintText && (
        <div className="bg-purple-50 border border-purple-300 text-purple-950 p-2 rounded-xl text-xs font-medium my-1 animate-in fade-in shrink-0 leading-snug">
          {geminiHintText}
        </div>
      )}

      {/* 4. HỘP CÂU HỎI TRUNG TÂM */}
      <div className="flex-1 flex flex-col justify-center my-1 bg-gradient-to-b from-[#1C1438] to-[#2B1B54] p-3.5 rounded-3xl border-2 border-amber-400/80 shadow-md relative overflow-hidden">
        {isLoadingGemini ? (
          <div className="flex flex-col items-center justify-center text-amber-200 space-y-2 py-6">
            <Sparkles className="w-8 h-8 animate-spin text-amber-300" />
            <p className="text-xs font-fredoka font-bold animate-pulse">
              MC Lại Văn Sâm đang chuẩn bị câu hỏi mới...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[10px] font-fredoka font-black tracking-wider text-amber-300/80 uppercase block mb-1">
              Câu hỏi số {currentQuestionIndex + 1}
            </span>
            <h2 className="text-sm sm:text-base font-fredoka font-black text-white leading-snug drop-shadow-xs">
              {currentQuestion?.question}
            </h2>
          </div>
        )}
      </div>

      {/* 5. 4 PHƯƠNG ÁN LỰA CHỌN A - B - C - D */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-1 shrink-0">
        {(currentQuestion?.options || []).map((opt, idx) => {
          const isHidden = hiddenOptions.includes(idx);
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQuestion.correct;

          let btnStyle = 'bg-white hover:bg-amber-50 border-amber-200 text-slate-800';

          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-black animate-pulse';
            } else if (isSelected) {
              btnStyle = 'bg-rose-500 text-white border-rose-600 font-black';
            } else {
              btnStyle = 'bg-slate-100 text-slate-400 border-slate-200 opacity-50';
            }
          }

          if (isHidden) {
            return (
              <div
                key={idx}
                className="h-11 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-300 text-xs font-mono"
              >
                ---
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered || isGameOver || isHidden}
              className={`min-h-[44px] p-2 rounded-2xl border-2 flex items-center gap-2 text-left transition-all active:scale-95 shadow-xs ${btnStyle}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-fredoka font-black text-xs shrink-0 ${
                  isAnswered && isCorrect
                    ? 'bg-white text-emerald-700'
                    : isAnswered && isSelected
                    ? 'bg-white text-rose-700'
                    : 'bg-amber-100 text-amber-950'
                }`}
              >
                {optionLetters[idx]}
              </div>
              <span className="text-xs font-semibold leading-tight line-clamp-2">
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* 6. BANNER THÔNG BÁO KẾT THÚC */}
      {isGameOver && (
        <div className="mt-1 p-2.5 bg-gradient-to-r from-purple-100 via-amber-100 to-indigo-100 border-2 border-purple-400 rounded-2xl text-center shadow-md animate-in zoom-in-95 shrink-0">
          <p className="font-fredoka font-black text-xs text-purple-950 mb-1.5">
            {gameResultMsg}
          </p>
          <button
            onClick={handleRestart}
            className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-fredoka font-black text-xs transition active:scale-95 shadow-xs"
          >
            Chơi Ván Mới 🔄
          </button>
        </div>
      )}
    </div>
  );
}

export default MillionaireGame;
