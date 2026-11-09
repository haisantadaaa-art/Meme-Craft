import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Zap,
  Flame,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Flag,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Chiều dài chặng đua chuẩn (1.000 mét)
export const RACE_TARGET_METERS = 1000;

// Các loại thực thể trên đường đua
export const ENTITY_TYPES = {
  OIL: { type: 'OIL', icon: '🛢️', name: 'Vũng Dầu', isObstacle: true },
  CRATE: { type: 'CRATE', icon: '📦', name: 'Thùng Gỗ', isObstacle: true },
  SLOW_CAR: { type: 'SLOW_CAR', icon: '🚙', name: 'Xe Chậm', isObstacle: true },
  NITRO: { type: 'NITRO', icon: '⚡', name: 'Nitro', isBoost: true },
  ORANGE: { type: 'ORANGE', icon: '🍊', name: 'Quýt Tốc Độ', isBoost: true },
};

// Hàm sinh chướng ngại vật & vật phẩm theo seed để 2 người chơi có đường đua 100% giống nhau
export function generateRaceTrackEntities(seed = 123456, totalMeters = 1000) {
  const entities = [];
  let currentSeed = seed;

  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  // Bố trí vật cản/vật phẩm từ mốc 50m đến 950m, cách nhau mỗi 35m - 60m
  let meter = 50;
  while (meter < totalMeters - 40) {
    meter += Math.floor(pseudoRandom() * 25) + 35;
    const lane = Math.floor(pseudoRandom() * 3); // Làn 0, 1 hoặc 2
    const roll = pseudoRandom();

    let entityType = ENTITY_TYPES.OIL;
    if (roll < 0.25) {
      entityType = ENTITY_TYPES.ORANGE; // Quýt tăng tốc
    } else if (roll < 0.45) {
      entityType = ENTITY_TYPES.NITRO; // Nitro
    } else if (roll < 0.7) {
      entityType = ENTITY_TYPES.CRATE; // Thùng gỗ
    } else if (roll < 0.88) {
      entityType = ENTITY_TYPES.OIL; // Vũng dầu
    } else {
      entityType = ENTITY_TYPES.SLOW_CAR; // Xe chậm
    }

    entities.push({
      id: `entity_${meter}_${lane}`,
      meter,
      lane,
      ...entityType,
      collectedP1: false,
      collectedP2: false,
    });
  }

  return entities;
}

export function MiniRacingGame({
  roomCode = '',
  myRole = 'p1', // 'p1' (Trái) | 'p2' (Phải)
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'
  const [countdownNum, setCountdownNum] = useState(3);
  const [trackSeed, setTrackSeed] = useState(() => Math.floor(100000 + Math.random() * 900000));

  // Tọa độ & trạng thái xe P1 (Bên Trái - Xe Đỏ / Capybara)
  const [p1Lane, setP1Lane] = useState(1); // 0 (Trái), 1 (Giữa), 2 (Phải)
  const [p1Progress, setP1Progress] = useState(0); // Mét (0 -> 1000)
  const [p1Speed, setP1Speed] = useState(24); // m/s
  const [p1BoostTime, setP1BoostTime] = useState(0);
  const [p1SpinTime, setP1SpinTime] = useState(0);

  // Tọa độ & trạng thái xe P2 (Bên Phải - Xe Xanh / Shiba hoặc Bot)
  const [p2Lane, setP2Lane] = useState(1);
  const [p2Progress, setP2Progress] = useState(0);
  const [p2Speed, setP2Speed] = useState(24);
  const [p2BoostTime, setP2BoostTime] = useState(0);
  const [p2SpinTime, setP2SpinTime] = useState(0);

  const [winner, setWinner] = useState(null); // 'p1' | 'p2'
  const [raceTimeSec, setRaceTimeSec] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Danh sách vật cản trên đường đua
  const entitiesRef = useRef([]);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const sessionRef = useRef(null);
  const botAiTimerRef = useRef(null);

  // Khởi tạo cuộc đua
  const initRace = useCallback((seed = Math.floor(100000 + Math.random() * 900000)) => {
    setTrackSeed(seed);
    entitiesRef.current = generateRaceTrackEntities(seed, RACE_TARGET_METERS);

    setP1Lane(1);
    setP1Progress(0);
    setP1Speed(24);
    setP1BoostTime(0);
    setP1SpinTime(0);

    setP2Lane(1);
    setP2Progress(0);
    setP2Speed(24);
    setP2BoostTime(0);
    setP2SpinTime(0);

    setWinner(null);
    setRaceTimeSec(0);
    setRewardClaimed(false);
    setGameState('COUNTDOWN');
    setCountdownNum(3);

    sound.playTick();
  }, []);

  useEffect(() => {
    initRace();
  }, [initRace]);

  // Đếm ngược 3, 2, 1, GO!
  useEffect(() => {
    if (gameState !== 'COUNTDOWN') return;

    if (countdownNum > 0) {
      const timer = setTimeout(() => {
        sound.playTick();
        setCountdownNum((prev) => prev - 1);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      sound.playTing();
      setGameState('RACING');
      lastTimeRef.current = performance.now();
    }
  }, [gameState, countdownNum]);

  // Đồng bộ P2P Realtime nếu chơi Online
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'racing',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '🏎️' },
      (remoteState) => {
        if (!remoteState) return;
        if (remoteState.trackSeed && remoteState.trackSeed !== trackSeed) {
          setTrackSeed(remoteState.trackSeed);
          entitiesRef.current = generateRaceTrackEntities(remoteState.trackSeed, RACE_TARGET_METERS);
        }
        if (typeof remoteState.p2Progress === 'number') setP2Progress(remoteState.p2Progress);
        if (typeof remoteState.p2Lane === 'number') setP2Lane(remoteState.p2Lane);
        if (typeof remoteState.p2BoostTime === 'number') setP2BoostTime(remoteState.p2BoostTime);
        if (typeof remoteState.p2SpinTime === 'number') setP2SpinTime(remoteState.p2SpinTime);
        if (remoteState.winner) {
          setWinner(remoteState.winner);
          setGameState('FINISHED');
        }
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName, trackSeed]);

  // Điều khiển P1 chuyển làn
  const moveP1Left = useCallback(() => {
    if (gameState !== 'RACING') return;
    setP1Lane((prev) => {
      const next = Math.max(0, prev - 1);
      if (next !== prev) sound.playClick();
      return next;
    });
  }, [gameState]);

  const moveP1Right = useCallback(() => {
    if (gameState !== 'RACING') return;
    setP1Lane((prev) => {
      const next = Math.min(2, prev + 1);
      if (next !== prev) sound.playClick();
      return next;
    });
  }, [gameState]);

  // Bàn phím máy tính (A/D hoặc Mũi tên trái/phải)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveP1Left();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveP1Right();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveP1Left, moveP1Right]);

  // Bot AI tự động né vật cản & nhặt nitro/quýt
  useEffect(() => {
    if (!isBotMode || gameState !== 'RACING') return;

    botAiTimerRef.current = setInterval(() => {
      const lookAheadMin = p2Progress + 25;
      const lookAheadMax = p2Progress + 85;

      // Tìm các vật thể sắp chạm trán ở làn hiện tại
      const upcoming = entitiesRef.current.filter(
        (e) => e.meter >= lookAheadMin && e.meter <= lookAheadMax
      );

      const dangerInCurrent = upcoming.find((e) => e.lane === p2Lane && e.isObstacle);
      const boostInOther = upcoming.find((e) => e.lane !== p2Lane && e.isBoost);

      // Tỷ lệ phản xạ theo độ khó
      const missChance = botDifficulty === 'easy' ? 0.35 : botDifficulty === 'medium' ? 0.15 : 0.05;

      if (dangerInCurrent && Math.random() > missChance) {
        // Cần né! Chọn làn trống
        const safeLanes = [0, 1, 2].filter((l) => l !== p2Lane && !upcoming.some((e) => e.lane === l && e.isObstacle));
        if (safeLanes.length > 0) {
          const target = safeLanes[Math.floor(Math.random() * safeLanes.length)];
          setP2Lane(target);
        } else {
          // Bất đắc dĩ chuyển sang làn cạnh bên
          setP2Lane((l) => (l === 0 ? 1 : l === 2 ? 1 : Math.random() > 0.5 ? 0 : 2));
        }
      } else if (boostInOther && Math.random() > missChance) {
        // Nhặt boost nếu an toàn
        const safe = !upcoming.some((e) => e.lane === boostInOther.lane && e.isObstacle);
        if (safe) setP2Lane(boostInOther.lane);
      }
    }, 280);

    return () => {
      if (botAiTimerRef.current) clearInterval(botAiTimerRef.current);
    };
  }, [isBotMode, gameState, p2Progress, p2Lane, botDifficulty]);

  // VÒNG LẶP VẬT LÝ & CANVAS 60FPS
  useEffect(() => {
    if (gameState !== 'RACING') return;

    let localP1Progress = p1Progress;
    let localP2Progress = p2Progress;
    let localP1Boost = p1BoostTime;
    let localP1Spin = p1SpinTime;
    let localP2Boost = p2BoostTime;
    let localP2Spin = p2SpinTime;

    const gameLoop = (timestamp) => {
      const deltaSec = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      setRaceTimeSec((t) => t + deltaSec);

      // 1. TÍNH TỐC ĐỘ P1
      if (localP1Boost > 0) localP1Boost = Math.max(0, localP1Boost - deltaSec);
      if (localP1Spin > 0) localP1Spin = Math.max(0, localP1Spin - deltaSec);

      const baseSpeedP1 = 28;
      let currentSpeedP1 = baseSpeedP1;
      if (localP1Boost > 0) currentSpeedP1 = 44; // Max Nitro
      else if (localP1Spin > 0) currentSpeedP1 = 12; // Va chạm xoay vòng

      localP1Progress += currentSpeedP1 * deltaSec;

      // 2. TÍNH TỐC ĐỘ P2
      if (localP2Boost > 0) localP2Boost = Math.max(0, localP2Boost - deltaSec);
      if (localP2Spin > 0) localP2Spin = Math.max(0, localP2Spin - deltaSec);

      const baseSpeedP2 = 28;
      let currentSpeedP2 = baseSpeedP2;
      if (localP2Boost > 0) currentSpeedP2 = 44;
      else if (localP2Spin > 0) currentSpeedP2 = 12;

      localP2Progress += currentSpeedP2 * deltaSec;

      // 3. KIỂM TRA VA CHẠM (COLLISION DETECTION)
      const hitRadius = 3.5; // mét

      entitiesRef.current.forEach((entity) => {
        // Kiểm tra P1
        if (!entity.collectedP1 && Math.abs(entity.meter - localP1Progress) < hitRadius && entity.lane === p1Lane) {
          entity.collectedP1 = true;
          if (entity.isObstacle) {
            sound.playBomb();
            localP1Spin = 1.5;
            localP1Boost = 0;
          } else if (entity.isBoost) {
            sound.playTing();
            sound.playPop();
            localP1Boost = 2.0;
            localP1Spin = 0;
          }
        }

        // Kiểm tra P2
        if (!entity.collectedP2 && Math.abs(entity.meter - localP2Progress) < hitRadius && entity.lane === p2Lane) {
          entity.collectedP2 = true;
          if (entity.isObstacle) {
            localP2Spin = 1.5;
            localP2Boost = 0;
          } else if (entity.isBoost) {
            localP2Boost = 2.0;
            localP2Spin = 0;
          }
        }
      });

      // Cập nhật state UI
      setP1Progress(localP1Progress);
      setP2Progress(localP2Progress);
      setP1BoostTime(localP1Boost);
      setP1SpinTime(localP1Spin);
      setP1Speed(currentSpeedP1);

      setP2BoostTime(localP2Boost);
      setP2SpinTime(localP2Spin);
      setP2Speed(currentSpeedP2);

      // Đồng bộ P2P online nếu có
      if (!isBotMode && sessionRef.current) {
        sessionRef.current.syncGameState({
          p2Progress: localP1Progress,
          p2Lane: p1Lane,
          p2BoostTime: localP1Boost,
          p2SpinTime: localP1Spin,
        });
      }

      // 4. KIỂM TRA CÁN ĐÍCH (1.000 METERS)
      if (localP1Progress >= RACE_TARGET_METERS || localP2Progress >= RACE_TARGET_METERS) {
        const isP1Won = localP1Progress >= localP2Progress;
        const winRole = isP1Won ? 'p1' : 'p2';
        setWinner(winRole);
        setGameState('FINISHED');

        if (isP1Won) {
          sound.playWin();
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
          if (!rewardClaimed && onRewardWon) {
            setRewardClaimed(true);
            onRewardWon(150, 3);
          }
        } else {
          sound.playBomb();
        }

        if (!isBotMode && sessionRef.current) {
          sessionRef.current.syncGameState({ winner: winRole });
        }
        return;
      }

      // 5. VẼ CANVAS ĐƯỜNG ĐUA CUỘN DỌC
      renderTrackCanvas(localP1Progress, localP2Progress, localP1Boost > 0, localP1Spin > 0, localP2Boost > 0, localP2Spin > 0);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, p1Lane, p2Lane, isBotMode, rewardClaimed, onRewardWon]);

  // HÀM VẼ CANVAS 2D ĐƯỜNG ĐUA RETRO 60FPS
  const renderTrackCanvas = (p1Dist, p2Dist, p1IsBoost, p1IsSpin, p2IsBoost, p2IsSpin) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const halfWidth = width / 2;

    // Nền đường nhựa đen arcade
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // 1. VẼ ĐƯỜNG CHẠY BÊN TRÁI (P1)
    renderSingleTrack(ctx, 0, halfWidth, height, p1Dist, p1Lane, '🦫', '#ef4444', p1IsBoost, p1IsSpin, 'P1');

    // 2. VẼ ĐƯỜNG CHẠY BÊN PHẢI (P2 / Bot)
    renderSingleTrack(ctx, halfWidth, halfWidth, height, p2Dist, p2Lane, '🐕', '#3b82f6', p2IsBoost, p2IsSpin, isBotMode ? 'BOT' : 'P2');

    // 3. DẢI PHÂN CÁCH TRUNG TÂM (VẠCH ĐỎ TRẮNG NỔI BẬT)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(halfWidth - 3, 0, 6, height);
  };

  const renderSingleTrack = (ctx, startX, trackWidth, height, carDist, carLane, mascotEmoji, carColor, isBoost, isSpin, label) => {
    // Vạch kẻ làn đường cuộn dọc theo khoảng cách xe chạy
    const laneWidth = trackWidth / 3;
    const scrollOffset = (carDist * 20) % 40;

    // Vạch nét đứt phân làn
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);

    ctx.beginPath();
    ctx.moveTo(startX + laneWidth, -scrollOffset);
    ctx.lineTo(startX + laneWidth, height + 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX + laneWidth * 2, -scrollOffset);
    ctx.lineTo(startX + laneWidth * 2, height + 40);
    ctx.stroke();

    ctx.setLineDash([]); // Reset

    // Gờ vỉa hè đỏ-trắng F1 hai bên mép đường
    const curbWidth = 6;
    const curbStep = 20;
    const curbOffset = (carDist * 15) % (curbStep * 2);

    for (let y = -curbStep * 2; y < height + curbStep * 2; y += curbStep) {
      const isRed = Math.floor((y + curbOffset) / curbStep) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
      ctx.fillRect(startX, y, curbWidth, curbStep);
      ctx.fillRect(startX + trackWidth - curbWidth, y, curbWidth, curbStep);
    }

    // VẼ CÁC VẬT CẢN & VẬT PHẨM
    const visibleRangeMeters = 40; // Hiển thị 40 mét phía trước xe
    const carScreenY = height - 80; // Vị trí xe cố định cách đáy màn hình 80px

    entitiesRef.current.forEach((entity) => {
      const relDist = entity.meter - carDist; // Khoảng cách tương đối so với xe
      if (relDist >= -5 && relDist <= visibleRangeMeters) {
        // Tọa độ Y trên màn hình
        const itemY = carScreenY - (relDist / visibleRangeMeters) * (height - 120);
        const itemX = startX + entity.lane * laneWidth + laneWidth / 2;

        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Hiệu ứng bóng đổ
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText(entity.icon, itemX, itemY);
        ctx.shadowBlur = 0; // Reset
      }
    });

    // VẼ XE ĐUA NGƯỜI CHƠI
    const carX = startX + carLane * laneWidth + laneWidth / 2;
    const carY = carScreenY;

    ctx.save();
    ctx.translate(carX, carY);

    // Hiệu ứng xoay tròn nếu đụng trúng vũng dầu
    if (isSpin) {
      const angle = (Date.now() / 60) % (Math.PI * 2);
      ctx.rotate(angle);
    }

    // Thân xe đua Retro bo góc
    ctx.fillStyle = carColor;
    ctx.beginPath();
    ctx.roundRect(-16, -26, 32, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Kính chắn gió mờ
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-11, -16, 22, 14, 3);
    ctx.fill();

    // 4 Bánh xe đen hầm hố
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-20, -22, 5, 12);
    ctx.fillRect(15, -22, 5, 12);
    ctx.fillRect(-20, 10, 5, 12);
    ctx.fillRect(15, 10, 5, 12);

    // Mascot ngồi lái xe
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mascotEmoji, 0, 3);

    // LỬA NITRO PHỤT ĐUÔI XE KHI TĂNG TỐC
    if (isBoost) {
      ctx.font = '18px Arial';
      ctx.fillText('🔥', -8, 36);
      ctx.fillText('🔥', 8, 36);
    }

    ctx.restore();

    // Nhãn tên người chơi
    ctx.font = 'bold 10px Fredoka, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(label, carX, carY - 34);
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
          <span className="font-fredoka font-black text-xs text-red-950 block">
            🏎️ ĐUA XE TỐC ĐỘ 1.000M
          </span>
          <span className="text-[9px] text-red-700 font-bold">
            {isBotMode ? `Đấu Bot AI (${botDifficulty})` : `Phòng Online #${roomCode}`}
          </span>
        </div>

        <button
          onClick={() => initRace()}
          title="Đua lại vòng mới"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. THANH TIẾN ĐỘ SO KÈ TỪNG MÉT (TRACK PROGRESS BAR 0 -> 1000M) */}
      <div className="bg-slate-900 text-white p-2 rounded-2xl border border-slate-700 shadow-xs shrink-0 my-1">
        <div className="flex items-center justify-between text-[11px] font-fredoka font-black mb-1">
          <div className="flex items-center gap-1 text-red-400">
            <span>🦫 Bạn:</span>
            <span className="font-mono text-white">{Math.min(RACE_TARGET_METERS, Math.round(p1Progress))}m</span>
            {p1BoostTime > 0 && <span className="text-amber-400 animate-pulse text-[10px]">🔥 NITRO!</span>}
          </div>

          <div className="flex items-center gap-1 text-amber-300">
            <Flag className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="font-mono text-xs text-yellow-300">1.000m ĐÍCH</span>
          </div>

          <div className="flex items-center gap-1 text-blue-400">
            <span>{isBotMode ? 'Bot AI:' : 'P2:'}</span>
            <span className="font-mono text-white">{Math.min(RACE_TARGET_METERS, Math.round(p2Progress))}m</span>
            {p2BoostTime > 0 && <span className="text-amber-400 animate-pulse text-[10px]">🔥 NITRO!</span>}
          </div>
        </div>

        {/* Cột theo dõi tiến độ hai xe song song */}
        <div className="w-full bg-slate-800 h-3 rounded-full relative overflow-hidden border border-slate-700 flex flex-col justify-center">
          {/* Vạch tiến trình P1 (Đỏ) */}
          <div
            className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-100"
            style={{ width: `${Math.min(100, (p1Progress / RACE_TARGET_METERS) * 100)}%` }}
          />
          {/* Vạch tiến trình P2 (Xanh) */}
          <div
            className="h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100 mt-0.5"
            style={{ width: `${Math.min(100, (p2Progress / RACE_TARGET_METERS) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. MÀN HÌNH ĐƯỜNG ĐUA CANVAS 2D CHIA ĐÔI DỌC */}
      <div className="flex-1 w-full bg-slate-900 rounded-3xl border-2 border-amber-400/80 shadow-inner relative flex items-center justify-center my-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={380}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Lớp phủ đếm ngược 3, 2, 1, GO! */}
        {gameState === 'COUNTDOWN' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-20 animate-in fade-in">
            <span className="text-6xl sm:text-7xl font-fredoka font-black text-amber-400 drop-shadow-[0_0_20px_#f59e0b] animate-bounce">
              {countdownNum > 0 ? countdownNum : 'XUẤT PHÁT! 🏁'}
            </span>
            <span className="text-xs font-fredoka font-bold text-white/90 mt-2">
              Né vũng dầu 🛢️ & Thùng gỗ 📦 • Ăn quýt 🍊 & Nitro ⚡
            </span>
          </div>
        )}

        {/* Chạm trực tiếp vào nửa trái / nửa phải đường đua để đổi làn */}
        <div className="absolute inset-0 grid grid-cols-2 z-10">
          <div
            onClick={moveP1Left}
            className="w-full h-full cursor-pointer active:bg-white/5"
            title="Chạm để rẽ trái"
          />
          <div
            onClick={moveP1Right}
            className="w-full h-full cursor-pointer active:bg-white/5"
            title="Chạm để rẽ phải"
          />
        </div>
      </div>

      {/* 4. THANH NÚT ĐIỀU KHIỂN CHUYỂN LÀN [ ⬅ Trái ] & [ Phải ➡ ] CHO MOBILE */}
      <div className="grid grid-cols-2 gap-3 my-1 shrink-0">
        <button
          onClick={moveP1Left}
          disabled={gameState !== 'RACING'}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-fredoka font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-white/30"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>RẼ TRÁI</span>
        </button>

        <button
          onClick={moveP1Right}
          disabled={gameState !== 'RACING'}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-fredoka font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-white/30"
        >
          <span>RẼ PHẢI</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 5. BANNER CÁN ĐÍCH VÔ ĐỊCH */}
      {gameState === 'FINISHED' && (
        <div className="mt-1 p-2.5 bg-gradient-to-r from-amber-100 via-red-100 to-orange-100 border-2 border-red-500 rounded-2xl text-center shadow-lg animate-in zoom-in-95 shrink-0">
          <p className="font-fredoka font-black text-sm text-red-950 mb-1">
            {winner === 'p1'
              ? `🏆 CHIẾN THẮNG HUY HOÀNG! BẠN CÁN ĐÍCH 1.000M TRƯỚC! (+150 Xu)`
              : `😢 ĐỐI THỦ ĐÃ CÁN ĐÍCH 1.000M TRƯỚC!`}
          </p>
          <p className="text-[11px] font-fredoka font-bold text-slate-700 mb-2">
            Thời gian hoàn thành chặng đua: <span className="font-mono text-red-700 font-black">{raceTimeSec.toFixed(1)} giây</span>
          </p>
          <button
            onClick={() => initRace()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-fredoka font-black text-xs transition active:scale-95 shadow-md"
          >
            Đua Lại Vòng Mới 🔄
          </button>
        </div>
      )}
    </div>
  );
}

export default MiniRacingGame;
