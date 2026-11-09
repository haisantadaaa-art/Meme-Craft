import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, ref, update, onValue, set } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import { Trophy, ArrowLeft, RotateCcw, Sparkles, Bot, Users, Copy, Check, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatBox } from '../ChatBox';
import { QuickReactionToolbar } from '../QuickReactionToolbar';

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
  roomData,
  roomCode,
  myRole = 'X',
  isBotMode = false,
  onRewardWon,
  onExit,
}) {
  const [boardSize, setBoardSize] = useState(() => {
    return roomData?.boardSize || 10;
  });
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [localBoard, setLocalBoard] = useState(() => createEmptyBoard(10));
  const [localTurn, setLocalTurn] = useState('X');
  const [localWinner, setLocalWinner] = useState(null);
  const [localWinLine, setLocalWinLine] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Đồng bộ kích thước từ roomData online nếu có
  useEffect(() => {
    if (!isBotMode && roomData?.boardSize && roomData.boardSize !== boardSize) {
      setBoardSize(roomData.boardSize);
    }
  }, [roomData?.boardSize, isBotMode, boardSize]);

  const board = useMemo(() => {
    if (isBotMode) return localBoard;
    const raw = roomData?.board || roomData?.caroState?.board;
    return normalizeBoard(raw, boardSize);
  }, [isBotMode, localBoard, roomData, boardSize]);

  const currentTurn = useMemo(() => {
    if (isBotMode) return localTurn;
    return roomData?.currentTurn || roomData?.caroState?.currentTurn || roomData?.turn || 'X';
  }, [isBotMode, localTurn, roomData]);

  const winner = useMemo(() => {
    if (isBotMode) return localWinner;
    return roomData?.winner || roomData?.caroState?.winner || null;
  }, [isBotMode, localWinner, roomData]);

  const winLine = useMemo(() => {
    if (isBotMode) return localWinLine;
    const res = checkCaroWinner(board, boardSize);
    return res.line || [];
  }, [isBotMode, localWinLine, board, boardSize]);

  const isMyTurn = isBotMode ? localTurn === 'X' : currentTurn === myRole;

  // Đổi kích thước bàn cờ trong chế độ Bot
  const handleSelectSize = (newSize) => {
    if (newSize === boardSize) return;
    setBoardSize(newSize);
    setLocalBoard(createEmptyBoard(newSize));
    setLocalTurn('X');
    setLocalWinner(null);
    setLocalWinLine([]);
    setLastMove(null);
    setRewardClaimed(false);
    sound.playClick();
  };

  // Bot AI đánh cờ thông minh
  const makeBotMove = useCallback(
    (currentB) => {
      // 1. Kiểm tra Bot có nước thắng ngay không (4 quân)
      // 2. Chặn nước đối thủ thắng ngay (4 quân X)
      // 3. Đánh cạnh các quân hiện tại
      const size = boardSize;
      const emptyCells = [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!currentB[r][c]) {
            // Tính điểm lân cận
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

      // Sắp xếp ô gần quân cờ nhất
      emptyCells.sort((a, b) => b.weight - a.weight);

      // Nếu độ khó Dễ: lấy ngẫu nhiên top 8
      // Vừa: top 3
      // Khó: top 1
      const poolSize = botDifficulty === 'easy' ? Math.min(8, emptyCells.length) : botDifficulty === 'medium' ? Math.min(3, emptyCells.length) : 1;
      const pick = emptyCells[Math.floor(Math.random() * poolSize)];

      setTimeout(() => {
        const nextB = currentB.map((row) => [...row]);
        nextB[pick.r][pick.c] = 'O';
        setLocalBoard(nextB);
        setLastMove({ r: pick.r, c: pick.c });
        sound.playCaroMove();

        const check = checkCaroWinner(nextB, size);
        if (check.winner) {
          setLocalWinner(check.winner);
          setLocalWinLine(check.line);
          if (check.winner === 'O') sound.playLose();
        } else {
          setLocalTurn('X');
        }
      }, 450);
    },
    [boardSize, botDifficulty]
  );

  // Thao tác đánh cờ
  const handleCellClick = (r, c) => {
    if (winner || board[r][c]) return;
    if (!isMyTurn) return;

    sound.playCaroMove();
    setLastMove({ r, c });

    if (isBotMode) {
      const nextB = board.map((row) => [...row]);
      nextB[r][c] = 'X';
      setLocalBoard(nextB);

      const check = checkCaroWinner(nextB, boardSize);
      if (check.winner) {
        setLocalWinner(check.winner);
        setLocalWinLine(check.line);
        if (check.winner === 'X') {
          sound.playWin();
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          if (!rewardClaimed && onRewardWon) {
            setRewardClaimed(true);
            onRewardWon(80, 2);
          }
        }
      } else {
        setLocalTurn('O');
        makeBotMove(nextB);
      }
    } else if (roomCode) {
      const nextB = board.map((row) => [...row]);
      nextB[r][c] = myRole;
      const nextTurn = myRole === 'X' ? 'O' : 'X';
      const check = checkCaroWinner(nextB, boardSize);

      update(ref(db, `rooms/${roomCode}`), {
        board: nextB,
        currentTurn: nextTurn,
        winner: check.winner || null,
        lastMove: { r, c },
      }).catch((e) => console.error('Lỗi đi cờ caro:', e));

      if (check.winner === myRole) {
        sound.playWin();
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(120, 3);
        }
      }
    }
  };

  const handleResetGame = () => {
    sound.playClick();
    setRewardClaimed(false);
    setLastMove(null);
    if (isBotMode) {
      setLocalBoard(createEmptyBoard(boardSize));
      setLocalTurn('X');
      setLocalWinner(null);
      setLocalWinLine([]);
    } else if (roomCode) {
      update(ref(db, `rooms/${roomCode}`), {
        board: createEmptyBoard(boardSize),
        currentTurn: 'X',
        winner: null,
        lastMove: null,
      }).catch((e) => console.error('Lỗi reset phòng:', e));
    }
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. Header & Thanh thông tin người chơi phía trên (Đối thủ / Bot) */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        {/* Đối thủ hoặc Bot */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-sm font-fredoka font-black text-rose-600 shrink-0">
            {isBotMode ? '🤖' : 'O'}
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-xs text-slate-800 block truncate">
              {isBotMode ? `Bot AI (${botDifficulty === 'easy' ? 'Dễ' : botDifficulty === 'medium' ? 'Vừa' : 'Khó'})` : 'Đối Thủ Online'}
            </span>
            <span className="text-[10px] text-slate-500">
              Quân O • {currentTurn === 'O' ? 'Đang suy nghĩ... ⏳' : 'Chờ lượt'}
            </span>
          </div>
        </div>

        {/* Nút thao tác: Chọn kích thước / Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isBotMode && (
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
          )}

          <button
            onClick={handleResetGame}
            title="Đánh ván mới"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Bàn cờ Caro chính giữa màn hình (Căn giữa hoàn hảo, không méo tỷ lệ) */}
      <div className="flex-1 flex items-center justify-center p-1 relative my-auto">
        <div className="w-full max-w-[360px] aspect-square bg-[#FDE2B8] rounded-2xl p-1.5 shadow-md border-2 border-[#D4A373] flex flex-col justify-center">
          <div
            className="grid gap-[1px] bg-[#C58B58] p-[1px] rounded-xl overflow-hidden w-full h-full shadow-inner"
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

      {/* 3. Thanh thông tin người chơi phía dưới (Bạn) */}
      <div className="bg-white/95 p-2.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-sm font-fredoka font-black text-blue-600">
            {myRole}
          </div>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-slate-800 block">
              Bạn (Người Chơi)
            </span>
            <span className={`text-[10px] font-bold ${isMyTurn ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`}>
              {winner
                ? winner === myRole
                  ? 'Chiến thắng! 🏆'
                  : winner === 'DRAW'
                  ? 'Hòa cờ!'
                  : 'Đối thủ thắng!'
                : isMyTurn
                ? 'Đến lượt bạn đi! ✨'
                : 'Đang đợi đối thủ...'}
            </span>
          </div>
        </div>

        {/* Mã phòng online hoặc đổi độ khó bot */}
        {isBotMode ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500">Độ khó:</span>
            <select
              value={botDifficulty}
              onChange={(e) => setBotDifficulty(e.target.value)}
              className="px-2 py-1 rounded-xl bg-amber-50 border border-amber-300 text-xs font-fredoka font-bold text-amber-950"
            >
              <option value="easy">Dễ 🌱</option>
              <option value="medium">Vừa ⚔️</option>
              <option value="hard">Khó 👑</option>
            </select>
          </div>
        ) : roomCode ? (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-bold text-xs border border-amber-300"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>Mã: {roomCode}</span>
          </button>
        ) : null}
      </div>

      {/* Modal Thông Báo Thắng/Thua */}
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
