import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { haptic } from '../../utils/haptics';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Bomb,
  Zap,
  Flame,
  Volume2,
  Trophy,
  Skull,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Hàm sinh câu đố phản xạ nhanh (Math hoặc Từ nhanh)
function generateQuickPuzzle() {
  const types = ['add', 'sub', 'mul', 'double'];
  const type = types[Math.floor(Math.random() * types.length)];
  let q = '';
  let correct = 0;

  if (type === 'add') {
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 40) + 10;
    q = `${a} + ${b} = ?`;
    correct = a + b;
  } else if (type === 'sub') {
    const a = Math.floor(Math.random() * 50) + 30;
    const b = Math.floor(Math.random() * 25) + 5;
    q = `${a} - ${b} = ?`;
    correct = a - b;
  } else if (type === 'mul') {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    q = `${a} × ${b} = ?`;
    correct = a * b;
  } else {
    const a = Math.floor(Math.random() * 35) + 5;
    q = `Gấp đôi số ${a}?`;
    correct = a * 2;
  }

  // 3 đáp án nhiễu
  const optionsSet = new Set([correct]);
  while (optionsSet.size < 4) {
    const diff = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const fake = correct + diff;
    if (fake >= 0) optionsSet.add(fake);
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  return { question: q, correct, options };
}

export function PassTheBombGame({
  roomCode = '',
  myRole = 'p1', // 'p1' | 'p2'
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const isP1 = String(myRole).toLowerCase() === 'p1';

  // State trận đấu
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // Số hiệp thắng
  const [bombHolder, setBombHolder] = useState('p1'); // 'p1' hoặc 'p2'
  const [fuseTime, setFuseTime] = useState(30); // Thời gian bom còn lại (giây)
  const [totalFuse, setTotalFuse] = useState(30);
  const [isExploded, setIsExploded] = useState(false);
  const [explodedPlayer, setExplodedPlayer] = useState(null); // 'p1' | 'p2'
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Câu đố hiện tại của người đang giữ bom trên máy cục bộ
  const [currentPuzzle, setCurrentPuzzle] = useState(() => generateQuickPuzzle());
  const [wrongShake, setWrongShake] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

  const sessionRef = useRef(null);
  const fuseTimerRef = useRef(null);
  const botTurnTimerRef = useRef(null);

  // Khởi động hiệp mới
  const startNewRound = useCallback(
    (roundNum, startingHolder = Math.random() > 0.5 ? 'p1' : 'p2') => {
      // Thời gian ngòi ngẫu nhiên từ 25s - 38s
      const fuse = Math.floor(Math.random() * 14) + 25;
      setFuseTime(fuse);
      setTotalFuse(fuse);
      setBombHolder(startingHolder);
      setIsExploded(false);
      setExplodedPlayer(null);
      setCurrentPuzzle(generateQuickPuzzle());

      if (fuseTimerRef.current) clearInterval(fuseTimerRef.current);
      if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
    },
    []
  );

  // Khởi tạo toàn bộ ván đấu
  const initGame = useCallback(() => {
    setScores({ p1: 0, p2: 0 });
    setRound(1);
    setIsGameOver(false);
    setRewardClaimed(false);
    startNewRound(1, 'p1');
  }, [startNewRound]);

  // Setup P2P Session nếu online
  useEffect(() => {
    if (!isBotMode && roomCode) {
      const session = new GameRoomSession(roomCode, myRole);
      sessionRef.current = session;

      session.onAction((action, payload) => {
        if (action === 'PASS_BOMB') {
          // Đối thủ đã chuyền bom sang mình
          setBombHolder(payload.newHolder);
          setFuseTime(payload.fuseTime);
          setCurrentPuzzle(generateQuickPuzzle());
          sound.playCardFlip?.();
          haptic.medium();
        } else if (action === 'BOMB_EXPLODED') {
          handleExplosion(payload.victim);
        } else if (action === 'RESTART_GAME') {
          initGame();
        }
      });

      return () => {
        session.cleanup();
      };
    }
  }, [isBotMode, roomCode, myRole, initGame]);

  // Bộ đếm lùi Fuse (Chỉ máy Host hoặc Máy Đơn tính thời gian)
  useEffect(() => {
    if (isGameOver || isExploded) return;

    fuseTimerRef.current = setInterval(() => {
      setFuseTime((prev) => {
        if (prev <= 1) {
          clearInterval(fuseTimerRef.current);
          handleExplosion(bombHolder);
          return 0;
        }

        // Càng gần hết giờ nhịp tim đập càng nhanh
        if (prev <= 8) {
          haptic.light();
          sound.playPiecePlace?.();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (fuseTimerRef.current) clearInterval(fuseTimerRef.current);
    };
  }, [isGameOver, isExploded, bombHolder]);

  // Xử lý nổ bom
  const handleExplosion = useCallback(
    (victim) => {
      setIsExploded(true);
      setExplodedPlayer(victim);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 1200);

      haptic.boom();
      sound.playExplosion?.();

      const winner = victim === 'p1' ? 'p2' : 'p1';
      const newScores = {
        p1: victim === 'p2' ? scores.p1 + 1 : scores.p1,
        p2: victim === 'p1' ? scores.p2 + 1 : scores.p2,
      };
      setScores(newScores);

      // Nếu online và mình là P1 báo nổ
      if (!isBotMode && sessionRef.current && isP1) {
        sessionRef.current.sendAction('BOMB_EXPLODED', { victim });
      }

      // Kiểm tra ai thắng chung cuộc (Chạm 2 hiệp thắng - Best of 3)
      if (newScores.p1 >= 2 || newScores.p2 >= 2) {
        setIsGameOver(true);
        if (
          (isP1 && newScores.p1 > newScores.p2) ||
          (!isP1 && newScores.p2 > newScores.p1)
        ) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          sound.playWin?.();
          haptic.success();
        } else {
          sound.playLose?.();
        }
      }
    },
    [scores, isBotMode, isP1]
  );

  // Bot AI tự động giải câu đố khi đang cầm bom
  useEffect(() => {
    if (!isBotMode || isGameOver || isExploded) return;

    if (bombHolder === 'p2') {
      // Bot phản xạ từ 1.8s đến 3.2s
      const delay =
        botDifficulty === 'hard'
          ? Math.random() * 1200 + 1400
          : Math.random() * 1800 + 1900;

      botTurnTimerRef.current = setTimeout(() => {
        // Bot chuyền bom lại cho P1
        setBombHolder('p1');
        setCurrentPuzzle(generateQuickPuzzle());
        sound.playCardFlip?.();
        haptic.medium();
      }, delay);
    }

    return () => {
      if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
    };
  }, [bombHolder, isBotMode, isGameOver, isExploded, botDifficulty]);

  // Người chơi bấm chọn đáp án
  const handleSelectAnswer = (ans) => {
    if (isGameOver || isExploded) return;

    const myCurrentRole = isP1 ? 'p1' : 'p2';
    if (bombHolder !== myCurrentRole) return; // Không cầm bom thì không bấm

    if (ans === currentPuzzle.correct) {
      // Đúng! Chuyền bom ngay
      sound.playWordCorrect?.();
      haptic.medium();
      const nextHolder = isP1 ? 'p2' : 'p1';
      setBombHolder(nextHolder);

      // Báo đối thủ nếu online
      if (!isBotMode && sessionRef.current) {
        sessionRef.current.sendAction('PASS_BOMB', {
          newHolder: nextHolder,
          fuseTime,
        });
      }
    } else {
      // Sai: Phạt rung lắc và phát tiếng tạch
      sound.playWordWrong?.();
      haptic.light();
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 400);
    }
  };

  // Nhận thưởng
  const handleClaimReward = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    const amIWinner = (isP1 && scores.p1 > scores.p2) || (!isP1 && scores.p2 > scores.p1);
    if (onRewardWon) {
      onRewardWon({
        coins: amIWinner ? 120 : 35,
        exp: amIWinner ? 45 : 15,
        elo: amIWinner ? 25 : -10,
      });
    }
    onExit?.();
  };

  const isMyTurn = (isP1 && bombHolder === 'p1') || (!isP1 && bombHolder === 'p2');
  const fusePercent = Math.max(0, Math.min(100, (fuseTime / totalFuse) * 100));

  return (
    <div
      className={`relative w-full max-w-[430px] mx-auto min-h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 flex flex-col justify-between p-3 select-none overflow-hidden transition-transform duration-75 ${
        shakeScreen ? 'animate-bounce' : ''
      }`}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-orange-200/80 shadow-sm z-10">
        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 font-black text-orange-900 text-sm tracking-wide">
            <Bomb size={18} className="text-red-500 animate-pulse" />
            <span>TRUYỀN BOM NỔ CHẬM</span>
          </div>
          <span className="text-[10px] text-orange-600 font-semibold">
            Hiệp {round}/3 • Thắng 2 hiệp là Vua Bom
          </span>
        </div>

        <button
          onClick={initGame}
          className="p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 active:scale-95 transition-all"
          title="Chơi lại"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* SCOREBOARD & FUSE PROGRESS */}
      <div className="my-2 bg-white/80 backdrop-blur rounded-2xl p-2.5 border border-orange-200/70 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between px-2">
          {/* P1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm ${
                bombHolder === 'p1'
                  ? 'bg-red-500 text-white border-red-300 animate-pulse ring-4 ring-red-200'
                  : 'bg-blue-100 text-blue-700 border-blue-300'
              }`}
            >
              {bombHolder === 'p1' ? '💣' : '🧑'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isP1 ? playerName : isBotMode ? 'Bot Đấu Thủ' : 'Đối Thủ'}
              </p>
              <div className="flex gap-1">
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full ${
                      scores.p1 > idx ? 'bg-amber-500 shadow-sm' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="text-center font-black text-orange-800 text-base">
            {scores.p1} : {scores.p2}
          </div>

          {/* P2 */}
          <div className="flex items-center gap-2 flex-row-reverse">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm ${
                bombHolder === 'p2'
                  ? 'bg-red-500 text-white border-red-300 animate-pulse ring-4 ring-red-200'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
            >
              {bombHolder === 'p2' ? '💣' : isBotMode ? '🤖' : '👤'}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">
                {!isP1 ? playerName : isBotMode ? 'Bot Khôn Khéo' : 'Đối Thủ'}
              </p>
              <div className="flex gap-1 justify-end">
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full ${
                      scores.p2 > idx ? 'bg-amber-500 shadow-sm' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NGÒI NỔ THANH TIẾN ĐỘ */}
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              fusePercent < 25
                ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${fusePercent}%` }}
          />
          <Flame
            size={14}
            className="absolute top-1/2 -translate-y-1/2 text-red-600 animate-bounce"
            style={{ left: `calc(${Math.max(4, fusePercent)}% - 10px)` }}
          />
        </div>
      </div>

      {/* SÂN ĐẤU TRUYỀN BOM Ở GIỮA */}
      <div className="flex-1 flex flex-col items-center justify-center relative py-2">
        {/* NỔ BÙM HIỆU ỨNG */}
        {isExploded ? (
          <div className="flex flex-col items-center animate-ping text-center">
            <div className="text-7xl mb-2">💥</div>
            <span className="text-2xl font-black text-red-600 tracking-wider">
              BÙM! NỔ TAN TÁNH!
            </span>
            <span className="text-sm font-bold text-orange-800 mt-1">
              {explodedPlayer === 'p1'
                ? isP1
                  ? 'Mặt bạn đã dính đầy than đen!'
                  : 'Đối thủ đã nổ tung!'
                : !isP1
                ? 'Mặt bạn đã dính đầy than đen!'
                : 'Đối thủ đã nổ tung!'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {/* Bom Ticking Visual */}
            <div className="relative">
              <div
                className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 ${
                  isMyTurn
                    ? 'bg-gradient-to-b from-red-500 to-rose-700 ring-8 ring-red-300/80 scale-105'
                    : 'bg-gradient-to-b from-slate-700 to-slate-900 ring-8 ring-slate-300/60 scale-95 opacity-80'
                }`}
              >
                <div className="text-6xl animate-bounce">
                  {isMyTurn ? '💣' : '⏳'}
                </div>
              </div>
              {/* Tia lửa ngòi nổ */}
              <div className="absolute -top-3 right-6 text-xl animate-spin">
                🔥
              </div>
            </div>

            {/* Trạng thái lượt */}
            <div className="mt-4 text-center">
              {isMyTurn ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-100 text-red-700 font-black text-sm animate-pulse border border-red-300">
                  <Flame size={16} /> BẠN ĐANG ÔM BOM! GIẢI NHANH ĐỂ CHUYỀN!
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300">
                  <span>Đối thủ đang ôm bom cuống cuồng...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KHU VỰC CÂU ĐỐ NHANH BÊN DƯỚI (DÀNH CHO NGƯỜI CHƠI) */}
      <div
        className={`bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-orange-200 shadow-lg flex flex-col gap-3 transition-transform ${
          wrongShake ? 'animate-wiggle bg-red-50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-orange-700 tracking-wider flex items-center gap-1">
            <Zap size={14} className="text-amber-500" /> CÂU HỎI PHẢN XẠ NHANH:
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Chạm đúng để đá bom đi
          </span>
        </div>

        {/* Nội dung câu đố */}
        <div className="text-center py-2 bg-orange-50/80 rounded-2xl border border-orange-200/60">
          <span className="text-2xl font-black text-slate-900 tracking-wider font-mono">
            {isMyTurn ? currentPuzzle.question : 'Chờ bom bay sang...'}
          </span>
        </div>

        {/* 4 Nút Lựa Chọn */}
        <div className="grid grid-cols-2 gap-2.5">
          {currentPuzzle.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelectAnswer(opt)}
              disabled={!isMyTurn || isExploded || isGameOver}
              className={`py-3.5 rounded-2xl text-lg font-black transition-all active:scale-95 shadow-sm border ${
                !isMyTurn || isExploded || isGameOver
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-gradient-to-b from-amber-400 to-orange-500 text-white border-orange-600 hover:brightness-105 active:brightness-95 shadow-orange-300/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL KẾT THÚC VÁN ĐẤU */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-orange-300 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mb-3 shadow-lg">
              <Trophy size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-800">
              {(isP1 && scores.p1 > scores.p2) ||
              (!isP1 && scores.p2 > scores.p1)
                ? 'CHIẾN THẮNG HUY HOÀNG!'
                : 'BỊ NỔ ĐEN THUI!'}
            </h3>

            <p className="text-xs text-slate-600 mt-1 mb-4">
              Tỷ số chung cuộc: {scores.p1} - {scores.p2}
            </p>

            <div className="flex gap-2 w-full">
              <button
                onClick={initGame}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 active:scale-95 transition-all text-sm"
              >
                Chơi Lại
              </button>
              <button
                onClick={handleClaimReward}
                disabled={rewardClaimed}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-md shadow-orange-300/40 text-sm"
              >
                {rewardClaimed ? 'Đã Nhận' : 'Nhận Thưởng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CỔ ĐỘNG VIÊN THÚ CƯNG HẬU TRƯỜNG */}
      <div className="absolute bottom-2 left-2 pointer-events-none opacity-85 z-10 flex items-center gap-1.5 bg-white/70 backdrop-blur px-2 py-1 rounded-full border border-orange-200">
        <span className="text-base animate-bounce">🐹</span>
        <span className="text-[10px] font-bold text-orange-900">
          Cố lên sen ơi!
        </span>
      </div>
    </div>
  );
}

export default PassTheBombGame;
