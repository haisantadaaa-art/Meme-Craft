import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../utils/soundEffects';
import { Trophy, ArrowLeft, RotateCcw, Clock, Sparkles, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatBox } from '../ChatBox';

const SYMBOLS = [
  { id: 'bau', name: 'Bầu', icon: '🍶' },
  { id: 'cua', name: 'Cua', icon: '🦀' },
  { id: 'tom', name: 'Tôm', icon: '🦐' },
  { id: 'ca', name: 'Cá', icon: '🐟' },
  { id: 'ga', name: 'Gà', icon: '🐔' },
  { id: 'nai', name: 'Nai', icon: '🦌' },
];

export function BauCuaGame({ roomCode, onExit }) {
  const { user, addCoins } = useAuth();
  const [selectedBetAmount, setSelectedBetAmount] = useState(20);
  const [bets, setBets] = useState({}); // { bau: 20, cua: 40, ... }
  const [diceResults, setDiceResults] = useState(['🍶', '🦀', '🦐']);
  const [isShaking, setIsShaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [roundFeedback, setRoundFeedback] = useState('Hãy chọn số tiền và đặt cược vào các cửa linh vật!');
  const timerRef = useRef(null);

  // Đếm ngược 15s mỗi lượt xóc đĩa
  useEffect(() => {
    setTimeLeft(15);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          triggerRollDice();
          return 15;
        }
        if (prev <= 4) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bets]);

  // Đặt cược vào 1 cửa
  const handlePlaceBet = (symbolId) => {
    if (isShaking) return;
    if ((user?.coins ?? 0) < selectedBetAmount) {
      alert('Bạn không đủ Tiền Vàng để đặt thêm cược!');
      return;
    }

    sound.playClick();
    addCoins(-selectedBetAmount);

    setBets((prev) => ({
      ...prev,
      [symbolId]: (prev[symbolId] || 0) + selectedBetAmount,
    }));
  };

  // Lắc 3 xúc xắc
  const triggerRollDice = () => {
    if (isShaking) return;
    setIsShaking(true);
    sound.playPlant();

    // Hiệu ứng xóc đĩa trong 1.5s
    const shakeInterval = setInterval(() => {
      setDiceResults([
        SYMBOLS[Math.floor(Math.random() * 6)].icon,
        SYMBOLS[Math.floor(Math.random() * 6)].icon,
        SYMBOLS[Math.floor(Math.random() * 6)].icon,
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(shakeInterval);

      // Kết quả cuối cùng
      const final1 = SYMBOLS[Math.floor(Math.random() * 6)];
      const final2 = SYMBOLS[Math.floor(Math.random() * 6)];
      const final3 = SYMBOLS[Math.floor(Math.random() * 6)];
      const finalDices = [final1, final2, final3];

      setDiceResults([final1.icon, final2.icon, final3.icon]);
      setIsShaking(false);

      // Tính thưởng
      let totalWon = 0;
      let totalReturned = 0;

      Object.entries(bets).forEach(([symId, betAmount]) => {
        const matchCount = finalDices.filter((d) => d.id === symId).length;
        if (matchCount > 0) {
          // Hoàn tiền cược + tiền thắng theo tỷ lệ (1:1, 1:2, 1:3)
          const profit = betAmount * matchCount;
          totalReturned += betAmount + profit;
          totalWon += profit;
        }
      });

      if (totalReturned > 0) {
        sound.playCoin();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        addCoins(totalReturned);
        setRoundFeedback(`🎉 Chúc mừng! Bạn trúng cược nhận về +${totalReturned} Vàng (+${totalWon} Lời)!`);
      } else if (Object.keys(bets).length > 0) {
        sound.playLose();
        setRoundFeedback(`Tiếc quá! Không trúng cửa nào rồi. Thử lại ván sau nhé!`);
      } else {
        setRoundFeedback(`Ván này bạn chưa đặt cược. Hãy chọn linh vật cho ván kế tiếp!`);
      }

      // Xóa cược cho ván mới
      setBets({});
    }, 1600);
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
            {roomCode ? `Phòng PIN: ${roomCode}` : 'Hội Chợ Bầu Cua'}
          </span>
          <div className="text-xs font-black font-fredoka text-amber-950">🎲 Bầu Cua Tôm Cá</div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold font-fredoka shadow-sm">
          <Coins className="w-3.5 h-3.5 text-amber-700" />
          <span>{(user?.coins ?? 0).toLocaleString()} Xu</span>
        </div>
      </div>

      {/* ĐĨA XÓC 3 XÚC XẮC & ĐẾM LÙI CHUẨN PASTEL */}
      <div className="w-full p-4 rounded-3xl bg-white border-2 border-orange-200 shadow-sm text-center mb-2.5">
        <div className="flex items-center justify-center gap-1 text-xs font-mono text-amber-800 mb-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Tự động mở đĩa sau: <strong className="text-rose-600">{timeLeft}s</strong></span>
        </div>

        {/* 3 Viên Xúc Xắc */}
        <div className="flex items-center justify-center gap-4 py-2">
          {diceResults.map((dice, i) => (
            <div
              key={i}
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-[#FFF9EE] border-3 border-amber-400 shadow-md flex items-center justify-center text-4xl sm:text-5xl transition-transform ${
                isShaking ? 'animate-spin' : 'hover:scale-105'
              }`}
            >
              {dice}
            </div>
          ))}
        </div>

        <p className="text-xs text-amber-900 mt-2 font-medium">{roundFeedback}</p>
      </div>

      {/* CHỌN MỨC CƯỢC */}
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <span className="text-xs font-bold text-amber-900 mr-1">Mức cược:</span>
        {[10, 20, 50, 100].map((amt) => (
          <button
            key={amt}
            onClick={() => {
              sound.playClick();
              setSelectedBetAmount(amt);
            }}
            className={`px-3 py-1 rounded-2xl font-fredoka font-black text-xs border transition ${
              selectedBetAmount === amt
                ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {amt} Xu
          </button>
        ))}
      </div>

      {/* BÀN CƯỢC 6 Ô LINH VẬT NỀN TRẮNG SÁNG */}
      <div className="grid grid-cols-3 gap-2.5 w-full mb-3">
        {SYMBOLS.map((sym) => {
          const betVal = bets[sym.id] || 0;
          return (
            <button
              key={sym.id}
              onClick={() => handlePlaceBet(sym.id)}
              disabled={isShaking}
              className="p-3 rounded-3xl bg-white hover:bg-amber-50/80 border-2 border-orange-100 shadow-sm flex flex-col items-center justify-center active:scale-95 transition relative group"
            >
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                {sym.icon}
              </span>
              <span className="font-fredoka font-black text-xs text-amber-950">{sym.name}</span>

              {/* Huy hiệu tiền cược trên ô */}
              {betVal > 0 && (
                <div className="absolute -top-2 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] border border-amber-600 shadow animate-bounce">
                  {betVal} Xu
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* NÚT LẮC ĐĨA TỨC THÌ */}
      <button
        onClick={triggerRollDice}
        disabled={isShaking}
        className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-950 font-fredoka font-black text-sm border-2 border-amber-600 shadow-sm active:scale-95 transition mb-3"
      >
        {isShaking ? 'Đang Lắc Đĩa... 🎲' : '🎲 MỞ BÁT NGAY!'}
      </button>

      {/* CHATBOX */}
      <ChatBox roomPin={roomCode} />
    </div>
  );
}

export default BauCuaGame;
