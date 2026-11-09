import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
import { Trophy, RotateCcw, ShieldCheck, Flag, Copy, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GO_SIZES = [
  { size: 9, label: '9x9', desc: 'Dân Gian Nhanh ⚡' },
  { size: 13, label: '13x13', desc: 'Trung Cấp ⚔️' },
  { size: 19, label: '19x19', desc: 'Kỳ Vương 👑' },
];

export const createEmptyGoBoard = (size = 9) =>
  Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

/**
 * LUẬT CỜ CHẶN / KẸP 2 ĐẦU DÂN GIAN (Sandwich Capture)
 * Khi một quân đặt xuống mà kẹp 1 hoặc chuỗi quân đối phương ở giữa
 * theo chiều ngang hoặc chiều dọc (Đen - Trắng - Đen, hoặc Đen - Trắng - Trắng - Đen):
 * Toàn bộ quân bị kẹp ở giữa lập tức bị nuốt chửng và biến mất!
 */
export function checkSandwichCaptures(board, r, c, myColor, size = 9) {
  const oppColor = myColor === 'b' ? 'w' : 'b';
  const directions = [
    [0, 1],   // Ngang phải
    [0, -1],  // Ngang trái
    [1, 0],   // Dọc xuống
    [-1, 0],  // Dọc lên
  ];

  const capturedCoords = [];

  for (const [dr, dc] of directions) {
    const potential = [];
    let step = 1;

    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;

      // Ra ngoài bàn cờ
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
        break;
      }

      const cell = board[nr][nc];

      if (cell === oppColor) {
        potential.push([nr, nc]);
        step++;
      } else if (cell === myColor) {
        // Tìm thấy quân cùng màu ở đầu bên kia -> Kẹp thành công!
        if (potential.length > 0) {
          capturedCoords.push(...potential);
        }
        break;
      } else {
        // Gặp ô trống -> Không bị kẹp 2 đầu
        break;
      }
    }
  }

  return capturedCoords;
}

export function GoGame({
  roomData = null,
  roomCode: initialRoomCode = '',
  myRole: initialRole = 'b',
  isBotMode: initialBotMode = true,
  playerName = 'Kỳ Thủ',
  onRewardWon,
  onExit,
}) {
  const [isOnlineMode, setIsOnlineMode] = useState(!initialBotMode);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [myRole, setMyRole] = useState(initialRole); // 'b': Đen, 'w': Trắng
  const [connectedGuest, setConnectedGuest] = useState(null);

  const [boardSize, setBoardSize] = useState(9);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [board, setBoard] = useState(() => createEmptyGoBoard(9));
  const [currentTurn, setCurrentTurn] = useState('b'); // Đen luôn đi trước
  const [prisoners, setPrisoners] = useState({ b: 0, w: 0 }); // Số quân ăn thịt được
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [passCount, setPassCount] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);
  const botTimerRef = useRef(null);

  // Điểm sao Hoshiboshi chuẩn
  const starPoints = useMemo(() => {
    if (boardSize === 9) {
      return [
        [2, 2], [2, 6],
        [4, 4],
        [6, 2], [6, 6],
      ];
    } else if (boardSize === 13) {
      return [
        [3, 3], [3, 9],
        [6, 6],
        [9, 3], [9, 9],
      ];
    } else {
      return [
        [3, 3], [3, 9], [3, 15],
        [9, 3], [9, 9], [9, 15],
        [15, 3], [15, 9], [15, 15],
      ];
    }
  }, [boardSize]);

  const isMyTurn = isOnlineMode ? currentTurn === myRole : currentTurn === 'b';

  // Khởi tạo ván cờ mới
  const resetGame = useCallback((size = boardSize) => {
    setBoardSize(size);
    setBoard(createEmptyGoBoard(size));
    setCurrentTurn('b');
    setPrisoners({ b: 0, w: 0 });
    setWinner(null);
    setLastMove(null);
    setPassCount(0);
    setRewardClaimed(false);

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: createEmptyGoBoard(size),
        boardSize: size,
        currentTurn: 'b',
        prisoners: { b: 0, w: 0 },
        winner: null,
        lastMove: null,
      });
    }
  }, [boardSize, isOnlineMode]);

  // Bot AI chơi luật kẹp dân gian
  useEffect(() => {
    if (isOnlineMode || winner || currentTurn !== 'w') return;

    const size = boardSize;
    // Tìm các nước đi cho Bot
    const candidateMoves = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!board[r][c]) {
          // Kiểm tra nếu bot đặt ở đây có kẹp ăn quân không
          const testB = board.map((row) => [...row]);
          testB[r][c] = 'w';
          const captured = checkSandwichCaptures(testB, r, c, 'w', size);
          candidateMoves.push({ r, c, captures: captured.length });
        }
      }
    }

    if (candidateMoves.length === 0) return;

    // Ưu tiên nước kẹp ăn được nhiều quân nhất
    candidateMoves.sort((a, b) => b.captures - a.captures);

    const pool = botDifficulty === 'easy' ? Math.min(8, candidateMoves.length) : botDifficulty === 'medium' ? Math.min(3, candidateMoves.length) : 1;
    const chosen = candidateMoves[Math.floor(Math.random() * pool)];

    botTimerRef.current = setTimeout(() => {
      executeMove(chosen.r, chosen.c, 'w');
    }, 600);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [isOnlineMode, winner, currentTurn, board, boardSize, botDifficulty]);

  // Thực hiện nước đi & nuốt chửng quân kẹp 2 đầu
  const executeMove = (r, c, color) => {
    const size = boardSize;
    const nextB = board.map((row) => [...row]);
    nextB[r][c] = color;

    // QUY TẮC KẸP 2 ĐẦU DÂN GIAN
    const captured = checkSandwichCaptures(nextB, r, c, color, size);
    if (captured.length > 0) {
      sound.playWin();
      captured.forEach(([cr, cc]) => {
        nextB[cr][cc] = null; // Nuốt chửng và biến mất khỏi bàn cờ!
      });
    } else {
      sound.playCaroMove();
    }

    const nextPrisoners = {
      ...prisoners,
      [color]: prisoners[color] + captured.length,
    };

    const nextTurn = color === 'b' ? 'w' : 'b';

    setBoard(nextB);
    setPrisoners(nextPrisoners);
    setCurrentTurn(nextTurn);
    setLastMove({ r, c, capturedCount: captured.length });
    setPassCount(0);

    // Kiểm tra kết thúc nếu một bên ăn được mốc điểm áp đảo
    if (nextPrisoners.b >= 15 || nextPrisoners.w >= 15) {
      const win = nextPrisoners.b >= 15 ? 'b' : 'w';
      setWinner(win);
      if (win === myRole) {
        confetti({ particleCount: 70, spread: 70 });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(100, 2);
        }
      }
    }

    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: nextB,
        prisoners: nextPrisoners,
        currentTurn: nextTurn,
        lastMove: { r, c },
        winner: nextPrisoners.b >= 15 ? 'b' : nextPrisoners.w >= 15 ? 'w' : null,
      });
    }
  };

  const handleCellClick = (r, c) => {
    if (board[r][c] || winner || !isMyTurn) return;
    executeMove(r, c, isOnlineMode ? myRole : 'b');
  };

  // Quản lý P2P Online
  const handleCreateOnlineRoom = async () => {
    const session = new GameRoomSession(
      'go',
      { uid: 'host_' + Date.now(), displayName: playerName, avatar: '⚫' },
      (gameState) => {
        if (gameState.board) setBoard(gameState.board);
        if (gameState.boardSize) setBoardSize(gameState.boardSize);
        if (gameState.currentTurn) setCurrentTurn(gameState.currentTurn);
        if (gameState.prisoners) setPrisoners(gameState.prisoners);
        if (gameState.winner) setWinner(gameState.winner);
        if (gameState.lastMove) setLastMove(gameState.lastMove);
      },
      (guest) => setConnectedGuest(guest),
      () => setConnectedGuest(null)
    );

    const code = await session.createRoom({
      board: createEmptyGoBoard(boardSize),
      boardSize,
      currentTurn: 'b',
      prisoners: { b: 0, w: 0 },
      winner: null,
      lastMove: null,
    });

    sessionRef.current = session;
    setRoomCode(code);
    setMyRole('b'); // Host cầm Đen
    resetGame(boardSize);
  };

  const handleJoinOnlineRoom = async (codeToJoin) => {
    const session = new GameRoomSession(
      'go',
      { uid: 'guest_' + Date.now(), displayName: playerName, avatar: '⚪' },
      (gameState) => {
        if (gameState.board) setBoard(gameState.board);
        if (gameState.boardSize) setBoardSize(gameState.boardSize);
        if (gameState.currentTurn) setCurrentTurn(gameState.currentTurn);
        if (gameState.prisoners) setPrisoners(gameState.prisoners);
        if (gameState.winner) setWinner(gameState.winner);
        if (gameState.lastMove) setLastMove(gameState.lastMove);
      },
      (guest) => setConnectedGuest(guest),
      () => setConnectedGuest(null)
    );

    await session.joinRoom(codeToJoin);
    sessionRef.current = session;
    setRoomCode(codeToJoin);
    setMyRole('w'); // Khách cầm Trắng
    setConnectedGuest({ name: 'Chủ Phòng' });
  };

  const handleLeaveOnlineRoom = () => {
    if (sessionRef.current) {
      sessionRef.current.leaveRoom();
      sessionRef.current = null;
    }
    setRoomCode('');
    setConnectedGuest(null);
    setMyRole('b');
    resetGame(boardSize);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CHỌN CHẾ ĐỘ: BOT vs ONLINE 2 NGƯỜI */}
      <OnlineRoomToolbar
        isOnlineMode={isOnlineMode}
        onToggleMode={(online) => {
          setIsOnlineMode(online);
          if (!online) handleLeaveOnlineRoom();
          else resetGame(boardSize);
        }}
        roomCode={roomCode}
        isHost={myRole === 'b'}
        myRole={myRole}
        connectedPlayer={connectedGuest}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onLeaveRoom={handleLeaveOnlineRoom}
      />

      {/* 2. HEADER TỶ SỐ & QUÂN ĂN ĐƯỢC THEO LUẬT DÂN GIAN */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        {/* Bên Đen */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${currentTurn === 'b' ? 'bg-amber-100 border border-amber-300' : 'bg-slate-50'}`}>
          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 shadow-sm flex items-center justify-center text-sm font-black text-white shrink-0">
            ⚫
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-xs text-slate-900 block truncate">
              {isOnlineMode ? (myRole === 'b' ? `${playerName} (Bạn)` : 'Đối Thủ') : `${playerName} (Đen)`}
            </span>
            <span className="text-[10px] font-fredoka font-bold text-amber-800">
              Kẹp ăn: {prisoners.b} quân
            </span>
          </div>
        </div>

        {/* Thanh lượt & kích thước */}
        <div className="text-center px-1 shrink-0">
          <span className="font-fredoka font-black text-[11px] text-amber-950 block">
            LUẬT KẸP 2 ĐẦU
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${currentTurn === 'b' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            {currentTurn === 'b' ? 'Đen Đi ⏳' : 'Trắng Đi ⏳'}
          </span>
        </div>

        {/* Bên Trắng */}
        <div className={`flex items-center justify-end gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${currentTurn === 'w' ? 'bg-amber-100 border border-amber-300' : 'bg-slate-50'}`}>
          <div className="min-w-0 leading-tight text-right">
            <span className="font-fredoka font-black text-xs text-slate-900 block truncate">
              {isOnlineMode
                ? myRole === 'w'
                  ? `${playerName} (Bạn)`
                  : connectedGuest?.name || 'Đối Thủ'
                : `Bot (${botDifficulty === 'easy' ? 'Dễ' : botDifficulty === 'medium' ? 'Vừa' : 'Khó'})`}
            </span>
            <span className="text-[10px] font-fredoka font-bold text-amber-800">
              Kẹp ăn: {prisoners.w} quân
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-400 shadow-sm flex items-center justify-center text-sm font-black text-slate-800 shrink-0">
            ⚪
          </div>
        </div>
      </div>

      {/* 3. BÀN CỜ VÂY DÂN GIAN CĂN GIỮA */}
      <div className="flex-1 flex items-center justify-center p-1 relative my-auto">
        <div className="w-full max-w-[360px] aspect-square bg-[#DEB887] rounded-2xl p-2 shadow-lg border-2 border-[#8B5A2B] flex flex-col justify-center relative">
          <div
            className="grid w-full h-full relative"
            style={{
              gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isStar = starPoints.some(([sr, sc]) => sr === r && sc === c);
                const isLast = lastMove?.r === r && lastMove?.c === c;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={Boolean(cell || winner || !isMyTurn)}
                    className="w-full h-full relative flex items-center justify-center cursor-pointer group"
                  >
                    {/* Đường kẻ chữ thập */}
                    <div
                      className={`absolute inset-x-0 h-[1.5px] bg-[#654321]/70 top-1/2 -translate-y-1/2 ${
                        c === 0 ? 'left-1/2' : c === boardSize - 1 ? 'right-1/2' : ''
                      }`}
                    />
                    <div
                      className={`absolute inset-y-0 w-[1.5px] bg-[#654321]/70 left-1/2 -translate-x-1/2 ${
                        r === 0 ? 'top-1/2' : r === boardSize - 1 ? 'bottom-1/2' : ''
                      }`}
                    />

                    {isStar && !cell && (
                      <div className="w-2 h-2 rounded-full bg-[#3E2723] z-10 pointer-events-none" />
                    )}

                    {/* Quân Đen */}
                    {cell === 'b' && (
                      <div
                        className={`w-[86%] h-[86%] rounded-full bg-gradient-to-br from-slate-800 to-black shadow-md z-20 border border-slate-700 flex items-center justify-center ${
                          isLast ? 'ring-2 ring-amber-400' : ''
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500/40 -translate-x-1 -translate-y-1" />
                      </div>
                    )}

                    {/* Quân Trắng */}
                    {cell === 'w' && (
                      <div
                        className={`w-[86%] h-[86%] rounded-full bg-gradient-to-br from-white to-slate-200 shadow-md z-20 border border-slate-300 flex items-center justify-center ${
                          isLast ? 'ring-2 ring-amber-400' : ''
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white -translate-x-1 -translate-y-1" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. FOOTER & HƯỚNG DẪN KẸP DÂN GIAN */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between text-xs">
        <span className="text-[10px] font-fredoka font-bold text-amber-900 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Kẹp quân đối thủ giữa 2 quân của mình (ngang/dọc) để nuốt chửng ngay!
        </span>

        <button
          onClick={() => resetGame(boardSize)}
          className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-2xs transition active:scale-95 shrink-0"
        >
          Ván Mới 🔄
        </button>
      </div>
    </div>
  );
}

export default GoGame;
