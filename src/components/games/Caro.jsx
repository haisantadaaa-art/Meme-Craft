import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
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
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
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

export function Caro({
  roomCode = '',
  myRole = 'X', // 'X' | 'O'
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Kỳ Thủ',
  onRewardWon,
  onExit,
}) {
  const [boardSize, setBoardSize] = useState(10);
  const [board, setBoard] = useState(() => createEmptyBoard(10));
  const [currentTurn, setCurrentTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);

  const isMyTurn = !winner && (isBotMode ? currentTurn === 'X' : currentTurn === myRole);

  const resetGame = useCallback((size = boardSize) => {
    setBoardSize(size);
    setBoard(createEmptyBoard(size));
    setCurrentTurn('X');
    setWinner(null);
    setWinLine([]);
    setLastMove(null);
    setRewardClaimed(false);

    if (!isBotMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: createEmptyBoard(size),
        boardSize: size,
        currentTurn: 'X',
        winner: null,
        winLine: [],
        lastMove: null,
      });
    }
  }, [boardSize, isBotMode]);

  // Phiên đồng bộ online
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'caro',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '⭕' },
      (gameState) => {
        if (!gameState) return;
        if (gameState.board) setBoard(normalizeBoard(gameState.board, gameState.boardSize || boardSize));
        if (gameState.boardSize) setBoardSize(gameState.boardSize);
        if (gameState.currentTurn) setCurrentTurn(gameState.currentTurn);
        if (gameState.lastMove) setLastMove(gameState.lastMove);
        if (gameState.winLine) setWinLine(gameState.winLine);
        if (gameState.winner !== undefined) {
          setWinner(gameState.winner);
          if (gameState.winner && gameState.winner === myRole && !rewardClaimed) {
            sound.playWin();
            confetti({ particleCount: 70, spread: 70 });
            setRewardClaimed(true);
            if (onRewardWon) onRewardWon(100, 2);
          }
        }
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName, myRole, boardSize, rewardClaimed, onRewardWon]);

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

  const handleCellClick = (r, c) => {
    if (winner || board[r][c] || !isMyTurn) return;

    sound.playCaroMove();
    setLastMove({ r, c });

    const nextB = board.map((row) => [...row]);
    const piece = isBotMode ? 'X' : myRole;
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

      if (!isBotMode && sessionRef.current) {
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

    if (!isBotMode && sessionRef.current) {
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
      {/* 1. HEADER CHUẨN */}
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
            CỜ CARO 5 NƯỚC
          </span>
          <span className="text-[9px] text-slate-500 font-bold">
            {isBotMode ? `Bot AI (${botDifficulty})` : `Phòng Online #${roomCode}`}
          </span>
        </div>

        {/* Nút chọn kích cỡ */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex rounded-xl bg-amber-50 p-0.5 border border-amber-200">
            {BOARD_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => {
                  sound.playClick();
                  resetGame(b.size);
                }}
                className={`px-1.5 py-0.5 rounded-lg text-[9px] font-fredoka font-bold transition ${
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

      {/* 2. THANH LƯỢT ĐI */}
      <div className="bg-white/95 p-1.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2 my-1">
        <div className={`flex items-center gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${currentTurn === 'X' ? 'bg-blue-100 border border-blue-300 animate-pulse' : 'bg-slate-50'}`}>
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-fredoka font-black text-xs">
            ✕
          </span>
          <span className="text-xs font-fredoka font-black text-blue-950 truncate">
            {myRole === 'X' ? `${playerName} (Bạn)` : 'Đối Thủ'}
          </span>
        </div>

        <span className="text-xs font-fredoka font-black text-amber-950 px-1">VS</span>

        <div className={`flex items-center justify-end gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${currentTurn === 'O' ? 'bg-rose-100 border border-rose-300 animate-pulse' : 'bg-slate-50'}`}>
          <span className="text-xs font-fredoka font-black text-rose-950 truncate">
            {isBotMode ? 'Bot AI' : myRole === 'O' ? `${playerName} (Bạn)` : 'Đối Thủ'}
          </span>
          <span className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-fredoka font-black text-xs">
            ◯
          </span>
        </div>
      </div>

      {/* 3. BÀN CỜ CARO */}
      <div className="flex-1 flex items-center justify-center my-1 p-1 overflow-hidden">
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

      {/* BANNER THẮNG THUA */}
      {winner && (
        <div className="mt-1 p-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95 shrink-0">
          <span className="font-fredoka font-black text-xs text-amber-950">
            {winner === myRole
              ? '🎉 BẠN ĐÃ CHIẾN THẮNG 5 NƯỚC THẦN SẦU! (+80 Xu)'
              : winner === 'DRAW'
              ? '🤝 VÁN CỜ HÒA ĐẸP MẮT!'
              : '😢 ĐỐI THỦ ĐÃ CHIẾN THẮNG!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default Caro;
