import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, ref, update } from '../services/firebase';
import { sound } from '../utils/audio';
import { Trophy, ArrowLeft, RotateCcw, Bot, Sparkles, User, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const BOARD_SIZE = 10;

// Tạo bàn cờ mặc định 10x10 rỗng an toàn
export const createEmptyBoard = () =>
  Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(''));

// Chuẩn hóa dữ liệu bàn cờ từ Firebase thành mảng 2 chiều 10x10 an toàn
export function normalizeBoard(rawBoard) {
  const safeBoard = createEmptyBoard();
  if (!rawBoard) return safeBoard;

  // Nếu là mảng 1 chiều 100 phần tử (từ phiên bản cũ)
  if (Array.isArray(rawBoard) && rawBoard.length === 100 && typeof rawBoard[0] !== 'object') {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const val = rawBoard[r * BOARD_SIZE + c];
        safeBoard[r][c] = val === 'X' || val === 'O' ? val : '';
      }
    }
    return safeBoard;
  }

  // Nếu là mảng 2 chiều hoặc object từ Firebase RTDB
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = Array.isArray(rawBoard) ? rawBoard[r] : rawBoard[r] || rawBoard[String(r)];
    if (row) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const val = Array.isArray(row) ? row[c] : row[c] || row[String(c)];
        safeBoard[r][c] = val === 'X' || val === 'O' ? val : '';
      }
    }
  }

  return safeBoard;
}

// Kiểm tra 5 ô liên tiếp (Ngang, Dọc, 2 Chéo)
export function checkCaroWinner(board) {
  if (!board || !Array.isArray(board)) return { winner: null, line: [] };

  const directions = [
    [0, 1],  // Ngang
    [1, 0],  // Dọc
    [1, 1],  // Chéo xuống phải
    [1, -1], // Chéo xuống trái
  ];

  let hasEmpty = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
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
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr]?.[nc] !== piece) {
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
  roomData,
  roomCode,
  myRole = 'X',
  isBotMode = false,
  onRewardWon,
  onExit,
}) {
  // Trạng thái cục bộ cho chế độ Bot
  const [localBoard, setLocalBoard] = useState(createEmptyBoard);
  const [localTurn, setLocalTurn] = useState('X');
  const [localWinner, setLocalWinner] = useState(null);
  const [localWinLine, setLocalWinLine] = useState([]);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // 1. Trích xuất dữ liệu an toàn, không bao giờ để crash
  const board = useMemo(() => {
    if (isBotMode) return localBoard;
    // Kiểm tra cấu trúc trực tiếp hoặc qua caroState
    const raw = roomData?.board || roomData?.caroState?.board;
    return normalizeBoard(raw);
  }, [isBotMode, localBoard, roomData]);

  const currentTurn = useMemo(() => {
    if (isBotMode) return localTurn;
    return roomData?.currentTurn || roomData?.caroState?.currentTurn || roomData?.turn || 'X';
  }, [isBotMode, localTurn, roomData]);

  const winner = useMemo(() => {
    if (isBotMode) return localWinner;
    return roomData?.winner || roomData?.caroState?.winner || null;
  }, [isBotMode, localWinner, roomData]);

  // Kiểm tra hàng chiến thắng để phát sáng
  const winLine = useMemo(() => {
    if (isBotMode) return localWinLine;
    const res = checkCaroWinner(board);
    return res.line || [];
  }, [isBotMode, localWinLine, board]);

  // 2. Tự động khởi tạo dữ liệu phòng trên Firebase nếu chưa có
  useEffect(() => {
    if (!isBotMode && roomCode && roomData && !isInitializing) {
      const needsInit = !roomData.board && !roomData.caroState?.board;
      if (needsInit) {
        setIsInitializing(true);
        const empty = createEmptyBoard();
        update(ref(db, `rooms/${roomCode}`), {
          status: 'playing',
          gameType: 'caro',
          board: empty,
          currentTurn: 'X',
          winner: null,
        })
          .catch((err) => console.error('Lỗi khởi tạo bàn cờ Firebase:', err))
          .finally(() => setIsInitializing(false));
      }
    }
  }, [isBotMode, roomCode, roomData, isInitializing]);

  // 3. Xử lý nhận thưởng khi chiến thắng
  useEffect(() => {
    if (winner && !rewardClaimed) {
      if (winner === myRole) {
        sound.playWin();
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
        });
        if (onRewardWon) onRewardWon(200, 2);
      } else if (winner === 'DRAW') {
        sound.playLevelUp();
        if (onRewardWon) onRewardWon(50, 1);
      } else {
        sound.playLose();
      }
      setRewardClaimed(true);
    }
  }, [winner, myRole, rewardClaimed, onRewardWon]);

  // 4. Lượt của Bot Nông Dân
  useEffect(() => {
    if (isBotMode && localTurn === 'O' && !localWinner) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isBotMode, localTurn, localWinner, localBoard]);

  const makeBotMove = () => {
    const emptyCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!localBoard[r][c]) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (emptyCells.length === 0) return;

    // Chọn ô liền kề hoặc ngẫu nhiên
    const [br, bc] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = localBoard.map((row) => [...row]);
    newBoard[br][bc] = 'O';

    sound.playCaroMove();
    const result = checkCaroWinner(newBoard);

    setLocalBoard(newBoard);
    setLocalTurn('X');
    if (result.winner) {
      setLocalWinner(result.winner);
      setLocalWinLine(result.line);
    }
  };

  // 5. Click đánh cờ
  const handleCellClick = async (r, c) => {
    // Kiểm tra lượt, ô trống và trạng thái kết thúc
    const isMyTurn = currentTurn === myRole && !winner;
    if (!isMyTurn) return;
    if (board[r][c] !== '') return;

    sound.playCaroMove();

    if (isBotMode) {
      const newBoard = localBoard.map((row) => [...row]);
      newBoard[r][c] = 'X';
      const result = checkCaroWinner(newBoard);

      setLocalBoard(newBoard);
      setLocalTurn('O');
      if (result.winner) {
        setLocalWinner(result.winner);
        setLocalWinLine(result.line);
      }
    } else if (roomCode) {
      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = myRole;

      const result = checkCaroWinner(newBoard);
      const nextTurn = myRole === 'X' ? 'O' : 'X';

      const payload = {
        board: newBoard,
        currentTurn: nextTurn,
        winner: result.winner || null,
      };

      try {
        await update(ref(db, `rooms/${roomCode}`), payload);
      } catch (err) {
        console.error('Lỗi cập nhật nước đi Firebase:', err);
      }
    }
  };

  // 6. Chơi lại
  const handleRematch = async () => {
    sound.playClick();
    setRewardClaimed(false);

    if (isBotMode) {
      setLocalBoard(createEmptyBoard());
      setLocalTurn('X');
      setLocalWinner(null);
      setLocalWinLine([]);
    } else if (roomCode) {
      const empty = createEmptyBoard();
      try {
        await update(ref(db, `rooms/${roomCode}`), {
          board: empty,
          currentTurn: 'X',
          winner: null,
          status: 'playing',
        });
      } catch (err) {
        console.error('Lỗi tạo ván mới:', err);
      }
    }
  };

  // Kiểm tra ô có thuộc hàng chiến thắng không
  const isWinningCell = useCallback(
    (r, c) => winLine.some(([wr, wc]) => wr === r && wc === c),
    [winLine]
  );

  // 7. BẪY LỖI & LOADING AN TOÀN (Tuyệt đối không để crash màn hình đen)
  if (!isBotMode && !roomData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[420px] text-center">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
        <h3 className="text-xl font-black font-fredoka text-amber-300">Đang tải bàn cờ Caro...</h3>
        <p className="text-xs text-amber-200 mt-2">Đang đồng bộ dữ liệu phòng với máy chủ Firebase</p>
        <button
          onClick={onExit}
          className="mt-6 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition"
        >
          Quay lại sảnh
        </button>
      </div>
    );
  }

  const isMyTurnNow = currentTurn === myRole && !winner;
  const hostName = roomData?.host?.name || 'Chủ Nông Trại (X)';
  const guestName = isBotMode ? 'Bot Nông Dân (O)' : roomData?.guest?.name || 'Đối thủ (O)';

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-2 sm:p-4 select-none animate-in fade-in">
      {/* Thanh điều hướng & Thông tin phòng */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 bg-[#172d15] p-2.5 sm:p-3 rounded-2xl border-2 border-amber-600/60 shadow-lg">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-amber-300 font-bold text-xs border border-amber-400/30 active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rời phòng</span>
        </button>

        <div className="text-center">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400/90 font-mono">
            {isBotMode ? 'Luyện tập với Bot' : `Phòng PIN: ${roomCode || '---'}`}
          </span>
          <div className="text-xs font-bold text-emerald-200">Bàn cờ Caro 10x10</div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold font-fredoka">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>+200 Xu</span>
        </div>
      </div>

      {/* Bảng hiển thị 2 người chơi & Lượt đánh */}
      <div className="w-full grid grid-cols-2 gap-2 mb-3">
        {/* Người chơi X */}
        <div
          className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border-2 transition-all ${
            currentTurn === 'X' && !winner
              ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] scale-[1.02]'
              : 'bg-black/40 border-slate-700/60 opacity-80'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-black text-cyan-400 text-lg font-fredoka">
            X
          </div>
          <div className="truncate text-left">
            <div className="text-xs font-black text-white truncate">{hostName}</div>
            <div className="text-[10px] text-cyan-300 font-medium">
              {myRole === 'X' ? 'BẠN' : 'Đối thủ'}
            </div>
          </div>
        </div>

        {/* Người chơi O */}
        <div
          className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border-2 transition-all ${
            currentTurn === 'O' && !winner
              ? 'bg-orange-950/70 border-orange-500 shadow-[0_0_12px_rgba(255,87,34,0.4)] scale-[1.02]'
              : 'bg-black/40 border-slate-700/60 opacity-80'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500 flex items-center justify-center font-black text-orange-400 text-lg font-fredoka">
            O
          </div>
          <div className="truncate text-left">
            <div className="text-xs font-black text-white truncate">{guestName}</div>
            <div className="text-[10px] text-orange-300 font-medium">
              {myRole === 'O' ? 'BẠN' : isBotMode ? 'Máy AI' : 'Đối thủ'}
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo trạng thái lượt đánh */}
      <div className="w-full mb-3 text-center">
        {winner ? (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 border-2 border-yellow-400 text-yellow-300 font-black text-sm flex items-center justify-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>
              {winner === myRole
                ? '🏆 BẠN ĐÃ CHIẾN THẮNG (+200 Xu, +2 Phân bón)!'
                : winner === 'DRAW'
                ? '🤝 HÒA NHAU RỒI (+50 Xu)!'
                : '💀 ĐỐI THỦ ĐÃ THẮNG 5 Ô LIÊN TIẾP!'}
            </span>
          </div>
        ) : (
          <div
            className={`p-2 rounded-xl text-xs sm:text-sm font-black border transition-all ${
              isMyTurnNow
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                : 'bg-black/40 border-white/10 text-slate-300'
            }`}
          >
            {isMyTurnNow
              ? `🎯 ĐẾN LƯỢT CỦA BẠN (Quân ${myRole}) - Hãy chọn 1 ô trống!`
              : `⏳ Đang đợi đối thủ (${currentTurn}) suy nghĩ nước cờ...`}
          </div>
        )}
      </div>

      {/* BÀN CỜ CARO 10x10 */}
      <div className="relative p-2.5 sm:p-3.5 bg-gradient-to-b from-[#2e1d0c] to-[#1a1006] rounded-3xl border-4 border-[#b45309] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5 w-[310px] sm:w-[380px] h-[310px] sm:h-[380px]">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWin = isWinningCell(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={Boolean(cell) || Boolean(winner) || !isMyTurnNow}
                  className={`w-full h-full rounded-md sm:rounded-lg flex items-center justify-center font-black font-fredoka text-sm sm:text-lg transition-all select-none ${
                    isWin
                      ? 'bg-yellow-400/90 text-black shadow-[0_0_12px_#fde047] scale-105 z-10 animate-pulse'
                      : cell === 'X'
                      ? 'bg-[#0f2427] text-cyan-400 shadow-inner border border-cyan-500/40'
                      : cell === 'O'
                      ? 'bg-[#29140a] text-orange-500 shadow-inner border border-orange-500/40'
                      : isMyTurnNow
                      ? 'bg-[#3b2414] hover:bg-[#52331c] active:scale-95 border border-[#6b4226]/60 cursor-pointer'
                      : 'bg-[#2b1a0e] opacity-70 border border-[#4a2e1a]/40 cursor-not-allowed'
                  }`}
                >
                  {cell === 'X' && <span className="drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]">X</span>}
                  {cell === 'O' && <span className="drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]">O</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Nút đấu lại khi ván kết thúc */}
      {winner && (
        <div className="w-full mt-4 flex justify-center">
          <button
            onClick={handleRematch}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm border-2 border-black shadow-[4px_4px_0px_#000] active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ĐẤU LẠI VÁN MỚI 🔄</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default CaroGame;
