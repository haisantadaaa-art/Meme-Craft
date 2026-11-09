import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Timer,
  Flame,
  Snowflake,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SCHULTE_MODES = [
  { max: 25, label: '1 - 25', cols: 5 },
  { max: 50, label: '1 - 50', cols: 7 },
  { max: 100, label: '1 - 100', cols: 10 },
];

export const BOT_DIFFICULTIES = [
  { id: 'easy', label: 'Dễ 🌱', minDelay: 1400, maxDelay: 2500, missRate: 0.25 },
  { id: 'medium', label: 'Vừa ⚔️', minDelay: 1000, maxDelay: 1800, missRate: 0.15 },
  { id: 'hard', label: 'Khó 👑', minDelay: 600, maxDelay: 1100, missRate: 0.05 },
];

// Hàm sinh mảng số ngẫu nhiên theo seed
export function generateSeededSchulteGrid(max = 100, seed = 123456) {
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  let currentSeed = seed;

  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

export function SchulteBoard({
  roomCode = '',
  myRole = 'p1', // 'p1' (Xanh) | 'p2' (Cam)
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const [maxCount, setMaxCount] = useState(100);
  const [gridSeed, setGridSeed] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const [grid, setGrid] = useState(() => generateSeededSchulteGrid(100, 123456));

  const [targetNumber, setTargetNumber] = useState(1);
  const [claimedTiles, setClaimedTiles] = useState({}); // { [num]: 'p1' | 'p2' }
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(180);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);
  const botTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const freezeTimerRef = useRef(null);

  // Khởi tạo bảng đấu
  const initGame = useCallback(
    (count = maxCount, seed = Math.floor(100000 + Math.random() * 900000)) => {
      const newGrid = generateSeededSchulteGrid(count, seed);
      setGridSeed(seed);
      setGrid(newGrid);
      setTargetNumber(1);
      setClaimedTiles({});
      setScores({ p1: 0, p2: 0 });
      setTimeLeft(count <= 25 ? 60 : count <= 50 ? 120 : 180);
      setIsGameOver(false);
      setIsFrozen(false);
      setRewardClaimed(false);

      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    },
    [maxCount]
  );

  // Phiên đồng bộ P2P nếu có roomCode
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'schulte',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '🍊' },
      (gameState) => {
        if (!gameState) return;
        if (gameState.gridSeed && gameState.gridSeed !== gridSeed) {
          setGridSeed(gameState.gridSeed);
          setGrid(generateSeededSchulteGrid(gameState.maxCount || maxCount, gameState.gridSeed));
        }
        if (typeof gameState.targetNumber === 'number') setTargetNumber(gameState.targetNumber);
        if (gameState.claimedTiles) setClaimedTiles(gameState.claimedTiles);
        if (gameState.scores) setScores(gameState.scores);
        if (gameState.isGameOver) setIsGameOver(true);
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName, gridSeed, maxCount]);

  useEffect(() => {
    initGame(100);
  }, [initGame]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (isGameOver) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          setIsGameOver(true);
          sound.playWin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [isGameOver]);

  // Bot AI cướp số với tốc độ người thật (1.0s - 2.5s)
  useEffect(() => {
    if (!isBotMode || isGameOver || targetNumber > maxCount) return;

    const diffObj = BOT_DIFFICULTIES.find((d) => d.id === botDifficulty) || BOT_DIFFICULTIES[1];
    const delay = Math.random() * (diffObj.maxDelay - diffObj.minDelay) + diffObj.minDelay;

    botTimerRef.current = setTimeout(() => {
      // Có tỷ lệ trượt
      if (Math.random() < diffObj.missRate) return;
      handleClaimNumber(targetNumber, 'p2');
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [isBotMode, isGameOver, targetNumber, maxCount, botDifficulty]);

  // Cướp số hợp lệ
  const handleClaimNumber = (num, byRole) => {
    if (num !== targetNumber || claimedTiles[num] || isGameOver) return;

    const nextTarget = num + 1;
    const isPlayer = byRole === 'p1';

    if (isPlayer) {
      sound.playComboPop(Math.min(20, (scores.p1 || 0) + 1));
    } else {
      sound.playPop();
    }

    const nextClaimed = { ...claimedTiles, [num]: byRole };
    const nextScores = { ...scores, [byRole]: (scores[byRole] || 0) + 1 };

    setClaimedTiles(nextClaimed);
    setScores(nextScores);

    const isFinished = nextTarget > maxCount;
    if (isFinished) {
      sound.playWin();
      setIsGameOver(true);
      if (nextScores.p1 > nextScores.p2) {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(150, 3);
        }
      }
    } else {
      setTargetNumber(nextTarget);
    }

    if (!isBotMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        targetNumber: nextTarget,
        claimedTiles: nextClaimed,
        scores: nextScores,
        isGameOver: isFinished,
      });
    }
  };

  // Người chơi chạm ô số
  const handleCellClick = (num) => {
    if (isFrozen || isGameOver || claimedTiles[num]) return;

    if (num === targetNumber) {
      handleClaimNumber(num, isBotMode ? 'p1' : myRole);
    } else {
      // BẤM SAI -> PHẠT ĐÓNG BĂNG 1.0S
      sound.playBomb();
      setIsFrozen(true);

      freezeTimerRef.current = setTimeout(() => {
        setIsFrozen(false);
      }, 1000);
    }
  };

  const cols = maxCount <= 25 ? 5 : maxCount <= 50 ? 7 : 10;

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. HEADER CHUẨN: [🔙 Về Sảnh] + TÊN GAME + BADGE PHÒNG/BOT */}
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
          <span className="font-fredoka font-black text-xs text-amber-950 block">
            BẢNG TRANH SỐ SCHULTE
          </span>
          <span className="text-[9px] text-slate-500 font-bold">
            {isBotMode ? `Bot AI (${botDifficulty})` : `Phòng Online #${roomCode}`}
          </span>
        </div>

        <button
          onClick={() => initGame(maxCount)}
          title="Chơi lại ván mới"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. THANH TỈ SỐ ĐỐI ĐẦU: [P1 (Xanh)] VS [P2 (Cam)] */}
      <div className="bg-white/95 p-1.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2 my-1">
        {/* P1 */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl flex-1 min-w-0 bg-blue-50 border border-blue-200">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-fredoka font-black text-xs shrink-0">
            {myRole === 'p1' ? 'Bạn' : 'P1'}
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-[11px] text-blue-950 block truncate">
              {myRole === 'p1' ? playerName : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-xs text-blue-700">
              {scores.p1} Điểm
            </span>
          </div>
        </div>

        {/* Đồng hồ */}
        <div className="text-center px-1 shrink-0">
          <span className="font-fredoka font-black text-xs text-amber-950 block">VS</span>
          <span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-0.5 justify-center">
            <Timer className="w-3 h-3 text-amber-600" />
            {timeLeft}s
          </span>
        </div>

        {/* P2 */}
        <div className="flex items-center justify-end gap-1.5 p-1 rounded-xl flex-1 min-w-0 bg-orange-50 border border-orange-200">
          <div className="min-w-0 leading-tight text-right">
            <span className="font-fredoka font-black text-[11px] text-orange-950 block truncate">
              {isBotMode ? `Bot AI` : myRole === 'p2' ? playerName : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-xs text-orange-700">
              {scores.p2} Điểm
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-fredoka font-black text-xs shrink-0">
            {isBotMode ? '🤖' : myRole === 'p2' ? 'Bạn' : 'P2'}
          </div>
        </div>
      </div>

      {/* 3. MỤC TIÊU TIẾP THEO: SỐ [ X ] */}
      <div className="my-1 py-1.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-2 border-amber-500 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-red-600 animate-bounce" />
          <span className="font-fredoka font-black text-xs text-amber-950">
            MỤC TIÊU TIẾP THEO:
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white border-2 border-amber-600 shadow-inner flex items-center justify-center font-fredoka font-black text-xl text-amber-950 animate-pulse">
          {targetNumber <= maxCount ? targetNumber : 'XONG! 🏆'}
        </div>

        <div className="text-right">
          <span className="text-[9px] font-fredoka font-bold text-amber-900 block">Tiến trình</span>
          <span className="font-mono font-black text-xs text-amber-950">
            {Math.min(targetNumber - 1, maxCount)} / {maxCount}
          </span>
        </div>
      </div>

      {/* 4. BẢNG SỐ TRANH ĐẤU CHUNG (1 ĐẾN 100) */}
      <div className="flex-1 w-full bg-[#FFF9ED] p-1.5 rounded-3xl border-2 border-amber-300 shadow-inner relative flex items-center justify-center overflow-hidden my-1">
        {/* Lớp phủ phạt đóng băng 1.0s */}
        {isFrozen && (
          <div className="absolute inset-0 bg-cyan-900/60 backdrop-blur-xs z-20 flex flex-col items-center justify-center animate-in fade-in">
            <Snowflake className="w-10 h-10 text-cyan-200 animate-spin mb-1" />
            <span className="font-fredoka font-black text-sm text-cyan-100">
              BẤM SAI! ĐÓNG BĂNG 1.0s ❄️
            </span>
          </div>
        )}

        <div
          className="w-full h-full grid gap-1 p-0.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((num) => {
            const owner = claimedTiles[num];
            const isTarget = num === targetNumber;

            let tileStyle = 'bg-white hover:bg-amber-100/60 text-slate-800 border-amber-200';
            if (owner === 'p1') {
              tileStyle = 'bg-blue-500 text-white border-blue-600 shadow-2xs font-black';
            } else if (owner === 'p2') {
              tileStyle = 'bg-orange-500 text-white border-orange-600 shadow-2xs font-black';
            } else if (isTarget) {
              tileStyle = 'bg-yellow-200 text-amber-950 border-amber-400 font-black ring-2 ring-amber-400';
            }

            return (
              <button
                key={num}
                onClick={() => handleCellClick(num)}
                disabled={Boolean(owner || isGameOver || isFrozen)}
                className={`w-full h-full rounded-lg border flex items-center justify-center font-fredoka transition-all active:scale-95 ${tileStyle} ${
                  maxCount === 100
                    ? 'text-[10px] sm:text-xs'
                    : maxCount === 50
                    ? 'text-xs sm:text-sm'
                    : 'text-sm sm:text-base font-bold'
                }`}
              >
                {owner ? (owner === 'p1' ? '🔵' : '🔴') : num}
              </button>
            );
          })}
        </div>
      </div>

      {/* BANNER THẮNG THUA */}
      {isGameOver && (
        <div className="mt-1 p-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95 shrink-0">
          <span className="font-fredoka font-black text-xs text-amber-950">
            {scores.p1 > scores.p2
              ? `🎉 ${myRole === 'p1' ? 'BẠN' : 'ĐỐI THỦ'} ĐÃ CHIẾN THẮNG TUYỆT ĐỐI! (+150 Xu)`
              : scores.p1 < scores.p2
              ? `😢 ${myRole === 'p2' ? 'BẠN' : 'ĐỐI THỦ'} ĐÃ CHIẾN THẮNG!`
              : '🤝 VÁN ĐẤU HÒA ĐIỂM KỊCH TÍNH!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default SchulteBoard;
