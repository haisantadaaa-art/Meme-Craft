import React, { useState, useEffect, useRef } from 'react';
import { db, ref, update, onValue } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import { judgeWordChainWithGemini } from '../../services/geminiService';
import { Trophy, Clock, Sparkles, RotateCcw, AlertTriangle, Send, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

// Kho từ điển bot phong phú dự phòng
export const BOT_DICTIONARY = {
  thực: ['thực phẩm', 'thực tế', 'thực hành', 'thực đơn'],
  phẩm: ['phẩm giá', 'phẩm hạnh', 'phẩm chất', 'phẩm màu'],
  chất: ['chất xơ', 'chất độc', 'chất lượng', 'chất béo'],
  béo: ['béo ngậy', 'béo tốt', 'béo mầm', 'béo phì'],
  ngậy: ['ngậy béo', 'ngậy mùi'],
  mùi: ['mùi vị', 'mùi thơm', 'mùi hương', 'mùi khét'],
  vị: ['vị giác', 'vị trí', 'vị tha', 'vị hương'],
  hương: ['hương hoa', 'hương thảo', 'hương sắc', 'hương vị'],
  hoa: ['hoa quả', 'hoa hồng', 'hoa sen', 'hoa lệ'],
  quả: ['quả ngọt', 'quả nhiên', 'quả báo', 'quả quýt'],
  quýt: ['quýt đường', 'quýt ngọt', 'quýt non'],
  đường: ['đường phèn', 'đường cát', 'đường phố', 'đường dài'],
  phố: ['phố xá', 'phố cổ', 'phố đi bộ', 'phố phường'],
  cổ: ['cổ tích', 'cổ phần', 'cổ thụ', 'cổ truyền'],
  tích: ['tích cực', 'tích lũy', 'tích phân', 'tích đức'],
  cực: ['cực phẩm', 'cực khổ', 'cực nhanh', 'cực đã'],
};

export function WordChainGame({
  roomData,
  roomCode,
  myRole = 'X',
  isBotMode = false,
  playerName = 'Chủ Tiệm',
  playerId = 'user_1',
  onRewardWon,
  onExit,
}) {
  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(15); // 15 giây đếm ngược mỗi lượt
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [localHistory, setLocalHistory] = useState(['Ẩm Thực']);
  const [localTurn, setLocalTurn] = useState('X');
  const [localWinner, setLocalWinner] = useState(null);
  const [localRoast, setLocalRoast] = useState('Bắt đầu bằng từ có tiếng "Thực" nhé! 🐾');
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef(null);

  const wordHistory = isBotMode ? localHistory : roomData?.wordHistory || ['Ẩm Thực'];
  const currentTurn = isBotMode ? localTurn : roomData?.currentTurn || 'X';
  const winner = isBotMode ? localWinner : roomData?.winner || null;
  const lastWord = wordHistory[wordHistory.length - 1] || 'Ẩm Thực';
  const roastMessage = isBotMode ? localRoast : roomData?.roastMessage || localRoast;

  const isMyTurn = currentTurn === myRole && !winner;

  // Lấy âm tiết cuối cùng của từ trước
  const lastSyllable = lastWord.trim().split(/\s+/).pop()?.toLowerCase() || '';

  // Đếm ngược 15 giây
  useEffect(() => {
    if (winner || isEvaluating) {
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
        if (prev <= 4) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTurn, winner, isEvaluating]);

  // Hết giờ 15s -> Xử thua người đang đến lượt
  const handleTimeOut = () => {
    sound.playBomb();
    const loser = currentTurn;
    const win = loser === 'X' ? 'O' : 'X';

    if (isBotMode) {
      setLocalWinner(win);
      setLocalRoast('Hết 15 giây suy nghĩ rồi! Chậm chân là thua cuộc! 💣');
    } else if (roomCode) {
      update(ref(db, `rooms/${roomCode}`), {
        winner: win,
        roastMessage: 'Hết 15 giây suy nghĩ! Bom đã nổ bùm! 💣',
      });
    }

    if (win === myRole) {
      sound.playWin();
      confetti({ particleCount: 70, spread: 70 });
      if (!rewardClaimed && onRewardWon) {
        setRewardClaimed(true);
        onRewardWon(80, 2);
      }
    }
  };

  // Bot tự động nối từ
  const makeBotTurn = (latestHistory) => {
    const prev = latestHistory[latestHistory.length - 1];
    const prevSyl = prev.trim().split(/\s+/).pop()?.toLowerCase() || '';

    setTimeout(() => {
      const candidates = BOT_DICTIONARY[prevSyl] || [`${prevSyl} tươi`, `${prevSyl} ngon`, `${prevSyl} lạ`];
      const botPick = candidates[Math.floor(Math.random() * candidates.length)];

      sound.playPop();
      const updated = [...latestHistory, botPick];
      setLocalHistory(updated);
      setLocalTurn('X');
      setTimeLeft(15);
      setLocalRoast(`🤖 Bot nối: "${botPick}". Đến lượt bạn!`);
    }, 1200);
  };

  // Gửi từ nối
  const handleSubmitWord = async (e) => {
    e?.preventDefault();
    if (!isMyTurn || isEvaluating || !inputWord.trim()) return;

    const trimmed = inputWord.trim();
    setIsEvaluating(true);
    sound.playClick();

    // Thẩm định với Gemini AI Referee
    const judge = await judgeWordChainWithGemini(lastWord, trimmed, playerName);
    setIsEvaluating(false);

    if (!judge.isValid) {
      sound.playBomb();
      if (isBotMode) {
        setLocalRoast(judge.comment);
      }
      return;
    }

    // Từ hợp lệ!
    sound.playTing();
    const nextHistory = [...wordHistory, trimmed];
    setInputWord('');
    setTimeLeft(15);

    if (isBotMode) {
      setLocalHistory(nextHistory);
      setLocalRoast(judge.comment);
      setLocalTurn('O');
      makeBotTurn(nextHistory);
    } else if (roomCode) {
      update(ref(db, `rooms/${roomCode}`), {
        wordHistory: nextHistory,
        currentTurn: myRole === 'X' ? 'O' : 'X',
        roastMessage: judge.comment,
      });
    }
  };

  const handleRestart = () => {
    sound.playClick();
    setRewardClaimed(false);
    setInputWord('');
    setTimeLeft(15);
    if (isBotMode) {
      setLocalHistory(['Ẩm Thực']);
      setLocalTurn('X');
      setLocalWinner(null);
      setLocalRoast('Bắt đầu bằng từ có tiếng "Thực" nhé! 🐾');
    } else if (roomCode) {
      update(ref(db, `rooms/${roomCode}`), {
        wordHistory: ['Ẩm Thực'],
        currentTurn: 'X',
        winner: null,
        roastMessage: 'Ván đấu mới đã sẵn sàng!',
      });
    }
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. Header: Lượt & Đồng hồ 15s */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center font-fredoka font-black text-sm shadow-xs">
            15s
          </div>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-rose-950 block">
              NỐI TỪ SINH TỬ
            </span>
            <span className="text-[10px] text-slate-500">
              {isBotMode ? 'Solo cùng Bot AI' : `Phòng: ${roomCode}`}
            </span>
          </div>
        </div>

        {/* Đồng hồ đếm lùi */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 border border-rose-300">
          <Clock className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-rose-600 animate-spin' : 'text-rose-500'}`} />
          <span className={`font-mono font-black text-sm ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-rose-950'}`}>
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

      {/* 2. KHU VỰC CUỘN TỪ VỰNG & LỜI TRỌNG TÀI GEMINI */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden my-2">
        {/* Lời cà khịa của Trọng tài Gemini AI */}
        <div className="mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-300 text-xs font-fredoka text-purple-950 flex items-center gap-2 shadow-2xs">
          <span className="text-xl shrink-0">🤖</span>
          <span className="leading-snug">{roastMessage}</span>
        </div>

        {/* Lịch sử chuỗi từ vựng */}
        <div className="flex-1 overflow-y-auto p-2 bg-white/80 rounded-2xl border border-amber-200 space-y-1.5 shadow-inner flex flex-col-reverse">
          {[...wordHistory].reverse().map((w, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={idx}
                className={`p-2 rounded-xl text-xs font-fredoka font-black flex items-center justify-between transition ${
                  isLatest
                    ? 'bg-amber-100 text-amber-950 border border-amber-300 scale-101'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{w}</span>
                {isLatest && <span className="text-[10px] font-bold text-amber-700">Mới nhất ⚡</span>}
              </div>
            );
          })}
        </div>

        {/* Từ bắt buộc phải nối tiếp */}
        <div className="mt-2 p-2 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs font-fredoka font-black text-amber-950">
          <span>Tiếng phải bắt đầu:</span>
          <span className="px-3 py-1 rounded-xl bg-amber-400 text-black text-sm uppercase shadow-2xs animate-pulse">
            "{lastSyllable}"
          </span>
        </div>
      </div>

      {/* 3. Ô NHẬP TỪ & NÚT GỬI */}
      <form onSubmit={handleSubmitWord} className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder={isMyTurn ? `Bắt đầu bằng "${lastSyllable}..."` : 'Chờ đối thủ gửi từ...'}
          disabled={!isMyTurn || Boolean(winner) || isEvaluating}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-amber-300 focus:outline-none focus:border-amber-500 font-fredoka font-bold text-xs text-slate-800 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!isMyTurn || Boolean(winner) || isEvaluating || !inputWord.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-fredoka font-black text-xs shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1 shrink-0"
        >
          {isEvaluating ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* BANNER THẮNG THUA */}
      {winner && (
        <div className="mt-2 p-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95">
          <span className="font-fredoka font-black text-xs text-amber-950">
            {winner === myRole
              ? '🎉 BẠN LÀ VUA NỐI TỪ! (+80 Xu & 1 Túi Quà Trợ Chiến)'
              : '😢 BẠN ĐÃ THUA CUỘC! HÃY LUYỆN THÊM VỐN TỪ VỰNG NHA!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default WordChainGame;
