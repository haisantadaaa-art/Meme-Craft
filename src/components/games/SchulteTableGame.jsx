import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession, generateRoomCode } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
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

// Hàm sinh mảng số ngẫu nhiên theo seed (đảm bảo cả 2 máy nhận kết quả 100% giống hệt nhau)
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

export function SchulteTableGame({
  roomData = null,
  roomCode: initialRoomCode = '',
  myRole: initialRole = 'p1',
  isBotMode: initialBotMode = true,
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const [isOnlineMode, setIsOnlineMode] = useState(!initialBotMode);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [myRole, setMyRole] = useState(initialRole); // 'p1' (Xanh Dương) hoặc 'p2' (Cam Hồng)
  const [connectedGuest, setConnectedGuest] = useState(null);

  const [maxCount, setMaxCount] = useState(100); // Mặc định 10x10 (1-100) theo đúng yêu cầu
  const [difficulty, setDifficulty] = useState('medium');
  const [gridSeed, setGridSeed] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const [grid, setGrid] = useState(() => generateSeededSchulteGrid(100, 123456));

  const [targetNumber, setTargetNumber] = useState(1);
  const [claimedTiles, setClaimedTiles] = useState({}); // { [number]: 'p1' | 'p2' }
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(180);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeCountdown, setFreezeCountdown] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);
  const botTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const freezeTimerRef = useRef(null);

  const selectedMode = SCHULTE_MODES.find((m) => m.max === maxCount) || SCHULTE_MODES[2];

  // Khởi tạo bảng đấu mới
  const initGame = useCallback(
    (count = maxCount, seed = Math.floor(100000 + Math.random() * 900000)) => {
      const newGrid = generateSeededSchulteGrid(count, seed);
      setGridSeed(seed);
      setGrid(newGrid);
      setTargetNumber(1);
      setClaimedTiles({});
      setScores({ p1: 0, p2: 0 });
      setTimeLeft(180);
      setIsGameOver(false);
      setIsFrozen(false);
      setRewardClaimed(false);

      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);

      if (isOnlineMode && sessionRef.current) {
        sessionRef.current.syncGameState({
          gridSeed: seed,
          maxCount: count,
          targetNumber: 1,
          claimedTiles: {},
          scores: { p1: 0, p2: 0 },
          timeLeft: 180,
          isGameOver: false,
        });
      }
    },
    [maxCount, isOnlineMode]
  );

  // Đếm ngược 180s ván đấu
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

  const handleTimeOut = () => {
    sound.playWin();
    setIsGameOver(true);
  };

  // Bot AI tự động quét và cướp số
  useEffect(() => {
    if (isOnlineMode || isGameOver || targetNumber > maxCount) return;

    const diffObj = BOT_DIFFICULTIES.find((d) => d.id === difficulty) || BOT_DIFFICULTIES[1];
    const delay = Math.random() * (diffObj.maxDelay - diffObj.minDelay) + diffObj.minDelay;

    botTimerRef.current = setTimeout(() => {
      handleClaimNumber(targetNumber, 'p2');
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [isOnlineMode, isGameOver, targetNumber, maxCount, difficulty]);

  // Cướp số hợp lệ (Claim number)
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
    const nextScores = {
      ...scores,
      [byRole]: (scores[byRole] || 0) + 1,
    };

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

    // Đồng bộ P2P Realtime
    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        targetNumber: nextTarget,
        claimedTiles: nextClaimed,
        scores: nextScores,
        isGameOver: isFinished,
      });
    }
  };

  // Người chơi bấm ô số
  const handleCellClick = (num) => {
    if (isFrozen || isGameOver || claimedTiles[num]) return;

    if (num === targetNumber) {
      // Bấm trúng số hiện tại!
      handleClaimNumber(num, isOnlineMode ? myRole : 'p1');
    } else {
      // Bấm sai -> Phạt ĐÓNG BĂNG (Freeze) 1.0 giây!
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

  // Quản lý P2P Online qua GameRoomSession
  const handleCreateOnlineRoom = async () => {
    const seed = Math.floor(100000 + Math.random() * 900000);
    const session = new GameRoomSession(
      'schulte',
      { uid: 'host_' + Date.now(), displayName: playerName, avatar: '🍊' },
      (gameState) => {
        if (gameState.gridSeed && gameState.gridSeed !== gridSeed) {
          setGridSeed(gameState.gridSeed);
          setGrid(generateSeededSchulteGrid(gameState.maxCount || maxCount, gameState.gridSeed));
        }
        if (typeof gameState.targetNumber === 'number') setTargetNumber(gameState.targetNumber);
        if (gameState.claimedTiles) setClaimedTiles(gameState.claimedTiles);
        if (gameState.scores) setScores(gameState.scores);
        if (gameState.isGameOver) setIsGameOver(true);
      },
      (guest) => setConnectedGuest(guest),
      () => setConnectedGuest(null)
    );

    const code = await session.createRoom({
      gridSeed: seed,
      maxCount,
      targetNumber: 1,
      claimedTiles: {},
      scores: { p1: 0, p2: 0 },
      isGameOver: false,
    });

    sessionRef.current = session;
    setRoomCode(code);
    setMyRole('p1');
    initGame(maxCount, seed);
  };

  const handleJoinOnlineRoom = async (codeToJoin) => {
    const session = new GameRoomSession(
      'schulte',
      { uid: 'guest_' + Date.now(), displayName: playerName, avatar: '🐕' },
      (gameState) => {
        if (gameState.gridSeed && gameState.gridSeed !== gridSeed) {
          setGridSeed(gameState.gridSeed);
          setGrid(generateSeededSchulteGrid(gameState.maxCount || maxCount, gameState.gridSeed));
        }
        if (typeof gameState.targetNumber === 'number') setTargetNumber(gameState.targetNumber);
        if (gameState.claimedTiles) setClaimedTiles(gameState.claimedTiles);
        if (gameState.scores) setScores(gameState.scores);
        if (gameState.isGameOver) setIsGameOver(true);
      },
      (guest) => setConnectedGuest(guest),
      () => setConnectedGuest(null)
    );

    await session.joinRoom(codeToJoin);
    sessionRef.current = session;
    setRoomCode(codeToJoin);
    setMyRole('p2');
    setConnectedGuest({ name: 'Chủ Phòng' });
  };

  const handleLeaveOnlineRoom = () => {
    if (sessionRef.current) {
      sessionRef.current.leaveRoom();
      sessionRef.current = null;
    }
    setRoomCode('');
    setConnectedGuest(null);
    setMyRole('p1');
    initGame(maxCount);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CHỌN CHẾ ĐỘ: BOT vs ONLINE 2 NGƯỜI */}
      <OnlineRoomToolbar
        isOnlineMode={isOnlineMode}
        onToggleMode={(online) => {
          setIsOnlineMode(online);
          if (!online) handleLeaveOnlineRoom();
          else initGame(maxCount);
        }}
        roomCode={roomCode}
        isHost={myRole === 'p1'}
        myRole={myRole}
        connectedPlayer={connectedGuest}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onLeaveRoom={handleLeaveOnlineRoom}
      />

      {/* 2. THANH TỶ SỐ ĐỐI ĐẦU TRỰC QUAN [Player 1 (Xanh)] VS [Player 2 (Cam)] */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        {/* Người chơi 1: Xanh Dương */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${myRole === 'p1' ? 'bg-blue-100/80 border border-blue-300' : 'bg-slate-50'}`}>
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-fredoka font-black text-sm shadow-xs shrink-0">
            🍊
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-xs text-blue-950 block truncate">
              {myRole === 'p1' ? `${playerName} (Bạn)` : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-xs text-blue-700">
              {scores.p1} Điểm
            </span>
          </div>
        </div>

        {/* Thanh VS & Đồng hồ */}
        <div className="text-center px-1 shrink-0">
          <div className="font-fredoka font-black text-xs text-amber-950">VS</div>
          <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-0.5 justify-center">
            <Timer className="w-3 h-3 text-amber-600" />
            {timeLeft}s
          </div>
        </div>

        {/* Người chơi 2: Cam Hồng */}
        <div className={`flex items-center justify-end gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${myRole === 'p2' ? 'bg-orange-100/80 border border-orange-300' : 'bg-slate-50'}`}>
          <div className="min-w-0 leading-tight text-right">
            <span className="font-fredoka font-black text-xs text-orange-950 block truncate">
              {isOnlineMode
                ? myRole === 'p2'
                  ? `${playerName} (Bạn)`
                  : connectedGuest?.name || 'Khách'
                : `Bot AI (${difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'})`}
            </span>
            <span className="font-mono font-black text-xs text-orange-700">
              {scores.p2} Điểm
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-fredoka font-black text-sm shadow-xs shrink-0">
            {isOnlineMode ? '🐕' : '🤖'}
          </div>
        </div>
      </div>

      {/* 3. MỤC TIÊU TIẾP THEO: SỐ [ X ] */}
      <div className="my-1.5 py-1.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-2 border-amber-500 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-red-600 animate-bounce" />
          <span className="font-fredoka font-black text-xs text-amber-950">
            MỤC TIÊU TIẾP THEO:
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white border-2 border-amber-600 shadow-inner flex items-center justify-center font-fredoka font-black text-xl text-amber-950 animate-pulse">
          {targetNumber <= maxCount ? targetNumber : 'Xong!'}
        </div>

        <div className="text-right">
          <span className="text-[10px] font-fredoka font-bold text-amber-900 block">Tiến trình</span>
          <span className="font-mono font-black text-xs text-amber-950">
            {Math.min(targetNumber - 1, maxCount)} / {maxCount}
          </span>
        </div>
      </div>

      {/* Tùy chọn số lượng ô (25 / 50 / 100) & Độ khó Bot */}
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
                  ? 'bg-amber-400 text-black shadow-2xs'
                  : 'text-amber-900 hover:bg-amber-200/50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {!isOnlineMode && (
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
        )}
      </div>

      {/* 4. LƯỚI BẢNG ĐẤU TRANH SỐ 10x10 (CHUNG MỘT BẢNG) */}
      <div className="flex-1 flex items-center justify-center p-0.5 relative my-auto overflow-hidden">
        {/* Màn hình Đóng Băng khi bấm sai */}
        {isFrozen && (
          <div className="absolute inset-0 z-30 bg-cyan-900/50 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white animate-in zoom-in-95 pointer-events-auto">
            <Snowflake className="w-10 h-10 text-cyan-200 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="font-fredoka font-black text-sm text-cyan-100 mt-1">
              BẤM SAI! ĐÓNG BĂNG 1.0s
            </span>
            <span className="font-mono font-black text-xs text-cyan-200">
              {freezeCountdown}s
            </span>
          </div>
        )}

        {/* Lưới ô số căn chỉnh chuẩn mobile 100dvh */}
        <div
          className="w-full max-w-[360px] aspect-square bg-[#FFF9EE] rounded-2xl p-1 shadow-md border-2 border-amber-300 grid gap-[2px] overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${selectedMode.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${selectedMode.cols}, minmax(0, 1fr))`,
            touchAction: 'manipulation',
          }}
        >
          {grid.map((num) => {
            const claimedBy = claimedTiles[num];

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
                className={`w-full h-full rounded-md font-fredoka font-black flex items-center justify-center border transition-all active:scale-90 relative select-none ${tileStyle} ${
                  maxCount === 100
                    ? 'text-[9px] sm:text-[10px] leading-none'
                    : maxCount === 50
                    ? 'text-xs sm:text-sm leading-none'
                    : 'text-sm sm:text-base leading-none'
                }`}
              >
                {num}

                {/* Avatar người ăn điểm */}
                {claimedBy && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[7px] leading-none pointer-events-none">
                    {claimedBy === 'p1' ? '🍊' : '🐕'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Footer & Nút Đấu Lại */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between text-xs mt-1">
        <span className="text-[10px] font-fredoka font-bold text-amber-900 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Bấm trúng số hiện tại để ăn điểm. Bấm sai phạt đóng băng 1.0s!
        </span>

        <button
          onClick={() => initGame(maxCount)}
          className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-2xs transition active:scale-95"
        >
          Đấu Lại 🔄
        </button>
      </div>

      {/* MODAL KẾT THÚC VÁN ĐẤU */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[340px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 text-center shadow-2xl animate-in zoom-in-95">
            <span className="text-4xl">🏆</span>
            <h2 className="font-fredoka font-black text-lg text-amber-950 mt-2">
              {scores.p1 > scores.p2
                ? '🎉 BẠN ĐÃ CHIẾN THẮNG!'
                : scores.p1 === scores.p2
                ? '🤝 TRẬN ĐẤU HÒA ĐẸP MẮT!'
                : '😢 ĐỐI THỦ ĐÃ NHANH HƠN!'}
            </h2>

            <div className="flex items-center justify-center gap-4 my-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="text-center">
                <span className="text-xs font-fredoka text-blue-900 font-bold block">
                  {myRole === 'p1' ? 'Bạn' : 'Đối Thủ'}
                </span>
                <span className="font-fredoka font-black text-xl text-blue-600">{scores.p1}</span>
              </div>
              <span className="font-fredoka font-black text-lg text-amber-800">-</span>
              <div className="text-center">
                <span className="text-xs font-fredoka text-orange-900 font-bold block">
                  {myRole === 'p2' ? 'Bạn' : 'Đối Thủ'}
                </span>
                <span className="font-fredoka font-black text-xl text-orange-600">{scores.p2}</span>
              </div>
            </div>

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
