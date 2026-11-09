import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import { ArrowLeft, RotateCcw, Flag } from 'lucide-react';
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
 * Khi một quân đặt xuống kẹp quân đối phương ở giữa theo chiều ngang hoặc dọc:
 * Toàn bộ quân bị kẹp ở giữa lập tức bị nuốt chửng và loại bỏ!
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

      if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;

      const cell = board[nr][nc];

      if (cell === oppColor) {
        potential.push([nr, nc]);
        step++;
      } else if (cell === myColor) {
        if (potential.length > 0) {
          capturedCoords.push(...potential);
        }
        break;
      } else {
        break;
      }
    }
  }

  return capturedCoords;
}

export function FolkGo({
  roomCode = '',
  myRole = 'b', // 'b': Đen | 'w': Trắng
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Kỳ Thủ',
  onRewardWon,
  onExit,
}) {
  const [boardSize, setBoardSize] = useState(9);
  const [board, setBoard] = useState(() => createEmptyGoBoard(9));
  const [currentTurn, setCurrentTurn] = useState('b'); // Đen luôn đi trước
  const [prisoners, setPrisoners] = useState({ b: 0, w: 0 });
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [passCount, setPassCount] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);
  const botTimerRef = useRef(null);

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

  const isMyTurn = !winner && (isBotMode ? currentTurn === 'b' : currentTurn === myRole);

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

    if (!isBotMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: createEmptyGoBoard(size),
        boardSize: size,
        currentTurn: 'b',
        prisoners: { b: 0, w: 0 },
        winner: null,
      });
    }
  }, [boardSize, isBotMode]);

  // Phiên đồng bộ online
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'go',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '⚪⚫' },
      (gameState) => {
        if (!gameState) return;
        if (gameState.board) setBoard(gameState.board);
        if (gameState.boardSize) setBoardSize(gameState.boardSize);
        if (gameState.currentTurn) setCurrentTurn(gameState.currentTurn);
        if (gameState.prisoners) setPrisoners(gameState.prisoners);
        if (gameState.lastMove) setLastMove(gameState.lastMove);
        if (gameState.winner !== undefined) {
          setWinner(gameState.winner);
          if (gameState.winner && gameState.winner === myRole && !rewardClaimed) {
            sound.playWin();
            confetti({ particleCount: 70, spread: 70 });
            setRewardClaimed(true);
            if (onRewardWon) onRewardWon(120, 3);
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
  }, [isBotMode, roomCode, playerName, myRole, rewardClaimed, onRewardWon]);

  // Bot AI đánh cờ
  const makeBotMove = useCallback((currentB, pRecord) => {
    const opp = 'w';
    const myCol = 'b';
    const emptyCells = [];

    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (!currentB[r][c]) {
          const captures = checkSandwichCaptures(currentB, r, c, opp, boardSize);
          emptyCells.push({ r, c, captureCount: captures.length });
        }
      }
    }

    if (emptyCells.length === 0) return;

    emptyCells.sort((a, b) => b.captureCount - a.captureCount);
    const chosen = emptyCells[0].captureCount > 0
      ? emptyCells[0]
      : emptyCells[Math.floor(Math.random() * Math.min(8, emptyCells.length))];

    botTimerRef.current = setTimeout(() => {
      const nextB = currentB.map((row) => [...row]);
      nextB[chosen.r][chosen.c] = opp;

      const caps = checkSandwichCaptures(nextB, chosen.r, chosen.c, opp, boardSize);
      caps.forEach(([cr, cc]) => {
        nextB[cr][cc] = null;
      });

      const nextP = {
        ...pRecord,
        w: (pRecord.w || 0) + caps.length,
      };

      setBoard(nextB);
      setPrisoners(nextP);
      setLastMove({ r: chosen.r, c: chosen.c });
      setCurrentTurn('b');
      setPassCount(0);
      sound.playCaroMove();
    }, 700);
  }, [boardSize]);

  // Thao tác đặt quân
  const handleCellClick = (r, c) => {
    if (board[r][c] || !isMyTurn) return;

    sound.playCaroMove();

    const turnColor = isBotMode ? 'b' : myRole;
    const nextB = board.map((row) => [...row]);
    nextB[r][c] = turnColor;

    // Kiểm tra kẹp 2 đầu
    const captures = checkSandwichCaptures(nextB, r, c, turnColor, boardSize);
    if (captures.length > 0) {
      sound.playWin();
      captures.forEach(([cr, cc]) => {
        nextB[cr][cc] = null;
      });
    }

    const nextP = {
      ...prisoners,
      [turnColor]: (prisoners[turnColor] || 0) + captures.length,
    };

    setBoard(nextB);
    setPrisoners(nextP);
    setLastMove({ r, c });
    setPassCount(0);

    const nextTurn = turnColor === 'b' ? 'w' : 'b';
    setCurrentTurn(nextTurn);

    if (!isBotMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        board: nextB,
        currentTurn: nextTurn,
        prisoners: nextP,
        lastMove: { r, c },
      });
    } else if (isBotMode) {
      makeBotMove(nextB, nextP);
    }
  };

  // Nước đi Chuyền (Pass)
  const handlePass = () => {
    sound.playClick();
    const nextPass = passCount + 1;
    setPassCount(nextPass);

    if (nextPass >= 2) {
      // 2 bên cùng nhường -> Kết thúc đếm quân
      const bStones = board.flat().filter((c) => c === 'b').length + prisoners.b;
      const wStones = board.flat().filter((c) => c === 'w').length + prisoners.w;
      const win = bStones >= wStones ? 'b' : 'w';
      setWinner(win);
      sound.playWin();
      return;
    }

    const nextTurn = currentTurn === 'b' ? 'w' : 'b';
    setCurrentTurn(nextTurn);
    if (isBotMode && nextTurn === 'w') {
      makeBotMove(board, prisoners);
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
            CỜ VÂY DÂN GIAN (KẸP 2 ĐẦU)
          </span>
          <span className="text-[9px] text-slate-500 font-bold">
            {isBotMode ? `Bot AI (${botDifficulty})` : `Phòng Online #${roomCode}`}
          </span>
        </div>

        <button
          onClick={() => resetGame()}
          title="Đánh ván mới"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. THANH THÔNG TIN 2 KỲ THỦ & QUÂN ĂN ĐƯỢC */}
      <div className="bg-white/95 p-1.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2 my-1">
        {/* Quân Đen */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${currentTurn === 'b' ? 'bg-amber-100 border border-amber-400 animate-pulse' : 'bg-slate-50'}`}>
          <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs text-white font-black shrink-0 shadow-xs">
            ⚫
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-[11px] text-slate-900 block truncate">
              {myRole === 'b' ? `${playerName} (Bạn)` : 'Đối Thủ'}
            </span>
            <span className="text-[10px] text-slate-600 font-bold">
              Ăn: {prisoners.b} quân
            </span>
          </div>
        </div>

        {/* Nút Nhường Nước */}
        <button
          onClick={handlePass}
          disabled={!isMyTurn || Boolean(winner)}
          className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-fredoka font-bold text-xs shrink-0 active:scale-95 transition flex items-center gap-1 disabled:opacity-50"
        >
          <Flag className="w-3 h-3 text-amber-700" />
          <span>Nhường</span>
        </button>

        {/* Quân Trắng */}
        <div className={`flex items-center justify-end gap-1.5 p-1 rounded-xl flex-1 min-w-0 ${currentTurn === 'w' ? 'bg-amber-100 border border-amber-400 animate-pulse' : 'bg-slate-50'}`}>
          <div className="min-w-0 leading-tight text-right">
            <span className="font-fredoka font-black text-[11px] text-slate-900 block truncate">
              {isBotMode ? 'Bot AI' : myRole === 'w' ? `${playerName} (Bạn)` : 'Đối Thủ'}
            </span>
            <span className="text-[10px] text-slate-600 font-bold">
              Ăn: {prisoners.w} quân
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-xs text-slate-800 font-black shrink-0 shadow-xs">
            ⚪
          </div>
        </div>
      </div>

      {/* 3. KHUNG BÀN CỜ VÂY GỖ */}
      <div className="flex-1 w-full bg-[#E8C39E] rounded-3xl p-2 border-4 border-[#8B5A2B] shadow-inner relative flex items-center justify-center overflow-hidden my-1">
        <div
          className="w-full aspect-square max-h-[380px] grid relative bg-[#DEB887] rounded-xl p-1 shadow-inner border border-[#8B5A2B]"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMove?.r === r && lastMove?.c === c;
              const isStar = starPoints.some(([sr, sc]) => sr === r && sc === c);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={Boolean(cell || winner || !isMyTurn)}
                  className="w-full h-full relative flex items-center justify-center focus:outline-none"
                >
                  {/* Đường kẻ ngang & dọc chuẩn bàn cờ vây */}
                  <div className="absolute inset-x-0 h-[1px] bg-[#8B5A2B]/80 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute inset-y-0 w-[1px] bg-[#8B5A2B]/80 left-1/2 -translate-x-1/2 pointer-events-none" />

                  {/* Điểm sao Hoshiboshi */}
                  {isStar && !cell && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5A2B] absolute z-10 pointer-events-none" />
                  )}

                  {/* Quân cờ Đen */}
                  {cell === 'b' && (
                    <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#2D3748] to-[#1A202C] border-2 border-black shadow-md z-20 flex items-center justify-center relative">
                      {isLast && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                    </div>
                  )}

                  {/* Quân cờ Trắng */}
                  {cell === 'w' && (
                    <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#FFFFFF] to-[#EDF2F7] border-2 border-slate-300 shadow-md z-20 flex items-center justify-center relative">
                      {isLast && <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* BANNER THẮNG THUA */}
      {winner && (
        <div className="mt-1 p-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 rounded-2xl text-center shadow-xs animate-in zoom-in-95 shrink-0">
          <span className="font-fredoka font-black text-xs text-amber-950">
            {winner === myRole
              ? '🎉 BẠN ĐÃ CHIẾN THẮNG VÁN CỜ VÂY XUẤT SẮC! (+120 Xu)'
              : '😢 ĐỐI THỦ ĐÃ CHIẾN THẮNG VÁN CỜ!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default FolkGo;
