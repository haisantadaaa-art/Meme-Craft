import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db, ref, update, onValue } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import {
  Trophy,
  RotateCcw,
  Sparkles,
  Timer,
  Flame,
  Zap,
  Snowflake,
  Copy,
  Check,
  Bot,
  Users,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SCHULTE_MODES = [
  { max: 25, label: '1 - 25', desc: '5x5 Chớp Nhoáng ⚡', cols: 5 },
  { max: 50, label: '1 - 50', desc: 'Nửa Bàn 🎯', cols: 7 },
  { max: 100, label: '1 - 100', desc: '10x10 Đại Chiến 🏆', cols: 10 },
];

export const BOT_DIFFICULTIES = [
  { id: 'easy', label: 'Dễ 🌱', minDelay: 1500, maxDelay: 2500 },
  { id: 'medium', label: 'Vừa ⚔️', minDelay: 900, maxDelay: 1400 },
  { id: 'hard', label: 'Khó 👑', minDelay: 400, maxDelay: 700 },
];

// Hàm tạo bảng xáo trộn chuẩn có seed hoặc Fisher-Yates
export function generateSchulteGrid(max = 100) {
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

export function SchulteTableGame({
  roomData = null,
  roomCode = '',
  myRole = 'p1', // 'p1' (Xanh Dương) hoặc 'p2' (Cam Hồng)
  isBotMode = true,
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const [maxCount, setMaxCount] = useState(25); // Mặc định 25 chớp nhoáng, có nút chuyển sang 50 hoặc 100
  const [difficulty, setDifficulty] = useState('medium');
  const [grid, setGrid] = useState(() => generateSchulteGrid(25));
  const [targetNumber, setTargetNumber] = useState(1);
  const [claimedTiles, setClaimedTiles] = useState({}); // { [number]: 'p1' | 'p2' }
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(180);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeCountdown, setFreezeCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const botTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const freezeTimerRef = useRef(null);

  const selectedMode = SCHULTE_MODES.find((m) => m.max === maxCount) || SCHULTE_MODES[0];

  // Khởi tạo ván chơi mới
  const initGame = useCallback(
    (count = maxCount) => {
      const newGrid = generateSchulteGrid(count);
      setGrid(newGrid);
      setTargetNumber(1);
      setClaimedTiles({});
      setScores({ p1: 0, p2: 0 });
      setTimeLeft(180);
      setIsGameOver(false);
      setIsFrozen(false);
      setRewardClaimed(false);

      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);

      // Nếu đang trong phòng Online: đồng bộ lên Firebase
      if (!isBotMode && roomCode) {
        update(ref(db, `rooms/${roomCode}/schulte`), {
          grid: newGrid,
          maxCount: count,
          targetNumber: 1,
          claimedTiles: {},
          scores: { p1: 0, p2: 0 },
          status: 'playing',
          updatedAt: Date.now(),
        }).catch((e) => console.error('Lỗi sync Firebase Schulte:', e));
      }
    },
    [maxCount, isBotMode, roomCode]
  );

  // Lắng nghe dữ liệu Online Realtime từ Firebase
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const schulteRef = ref(db, `rooms/${roomCode}/schulte`);
    const unsub = onValue(schulteRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val.grid && Array.isArray(val.grid)) setGrid(val.grid);
        if (typeof val.targetNumber === 'number') setTargetNumber(val.targetNumber);
        if (val.claimedTiles) setClaimedTiles(val.claimedTiles);
        if (val.scores) setScores(val.scores);
        if (val.maxCount) setMaxCount(val.maxCount);
        if (val.status === 'finished') setIsGameOver(true);
      } else {
        // Chưa có dữ liệu schulte trong room -> tạo mới
        initGame(maxCount);
      }
    });

    return () => unsub();
  }, [isBotMode, roomCode, initGame, maxCount]);

  // Đếm ngược 180s tổng thời gian trận đấu
  useEffect(() => {
    if (isGameOver) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [isGameOver]);

  // Hết giờ 180s
  const handleTimeOut = () => {
    sound.playWin();
    setIsGameOver(true);
  };

  // Bot AI tự động tìm kiếm số theo cấp độ khó
  useEffect(() => {
    if (!isBotMode || isGameOver || targetNumber > maxCount) return;

    const diffObj = BOT_DIFFICULTIES.find((d) => d.id === difficulty) || BOT_DIFFICULTIES[1];
    const delay = Math.random() * (diffObj.maxDelay - diffObj.minDelay) + diffObj.minDelay;

    botTimerRef.current = setTimeout(() => {
      // Bot cướp số hiện tại
      handleClaimNumber(targetNumber, 'p2');
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [isBotMode, isGameOver, targetNumber, maxCount, difficulty]);

  // Xử lý ăn số (Claim number)
  const handleClaimNumber = (num, byPlayer) => {
    if (num !== targetNumber || claimedTiles[num] || isGameOver) return;

    const nextTarget = num + 1;
    const isPlayer = byPlayer === 'p1';

    if (isPlayer) {
      sound.playComboPop(Math.min(15, scores.p1 + 1));
    } else {
      sound.playPop();
    }

    const nextClaimed = { ...claimedTiles, [num]: byPlayer };
    const nextScores = {
      ...scores,
      [byPlayer]: (scores[byPlayer] || 0) + 1,
    };

    setClaimedTiles(nextClaimed);
    setScores(nextScores);

    // Kiểm tra kết thúc ván
    if (nextTarget > maxCount) {
      sound.playWin();
      setIsGameOver(true);
      if (nextScores.p1 > nextScores.p2) {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(120, 2);
        }
      }
    } else {
      setTargetNumber(nextTarget);
    }

    // Đồng bộ Firebase nếu chơi Online
    if (!isBotMode && roomCode) {
      update(ref(db, `rooms/${roomCode}/schulte`), {
        targetNumber: nextTarget,
        claimedTiles: nextClaimed,
        scores: nextScores,
        status: nextTarget > maxCount ? 'finished' : 'playing',
      }).catch((e) => console.error('Lỗi sync claim:', e));
    }
  };

  // Người chơi bấm vào ô số
  const handleCellClick = (num) => {
    if (isFrozen || isGameOver || claimedTiles[num]) return;

    if (num === targetNumber) {
      // Bấm ĐÚNG!
      handleClaimNumber(num, isBotMode ? 'p1' : myRole);
    } else {
      // Bấm SAI -> Bị phạt Đóng Băng 1.0 giây!
      sound.playBomb();
      setIsFrozen(true);
      setFreezeCountdown(1.0);

      const interval = setInterval(() => {
        setFreezeCountdown((prev) => Math.max(0, parseFloat((prev - 0.2).toFixed(1))));
      }, 200);

      freezeTimerRef.current = setTimeout(() => {
        clearInterval(interval);
        setIsFrozen(false);
        setFreezeCountdown(0);
      }, 1000);
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
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-2.5 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. Header: Tỷ Số Đối Đầu Trực Quan [Bạn (Xanh)] VS [Đối Thủ (Cam)] */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        {/* Người chơi 1: Bạn (Xanh Dương) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-blue-50 border border-blue-200 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-fredoka font-black text-sm shadow-xs shrink-0">
            🍊
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-xs text-blue-950 block truncate">
              {playerName}
            </span>
            <span className="font-mono font-black text-xs text-blue-700">
              {scores.p1} Điểm
            </span>
          </div>
        </div>

        {/* Thanh VS & Thời gian còn lại */}
        <div className="text-center px-1 shrink-0">
          <div className="font-fredoka font-black text-xs text-amber-950">VS</div>
          <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-0.5 justify-center">
            <Timer className="w-3 h-3 text-amber-600" />
            {timeLeft}s
          </div>
        </div>

        {/* Người chơi 2: Đối Thủ hoặc Bot (Cam Hồng) */}
        <div className="flex items-center justify-end gap-1.5 p-1 rounded-xl bg-orange-50 border border-orange-200 flex-1 min-w-0">
          <div className="min-w-0 leading-tight text-right">
            <span className="font-fredoka font-black text-xs text-orange-950 block truncate">
              {isBotMode ? `Bot (${difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'})` : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-xs text-orange-700">
              {scores.p2} Điểm
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-fredoka font-black text-sm shadow-xs shrink-0">
            {isBotMode ? '🤖' : '🐕'}
          </div>
        </div>
      </div>

      {/* 2. THANH MỤC TIÊU LỚN Ở ĐỈNH: TÌM SỐ TIẾP THEO: [ X ] */}
      <div className="my-1.5 py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-2 border-amber-500 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-red-600 animate-bounce" />
          <span className="font-fredoka font-black text-xs sm:text-sm text-amber-950">
            TÌM SỐ TIẾP THEO:
          </span>
        </div>

        {/* Khung số mục tiêu to nổi bật */}
        <div className="w-11 h-11 rounded-2xl bg-white border-2 border-amber-600 shadow-inner flex items-center justify-center font-fredoka font-black text-2xl text-amber-950 animate-pulse">
          {targetNumber <= maxCount ? targetNumber : 'Xong!'}
        </div>

        {/* Tiến trình tổng */}
        <div className="text-right">
          <span className="text-[10px] font-fredoka font-bold text-amber-900 block">
            Tiến độ
          </span>
          <span className="font-mono font-black text-xs text-amber-950">
            {Math.min(targetNumber - 1, maxCount)} / {maxCount}
          </span>
        </div>
      </div>

      {/* Tùy chọn chế độ ván (25 / 50 / 100) & Độ khó Bot */}
      <div className="flex items-center justify-between gap-1.5 mb-1 px-1 shrink-0">
        <div className="flex rounded-xl bg-amber-100/70 p-0.5 border border-amber-300">
          {SCHULTE_MODES.map((m) => (
            <button
              key={m.max}
              onClick={() => {
                sound.playClick();
                setMaxCount(m.max);
                initGame(m.max);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-fredoka font-black transition ${
                maxCount === m.max
                  ? 'bg-amber-400 text-black shadow-2xs scale-102'
                  : 'text-amber-900 hover:bg-amber-200/50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {isBotMode ? (
          <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-300">
            {BOT_DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  sound.playClick();
                  setDifficulty(d.id);
                }}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-fredoka font-bold transition ${
                  difficulty === d.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        ) : roomCode ? (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-[10px] font-fredoka font-bold text-amber-950 border border-amber-300"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>Mã: {roomCode}</span>
          </button>
        ) : null}
      </div>

      {/* 3. LƯỚI BẢNG ĐẤU TRANH SỐ (SHARED BOARD PVP) */}
      <div className="flex-1 flex items-center justify-center p-0.5 relative my-auto overflow-hidden">
        {/* Màn che Đóng Băng khi bấm sai */}
        {isFrozen && (
          <div className="absolute inset-0 z-30 bg-cyan-900/40 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white animate-in zoom-in-95 pointer-events-auto">
            <Snowflake className="w-10 h-10 text-cyan-200 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="font-fredoka font-black text-sm text-cyan-100 mt-1">
              BẤM SAI! ĐÓNG BĂNG 1.0s
            </span>
            <span className="font-mono font-black text-xs text-cyan-200">
              {freezeCountdown}s
            </span>
          </div>
        )}

        {/* Khung Bảng Số */}
        <div
          className="w-full max-w-[360px] aspect-square bg-[#FFF9EE] rounded-2xl p-1.5 shadow-md border-2 border-amber-300 grid gap-1 overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${selectedMode.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${selectedMode.cols}, minmax(0, 1fr))`,
            touchAction: 'manipulation',
          }}
        >
          {grid.map((num) => {
            const claimedBy = claimedTiles[num];
            const isTarget = num === targetNumber;

            let tileStyle = 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200';
            if (claimedBy === 'p1') {
              tileStyle = 'bg-blue-500 text-white border-blue-600 shadow-inner scale-95';
            } else if (claimedBy === 'p2') {
              tileStyle = 'bg-orange-500 text-white border-orange-600 shadow-inner scale-95';
            }

            return (
              <button
                key={num}
                onClick={() => handleCellClick(num)}
                disabled={Boolean(claimedBy) || isFrozen || isGameOver}
                className={`w-full h-full rounded-lg font-fredoka font-black flex items-center justify-center border transition-all active:scale-95 relative select-none ${tileStyle} ${
                  maxCount === 100
                    ? 'text-[10px] sm:text-xs leading-none'
                    : maxCount === 50
                    ? 'text-xs sm:text-sm leading-none'
                    : 'text-sm sm:text-base leading-none'
                }`}
              >
                {num}

                {/* Avatar người đã chiếm ô */}
                {claimedBy && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] leading-none pointer-events-none">
                    {claimedBy === 'p1' ? '🍊' : '🐕'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Footer Điều Khiển */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between text-xs mt-1">
        <span className="text-[11px] font-fredoka font-bold text-amber-900 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Bấm đúng số X trước để cướp điểm! Bấm sai phạt đóng băng 1s!
        </span>

        <button
          onClick={() => initGame(maxCount)}
          className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-2xs transition active:scale-95"
        >
          Đấu Lại 🔄
        </button>
      </div>

      {/* MODAL KẾT THÚC ĐẠI CHIẾN */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[340px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 text-center shadow-2xl animate-in zoom-in-95">
            <span className="text-4xl">🏆</span>
            <h2 className="font-fredoka font-black text-lg text-amber-950 mt-2">
              {scores.p1 > scores.p2
                ? '🎉 BẠN ĐÃ CHIẾN THẮNG TUYỆT ĐỈNH!'
                : scores.p1 === scores.p2
                ? '🤝 TRẬN ĐẤU HÒA ĐẸP MẮT!'
                : '😢 ĐỐI THỦ ĐÃ NHANH TAY HƠN!'}
            </h2>

            <div className="flex items-center justify-center gap-4 my-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="text-center">
                <span className="text-xs font-fredoka text-blue-900 font-bold block">Bạn</span>
                <span className="font-fredoka font-black text-xl text-blue-600">{scores.p1}</span>
              </div>
              <span className="font-fredoka font-black text-lg text-amber-800">-</span>
              <div className="text-center">
                <span className="text-xs font-fredoka text-orange-900 font-bold block">Đối Thủ</span>
                <span className="font-fredoka font-black text-xl text-orange-600">{scores.p2}</span>
              </div>
            </div>

            <p className="text-xs text-emerald-800 font-bold">
              {scores.p1 > scores.p2
                ? 'Nhận ngay +120 Xu & 1 Túi Quà Trợ Chiến cho Bé Cưng! 🎁'
                : 'Luyện tập thêm để nâng cao tốc độ phản xạ nhé!'}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={onExit}
                className="py-2 rounded-xl bg-slate-100 text-slate-700 font-fredoka font-bold text-xs border border-slate-300"
              >
                Về Sảnh Minigames
              </button>
              <button
                onClick={() => initGame(maxCount)}
                className="py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-sm"
              >
                Đấu Lại Ngay 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchulteTableGame;
