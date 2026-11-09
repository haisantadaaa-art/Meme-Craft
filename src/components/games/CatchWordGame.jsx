import React, { useState, useEffect, useRef } from 'react';
import { db, ref, update } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import { Trophy, ArrowLeft, Clock, Sparkles, RotateCcw, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatBox } from '../ChatBox';

// Danh sách câu đố Đuổi Hình Bắt Chữ tiếng Việt thú vị
const PUZZLES = [
  {
    icons: ['🐴', '🏹'],
    answer: 'MÃ TIỄN',
    hint: 'Ngựa + Cung Tên (Vũ khí / Tên thuốc)',
  },
  {
    icons: ['🌽', '🥬'],
    answer: 'BẮP CẢI',
    hint: 'Nông sản quen thuộc trong vườn',
  },
  {
    icons: ['☕', '🥛'],
    answer: 'CÀ PHÊ SỮA',
    hint: 'Thức uống sáng đậm chất Việt Nam',
  },
  {
    icons: ['🚗', '🚜'],
    answer: 'XE CỘ',
    hint: 'Phương tiện giao thông đi lại',
  },
  {
    icons: ['👑', '💎'],
    answer: 'HOÀNG KIM',
    hint: 'Vàng son, quý giá bậc nhất',
  },
  {
    icons: ['🐱', '🐭'],
    answer: 'MÈO CHUỘT',
    hint: 'Cặp đôi đuổi bắt nổi tiếng hoạt hình',
  },
  {
    icons: ['🐔', '🥚'],
    answer: 'GÀ TRỨNG',
    hint: 'Câu hỏi triết học: cái nào có trước?',
  },
  {
    icons: ['🌧️', '🌈'],
    answer: 'CẦU VỒNG',
    hint: 'Hiện ra sau cơn mưa rào',
  },
  {
    icons: ['🔥', '🍳'],
    answer: 'NẤU NƯỚNG',
    hint: 'Công việc tạo ra món ăn ngon trong bếp',
  },
  {
    icons: ['🐟', '🌊'],
    answer: 'CÁ BIỂN',
    hint: 'Sinh vật bơi lội dưới đại dương',
  },
];

export function CatchWordGame({
  roomData,
  roomCode,
  myRole = 'X',
  isBotMode = false,
  playerName = 'Bác Nông Dân',
  onRewardWon,
  onExit,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [localScores, setLocalScores] = useState({ X: 0, O: 0 });
  const [localWinner, setLocalWinner] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef(null);

  const puzzleIdx = isBotMode ? currentIdx : roomData?.puzzleIndex || 0;
  const puzzle = PUZZLES[puzzleIdx % PUZZLES.length];
  const scores = isBotMode ? localScores : roomData?.scores || { X: 0, O: 0 };
  const winner = isBotMode ? localWinner : roomData?.winner || null;

  // Đếm ngược 30s
  useEffect(() => {
    if (winner) return;

    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 30;
        }
        if (prev <= 5) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [puzzleIdx, winner]);

  const handleTimeOut = () => {
    sound.playLose();
    setFeedback(`Hết 30s! Đáp án là: "${puzzle.answer}". Đổi câu tiếp theo!`);
    nextPuzzle();
  };

  const nextPuzzle = async () => {
    const nextI = (puzzleIdx + 1) % PUZZLES.length;
    setTimeLeft(30);
    if (isBotMode) {
      setCurrentIdx(nextI);
    } else if (roomCode) {
      await update(ref(db, `rooms/${roomCode}`), {
        puzzleIndex: nextI,
      });
    }
  };

  // Bot ngẫu nhiên trả lời sau 8-15 giây
  useEffect(() => {
    if (isBotMode && !winner) {
      const botDelay = Math.floor(Math.random() * 8000) + 7000;
      const botTimer = setTimeout(() => {
        // 50% cơ hội Bot đoán đúng
        if (Math.random() > 0.45) {
          handleScore('O', 'Bot AI đã đoán chính xác!');
        }
      }, botDelay);

      return () => clearTimeout(botTimer);
    }
  }, [isBotMode, puzzleIdx, winner]);

  const handleScore = async (scoringRole, msg) => {
    sound.playTing();
    setFeedback(msg);

    const nextScore = (scores[scoringRole] || 0) + 1;
    const updatedScores = { ...scores, [scoringRole]: nextScore };

    // Kiểm tra ai đạt 3 điểm trước là thắng!
    if (nextScore >= 3) {
      sound.playWin();
      if (isBotMode) {
        setLocalScores(updatedScores);
        setLocalWinner(scoringRole);
      } else if (roomCode) {
        await update(ref(db, `rooms/${roomCode}`), {
          scores: updatedScores,
          winner: scoringRole,
        });
      }
    } else {
      if (isBotMode) {
        setLocalScores(updatedScores);
        nextPuzzle();
      } else if (roomCode) {
        const nextI = (puzzleIdx + 1) % PUZZLES.length;
        await update(ref(db, `rooms/${roomCode}`), {
          scores: updatedScores,
          puzzleIndex: nextI,
        });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputAnswer.trim() || winner) return;

    const guess = inputAnswer.trim().toLowerCase();
    const cleanAnswer = puzzle.answer.toLowerCase();

    setInputAnswer('');

    if (guess === cleanAnswer) {
      handleScore(myRole, `🎉 Bạn đã đoán đúng đáp án "${puzzle.answer}"! (+1 Điểm)`);
    } else {
      sound.playLose();
      setFeedback(`Sai rồi! Hãy thử lại nhanh trước khi hết 30s!`);
    }
  };

  useEffect(() => {
    if (winner && !rewardClaimed) {
      if (winner === myRole) {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
        if (onRewardWon) onRewardWon(250, 2);
      }
      setRewardClaimed(true);
    }
  }, [winner, myRole, rewardClaimed, onRewardWon]);

  const handleRematch = async () => {
    sound.playClick();
    setRewardClaimed(false);
    setTimeLeft(30);
    setFeedback('');

    if (isBotMode) {
      setLocalScores({ X: 0, O: 0 });
      setLocalWinner(null);
      setCurrentIdx((prev) => (prev + 1) % PUZZLES.length);
    } else if (roomCode) {
      await update(ref(db, `rooms/${roomCode}`), {
        scores: { X: 0, O: 0 },
        winner: null,
        puzzleIndex: Math.floor(Math.random() * PUZZLES.length),
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-2 sm:p-4 select-none animate-in fade-in font-jakarta">
      {/* Top Header Light Pastel */}
      <div className="w-full flex items-center justify-between gap-2 mb-2.5 bg-white p-3 rounded-3xl border border-orange-100 shadow-sm">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rời phòng</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/80 font-mono">
            {isBotMode ? 'Thi với Máy AI' : `Phòng PIN: ${roomCode}`}
          </span>
          <div className="text-xs font-black font-fredoka text-amber-950">🧩 Đuổi Hình Bắt Chữ</div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold font-fredoka shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-700" />
          <span>+250 Xu</span>
        </div>
      </div>

      {/* BẢNG ĐIỂM 2 BÊN (Ai đạt 3 điểm trước là thắng) */}
      <div className="w-full grid grid-cols-2 gap-2 mb-2.5">
        <div className="p-3 rounded-3xl bg-white border border-blue-200 text-center shadow-sm">
          <div className="text-[10px] font-bold text-blue-600">{myRole === 'X' ? 'BẠN (X)' : 'Đối thủ (X)'}</div>
          <div className="text-2xl font-black font-fredoka text-slate-800">{scores.X || 0} / 3</div>
        </div>
        <div className="p-3 rounded-3xl bg-white border border-orange-200 text-center shadow-sm">
          <div className="text-[10px] font-bold text-orange-600">{myRole === 'O' ? 'BẠN (O)' : isBotMode ? 'Bot AI (O)' : 'Đối thủ (O)'}</div>
          <div className="text-2xl font-black font-fredoka text-slate-800">{scores.O || 0} / 3</div>
        </div>
      </div>

      {/* KHUNG CÂU ĐỐ HÌNH ẢNH LIGHT PASTEL */}
      <div className="w-full p-5 rounded-3xl bg-white border-2 border-orange-200 shadow-sm text-center mb-2.5">
        {/* Đồng hồ 30s */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-amber-800 mb-2.5">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Thời gian còn: <strong className="text-rose-600">{timeLeft}s</strong></span>
        </div>

        {/* 2 Icon hình ảnh ghép câu */}
        <div className="flex items-center justify-center gap-4 my-2">
          {puzzle.icons.map((ic, i) => (
            <div
              key={i}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FFF9EE] border-2 border-amber-300 flex items-center justify-center text-4xl sm:text-5xl shadow-sm animate-pulse"
            >
              {ic}
            </div>
          ))}
        </div>

        {/* Gợi ý */}
        <p className="text-xs text-amber-900 mt-3 font-semibold flex items-center justify-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>Gợi ý: {puzzle.hint} ({puzzle.answer.length} ký tự)</span>
        </p>

        {feedback && (
          <div className="mt-2.5 p-2 rounded-2xl bg-amber-50 text-xs font-bold text-amber-950 border border-amber-200">
            {feedback}
          </div>
        )}
      </div>

      {/* Ô NHẬP ĐÁP ÁN */}
      {!winner && (
        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-2.5">
          <input
            type="text"
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            placeholder="Gõ đáp án tiếng Việt (VD: Bắp Cải)..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-amber-300 text-slate-800 font-fredoka text-sm focus:outline-none focus:border-amber-500 placeholder-slate-400 uppercase shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputAnswer.trim()}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-amber-950 font-black font-fredoka text-sm border-2 border-amber-600 shadow-sm active:scale-95 transition"
          >
            Đoán! 🎯
          </button>
        </form>
      )}

      {/* THẮNG TRẬN */}
      {winner && (
        <div className="w-full mb-3 text-center">
          <div className="p-3 rounded-3xl bg-amber-300 border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-sm mb-2.5 shadow-sm animate-bounce">
            {winner === myRole ? '🏆 BẠN ĐÃ CHIẾN THẮNG TRẬN ĐỐ CHỮ (+250 Xu)!' : '💀 ĐỐI THỦ ĐÃ ĐẠT 3 ĐIỂM TRƯỚC!'}
          </div>
          <button
            onClick={handleRematch}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm border-2 border-amber-600 shadow-sm mx-auto active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Ván Mới 🔄</span>
          </button>
        </div>
      )}

      {/* CHATBOX */}
      <ChatBox roomPin={roomCode} />
    </div>
  );
}

export default CatchWordGame;
