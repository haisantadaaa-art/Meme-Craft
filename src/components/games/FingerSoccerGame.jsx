import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { haptic } from '../../utils/haptics';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Timer,
  Trophy,
  Zap,
  Flame,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function FingerSoccerGame({
  roomCode = '',
  myRole = 'p1', // 'p1' (Dưới) | 'p2' (Trên)
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const isP1 = String(myRole).toLowerCase() === 'p1';

  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(90);
  const [isGameOver, setIsGameOver] = useState(false);
  const [goalBanner, setGoalBanner] = useState('');
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const sessionRef = useRef(null);
  const botTimerRef = useRef(null);
  const gameTimerRef = useRef(null);

  // VẬT LÝ TRẬN ĐẤU (Physics State Refs)
  const p1Pos = useRef({ x: 190, y: 390, vx: 0, vy: 0, radius: 24 });
  const p2Pos = useRef({ x: 190, y: 90, vx: 0, vy: 0, radius: 24 });
  const ballPos = useRef({ x: 190, y: 240, vx: 0, vy: 0, radius: 12 });

  // Reset bóng về tâm sân sau bàn thắng
  const resetBall = useCallback(() => {
    ballPos.current = { x: 190, y: 240, vx: 0, vy: 0, radius: 12 };
    p1Pos.current = { x: 190, y: 390, vx: 0, vy: 0, radius: 24 };
    p2Pos.current = { x: 190, y: 90, vx: 0, vy: 0, radius: 24 };
  }, []);

  // Khởi tạo trận bóng
  const initGame = useCallback(() => {
    setScore({ p1: 0, p2: 0 });
    setTimeLeft(90);
    setIsGameOver(false);
    setGoalBanner('');
    setRewardClaimed(false);
    resetBall();

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    sound.playTick();
  }, [resetBall]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Đếm ngược 90s
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

  // Kết nối P2P online nếu có
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'soccer',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '⚽' },
      (remoteState) => {
        if (!remoteState) return;
        if (remoteState.score) setScore(remoteState.score);
        if (typeof remoteState.timeLeft === 'number') setTimeLeft(remoteState.timeLeft);

        if (isP1 && remoteState.role === 'p2') {
          if (remoteState.p2Pos) {
            p2Pos.current.x = remoteState.p2Pos.x;
            p2Pos.current.y = remoteState.p2Pos.y;
          }
        } else if (!isP1 && remoteState.role === 'p1') {
          if (remoteState.p1Pos) {
            p1Pos.current.x = remoteState.p1Pos.x;
            p1Pos.current.y = remoteState.p1Pos.y;
          }
          if (remoteState.ball) {
            ballPos.current.x = remoteState.ball.x;
            ballPos.current.y = remoteState.ball.y;
          }
        }

        if (remoteState.isGameOver) setIsGameOver(true);
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName, isP1]);

  // Bot AI di chuyển và sút bóng
  useEffect(() => {
    if (!isBotMode || isGameOver) return;

    botTimerRef.current = setInterval(() => {
      const ball = ballPos.current;
      const bot = p2Pos.current;

      const dx = ball.x - bot.x;
      const dy = ball.y - bot.y;
      const dist = Math.hypot(dx, dy);

      const speed = botDifficulty === 'easy' ? 4 : botDifficulty === 'medium' ? 6.5 : 9;

      if (dist > 15) {
        bot.x += (dx / dist) * speed;
        // Giữ bot ở nửa sân trên
        bot.y = Math.min(230, Math.max(50, bot.y + (dy / dist) * speed));
      }

      // Sút nếu bóng ở gần
      if (dist < 40) {
        ball.vx = (ball.x - bot.x) * 0.45;
        ball.vy = Math.abs(ball.y - bot.y) * 0.5 + 4; // Sút mạnh xuống cầu môn P1
        sound.playPop();
        haptic.light();
      }
    }, 50);

    return () => {
      if (botTimerRef.current) clearInterval(botTimerRef.current);
    };
  }, [isBotMode, isGameOver, botDifficulty]);

  // Thao tác 1: Lao lên / Bật Nhảy về hướng bóng
  const handleDashToBall = () => {
    if (isGameOver) return;
    sound.playClick();
    haptic.light();

    const myPiece = isP1 ? p1Pos.current : p2Pos.current;
    const ball = ballPos.current;

    const dx = ball.x - myPiece.x;
    const dy = ball.y - myPiece.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      myPiece.x += (dx / dist) * 35;
      myPiece.y += (dy / dist) * 35;
    }
  };

  // Thao tác 2: Sút bóng cực căng về phía khung thành đối thủ
  const handlePowerKick = () => {
    if (isGameOver) return;
    const myPiece = isP1 ? p1Pos.current : p2Pos.current;
    const ball = ballPos.current;

    const dx = ball.x - myPiece.x;
    const dy = ball.y - myPiece.y;
    const dist = Math.hypot(dx, dy);

    sound.playPop();
    haptic.medium();

    if (dist < 75) {
      // Sút bóng cực mạnh theo hướng tấn công
      const targetY = isP1 ? -18 : 18; // P1 sút lên trên (y âm), P2 sút xuống dưới (y dương)
      ball.vx = (dx / (dist || 1)) * 14;
      ball.vy = targetY;
    } else {
      // Lao vọt tới bóng rồi sút
      myPiece.x = ball.x - (dx / (dist || 1)) * 20;
      myPiece.y = ball.y - (dy / (dist || 1)) * 20;
      ball.vx = (dx / (dist || 1)) * 10;
      ball.vy = isP1 ? -15 : 15;
    }
  };

  // VÒNG LẶP VẬT LÝ & CANVAS 60FPS
  useEffect(() => {
    if (isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pitchW = canvas.width;
    const pitchH = canvas.height;
    const goalW = 100;
    const goalXStart = (pitchW - goalW) / 2;
    const goalXEnd = goalXStart + goalW;

    const loop = () => {
      const ball = ballPos.current;
      const p1 = p1Pos.current;
      const p2 = p2Pos.current;

      // 1. VẬT LÝ BÓNG (Ma sát & Tốc độ)
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.975;
      ball.vy *= 0.975;

      // 2. VA CHẠM TƯỜNG BIÊN HAI BÊN
      if (ball.x - ball.radius <= 20) {
        ball.x = 20 + ball.radius;
        ball.vx = -ball.vx * 0.85;
        haptic.light();
      } else if (ball.x + ball.radius >= pitchW - 20) {
        ball.x = pitchW - 20 - ball.radius;
        ball.vx = -ball.vx * 0.85;
        haptic.light();
      }

      // 3. VA CHẠM XÀ NGANG / CỘT DỌC KHUNG THÀNH
      // Khung thành trên (Goal P2)
      if (ball.y - ball.radius <= 25) {
        const inGoalX = ball.x >= goalXStart && ball.x <= goalXEnd;
        if (inGoalX) {
          // BÓNG VÀO LƯỚI KHUNG THÀNH TRÊN -> P1 GHI BÀN!
          handleGoal('p1');
          return;
        } else {
          // Bật lại từ tường biên trên
          ball.y = 25 + ball.radius;
          ball.vy = -ball.vy * 0.8;
          haptic.medium();
        }
      }

      // Khung thành dưới (Goal P1)
      if (ball.y + ball.radius >= pitchH - 25) {
        const inGoalX = ball.x >= goalXStart && ball.x <= goalXEnd;
        if (inGoalX) {
          // BÓNG VÀO LƯỚI KHUNG THÀNH DƯỚI -> P2 GHI BÀN!
          handleGoal('p2');
          return;
        } else {
          // Bật lại từ tường biên dưới
          ball.y = pitchH - 25 - ball.radius;
          ball.vy = -ball.vy * 0.8;
          haptic.medium();
        }
      }

      // 4. VA CHẠM GIỮA CẦU THỦ VÀ BÓNG
      // P1 chạm bóng
      const dx1 = ball.x - p1.x;
      const dy1 = ball.y - p1.y;
      const dist1 = Math.hypot(dx1, dy1);
      if (dist1 < ball.radius + p1.radius) {
        const angle = Math.atan2(dy1, dx1);
        const force = 9;
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;
        sound.playPop();
        haptic.light();
      }

      // P2 chạm bóng
      const dx2 = ball.x - p2.x;
      const dy2 = ball.y - p2.y;
      const dist2 = Math.hypot(dx2, dy2);
      if (dist2 < ball.radius + p2.radius) {
        const angle = Math.atan2(dy2, dx2);
        const force = 9;
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;
        sound.playPop();
        haptic.light();
      }

      // 5. GIỚI HẠN VÙNG SÂN CHO CẦU THỦ
      p1.x = Math.max(40, Math.min(pitchW - 40, p1.x));
      p1.y = Math.max(pitchH / 2, Math.min(pitchH - 45, p1.y));

      p2.x = Math.max(40, Math.min(pitchW - 40, p2.x));
      p2.y = Math.max(45, Math.min(pitchH / 2, p2.y));

      // 6. VẼ SÂN BÓNG ĐÁ 2D RETRO
      renderPitch(ctx, pitchW, pitchH, goalXStart, goalW);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver]);

  // Xử lý khi có bàn thắng
  const handleGoal = (scorer) => {
    sound.playWin();
    haptic.success();
    confetti({ particleCount: 90, spread: 80, origin: { y: scorer === 'p1' ? 0.3 : 0.7 } });

    setGoalBanner(scorer === 'p1' ? '⚽ VÀOOOO! BẠN GHI BÀN ĐẲNG CẤP!' : '😢 ĐỐI THỦ VỪA GHI BÀN!');

    setScore((prev) => {
      const nextScores = { ...prev, [scorer]: prev[scorer] + 1 };

      if (nextScores.p1 >= 3 || nextScores.p2 >= 3) {
        setIsGameOver(true);
        if (nextScores.p1 > nextScores.p2 && !rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(150, 3);
        }
      }

      return nextScores;
    });

    setTimeout(() => {
      setGoalBanner('');
      resetBall();
    }, 1500);
  };

  // HÀM VẼ SÂN CỎ 2D
  const renderPitch = (ctx, w, h, gx, gw) => {
    // Sân cỏ sọc xanh retro
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, 0, w, h);

    // Kẻ vạch sân trắng
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;

    // Đường biên ngoài
    ctx.strokeRect(20, 25, w - 40, h - 50);

    // Đường giữa sân & Vòng tròn trung tâm
    ctx.beginPath();
    ctx.moveTo(20, h / 2);
    ctx.lineTo(w - 20, h / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Điểm giao bóng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Khung thành trên
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(gx, 10, gw, 15);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx, 10, gw, 15);

    // Khung thành dưới
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(gx, h - 25, gw, 15);
    ctx.strokeRect(gx, h - 25, gw, 15);

    // VẼ CẦU THỦ P1 (CAPYBARA / ĐỎ)
    const p1 = p1Pos.current;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦫', p1.x, p1.y);

    // VẼ CẦU THỦ P2 (SHIBA / XANH)
    const p2 = p2Pos.current;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, p2.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillText('🐕', p2.x, p2.y);

    // VẼ TRÁI BÓNG ⚽
    const ball = ballPos.current;
    ctx.font = '24px Arial';
    ctx.fillText('⚽', ball.x, ball.y);
  };

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
          <span className="font-fredoka font-black text-xs text-emerald-950 block">
            ⚽ BÓNG ĐÁ BÀN 2 NÚT
          </span>
          <span className="text-[9px] text-emerald-700 font-bold">
            {isBotMode ? `Đấu Bot AI (${botDifficulty})` : `Online #${roomCode}`}
          </span>
        </div>

        <button
          onClick={initGame}
          title="Chơi lại trận mới"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. THANH BẢNG ĐIỂM TỈ SỐ & ĐỒNG HỒ 90s */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 text-white p-2 rounded-2xl border border-white/20 shadow-xs shrink-0 flex items-center justify-between gap-2 my-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center font-fredoka font-black text-sm">
            🦫
          </div>
          <div className="leading-tight">
            <span className="text-[11px] font-fredoka font-bold text-red-200">
              {isP1 ? playerName : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-base text-white block">
              {score.p1} Bàn
            </span>
          </div>
        </div>

        <div className="text-center">
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-fredoka font-black text-amber-300 block mb-0.5">
            CHẠM 3 BÀN THẮNG
          </span>
          <span className="font-mono font-black text-xs text-cyan-200 flex items-center justify-center gap-0.5">
            <Timer className="w-3 h-3 text-cyan-400" />
            {timeLeft}s
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 text-right">
          <div className="leading-tight">
            <span className="text-[11px] font-fredoka font-bold text-blue-200">
              {isBotMode ? 'Bot AI' : !isP1 ? playerName : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-base text-white block">
              {score.p2} Bàn
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-fredoka font-black text-sm">
            🐕
          </div>
        </div>
      </div>

      {/* 3. MẶT SÂN CỎ 2D CANVAS */}
      <div className="flex-1 w-full bg-[#1b4332] rounded-3xl border-2 border-emerald-400/80 shadow-inner relative flex items-center justify-center my-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={380}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Banner VÀOOOO! khi có bàn thắng */}
        {goalBanner && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20 animate-in zoom-in">
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black px-6 py-3 rounded-3xl border-4 border-white shadow-2xl text-center">
              <span className="text-3xl block mb-1">🎉⚽</span>
              <span className="font-fredoka font-black text-base drop-shadow-xs">
                {goalBanner}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. THANH NÚT ĐIỀU KHIỂN 2 NÚT TỐI GIẢN: [🏃 LAO LÊN] & [⚡ SÚT CĂNG] */}
      <div className="grid grid-cols-2 gap-3 my-1 shrink-0">
        <button
          onClick={handleDashToBall}
          disabled={isGameOver}
          className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-fredoka font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-white/30"
        >
          <Zap className="w-5 h-5" />
          <span>🏃 LAO LÊN</span>
        </button>

        <button
          onClick={handlePowerKick}
          disabled={isGameOver}
          className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-fredoka font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-white/30"
        >
          <Flame className="w-5 h-5 fill-yellow-300 text-yellow-300" />
          <span>⚡ SÚT CĂNG</span>
        </button>
      </div>

      {/* 5. BANNER KẾT THÚC TRẬN ĐẤU */}
      {isGameOver && (
        <div className="mt-1 p-2.5 bg-gradient-to-r from-emerald-100 via-amber-100 to-teal-100 border-2 border-emerald-500 rounded-2xl text-center shadow-lg animate-in zoom-in-95 shrink-0">
          <p className="font-fredoka font-black text-sm text-emerald-950 mb-1">
            {score.p1 > score.p2
              ? `🏆 CHIẾN THẮNG TUYỆT VỜI! BẠN THẮNG (${score.p1} - ${score.p2})! (+150 Xu)`
              : score.p1 < score.p2
              ? `😢 ĐỐI THỦ ĐÃ THẮNG TRẬN (${score.p2} - ${score.p1})!`
              : '🤝 TRẬN BÓNG HÒA KỊCH TÍNH!'}
          </p>
          <button
            onClick={initGame}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-fredoka font-black text-xs transition active:scale-95 shadow-md"
          >
            Đá Lại Trận Mới 🔄
          </button>
        </div>
      )}
    </div>
  );
}

export default FingerSoccerGame;
