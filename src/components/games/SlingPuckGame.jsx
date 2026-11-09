import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
import { Trophy, RotateCcw, Smartphone, Bot, Globe, Play, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const ARENA_WIDTH = 340;
const ARENA_HEIGHT = 480;
const DIVIDER_Y = 240;
const DIVIDER_THICKNESS = 14;
const GAP_WIDTH = 56;
const GAP_X_START = (ARENA_WIDTH - GAP_WIDTH) / 2; // 142
const GAP_X_END = GAP_X_START + GAP_WIDTH; // 198
const PUCK_RADIUS = 13;
const TOP_SLING_Y = 45;
const BOT_SLING_Y = 435;

export function SlingPuckGame({
  roomData = null,
  roomCode: initialRoomCode = '',
  myRole: initialRole = 'p1',
  isBotMode: initialBotMode = true,
  playerName = 'Xạ Thủ',
  onRewardWon,
  onExit,
}) {
  const [playMode, setPlayMode] = useState(initialBotMode ? 'local' : 'online');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [myRole, setMyRole] = useState(initialRole);
  const [connectedPlayer, setConnectedPlayer] = useState(null);
  const [matchCountdown, setMatchCountdown] = useState(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);

  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'ended'
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | null
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const botTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Danh sách các quân cờ (5 quân xanh P1, 5 quân đỏ P2)
  const pucksRef = useRef([]);
  // Quân cờ đang được kéo (drag)
  const draggingPuckRef = useRef(null); // { id, startX, startY, currentX, currentY, player }

  // Khởi tạo vị trí 10 quân cờ (5 trên, 5 dưới)
  const initPucks = useCallback(() => {
    const list = [];
    // 5 quân của P2 (nửa trên: y: 80 - 180)
    const p2Positions = [
      { x: 70, y: 110 },
      { x: 170, y: 90 },
      { x: 270, y: 110 },
      { x: 110, y: 170 },
      { x: 230, y: 170 },
    ];
    p2Positions.forEach((pos, idx) => {
      list.push({
        id: `p2_${idx}`,
        color: 'red',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
      });
    });

    // 5 quân của P1 (nửa dưới: y: 300 - 400)
    const p1Positions = [
      { x: 70, y: 370 },
      { x: 170, y: 390 },
      { x: 270, y: 370 },
      { x: 110, y: 310 },
      { x: 230, y: 310 },
    ];
    p1Positions.forEach((pos, idx) => {
      list.push({
        id: `p1_${idx}`,
        color: 'blue',
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
      });
    });

    pucksRef.current = list;
    draggingPuckRef.current = null;
    setWinner(null);
    setRewardClaimed(false);
  }, []);

  // Khởi động ván chơi
  const handleStartGame = () => {
    sound.playClick();
    initPucks();
    setGameState('playing');
  };

  // Thiết lập phiên kết nối Online P2P
  useEffect(() => {
    if (playMode !== 'online') {
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }
      return;
    }

    const session = new GameRoomSession({
      gameType: 'slingpuck',
      playerName,
      onState: (state) => {
        if (!state) return;
        if (state.pucks && Array.isArray(state.pucks)) {
          // Đồng bộ vị trí quân cờ
          pucksRef.current = state.pucks;
        }
        if (state.gameState) setGameState(state.gameState);
        if (state.winner !== undefined) {
          setWinner(state.winner);
          if (state.winner && state.winner === myRole && !rewardClaimed) {
            sound.playWin();
            confetti({ particleCount: 90, spread: 80 });
            setRewardClaimed(true);
            if (onRewardWon) onRewardWon(120, 3);
          }
        }
        if (state.p2) setConnectedPlayer(state.p2.name);
      },
      onPlayerJoin: (player) => {
        setConnectedPlayer(player.name);
        sound.playTing();
      },
      onPlayerLeft: () => {
        setConnectedPlayer(null);
      },
    });

    sessionRef.current = session;

    return () => {
      session.destroy();
      sessionRef.current = null;
    };
  }, [playMode, playerName, myRole, rewardClaimed, onRewardWon]);

  // Tìm trận nhanh
  const handleQuickMatch = async () => {
    if (!sessionRef.current) return;
    setIsSearchingMatch(true);
    sound.playClick();

    initPucks();
    const res = await sessionRef.current.quickMatch(
      { pucks: pucksRef.current, gameState: 'playing' },
      (cd) => setMatchCountdown(cd)
    );

    setIsSearchingMatch(false);
    setRoomCode(res.roomCode);
    setMyRole(res.isHost ? 'p1' : 'p2');
    setGameState('playing');
  };

  const handleCreateRoom = async () => {
    if (!sessionRef.current) return;
    initPucks();
    const code = await sessionRef.current.createRoom({
      pucks: pucksRef.current,
      gameState: 'ready',
    });
    setRoomCode(code);
    setMyRole('p1');
    sound.playClick();
  };

  const handleJoinRoom = async (code) => {
    if (!sessionRef.current) return;
    const ok = await sessionRef.current.joinRoom(code);
    if (ok) {
      setRoomCode(code);
      setMyRole('p2');
      sound.playTing();
      setGameState('playing');
    } else {
      alert('Không tìm thấy phòng!');
    }
  };

  const handleLeaveRoom = () => {
    if (sessionRef.current) sessionRef.current.leaveRoom();
    setRoomCode('');
    setConnectedPlayer(null);
    setPlayMode('local');
    setGameState('ready');
    initPucks();
  };

  // Bot AI tự động ngắm và bắn quân cờ của mình
  useEffect(() => {
    if (playMode !== 'bot' || gameState !== 'playing' || winner) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      return;
    }

    const runBotCycle = () => {
      // Tìm các quân cờ đang ở sân của Bot (y < DIVIDER_Y)
      const botPucks = pucksRef.current.filter((p) => p.y < DIVIDER_Y - 15);
      if (botPucks.length > 0) {
        // Chọn 1 quân gần dây thun hoặc gần tâm
        const chosen = botPucks[Math.floor(Math.random() * botPucks.length)];

        // Kéo về phía dây thun trên
        const pullY = TOP_SLING_Y - 15;
        const targetX = GAP_X_START + GAP_WIDTH / 2 + (Math.random() - 0.5) * 30;

        // Bắn về phía khe hở!
        const dx = targetX - chosen.x;
        const dy = DIVIDER_Y - pullY;
        const dist = Math.hypot(dx, dy);

        chosen.x = targetX + (Math.random() - 0.5) * 40;
        chosen.y = TOP_SLING_Y + 12;
        chosen.vx = (dx / dist) * (14 + Math.random() * 6);
        chosen.vy = (dy / dist) * (14 + Math.random() * 6);

        sound.playPop();
      }

      // Lặp lại sau 1.2s - 2.2s
      botTimerRef.current = setTimeout(runBotCycle, 1200 + Math.random() * 1000);
    };

    botTimerRef.current = setTimeout(runBotCycle, 1500);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [playMode, gameState, winner]);

  // VÒNG LẶP VẬT LÝ VÀ VẼ CANVAS (PHYSICS ENGINE)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // 1. Vẽ nền gỗ bàn cờ
      ctx.fillStyle = '#E8C39E';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Kẻ vạch biên
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, ARENA_WIDTH - 8, ARENA_HEIGHT - 8);

      // Dây thun trên (P2 Elastic Band)
      ctx.strokeStyle = '#D94E41';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(12, TOP_SLING_Y);
      // Nếu có quân đang kéo vào dây thun trên
      const dragging = draggingPuckRef.current;
      if (dragging && dragging.player === 'p2') {
        ctx.lineTo(dragging.currentX, dragging.currentY);
      }
      ctx.lineTo(ARENA_WIDTH - 12, TOP_SLING_Y);
      ctx.stroke();

      // Dây thun dưới (P1 Elastic Band)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(12, BOT_SLING_Y);
      if (dragging && dragging.player === 'p1') {
        ctx.lineTo(dragging.currentX, dragging.currentY);
      }
      ctx.lineTo(ARENA_WIDTH - 12, BOT_SLING_Y);
      ctx.stroke();

      // Vách ngăn ở giữa với khe hẹp (Middle Divider with Narrow Gap)
      ctx.fillStyle = '#78350F';
      // Vách bên trái
      ctx.fillRect(4, DIVIDER_Y - DIVIDER_THICKNESS / 2, GAP_X_START - 4, DIVIDER_THICKNESS);
      // Vách bên phải
      ctx.fillRect(
        GAP_X_END,
        DIVIDER_Y - DIVIDER_THICKNESS / 2,
        ARENA_WIDTH - GAP_X_END - 4,
        DIVIDER_THICKNESS
      );

      // Viền khe hẹp
      ctx.fillStyle = '#D97706';
      ctx.fillRect(GAP_X_START - 3, DIVIDER_Y - DIVIDER_THICKNESS / 2, 3, DIVIDER_THICKNESS);
      ctx.fillRect(GAP_X_END, DIVIDER_Y - DIVIDER_THICKNESS / 2, 3, DIVIDER_THICKNESS);

      // 2. CẬP NHẬT TỌA ĐỘ VẬT LÝ VÀ VA CHẠM CỦA CÁC QUÂN CỜ
      const pucks = pucksRef.current;

      if (gameState === 'playing' && !winner) {
        for (let i = 0; i < pucks.length; i++) {
          const p = pucks[i];

          // Nếu đang bị người chơi kéo thì không tự bay
          if (dragging && dragging.id === p.id) {
            p.x = dragging.currentX;
            p.y = dragging.currentY;
            p.vx = 0;
            p.vy = 0;
            continue;
          }

          // Áp dụng vận tốc
          p.x += p.vx;
          p.y += p.vy;

          // Ma sát chậm dần
          p.vx *= 0.982;
          p.vy *= 0.982;
          if (Math.abs(p.vx) < 0.05) p.vx = 0;
          if (Math.abs(p.vy) < 0.05) p.vy = 0;

          // Va chạm với 4 bức tường biên
          if (p.x - PUCK_RADIUS < 6) {
            p.x = 6 + PUCK_RADIUS;
            p.vx = -p.vx * 0.85;
            sound.playTick();
          } else if (p.x + PUCK_RADIUS > ARENA_WIDTH - 6) {
            p.x = ARENA_WIDTH - 6 - PUCK_RADIUS;
            p.vx = -p.vx * 0.85;
            sound.playTick();
          }

          if (p.y - PUCK_RADIUS < 6) {
            p.y = 6 + PUCK_RADIUS;
            p.vy = -p.vy * 0.85;
            sound.playTick();
          } else if (p.y + PUCK_RADIUS > ARENA_HEIGHT - 6) {
            p.y = ARENA_HEIGHT - 6 - PUCK_RADIUS;
            p.vy = -p.vy * 0.85;
            sound.playTick();
          }

          // Va chạm với vách ngăn giữa
          const inGap = p.x >= GAP_X_START + PUCK_RADIUS * 0.4 && p.x <= GAP_X_END - PUCK_RADIUS * 0.4;
          const topDividerY = DIVIDER_Y - DIVIDER_THICKNESS / 2;
          const botDividerY = DIVIDER_Y + DIVIDER_THICKNESS / 2;

          if (!inGap) {
            // Đang ở nửa trên đập vào mép trên vách
            if (p.y + PUCK_RADIUS >= topDividerY && p.y < DIVIDER_Y) {
              p.y = topDividerY - PUCK_RADIUS;
              p.vy = -p.vy * 0.85;
              sound.playTick();
            }
            // Đang ở nửa dưới đập vào mép dưới vách
            else if (p.y - PUCK_RADIUS <= botDividerY && p.y > DIVIDER_Y) {
              p.y = botDividerY + PUCK_RADIUS;
              p.vy = -p.vy * 0.85;
              sound.playTick();
            }
          }

          // Va chạm lẫn nhau giữa các quân cờ
          for (let j = i + 1; j < pucks.length; j++) {
            const p2 = pucks[j];
            const dx = p2.x - p.x;
            const dy = p2.y - p.y;
            const dist = Math.hypot(dx, dy);

            if (dist < PUCK_RADIUS * 2 && dist > 0) {
              // Tách rời
              const overlap = PUCK_RADIUS * 2 - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              p.x -= nx * (overlap / 2);
              p.y -= ny * (overlap / 2);
              p2.x += nx * (overlap / 2);
              p2.y += ny * (overlap / 2);

              // Đảo xung lượng va chạm đàn hồi
              const kx = p.vx - p2.vx;
              const ky = p.vy - p2.vy;
              const pVel = 2 * (nx * kx + ny * ky) / 2;

              p.vx -= pVel * nx * 0.85;
              p.vy -= pVel * ny * 0.85;
              p2.vx += pVel * nx * 0.85;
              p2.vy += pVel * ny * 0.85;

              sound.playPop();
            }
          }
        }

        // KIỂM TRA ĐIỀU KIỆN THẮNG BẠI:
        // Đếm số quân ở sân của P1 (dưới) và sân của P2 (trên)
        const p1SideCount = pucks.filter((p) => p.y > DIVIDER_Y).length;
        const p2SideCount = pucks.filter((p) => p.y < DIVIDER_Y).length;

        if (p1SideCount === 0) {
          // P1 đã dọn sạch toàn bộ quân cờ sang sân P2 -> P1 THẮNG!
          setWinner('p1');
          setGameState('ended');
          sound.playWin();
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.8 } });
          if (!rewardClaimed && onRewardWon) {
            setRewardClaimed(true);
            onRewardWon(120, 3);
          }
          if (playMode === 'online' && sessionRef.current) {
            sessionRef.current.syncGameState({ winner: 'p1', gameState: 'ended' });
          }
        } else if (p2SideCount === 0) {
          // P2 đã dọn sạch sang sân P1 -> P2 THẮNG!
          setWinner('p2');
          setGameState('ended');
          sound.playLose();
          if (playMode === 'online' && sessionRef.current) {
            sessionRef.current.syncGameState({ winner: 'p2', gameState: 'ended' });
          }
        }
      }

      // 3. VẼ TẤT CẢ CÁC QUÂN CỜ TRÒN
      pucks.forEach((p) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, PUCK_RADIUS, 0, Math.PI * 2);

        // Hiệu ứng đổ bóng
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        if (p.color === 'blue') {
          ctx.fillStyle = '#2563EB';
          ctx.fill();
          ctx.strokeStyle = '#1D4ED8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Tâm chấm trắng
          ctx.beginPath();
          ctx.arc(p.x, p.y, PUCK_RADIUS * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#93C5FD';
          ctx.fill();
        } else {
          ctx.fillStyle = '#DC2626';
          ctx.fill();
          ctx.strokeStyle = '#B91C1C';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x, p.y, PUCK_RADIUS * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#FCA5A5';
          ctx.fill();
        }

        ctx.restore();
      });

      // Vẽ vector hướng bắn khi đang kéo dây thun
      if (dragging) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;

        const anchorY = dragging.player === 'p1' ? BOT_SLING_Y : TOP_SLING_Y;
        const shootDirY = anchorY - dragging.currentY;
        const shootDirX = (ARENA_WIDTH / 2) - dragging.currentX;

        ctx.beginPath();
        ctx.moveTo(dragging.currentX, dragging.currentY);
        ctx.lineTo(dragging.currentX + shootDirX * 1.5, dragging.currentY + shootDirY * 2.5);
        ctx.stroke();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(updateAndDraw);
    };

    animFrameRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, winner, playMode, rewardClaimed, onRewardWon]);

  // XỬ LÝ SỰ KIỆN CHẠM VÀ KÉO (TOUCH / MOUSE EVENTS)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e) => {
    if (gameState !== 'playing' || winner) return;
    const { x, y } = getCanvasCoords(e);

    // Xác định người chơi được quyền chạm
    // P1 ở nửa dưới (y > DIVIDER_Y), P2 ở nửa trên (y < DIVIDER_Y)
    const isP1Touch = y > DIVIDER_Y;
    const isP2Touch = y < DIVIDER_Y;

    if (playMode === 'online') {
      if (myRole === 'p1' && !isP1Touch) return;
      if (myRole === 'p2' && !isP2Touch) return;
    } else if (playMode === 'bot') {
      if (!isP1Touch) return; // Trong chế độ Bot, người chơi chỉ điều khiển quân nửa dưới
    }

    // Tìm quân cờ ở gần điểm chạm nhất (bán kính < 22px)
    const pucks = pucksRef.current;
    for (const p of pucks) {
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist <= PUCK_RADIUS + 12) {
        // Chỉ kéo được quân cờ đang nằm ở sân của mình
        if (isP1Touch && p.y > DIVIDER_Y) {
          draggingPuckRef.current = {
            id: p.id,
            startX: p.x,
            startY: p.y,
            currentX: p.x,
            currentY: p.y,
            player: 'p1',
          };
          sound.playPop();
          break;
        } else if (isP2Touch && p.y < DIVIDER_Y) {
          draggingPuckRef.current = {
            id: p.id,
            startX: p.x,
            startY: p.y,
            currentX: p.x,
            currentY: p.y,
            player: 'p2',
          };
          sound.playPop();
          break;
        }
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!draggingPuckRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const dragging = draggingPuckRef.current;

    // Giới hạn kéo trong phạm vi dây thun của sân mình
    if (dragging.player === 'p1') {
      dragging.currentX = Math.max(16, Math.min(ARENA_WIDTH - 16, x));
      dragging.currentY = Math.max(DIVIDER_Y + 20, Math.min(ARENA_HEIGHT - 16, y));
    } else {
      dragging.currentX = Math.max(16, Math.min(ARENA_WIDTH - 16, x));
      dragging.currentY = Math.max(16, Math.min(DIVIDER_Y - 20, y));
    }
  };

  const handlePointerUp = () => {
    const dragging = draggingPuckRef.current;
    if (!dragging) return;

    const puck = pucksRef.current.find((p) => p.id === dragging.id);
    if (puck) {
      // Tính lực phóng đàn hồi từ dây thun
      const anchorY = dragging.player === 'p1' ? BOT_SLING_Y : TOP_SLING_Y;
      const stretchY = dragging.currentY - anchorY;
      const stretchX = dragging.currentX - (ARENA_WIDTH / 2);

      // Nếu kéo lùi đủ độ căng đàn hồi (> 15px)
      if (
        (dragging.player === 'p1' && stretchY > 10) ||
        (dragging.player === 'p2' && stretchY < -10)
      ) {
        // Lực đẩy ngược hướng kéo
        const power = Math.min(26, Math.abs(stretchY) * 0.45);
        puck.vx = -stretchX * 0.18;
        puck.vy = dragging.player === 'p1' ? -power : power;

        sound.playPop();
      }
    }

    draggingPuckRef.current = null;
  };

  // Đếm số quân ở mỗi sân để hiển thị tỉ số
  const p1CourtCount = pucksRef.current.filter((p) => p.y > DIVIDER_Y).length;
  const p2CourtCount = pucksRef.current.filter((p) => p.y < DIVIDER_Y).length;

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CHỌN CHẾ ĐỘ & ONLINE TOOLBAR */}
      {playMode === 'online' ? (
        <OnlineRoomToolbar
          gameType="slingpuck"
          isOnlineMode={true}
          onToggleMode={() => setPlayMode('local')}
          roomCode={roomCode}
          isHost={myRole === 'p1'}
          myRole={myRole}
          connectedPlayer={connectedPlayer}
          matchCountdown={matchCountdown}
          isSearchingMatch={isSearchingMatch}
          onCreateRoom={handleCreateRoom}
          onQuickMatch={handleQuickMatch}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <div className="w-full bg-white/95 border border-amber-200 rounded-2xl p-1.5 shadow-2xs mb-2 flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playClick();
                setPlayMode('local');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-fredoka font-black flex items-center gap-1 transition ${
                playMode === 'local'
                  ? 'bg-amber-400 text-black shadow-xs border border-amber-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Chung Máy (2P)</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setPlayMode('bot');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-fredoka font-black flex items-center gap-1 transition ${
                playMode === 'bot'
                  ? 'bg-amber-400 text-black shadow-xs border border-amber-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Đấu Bot AI</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setPlayMode('online');
            }}
            className="px-2.5 py-1 rounded-xl text-xs font-fredoka font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Đấu Online</span>
          </button>
        </div>
      )}

      {/* 2. KHUNG BÀN ĐẤU SLING PUCK */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden my-1">
        {/* Thanh trạng thái tỉ số quân cờ 2 bên */}
        <div className="w-full max-w-[340px] flex items-center justify-between px-2 mb-1 text-xs font-fredoka font-black">
          <div className="flex items-center gap-1 text-rose-600">
            <span>🔴 Sân Đối Thủ:</span>
            <span className="text-sm px-2 py-0.5 rounded-lg bg-rose-100 border border-rose-300">
              {p2CourtCount} quân
            </span>
          </div>

          <div className="flex items-center gap-1 text-blue-600">
            <span>🔵 Sân Của Bạn:</span>
            <span className="text-sm px-2 py-0.5 rounded-lg bg-blue-100 border border-blue-300">
              {p1CourtCount} quân
            </span>
          </div>
        </div>

        {/* Khung Canvas Bàn Gỗ Slingshot */}
        <div className="relative rounded-3xl overflow-hidden border-4 border-[#78350F] shadow-2xl bg-[#E8C39E]">
          <canvas
            ref={canvasRef}
            width={ARENA_WIDTH}
            height={ARENA_HEIGHT}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="block touch-none cursor-crosshair"
          />

          {/* Màn hình Ready hoặc Game Over */}
          {gameState !== 'playing' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              {gameState === 'ready' && (
                <div className="animate-in zoom-in">
                  <div className="text-5xl mb-2 animate-bounce">🎯🪵</div>
                  <h3 className="font-fredoka font-black text-xl text-white mb-1">
                    BẮN BI SLINGSHOT BÀN CỜ
                  </h3>
                  <p className="text-xs text-amber-200 font-fredoka mb-4 max-w-[260px] mx-auto">
                    Kéo lùi quân cờ vào dây thun đàn hồi rồi thả tay để bắn xuyên qua khe hẹp! Bắn hết quân sang sân đối thủ trước là THẮNG!
                  </p>
                  <button
                    onClick={handleStartGame}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-fredoka font-black text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>BẮT ĐẦU BẮN BI!</span>
                  </button>
                </div>
              )}

              {gameState === 'ended' && (
                <div className="bg-white/95 p-5 rounded-3xl border-4 border-amber-400 shadow-2xl animate-in zoom-in max-w-[280px]">
                  <div className="text-5xl mb-2">
                    {winner === 'p1' ? '🔵🏆' : '🔴🏆'}
                  </div>
                  <h3 className="font-fredoka font-black text-lg text-slate-800 mb-1">
                    {winner === 'p1'
                      ? 'XẠ THỦ XANH CHIẾN THẮNG!'
                      : 'XẠ THỦ ĐỎ CHIẾN THẮNG!'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mb-4">
                    Đã dọn sạch 100% quân cờ sang sân đối thủ thần sầu! (+120 Xu)
                  </p>
                  <button
                    onClick={handleStartGame}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-fredoka font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>BẮN LẠI VÁN MỚI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. FOOTER HƯỚNG DẪN */}
      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-500 font-bold">
        <span>💡 Chạm vào quân cờ, kéo lùi vào dây thun đỏ/xanh rồi thả tay!</span>
        <button
          onClick={handleStartGame}
          title="Xếp lại quân"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 active:scale-90 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default SlingPuckGame;
