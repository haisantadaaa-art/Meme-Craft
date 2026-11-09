import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
import { fetchGeminiMillionaireQuestion } from '../../services/geminiService';
import { Trophy, Clock, Sparkles, RotateCcw, CheckCircle2, XCircle, HelpCircle, Users, RefreshCw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// KHO CÂU HỎI OFFLINE DỰ PHÒNG PHONG PHÚ
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
  roomData = null,
  roomCode: initialRoomCode = '',
  myRole: initialRole = 'X',
  isBotMode: initialBotMode = true,
  playerName = 'Chủ Tiệm',
  onRewardWon,
  onExit,
}) {
  const [isOnlineMode, setIsOnlineMode] = useState(!initialBotMode);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [myRole, setMyRole] = useState(initialRole);
  const [connectedPlayer, setConnectedPlayer] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(OFFLINE_QUESTIONS[0]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState('');
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [scores, setScores] = useState({ player: 0, opponent: 0 });
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // 3 Quyền trợ giúp
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    geminiHint: true,
    changeQuestion: true,
  });
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [geminiHintText, setGeminiHintText] = useState('');

  const sessionRef = useRef(null);
  const timerRef = useRef(null);

  // Tải câu hỏi mới từ Gemini API hoặc offline pool
  const loadNextQuestion = useCallback(async (index) => {
    setIsLoadingGemini(true);
    setHiddenOptions([]);
    setGeminiHintText('');
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);

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
  }, []);

  // Thiết lập phiên kết nối Online P2P
  useEffect(() => {
    if (!isOnlineMode) {
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }
      return;
    }

    const session = new GameRoomSession({
      gameType: 'millionaire',
      playerName,
      onState: (state) => {
        if (!state) return;
        if (state.questionIndex !== undefined) {
          setCurrentQuestionIndex(state.questionIndex);
        }
        if (state.question) {
          setCurrentQuestion(state.question);
          setSelectedOption(null);
          setIsAnswered(false);
          setTimeLeft(15);
        }
        if (state.scores) {
          setScores(state.scores);
        }
        if (state.isGameOver) {
          setIsGameOver(true);
          setGameResultMsg(state.resultMsg || 'Trận đấu kết thúc!');
        }
        if (state.p2) setConnectedPlayer(state.p2.name);
      },
      onPlayerJoin: (player) => {
        setConnectedPlayer(player.name);
        sound.playTing();
      },
      onPlayerLeave: () => {
        setConnectedPlayer(null);
      },
    });

    sessionRef.current = session;

    return () => {
      session.destroy();
      sessionRef.current = null;
    };
  }, [isOnlineMode, playerName]);

  // Tạo phòng online
  const handleCreateRoom = async () => {
    if (!sessionRef.current) return;
    const code = await sessionRef.current.createRoom();
    setRoomCode(code);
    setMyRole('X');
    handleRestart();
  };

  // Vào phòng online
  const handleJoinRoom = async (code) => {
    if (!sessionRef.current) return;
    const ok = await sessionRef.current.joinRoom(code);
    if (ok) {
      setRoomCode(code);
      setMyRole('O');
      sound.playTing();
    } else {
      alert('Không tìm thấy phòng!');
    }
  };

  // Rời phòng online
  const handleLeaveRoom = () => {
    if (sessionRef.current) {
      sessionRef.current.leaveRoom();
    }
    setRoomCode('');
    setConnectedPlayer(null);
    setIsOnlineMode(false);
    handleRestart();
  };

  useEffect(() => {
    loadNextQuestion(0);
  }, [loadNextQuestion]);

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

      const earnedPts = 100 + timeLeft * 10;
      setScores((prev) => ({ ...prev, player: prev.player + earnedPts }));

      if (currentQuestionIndex >= 14) {
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
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);

    setHiddenOptions(toHide);
    setLifelines((prev) => ({ ...prev, fiftyFifty: false }));
  };

  // Trợ giúp 2: Gemini Cố Vấn
  const useGeminiHint = () => {
    if (!lifelines.geminiHint || isAnswered) return;
    sound.playClick();

    const hint = currentQuestion.explanation || 'Hãy chú ý đến các từ khóa đặc trưng trong câu hỏi!';
    setGeminiHintText(`🤖 MC Lại Văn Sâm tư vấn: "${hint}"`);
    setLifelines((prev) => ({ ...prev, geminiHint: false }));
  };

  // Trợ giúp 3: Đổi câu hỏi
  const useChangeQuestion = () => {
    if (!lifelines.changeQuestion || isAnswered) return;
    sound.playClick();
    setLifelines((prev) => ({ ...prev, changeQuestion: false }));
    loadNextQuestion(currentQuestionIndex);
  };

  // Kết thúc ván chơi
  const endGame = (isWin, message) => {
    setIsGameOver(true);
    setGameResultMsg(message);

    if (isWin && !rewardClaimed && onRewardWon) {
      setRewardClaimed(true);
      onRewardWon(150, 3);
    }
  };

  // Chơi lại từ đầu
  const handleRestart = () => {
    sound.playClick();
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

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CÔNG CỤ ONLINE P2P / BOT */}
      <OnlineRoomToolbar
        isOnlineMode={isOnlineMode}
        onToggleMode={(mode) => {
          setIsOnlineMode(mode);
          handleRestart();
        }}
        roomCode={roomCode}
        isHost={myRole === 'X'}
        myRole={myRole}
        connectedPlayer={connectedPlayer}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* 2. HEADER: TIẾN TRÌNH & ĐỒNG HỒ */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-black flex items-center justify-center font-fredoka font-black text-sm shadow-xs">
            {currentQuestionIndex + 1}
          </div>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-amber-950 block">
              AI LÀ TRIỆU PHÚ
            </span>
            <span className="text-[10px] text-slate-500">
              Mốc: {PRIZE_LADDER[currentQuestionIndex]}
            </span>
          </div>
        </div>

        {/* Đồng hồ 15s */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300">
          <Clock className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-rose-600 animate-spin' : 'text-amber-600'}`} />
          <span className={`font-mono font-black text-sm ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-950'}`}>
            {timeLeft}s
          </span>
        </div>

        <button
          onClick={handleRestart}
          title="Chơi lại ván mới"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. 3 QUYỀN TRỢ GIÚP */}
      <div className="grid grid-cols-3 gap-2 my-2 shrink-0">
        <button
          onClick={useFiftyFifty}
          disabled={!lifelines.fiftyFifty || isAnswered || isGameOver}
          className={`py-1.5 px-2 rounded-xl text-xs font-fredoka font-bold border transition flex items-center justify-center gap-1 active:scale-95 ${
            lifelines.fiftyFifty
              ? 'bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200 shadow-2xs'
              : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>50 : 50</span>
        </button>

        <button
          onClick={useGeminiHint}
          disabled={!lifelines.geminiHint || isAnswered || isGameOver}
          className={`py-1.5 px-2 rounded-xl text-xs font-fredoka font-bold border transition flex items-center justify-center gap-1 active:scale-95 ${
            lifelines.geminiHint
              ? 'bg-purple-100 border-purple-300 text-purple-950 hover:bg-purple-200 shadow-2xs'
              : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>MC Gemini</span>
        </button>

        <button
          onClick={useChangeQuestion}
          disabled={!lifelines.changeQuestion || isAnswered || isGameOver}
          className={`py-1.5 px-2 rounded-xl text-xs font-fredoka font-bold border transition flex items-center justify-center gap-1 active:scale-95 ${
            lifelines.changeQuestion
              ? 'bg-emerald-100 border-emerald-300 text-emerald-950 hover:bg-emerald-200 shadow-2xs'
              : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Đổi Câu</span>
        </button>
      </div>

      {/* GỢI Ý TỪ CỐ VẤN */}
      {geminiHintText && (
        <div className="mb-2 p-2 rounded-xl bg-purple-50 border border-purple-300 text-xs font-fredoka text-purple-900 shadow-2xs animate-in fade-in-50">
          {geminiHintText}
        </div>
      )}

      {/* 4. KHU VỰC CÂU HỎI VÀ 4 PHƯƠNG ÁN */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto my-1">
        {/* Câu hỏi */}
        <div className="bg-white/95 p-3.5 rounded-2xl border-2 border-amber-300 shadow-2xs mb-3 text-center">
          {isLoadingGemini ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-fredoka text-amber-800">
              <span className="animate-spin">⏳</span>
              <span>Đang kết nối Gemini AI lấy câu hỏi thú vị...</span>
            </div>
          ) : (
            <p className="font-fredoka font-black text-sm text-amber-950 leading-relaxed">
              {currentQuestion.question}
            </p>
          )}
        </div>

        {/* 4 Phương án A, B, C, D */}
        <div className="grid grid-cols-1 gap-2">
          {currentQuestion.options.map((opt, idx) => {
            const isHidden = hiddenOptions.includes(idx);
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correct;

            let btnStyle = 'bg-white hover:bg-amber-50 border-amber-200 text-slate-800';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500 text-white border-emerald-600 animate-pulse';
              } else if (isSelected) {
                btnStyle = 'bg-rose-500 text-white border-rose-600';
              }
            } else if (isSelected) {
              btnStyle = 'bg-amber-300 border-amber-400 text-black';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered || isGameOver || isHidden}
                className={`w-full p-2.5 rounded-xl border-2 font-fredoka font-bold text-xs flex items-center justify-between transition-all active:scale-98 shadow-2xs ${btnStyle} ${
                  isHidden ? 'opacity-20 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center font-black text-[10px] shrink-0">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span>{opt}</span>
                </div>

                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. MODAL GAME OVER */}
      {isGameOver && (
        <div className="mt-2 p-2.5 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95">
          <span className="font-fredoka font-black text-xs text-amber-950 block">
            {gameResultMsg}
          </span>
          <span className="text-[10px] text-amber-800 block mt-0.5">
            Điểm số: {scores.player} điểm • Thưởng: {PRIZE_LADDER[Math.max(0, currentQuestionIndex - 1)]}
          </span>
        </div>
      )}
    </div>
  );
}

export default MillionaireGame;
