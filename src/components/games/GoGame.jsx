import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, ref, update } from '../../services/firebase';
import { sound } from '../../utils/soundEffects';
import { Trophy, RotateCcw, ShieldCheck, Flag, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GO_SIZES = [
  { size: 9, label: '9x9', desc: 'Tập Sự ⚡' },
  { size: 13, label: '13x13', desc: 'Trung Cấp ⚔️' },
  { size: 19, label: '19x19', desc: 'Kỳ Vương 👑' },
];

export const createEmptyGoBoard = (size = 9) =>
  Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

// Thuật toán đếm Khí (Liberties) và tìm nhóm quân liên kết
export function getGroupAndLiberties(board, startR, startC, size = 9) {
  const color = board[startR][startC];
  if (!color) return { group: [], liberties: 0 };

  const group = [];
  const visited = Array(size)
    .fill(false)
    .map(() => Array(size).fill(false));
  const queue = [[startR, startC]];
  visited[startR][startC] = true;

  const libertiesSet = new Set();
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    group.push([r, c]);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (!board[nr][nc]) {
          libertiesSet.add(`${nr}-${nc}`);
        } else if (board[nr][nc] === color && !visited[nr][nc]) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
  }

  return { group, liberties: libertiesSet.size };
}

export function GoGame({
  roomData,
  roomCode,
  myRole = 'b', // 'b': Đen đi trước, 'w': Trắng
  isBotMode = false,
  playerName = 'Kỳ Thủ',
  onRewardWon,
  onExit,
}) {
  const [boardSize, setBoardSize] = useState(() => roomData?.boardSize || 9);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [localBoard, setLocalBoard] = useState(() => createEmptyGoBoard(9));
  const [localTurn, setLocalTurn] = useState('b'); // Đen luôn đi trước
  const [localPrisoners, setLocalPrisoners] = useState({ b: 0, w: 0 }); // Số quân tù binh đã bắt
  const [localWinner, setLocalWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [passCount, setPassCount] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Điểm sao Hoshiboshi chuẩn theo kích thước
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

  const board = isBotMode ? localBoard : roomData?.board || localBoard;
  const currentTurn = isBotMode ? localTurn : roomData?.currentTurn || 'b';
  const prisoners = isBotMode ? localPrisoners : roomData?.prisoners || { b: 0, w: 0 };
  const winner = isBotMode ? localWinner : roomData?.winner || null;

  const isMyTurn = isBotMode ? localTurn === myRole : currentTurn === myRole;

  const handleSelectSize = (newSize) => {
    if (newSize === boardSize) return;
    setBoardSize(newSize);
    setLocalBoard(createEmptyGoBoard(newSize));
    setLocalTurn('b');
    setLocalPrisoners({ b: 0, w: 0 });
    setLocalWinner(null);
    setLastMove(null);
    setPassCount(0);
    setRewardClaimed(false);
    sound.playClick();
  };

  // Bot AI đánh cờ Vây
  const makeBotMove = useCallback(
    (currentB, currentP) => {
      const size = boardSize;
      const botColor = myRole === 'b' ? 'w' : 'b';
      const oppColor = myRole;

      // Tìm tất cả các ô hợp lệ (không tự sát)
      const validMoves = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!currentB[r][c]) {
            // Giả lập đặt quân
            const testB = currentB.map((row) => [...row]);
            testB[r][c] = botColor;

            // Kiểm tra có bắt được quân đối thủ nào không
            let canCapture = 0;
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size && testB[nr][nc] === oppColor) {
                const { liberties } = getGroupAndLiberties(testB, nr, nc, size);
                if (liberties === 0) canCapture++;
              }
            }

            const { liberties: myLiberties } = getGroupAndLiberties(testB, r, c, size);
            if (myLiberties > 0 || canCapture > 0) {
              validMoves.push({ r, c, captureScore: canCapture * 10, myLiberties });
            }
          }
        }
      }

      if (validMoves.length === 0) {
        // Bot bỏ lượt (Pass)
        sound.playTing();
        setLocalTurn(myRole);
        return;
      }

      // Ưu tiên bắt quân hoặc giữ nhiều khí
      validMoves.sort((a, b) => b.captureScore + b.myLiberties - (a.captureScore + a.myLiberties));

      const pool = botDifficulty === 'easy' ? Math.min(6, validMoves.length) : botDifficulty === 'medium' ? Math.min(3, validMoves.length) : 1;
      const chosen = validMoves[Math.floor(Math.random() * pool)];

      setTimeout(() => {
        executeStonePlacement(chosen.r, chosen.c, botColor, currentB, currentP);
      }, 500);
    },
    [boardSize, botDifficulty, myRole]
  );

  // Đặt quân cờ & xử lý bắt quân (Capture)
  const executeStonePlacement = (r, c, color, currentB, currentP) => {
    const size = boardSize;
    const oppColor = color === 'b' ? 'w' : 'b';
    const nextB = currentB.map((row) => [...row]);
    nextB[r][c] = color;

    // Kiểm tra và bắt các nhóm quân đối thủ hết khí
    let capturedCount = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const capturedStones = new Set();

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && nextB[nr][nc] === oppColor) {
        const { group, liberties } = getGroupAndLiberties(nextB, nr, nc, size);
        if (liberties === 0) {
          group.forEach(([gr, gc]) => capturedStones.add(`${gr}-${gc}`));
        }
      }
    }

    // Xóa quân bị bắt khỏi bàn cờ
    capturedStones.forEach((key) => {
      const [cr, cc] = key.split('-').map(Number);
      nextB[cr][cc] = null;
      capturedCount++;
    });

    // Kiểm tra quy tắc cấm tự sát (Suicide rule)
    const { liberties: myLib } = getGroupAndLiberties(nextB, r, c, size);
    if (myLib === 0 && capturedCount === 0) {
      // Nước cờ tự sát bất hợp pháp
      sound.playBomb();
      return false;
    }

    sound.playCaroMove();
    setLastMove({ r, c });
    setPassCount(0);

    const nextPrisoners = {
      ...currentP,
      [color]: (currentP[color] || 0) + capturedCount,
    };

    const nextTurn = color === 'b' ? 'w' : 'b';

    if (isBotMode) {
      setLocalBoard(nextB);
      setLocalPrisoners(nextPrisoners);
      setLocalTurn(nextTurn);

      if (color === myRole) {
        makeBotMove(nextB, nextPrisoners);
      }
    } else if (roomCode) {
      update(ref(db, `rooms/${roomCode}`), {
        board: nextB,
        prisoners: nextPrisoners,
        currentTurn: nextTurn,
        lastMove: { r, c },
      }).catch((e) => console.error('Lỗi đi cờ vây:', e));
    }

    return true;
  };

  const handleCellClick = (r, c) => {
    if (winner || board[r][c] || !isMyTurn) return;
    executeStonePlacement(r, c, isBotMode ? myRole : currentTurn, board, prisoners);
  };

  // Bỏ lượt (Pass)
  const handlePass = () => {
    sound.playTing();
    const nextP = passCount + 1;
    setPassCount(nextP);

    if (nextP >= 2) {
      // 2 người liên tiếp pass -> kết thúc ván và tính điểm
      const bScore = prisoners.b;
      const wScore = prisoners.w;
      const win = bScore >= wScore ? 'b' : 'w';

      if (isBotMode) {
        setLocalWinner(win);
      } else if (roomCode) {
        update(ref(db, `rooms/${roomCode}`), { winner: win });
      }

      if (win === myRole) {
        sound.playWin();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(100, 2);
        }
      }
      return;
    }

    const nextTurn = currentTurn === 'b' ? 'w' : 'b';
    if (isBotMode) {
      setLocalTurn(nextTurn);
      makeBotMove(board, prisoners);
    } else if (roomCode) {
      update(ref(db, `rooms/${roomCode}`), { currentTurn: nextTurn });
    }
  };

  // Đầu hàng (Resign)
  const handleResign = () => {
    if (confirm('Bạn có chắc chắn muốn nhận thua ván này không?')) {
      const oppWin = myRole === 'b' ? 'w' : 'b';
      if (isBotMode) {
        setLocalWinner(oppWin);
      } else if (roomCode) {
        update(ref(db, `rooms/${roomCode}`), { winner: oppWin });
      }
      sound.playLose();
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
      {/* 1. Header & Đối thủ phía trên */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-700 shadow-sm flex items-center justify-center text-base font-black shrink-0">
            {myRole === 'b' ? '⚪' : '⚫'}
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-xs text-slate-800 block truncate">
              {isBotMode ? `Bot Cờ Vây (${botDifficulty === 'easy' ? 'Dễ' : botDifficulty === 'medium' ? 'Vừa' : 'Khó'})` : 'Đối Thủ'}
            </span>
            <span className="text-[10px] text-slate-500">
              Bắt được: {prisoners[myRole === 'b' ? 'w' : 'b']} quân • {currentTurn !== myRole ? 'Đang nghĩ... ⏳' : 'Chờ bạn'}
            </span>
          </div>
        </div>

        {/* Nút chọn kích thước */}
        {isBotMode && (
          <div className="flex rounded-xl bg-amber-50 p-0.5 border border-amber-200">
            {GO_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => handleSelectSize(b.size)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-fredoka font-bold transition ${
                  boardSize === b.size ? 'bg-amber-400 text-black shadow-2xs' : 'text-amber-800'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Bàn cờ vây chính giữa màn hình dọc */}
      <div className="flex-1 flex items-center justify-center p-1 relative my-auto">
        <div className="w-full max-w-[360px] aspect-square bg-[#DEB887] rounded-2xl p-2 shadow-lg border-2 border-[#8B5A2B] flex flex-col justify-center relative">
          {/* Lưới đường kẻ bàn cờ Vây */}
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
                    {/* Đường kẻ chữ thập qua tâm ô */}
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

                    {/* Điểm sao Hoshiboshi */}
                    {isStar && !cell && (
                      <div className="w-2 h-2 rounded-full bg-[#3E2723] z-10 pointer-events-none" />
                    )}

                    {/* Quân Cờ Đen */}
                    {cell === 'b' && (
                      <div
                        className={`w-[85%] h-[85%] rounded-full bg-gradient-to-br from-slate-800 to-black shadow-md z-20 border border-slate-700 flex items-center justify-center ${
                          isLast ? 'ring-2 ring-amber-400' : ''
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500/40 -translate-x-1 -translate-y-1" />
                      </div>
                    )}

                    {/* Quân Cờ Trắng */}
                    {cell === 'w' && (
                      <div
                        className={`w-[85%] h-[85%] rounded-full bg-gradient-to-br from-white to-slate-200 shadow-md z-20 border border-slate-300 flex items-center justify-center ${
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

      {/* 3. Thanh thông tin người chơi phía dưới (Bạn) */}
      <div className="bg-white/95 p-2.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 shadow-sm flex items-center justify-center text-base font-black shrink-0">
            {myRole === 'b' ? '⚫' : '⚪'}
          </div>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-slate-800 block">
              {playerName} (Bạn)
            </span>
            <span className={`text-[10px] font-bold ${isMyTurn ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`}>
              Bắt được: {prisoners[myRole]} quân • {isMyTurn ? 'Lượt của bạn! ✨' : 'Chờ đối thủ...'}
            </span>
          </div>
        </div>

        {/* Nút Bỏ lượt & Xin thua */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePass}
            disabled={!isMyTurn || Boolean(winner)}
            className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-bold text-xs border border-amber-300 transition active:scale-95 disabled:opacity-50"
          >
            Bỏ Lượt
          </button>
          <button
            onClick={handleResign}
            disabled={Boolean(winner)}
            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-fredoka font-bold text-xs border border-rose-200 transition active:scale-95 disabled:opacity-50"
          >
            Nhận Thua
          </button>
        </div>
      </div>

      {/* Banner kết thúc */}
      {winner && (
        <div className="mt-2 p-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95">
          <span className="font-fredoka font-black text-xs text-amber-950">
            {winner === myRole
              ? '🎉 BẠN ĐÃ CHIẾN THẮNG KỲ THỦ ĐỐI PHƯƠNG! (+100 Xu & 1 Túi Quà Trợ Chiến)'
              : '😢 BẠN ĐÃ THUA VÁN NÀY! HÃY LUYỆN TẬP VÀ PHỤC THÙ NHA!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default GoGame;
