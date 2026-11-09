import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Flag,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
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

  let meter = 45;
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
  myRole = 'p1', // 'p1' (Host / Xe Đỏ bên trái) hoặc 'p2' (Guest / Xe Xanh bên phải)
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  // Chuẩn hóa role
  const isP1 = String(myRole).toLowerCase() === 'p1';
  const roleCode = isP1 ? 'p1' : 'p2';

  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'
  const [countdownNum, setCountdownNum] = useState(3);
  const [trackSeed, setTrackSeed] = useState(() => Math.floor(100000 + Math.random() * 900000));

  // Tọa độ & trạng thái xe P1 (Bên Trái - Xe Đỏ / Capybara)
  const [p1Lane, setP1Lane] = useState(1); // 0 (Trái), 1 (Giữa), 2 (Phải)
  const [p1Progress, setP1Progress] = useState(0); // Mét (0 -> 1000)
  const [p1BoostTime, setP1BoostTime] = useState(0);
  const [p1SpinTime, setP1SpinTime] = useState(0);

  // Tọa độ & trạng thái xe P2 (Bên Phải - Xe Xanh / Shiba hoặc Bot)
  const [p2Lane, setP2Lane] = useState(1);
  const [p2Progress, setP2Progress] = useState(0);
  const [p2BoostTime, setP2BoostTime] = useState(0);
  const [p2SpinTime, setP2SpinTime] = useState(0);

  const [winner, setWinner] = useState(null); // 'p1' | 'p2'
  const [raceTimeSec, setRaceTimeSec] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Lưu trữ progress dưới dạng ref để dùng trong event handlers và gameLoop
  const p1ProgressRef = useRef(0);
  const p2ProgressRef = useRef(0);
  const p1LaneRef = useRef(1);
  const p2LaneRef = useRef(1);

  // Sync refs khi state đổi
  useEffect(() => {
    p1LaneRef.current = p1Lane;
  }, [p1Lane]);

  useEffect(() => {
    p2LaneRef.current = p2Lane;
  }, [p2Lane]);

  const entitiesRef = useRef([]);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const sessionRef = useRef(null);
  const botAiTimerRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  // Khởi tạo cuộc đua
  const initRace = useCallback((seed = Math.floor(100000 + Math.random() * 900000)) => {
    setTrackSeed(seed);
    entitiesRef.current = generateRaceTrackEntities(seed, RACE_TARGET_METERS);

    setP1Lane(1);
    setP1Progress(0);
    setP1BoostTime(0);
    setP1SpinTime(0);
    p1ProgressRef.current = 0;
    p1LaneRef.current = 1;

    setP2Lane(1);
    setP2Progress(0);
    setP2BoostTime(0);
    setP2SpinTime(0);
    p2ProgressRef.current = 0;
    p2LaneRef.current = 1;

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

  // ĐỒNG BỘ P2P REALTIME: TÁCH BIỆT HOÀN TOÀN GIỮA P1 VÀ P2
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'racing',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: isP1 ? '🏎️' : '🚙' },
      (remoteState) => {
        if (!remoteState) return;

        // Đồng bộ seed đường đua nếu nhận từ Host
        if (remoteState.trackSeed && remoteState.trackSeed !== trackSeed) {
          setTrackSeed(remoteState.trackSeed);
          entitiesRef.current = generateRaceTrackEntities(remoteState.trackSeed, RACE_TARGET_METERS);
        }

        // 1. Nếu MÌNH LÀ P1 (Xe Đỏ) -> CHỈ CẬP NHẬT XE P2 (Xe Xanh của đối thủ)
        if (isP1 && remoteState.role === 'p2') {
          if (typeof remoteState.lane === 'number') {
            setP2Lane(remoteState.lane);
            p2LaneRef.current = remoteState.lane;
          }
          if (typeof remoteState.distance === 'number') {
            setP2Progress(remoteState.distance);
            p2ProgressRef.current = remoteState.distance;
          }
          if (typeof remoteState.isBoosted === 'boolean') {
            setP2BoostTime(remoteState.isBoosted ? 2.0 : 0);
          }
          if (typeof remoteState.isSpinning === 'boolean') {
            setP2SpinTime(remoteState.isSpinning ? 1.5 : 0);
          }
        }

        // 2. Nếu MÌNH LÀ P2 (Xe Xanh) -> CHỈ CẬP NHẬT XE P1 (Xe Đỏ của đối thủ)
        if (!isP1 && remoteState.role === 'p1') {
          if (typeof remoteState.lane === 'number') {
            setP1Lane(remoteState.lane);
            p1LaneRef.current = remoteState.lane;
          }
          if (typeof remoteState.distance === 'number') {
            setP1Progress(remoteState.distance);
            p1ProgressRef.current = remoteState.distance;
          }
          if (typeof remoteState.isBoosted === 'boolean') {
            setP1BoostTime(remoteState.isBoosted ? 2.0 : 0);
          }
          if (typeof remoteState.isSpinning === 'boolean') {
            setP1SpinTime(remoteState.isSpinning ? 1.5 : 0);
          }
        }

        // Đồng bộ người thắng trận
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
  }, [isBotMode, roomCode, playerName, trackSeed, isP1]);

  // HÀM ĐIỀU KHIỂN XE CỦA CHÍNH MÌNH: CHỈ ĐƯỢC PHÉP ĐỔI LÀN XE CỦA MÌNH!
  const handleMoveMyCarLeft = useCallback(() => {
    if (gameState !== 'RACING') return;
    sound.playClick();

    if (isP1) {
      // Mình là P1 -> Chỉ lái P1
      setP1Lane((prev) => {
        const next = Math.max(0, prev - 1);
        p1LaneRef.current = next;
        if (!isBotMode && sessionRef.current) {
          sessionRef.current.syncGameState({
            type: 'MOVE_LANE',
            role: 'p1',
            lane: next,
            distance: p1ProgressRef.current,
          });
        }
        return next;
      });
    } else {
      // Mình là P2 -> Chỉ lái P2
      setP2Lane((prev) => {
        const next = Math.max(0, prev - 1);
        p2LaneRef.current = next;
        if (!isBotMode && sessionRef.current) {
          sessionRef.current.syncGameState({
            type: 'MOVE_LANE',
            role: 'p2',
            lane: next,
            distance: p2ProgressRef.current,
          });
        }
        return next;
      });
    }
  }, [gameState, isP1, isBotMode]);

  const handleMoveMyCarRight = useCallback(() => {
    if (gameState !== 'RACING') return;
    sound.playClick();

    if (isP1) {
      // Mình là P1 -> Chỉ lái P1
      setP1Lane((prev) => {
        const next = Math.min(2, prev + 1);
        p1LaneRef.current = next;
        if (!isBotMode && sessionRef.current) {
          sessionRef.current.syncGameState({
            type: 'MOVE_LANE',
            role: 'p1',
            lane: next,
            distance: p1ProgressRef.current,
          });
        }
        return next;
      });
    } else {
      // Mình là P2 -> Chỉ lái P2
      setP2Lane((prev) => {
        const next = Math.min(2, prev + 1);
        p2LaneRef.current = next;
        if (!isBotMode && sessionRef.current) {
          sessionRef.current.syncGameState({
            type: 'MOVE_LANE',
            role: 'p2',
            lane: next,
            distance: p2ProgressRef.current,
          });
        }
        return next;
      });
    }
  }, [gameState, isP1, isBotMode]);

  // Hỗ trợ phím mũi tên và A / D cho Desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleMoveMyCarLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleMoveMyCarRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMoveMyCarLeft, handleMoveMyCarRight]);

  // BOT AI (Chỉ hoạt động khi ở chế độ Bot và lái xe P2)
  useEffect(() => {
    if (!isBotMode || gameState !== 'RACING') return;

    botAiTimerRef.current = setInterval(() => {
      const curDist = p2ProgressRef.current;
      const curLane = p2LaneRef.current;
      const lookAheadMin = curDist + 20;
      const lookAheadMax = curDist + 80;

      const upcoming = entitiesRef.current.filter(
        (e) => e.meter >= lookAheadMin && e.meter <= lookAheadMax
      );

      const dangerInCurrent = upcoming.find((e) => e.lane === curLane && e.isObstacle);
      const boostInOther = upcoming.find((e) => e.lane !== curLane && e.isBoost);

      const missChance = botDifficulty === 'easy' ? 0.35 : botDifficulty === 'medium' ? 0.15 : 0.05;

      if (dangerInCurrent && Math.random() > missChance) {
        // Né vật cản
        const safeLanes = [0, 1, 2].filter((l) => l !== curLane && !upcoming.some((e) => e.lane === l && e.isObstacle));
        if (safeLanes.length > 0) {
          const target = safeLanes[Math.floor(Math.random() * safeLanes.length)];
          setP2Lane(target);
          p2LaneRef.current = target;
        } else {
          const next = curLane === 0 ? 1 : curLane === 2 ? 1 : Math.random() > 0.5 ? 0 : 2;
          setP2Lane(next);
          p2LaneRef.current = next;
        }
      } else if (boostInOther && Math.random() > missChance) {
        // Nhặt boost
        const safe = !upcoming.some((e) => e.lane === boostInOther.lane && e.isObstacle);
        if (safe) {
          setP2Lane(boostInOther.lane);
          p2LaneRef.current = boostInOther.lane;
        }
      }
    }, 260);

    return () => {
      if (botAiTimerRef.current) clearInterval(botAiTimerRef.current);
    };
  }, [isBotMode, gameState, botDifficulty]);

  // VÒNG LẶP VẬT LÝ & CANVAS 60FPS
  useEffect(() => {
    if (gameState !== 'RACING') return;

    let localP1Progress = p1ProgressRef.current;
    let localP2Progress = p2ProgressRef.current;
    let localP1Boost = p1BoostTime;
    let localP1Spin = p1SpinTime;
    let localP2Boost = p2BoostTime;
    let localP2Spin = p2SpinTime;

    const gameLoop = (timestamp) => {
      const deltaSec = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      setRaceTimeSec((t) => t + deltaSec);

      // 1. MÔ PHỎNG VẬT LÝ CHO P1 (XE ĐỎ)
      // Nếu là Bot Mode HOẶC máy mình là P1 -> Tự tính toán di chuyển P1
      if (isBotMode || isP1) {
        if (localP1Boost > 0) localP1Boost = Math.max(0, localP1Boost - deltaSec);
        if (localP1Spin > 0) localP1Spin = Math.max(0, localP1Spin - deltaSec);

        let speedP1 = 28;
        if (localP1Boost > 0) speedP1 = 44;
        else if (localP1Spin > 0) speedP1 = 12;

        localP1Progress += speedP1 * deltaSec;
        p1ProgressRef.current = localP1Progress;
        setP1Progress(localP1Progress);
        setP1BoostTime(localP1Boost);
        setP1SpinTime(localP1Spin);

        // Kiểm tra va chạm P1
        const hitRadius = 3.5;
        entitiesRef.current.forEach((entity) => {
          if (!entity.collectedP1 && Math.abs(entity.meter - localP1Progress) < hitRadius && entity.lane === p1LaneRef.current) {
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
        });
      } else {
        // Máy mình là P2 -> P1 lấy từ giá trị ref nhận được qua mạng
        localP1Progress = p1ProgressRef.current;
      }

      // 2. MÔ PHỎNG VẬT LÝ CHO P2 (XE XANH)
      // Nếu là Bot Mode HOẶC máy mình là P2 -> Tự tính toán di chuyển P2
      if (isBotMode || !isP1) {
        if (localP2Boost > 0) localP2Boost = Math.max(0, localP2Boost - deltaSec);
        if (localP2Spin > 0) localP2Spin = Math.max(0, localP2Spin - deltaSec);

        let speedP2 = 28;
        if (localP2Boost > 0) speedP2 = 44;
        else if (localP2Spin > 0) speedP2 = 12;

        localP2Progress += speedP2 * deltaSec;
        p2ProgressRef.current = localP2Progress;
        setP2Progress(localP2Progress);
        setP2BoostTime(localP2Boost);
        setP2SpinTime(localP2Spin);

        // Kiểm tra va chạm P2
        const hitRadius = 3.5;
        entitiesRef.current.forEach((entity) => {
          if (!entity.collectedP2 && Math.abs(entity.meter - localP2Progress) < hitRadius && entity.lane === p2LaneRef.current) {
            entity.collectedP2 = true;
            if (entity.isObstacle) {
              sound.playBomb();
              localP2Spin = 1.5;
              localP2Boost = 0;
            } else if (entity.isBoost) {
              if (!isBotMode) sound.playTing();
              localP2Boost = 2.0;
              localP2Spin = 0;
            }
          }
        });
      } else {
        // Máy mình là P1 -> P2 lấy từ giá trị ref nhận được qua mạng
        localP2Progress = p2ProgressRef.current;
      }

      // 3. ĐỒNG BỘ TRẠNG THÁI TIẾN ĐỘ QUA MẠNG (THROTTLED 70ms)
      if (!isBotMode && sessionRef.current && timestamp - lastSyncTimeRef.current > 70) {
        lastSyncTimeRef.current = timestamp;
        if (isP1) {
          sessionRef.current.syncGameState({
            role: 'p1',
            distance: localP1Progress,
            lane: p1LaneRef.current,
            isBoosted: localP1Boost > 0,
            isSpinning: localP1Spin > 0,
          });
        } else {
          sessionRef.current.syncGameState({
            role: 'p2',
            distance: localP2Progress,
            lane: p2LaneRef.current,
            isBoosted: localP2Boost > 0,
            isSpinning: localP2Spin > 0,
          });
        }
      }

      // 4. KIỂM TRA CÁN ĐÍCH (1.000m)
      if (localP1Progress >= RACE_TARGET_METERS || localP2Progress >= RACE_TARGET_METERS) {
        const isP1Won = localP1Progress >= localP2Progress;
        const winRole = isP1Won ? 'p1' : 'p2';
        setWinner(winRole);
        setGameState('FINISHED');

        const iWon = (isP1Won && isP1) || (!isP1Won && !isP1);

        if (iWon) {
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
      renderTrackCanvas(
        localP1Progress,
        localP2Progress,
        p1LaneRef.current,
        p2LaneRef.current,
        localP1Boost > 0,
        localP1Spin > 0,
        localP2Boost > 0,
        localP2Spin > 0
      );

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, isBotMode, isP1, rewardClaimed, onRewardWon]);

  // HÀM VẼ CANVAS 2D ĐƯỜNG ĐUA 60FPS
  const renderTrackCanvas = (
    p1Dist,
    p2Dist,
    curP1Lane,
    curP2Lane,
    p1IsBoost,
    p1IsSpin,
    p2IsBoost,
    p2IsSpin
  ) => {
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

    // 1. ĐƯỜNG CHẠY BÊN TRÁI (P1 - XE ĐỎ)
    const labelP1 = isP1 ? 'BẠN (Xe Đỏ)' : 'ĐỐI THỦ (Xe Đỏ)';
    renderSingleTrack(
      ctx,
      0,
      halfWidth,
      height,
      p1Dist,
      curP1Lane,
      '🦫',
      '#ef4444',
      p1IsBoost,
      p1IsSpin,
      labelP1,
      isP1
    );

    // 2. ĐƯỜNG CHẠY BÊN PHẢI (P2 - XE XANH)
    const labelP2 = !isP1
      ? 'BẠN (Xe Xanh)'
      : isBotMode
      ? 'BOT AI'
      : 'ĐỐI THỦ (Xe Xanh)';
    renderSingleTrack(
      ctx,
      halfWidth,
      halfWidth,
      height,
      p2Dist,
      curP2Lane,
      '🐕',
      '#3b82f6',
      p2IsBoost,
      p2IsSpin,
      labelP2,
      !isP1
    );

    // 3. DẢI PHÂN CÁCH TRUNG TÂM NỔI BẬT
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(halfWidth - 3, 0, 6, height);
  };

  const renderSingleTrack = (
    ctx,
    startX,
    trackWidth,
    height,
    carDist,
    carLane,
    mascotEmoji,
    carColor,
    isBoost,
    isSpin,
    label,
    isMyCar
  ) => {
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

    // Gờ vỉa hè đỏ-trắng F1
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
    const visibleRangeMeters = 40;
    const carScreenY = height - 80;

    entitiesRef.current.forEach((entity) => {
      const relDist = entity.meter - carDist;
      if (relDist >= -5 && relDist <= visibleRangeMeters) {
        const itemY = carScreenY - (relDist / visibleRangeMeters) * (height - 120);
        const itemX = startX + entity.lane * laneWidth + laneWidth / 2;

        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText(entity.icon, itemX, itemY);
        ctx.shadowBlur = 0;
      }
    });

    // VẼ XE ĐUA
    const carX = startX + carLane * laneWidth + laneWidth / 2;
    const carY = carScreenY;

    ctx.save();
    ctx.translate(carX, carY);

    if (isSpin) {
      const angle = (Date.now() / 60) % (Math.PI * 2);
      ctx.rotate(angle);
    }

    // Thân xe
    ctx.fillStyle = carColor;
    ctx.beginPath();
    ctx.roundRect(-16, -26, 32, 52, 8);
    ctx.fill();

    // Viền phát sáng nếu là xe của chính mình
    ctx.strokeStyle = isMyCar ? '#fef08a' : '#ffffff';
    ctx.lineWidth = isMyCar ? 3 : 2;
    ctx.stroke();

    // Kính chắn gió
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-11, -16, 22, 14, 3);
    ctx.fill();

    // 4 Bánh xe
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-20, -22, 5, 12);
    ctx.fillRect(15, -22, 5, 12);
    ctx.fillRect(-20, 10, 5, 12);
    ctx.fillRect(15, 10, 5, 12);

    // Mascot
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mascotEmoji, 0, 3);

    // Lửa Nitro
    if (isBoost) {
      ctx.font = '18px Arial';
      ctx.fillText('🔥', -8, 36);
      ctx.fillText('🔥', 8, 36);
    }

    ctx.restore();

    // Nhãn tên xe
    ctx.font = isMyCar ? 'bold 11px Fredoka, sans-serif' : '10px Fredoka, sans-serif';
    ctx.fillStyle = isMyCar ? '#fde047' : '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(label, carX, carY - 34);
  };

  const iWon = (winner === 'p1' && isP1) || (winner === 'p2' && !isP1);

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
            {isBotMode
              ? `Đấu Bot AI (${botDifficulty})`
              : `Online #${roomCode} (${isP1 ? 'Bạn là P1-Đỏ' : 'Bạn là P2-Xanh'})`}
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

      {/* 2. THANH TIẾN ĐỘ SO KÈ TỪNG MÉT (0 -> 1000M) */}
      <div className="bg-slate-900 text-white p-2 rounded-2xl border border-slate-700 shadow-xs shrink-0 my-1">
        <div className="flex items-center justify-between text-[11px] font-fredoka font-black mb-1">
          <div className={`flex items-center gap-1 ${isP1 ? 'text-amber-300 font-black' : 'text-red-400'}`}>
            <span>🦫 {isP1 ? 'Bạn (Đỏ):' : 'Đối Thủ (Đỏ):'}</span>
            <span className="font-mono text-white">{Math.min(RACE_TARGET_METERS, Math.round(p1Progress))}m</span>
            {p1BoostTime > 0 && <span className="text-amber-400 animate-pulse text-[10px]">🔥 NITRO!</span>}
          </div>

          <div className="flex items-center gap-1 text-amber-300">
            <Flag className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="font-mono text-xs text-yellow-300">1.000m</span>
          </div>

          <div className={`flex items-center gap-1 ${!isP1 ? 'text-amber-300 font-black' : 'text-blue-400'}`}>
            <span>🐕 {!isP1 ? 'Bạn (Xanh):' : isBotMode ? 'Bot AI:' : 'Đối Thủ (Xanh):'}</span>
            <span className="font-mono text-white">{Math.min(RACE_TARGET_METERS, Math.round(p2Progress))}m</span>
            {p2BoostTime > 0 && <span className="text-amber-400 animate-pulse text-[10px]">🔥 NITRO!</span>}
          </div>
        </div>

        {/* Cột theo dõi tiến độ hai xe song song */}
        <div className="w-full bg-slate-800 h-3 rounded-full relative overflow-hidden border border-slate-700 flex flex-col justify-center">
          <div
            className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-75"
            style={{ width: `${Math.min(100, (p1Progress / RACE_TARGET_METERS) * 100)}%` }}
          />
          <div
            className="h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-75 mt-0.5"
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
              {isP1 ? '🚗 Bạn lái XE ĐỎ (Bên Trái)' : '🚙 Bạn lái XE XANH (Bên Phải)'}
            </span>
          </div>
        )}

        {/* Chạm nửa trái màn hình để rẽ trái, nửa phải để rẽ phải */}
        <div className="absolute inset-0 grid grid-cols-2 z-10">
          <div
            onClick={handleMoveMyCarLeft}
            className="w-full h-full cursor-pointer active:bg-white/5"
            title="Chạm để rẽ trái"
          />
          <div
            onClick={handleMoveMyCarRight}
            className="w-full h-full cursor-pointer active:bg-white/5"
            title="Chạm để rẽ phải"
          />
        </div>
      </div>

      {/* 4. THANH NÚT ĐIỀU KHIỂN RIÊNG BIỆT CHO XE CỦA MÌNH */}
      <div className="grid grid-cols-2 gap-3 my-1 shrink-0">
        <button
          onClick={handleMoveMyCarLeft}
          disabled={gameState !== 'RACING'}
          className={`py-3 px-4 rounded-2xl text-white font-fredoka font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-white/30 ${
            isP1
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>RẼ TRÁI ({isP1 ? 'Xe Đỏ' : 'Xe Xanh'})</span>
        </button>

        <button
          onClick={handleMoveMyCarRight}
          disabled={gameState !== 'RACING'}
          className={`py-3 px-4 rounded-2xl text-white font-fredoka font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-white/30 ${
            isP1
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
              : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700'
          }`}
        >
          <span>RẼ PHẢI ({isP1 ? 'Xe Đỏ' : 'Xe Xanh'})</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 5. BANNER CÁN ĐÍCH VÔ ĐỊCH */}
      {gameState === 'FINISHED' && (
        <div className="mt-1 p-2.5 bg-gradient-to-r from-amber-100 via-red-100 to-orange-100 border-2 border-red-500 rounded-2xl text-center shadow-lg animate-in zoom-in-95 shrink-0">
          <p className="font-fredoka font-black text-sm text-red-950 mb-1">
            {iWon
              ? `🏆 CHIẾN THẮNG HUY HOÀNG! BẠN CÁN ĐÍCH 1.000M TRƯỚC! (+150 Xu)`
              : `😢 ĐỐI THỦ ĐÃ CÁN ĐÍCH 1.000M TRƯỚC!`}
          </p>
          <p className="text-[11px] font-fredoka font-bold text-slate-700 mb-2">
            Thời gian hoàn thành: <span className="font-mono text-red-700 font-black">{raceTimeSec.toFixed(1)} giây</span>
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
