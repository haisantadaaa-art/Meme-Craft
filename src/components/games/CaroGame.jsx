import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db, ref, update } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const BOARD_SIZES = [
  { size: 10, label: '10x10', desc: 'Nhanh ⚡' },
  { size: 12, label: '12x12', desc: 'Tiêu Chuẩn 🎯' },
  { size: 15, label: '15x15', desc: 'Thi Đấu 🏆' },
];

export const createEmptyBoard = (size = 10) =>
  Array(size)
    .fill(null)
    .map(() => Array(size).fill(''));

export function normalizeBoard(rawBoard, size = 10) {
  const safeBoard = createEmptyBoard(size);
  if (!rawBoard) return safeBoard;

  for (let r = 0; r < size; r++) {
    const row = Array.isArray(rawBoard) ? rawBoard[r] : rawBoard[r] || rawBoard[String(r)];
    if (row) {
      for (let c = 0; c < size; c++) {
        const val = Array.isArray(row) ? row[c] : row[c] || row[String(c)];
        safeBoard[r][c] = val === 'X' || val === 'O' ? val : '';
      }
    }
  }

  return safeBoard;
}

export function checkCaroWinner(board, size = 10) {
  if (!board || !Array.isArray(board)) return { winner: null, line: [] };

  const directions = [
    [0, 1],  // ngang
    [1, 0],  // dọc
    [1, 1],  // chéo xuôi
    [1, -1], // chéo ngược
  ];

  let hasEmpty = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const piece = board[r]?.[c];
      if (!piece) {
        hasEmpty = true;
        continue;
      }

      for (const [dr, dc] of directions) {
        let win = true;
        const line = [[r, c]];

        for (let step = 1; step < 5; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size || board[nr]?.[nc] !== piece) {
            win = false;
            break;
          }
          line.push([nr, nc]);
        }

        if (win) {
          return { winner: piece, line };
        }
      }
    }
  }

  if (!hasEmpty) return { winner: 'DRAW', line: [] };
  return { winner: null, line: [] };
}

export function CaroGame({
  roomData = null,
  roomCode: initialRoomCode = '',
  myRole: initialRole = 'X',
  isBotMode: initialBotMode = true,
  playerName = 'Kỳ Thủ Caro',
  onRewardWon,
  onExit,
}) {
  const [isOnlineMode, setIsOnlineMode] = useState(!initialBotMode);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [myRole, setMyRole] = useState(initialRole);
  const [connectedPlayer, setConnectedPlayer] = useState(null);

  const [boardSize, setBoardSize] = useState(10);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [board, setBoard] = useState(() => createEmptyBoard(10));
  const [currentTurn, setCurrentTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);

  const isMyTurn = !winner && (isOnlineMode ? currentTurn === myRole : currentTurn === 'X');

  // Khởi tạo ván mới
  const resetGame = useCallback((size = boardSize) => {
    setBoardSize(size);
    setBoard(createEmptyBoard(size));
    setCurrentTurn('X');
    setWinner(null);
    setWinLine([]);
    setLastMove(null);
    setRewardClaimed(false);

    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: createEmptyBoard(size),
        boardSize: size,
        currentTurn: 'X',
        winner: null,
        winLine: [],
        lastMove: null,
      });
    }
  }, [boardSize, isOnlineMode]);

  // Thiết lập phiên kết nối Online P2P
  useEffect(() => {
    if (!isOnlineMode) {
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }
      return;
    }

    const session = new GameRoomSession({
      gameType: 'caro',
      playerName,
      onState: (state) => {
        if (!state) return;
        if (state.board) setBoard(normalizeBoard(state.board, state.boardSize || boardSize));
        if (state.boardSize) setBoardSize(state.boardSize);
        if (state.currentTurn) setCurrentTurn(state.currentTurn);
        if (state.lastMove) setLastMove(state.lastMove);
        if (state.winLine) setWinLine(state.winLine);
        if (state.winner !== undefined) {
          setWinner(state.winner);
          if (state.winner && state.winner === myRole && !rewardClaimed) {
            sound.playWin();
            confetti({ particleCount: 70, spread: 70 });
            setRewardClaimed(true);
            if (onRewardWon) onRewardWon(100, 2);
          }
        }
        if (state.p2) setConnectedPlayer(state.p2.name);
      },
      onPlayerJoin: (player) => {
        setConnectedPlayer(player.name);
        sound.playTing();
      },
      onPlayerLeave: () => {
        setConnectedPlayer(null);
      },
    });

    sessionRef.current = session;

    return () => {
      session.destroy();
      sessionRef.current = null;
    };
  }, [isOnlineMode, playerName, myRole, boardSize, rewardClaimed, onRewardWon]);

  // Tạo phòng online
  const handleCreateRoom = async () => {
    if (!sessionRef.current) return;
    const code = await sessionRef.current.createRoom();
    setRoomCode(code);
    setMyRole('X');
    resetGame();
  };

  // Vào phòng online
  const handleJoinRoom = async (code) => {
    if (!sessionRef.current) return;
    const ok = await sessionRef.current.joinRoom(code);
    if (ok) {
      setRoomCode(code);
      setMyRole('O');
      sound.playTing();
    } else {
      alert('Không tìm thấy phòng!');
    }
  };

  // Rời phòng online
  const handleLeaveRoom = () => {
    if (sessionRef.current) {
      sessionRef.current.leaveRoom();
    }
    setRoomCode('');
    setConnectedPlayer(null);
    setIsOnlineMode(false);
    resetGame();
  };

  // Đổi kích thước bàn cờ
  const handleSelectSize = (newSize) => {
    if (newSize === boardSize) return;
    sound.playClick();
    resetGame(newSize);
  };

  // Bot AI đánh cờ
  const makeBotMove = useCallback(
    (currentB) => {
      const size = boardSize;
      const emptyCells = [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!currentB[r][c]) {
            let neighborCount = 0;
            for (let dr = -2; dr <= 2; dr++) {
              for (let dc = -2; dc <= 2; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size && currentB[nr][nc]) {
                  neighborCount++;
                }
              }
            }
            emptyCells.push({ r, c, weight: neighborCount });
          }
        }
      }

      if (emptyCells.length === 0) return;

      emptyCells.sort((a, b) => b.weight - a.weight);
      const poolSize = botDifficulty === 'easy' ? Math.min(8, emptyCells.length) : botDifficulty === 'medium' ? Math.min(3, emptyCells.length) : 1;
      const pick = emptyCells[Math.floor(Math.random() * poolSize)];

      setTimeout(() => {
        const nextB = currentB.map((row) => [...row]);
        nextB[pick.r][pick.c] = 'O';
        setBoard(nextB);
        setLastMove({ r: pick.r, c: pick.c });
        sound.playCaroMove();

        const check = checkCaroWinner(nextB, size);
        if (check.winner) {
          setWinner(check.winner);
          setWinLine(check.line);
          if (check.winner === 'O') sound.playLose();
        } else {
          setCurrentTurn('X');
        }
      }, 450);
    },
    [boardSize, botDifficulty]
  );

  // Thao tác đánh cờ
  const handleCellClick = (r, c) => {
    if (winner || board[r][c] || !isMyTurn) return;

    sound.playCaroMove();
    setLastMove({ r, c });

    const nextB = board.map((row) => [...row]);
    const piece = isOnlineMode ? myRole : 'X';
    nextB[r][c] = piece;
    setBoard(nextB);

    const check = checkCaroWinner(nextB, boardSize);

    if (check.winner) {
      setWinner(check.winner);
      setWinLine(check.line);

      if (check.winner === piece) {
        sound.playWin();
        confetti({ particleCount: 70, spread: 70 });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(80, 2);
        }
      }

      if (isOnlineMode && sessionRef.current) {
        sessionRef.current.syncGameState({
          board: nextB,
          winner: check.winner,
          winLine: check.line,
          lastMove: { r, c },
        });
      }
      return;
    }

    const nextTurn = piece === 'X' ? 'O' : 'X';
    setCurrentTurn(nextTurn);

    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: nextB,
        currentTurn: nextTurn,
        winner: null,
        winLine: [],
        lastMove: { r, c },
      });
    } else {
      makeBotMove(nextB);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CÔNG CỤ ONLINE P2P / BOT */}
      <OnlineRoomToolbar
        isOnlineMode={isOnlineMode}
        onToggleMode={(mode) => {
          setIsOnlineMode(mode);
          resetGame();
        }}
        roomCode={roomCode}
        isHost={myRole === 'X'}
        myRole={myRole}
        connectedPlayer={connectedPlayer}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* 2. HEADER: BÀN CỜ & KÍCH THƯỚC */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center font-fredoka font-black text-sm text-blue-600">
            {myRole}
          </div>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-slate-800 block">
              CỜ CARO 5 NƯỚC
            </span>
            <span className="text-[10px] text-slate-500">
              {winner
                ? 'Ván đấu kết thúc'
                : isMyTurn
                ? 'Lượt của bạn! ✨'
                : 'Đang đợi đối thủ... ⏳'}
            </span>
          </div>
        </div>

        {/* Nút chọn kích cỡ */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex rounded-xl bg-amber-50 p-0.5 border border-amber-200">
            {BOARD_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => handleSelectSize(b.size)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-fredoka font-bold transition ${
                  boardSize === b.size
                    ? 'bg-amber-400 text-black shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => resetGame()}
            title="Đánh ván mới"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. KHUNG BÀN CỜ CARO VUÔNG VẮN */}
      <div className="flex-1 flex items-center justify-center my-2 p-1 overflow-hidden">
        <div className="w-full aspect-square max-h-[380px] bg-[#E8C39E] p-1.5 rounded-2xl shadow-inner border-2 border-[#B08968] flex items-center justify-center">
          <div
            className="w-full h-full grid gap-[1px] bg-[#B08968] rounded-xl overflow-hidden border border-[#B08968]"
            style={{
              gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isLast = lastMove?.r === r && lastMove?.c === c;
                const isWinCell = winLine.some(([wr, wc]) => wr === r && wc === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={Boolean(cell || winner || !isMyTurn)}
                    className={`w-full h-full bg-[#FFF5EB] hover:bg-[#FFE8D1] flex items-center justify-center font-fredoka font-black transition-colors relative ${
                      isWinCell
                        ? 'bg-yellow-200 animate-pulse'
                        : isLast
                        ? 'bg-amber-100'
                        : ''
                    }`}
                  >
                    {cell === 'X' && (
                      <span className={`text-blue-600 font-black leading-none drop-shadow-2xs ${boardSize === 15 ? 'text-xs' : boardSize === 12 ? 'text-sm' : 'text-base sm:text-lg'}`}>
                        ✕
                      </span>
                    )}
                    {cell === 'O' && (
                      <span className={`text-rose-500 font-black leading-none drop-shadow-2xs ${boardSize === 15 ? 'text-xs' : boardSize === 12 ? 'text-sm' : 'text-base sm:text-lg'}`}>
                        ◯
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. FOOTER THÔNG BÁO KẾT QUẢ */}
      {winner && (
        <div className="mt-2 p-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95">
          <span className="font-fredoka font-black text-xs text-amber-950">
            {winner === myRole
              ? '🎉 BẠN ĐÃ CHIẾN THẮNG 5 NƯỚC THẦN SẦU! (+80 Xu & 1 Túi Quà Trợ Chiến)'
              : winner === 'DRAW'
              ? '🤝 VÁN CỜ HÒA ĐẸP MẮT!'
              : '😢 ĐỐI THỦ ĐÃ DÀNH CHIẾN THẮNG! HÃY PHỤC THÙ NÀO!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default CaroGame;
