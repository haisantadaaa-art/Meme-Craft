import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, ref, update, onValue, get, set, onDisconnect } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../utils/soundEffects';
import { Trophy, RotateCcw, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FloatingChatFAB } from '../FloatingChatFAB';
import { DisconnectModal } from '../DisconnectModal';

// Lấy ký tự chữ Hán chuẩn cho từng quân cờ
export function getPieceLabel(type, color) {
  if (color === 'r') {
    switch (type) {
      case 'K': return '帥';
      case 'A': return '仕';
      case 'B': return '相';
      case 'R': return '俥';
      case 'N': return '傌';
      case 'C': return '炮';
      case 'P': return '兵';
      default: return '';
    }
  } else {
    switch (type) {
      case 'K': return '將';
      case 'A': return '士';
      case 'B': return '象';
      case 'R': return '車';
      case 'N': return '馬';
      case 'C': return '砲';
      case 'P': return '卒';
      default: return '';
    }
  }
}

// Bàn cờ chuẩn 10 hàng x 9 cột
export const INITIAL_XIANGQI_BOARD = [
  // Hàng 0 (Bên Đen)
  [
    { type: 'R', color: 'b', label: '車' },
    { type: 'N', color: 'b', label: '馬' },
    { type: 'B', color: 'b', label: '象' },
    { type: 'A', color: 'b', label: '士' },
    { type: 'K', color: 'b', label: '將' },
    { type: 'A', color: 'b', label: '士' },
    { type: 'B', color: 'b', label: '象' },
    { type: 'N', color: 'b', label: '馬' },
    { type: 'R', color: 'b', label: '車' },
  ],
  // Hàng 1
  Array(9).fill(null),
  // Hàng 2 (Pháo đen)
  [
    null,
    { type: 'C', color: 'b', label: '砲' },
    null,
    null,
    null,
    null,
    null,
    { type: 'C', color: 'b', label: '砲' },
    null,
  ],
  // Hàng 3 (Tốt đen)
  [
    { type: 'P', color: 'b', label: '卒' },
    null,
    { type: 'P', color: 'b', label: '卒' },
    null,
    { type: 'P', color: 'b', label: '卒' },
    null,
    { type: 'P', color: 'b', label: '卒' },
    null,
    { type: 'P', color: 'b', label: '卒' },
  ],
  // Hàng 4 (Bờ sông phía Đen)
  Array(9).fill(null),
  // Hàng 5 (Bờ sông phía Đỏ)
  Array(9).fill(null),
  // Hàng 6 (Tốt đỏ)
  [
    { type: 'P', color: 'r', label: '兵' },
    null,
    { type: 'P', color: 'r', label: '兵' },
    null,
    { type: 'P', color: 'r', label: '兵' },
    null,
    { type: 'P', color: 'r', label: '兵' },
    null,
    { type: 'P', color: 'r', label: '兵' },
  ],
  // Hàng 7 (Pháo đỏ)
  [
    null,
    { type: 'C', color: 'r', label: '炮' },
    null,
    null,
    null,
    null,
    null,
    { type: 'C', color: 'r', label: '炮' },
    null,
  ],
  // Hàng 8
  Array(9).fill(null),
  // Hàng 9 (Bên Đỏ)
  [
    { type: 'R', color: 'r', label: '俥' },
    { type: 'N', color: 'r', label: '傌' },
    { type: 'B', color: 'r', label: '相' },
    { type: 'A', color: 'r', label: '仕' },
    { type: 'K', color: 'r', label: '帥' },
    { type: 'A', color: 'r', label: '仕' },
    { type: 'B', color: 'r', label: '相' },
    { type: 'N', color: 'r', label: '傌' },
    { type: 'R', color: 'r', label: '俥' },
  ],
];

export const createInitialBoard = () =>
  INITIAL_XIANGQI_BOARD.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

/**
 * Hàm chuẩn hóa bàn cờ từ Firebase.
 * Vì Firebase RTDB biến các mảng chứa null thành object dạng {0: ..., 2: ...},
 * hàm này đảm bảo luôn trả về mảng 2D kích thước đúng 10 hàng x 9 cột.
 */
export function normalizeXiangqiBoard(raw) {
  if (!raw) return createInitialBoard();
  try {
    const board = [];
    for (let r = 0; r < 10; r++) {
      const row = [];
      const sourceRow = raw[r] || (typeof raw === 'object' && raw !== null ? raw[String(r)] : null);
      for (let c = 0; c < 9; c++) {
        const cell = sourceRow
          ? sourceRow[c] || (typeof sourceRow === 'object' && sourceRow !== null ? sourceRow[String(c)] : null)
          : null;
        if (cell && typeof cell === 'object' && cell.type && cell.color) {
          row.push({
            type: cell.type,
            color: cell.color,
            label: cell.label || getPieceLabel(cell.type, cell.color),
          });
        } else {
          row.push(null);
        }
      }
      board.push(row);
    }
    return board;
  } catch (err) {
    console.error('Lỗi chuẩn hóa bàn cờ Cờ Tướng:', err);
    return createInitialBoard();
  }
}

/**
 * Hàm làm sạch payload đệ quy (chống lỗi Firebase crash do giá trị undefined)
 */
export function sanitizePayload(payload) {
  return JSON.parse(
    JSON.stringify(payload, (key, value) => (value === undefined ? null : value))
  );
}

// Kiểm tra nước đi hợp lệ cơ bản của Cờ Tướng
export function isValidMove(board, fromR, fromC, toR, toC, turnColor) {
  if (!board || toR < 0 || toR >= 10 || toC < 0 || toC >= 9) return false;
  const piece = board[fromR]?.[fromC];
  if (!piece || piece.color !== turnColor) return false;
  const target = board[toR]?.[toC];
  if (target && target.color === turnColor) return false; // Không ăn quân mình

  const dR = toR - fromR;
  const dC = toC - fromC;
  const absR = Math.abs(dR);
  const absC = Math.abs(dC);

  switch (piece.type) {
    case 'K': // Tướng: chỉ đi 1 ô trong Cung (hàng 7-9 bên đỏ hoặc 0-2 bên đen, cột 3-5)
      const inPalace =
        piece.color === 'r'
          ? toR >= 7 && toR <= 9 && toC >= 3 && toC <= 5
          : toR >= 0 && toR <= 2 && toC >= 3 && toC <= 5;
      return inPalace && ((absR === 1 && absC === 0) || (absR === 0 && absC === 1));

    case 'A': // Sĩ: đi chéo 1 ô trong Cung
      const inPalaceA =
        piece.color === 'r'
          ? toR >= 7 && toR <= 9 && toC >= 3 && toC <= 5
          : toR >= 0 && toR <= 2 && toC >= 3 && toC <= 5;
      return inPalaceA && absR === 1 && absC === 1;

    case 'B': // Tượng: đi chéo 2 ô, không qua sông, không bị cản mắt tượng
      const noCrossRiver = piece.color === 'r' ? toR >= 5 : toR <= 4;
      if (!noCrossRiver || absR !== 2 || absC !== 2) return false;
      const eyeR = fromR + dR / 2;
      const eyeC = fromC + dC / 2;
      return !board[eyeR]?.[eyeC]; // Mắt tượng trống

    case 'R': // Xe: đi thẳng ngang/dọc, không có quân cản
      if (dR !== 0 && dC !== 0) return false;
      return countObstacles(board, fromR, fromC, toR, toC) === 0;

    case 'C': // Pháo: đi như xe, nhưng ăn quân phải nhảy qua đúng 1 quân cản
      if (dR !== 0 && dC !== 0) return false;
      const obs = countObstacles(board, fromR, fromC, toR, toC);
      if (!target) return obs === 0;
      return obs === 1;

    case 'N': // Mã: đi chữ nhật (1 bước thẳng + 1 bước chéo), không bị cản chân mã
      if (!((absR === 2 && absC === 1) || (absR === 1 && absC === 2))) return false;
      const legR = absR === 2 ? fromR + dR / 2 : fromR;
      const legC = absC === 2 ? fromC + dC / 2 : fromC;
      return !board[legR]?.[legC]; // Chân mã không bị cản

    case 'P': // Tốt/Binh: chưa qua sông đi thẳng 1 bước; qua sông đi thẳng hoặc ngang 1 bước
      const crossedRiver = piece.color === 'r' ? fromR <= 4 : fromR >= 5;
      const forwardDir = piece.color === 'r' ? -1 : 1;
      if (!crossedRiver) {
        return dR === forwardDir && dC === 0;
      }
      return (dR === forwardDir && dC === 0) || (dR === 0 && absC === 1);

    default:
      return false;
  }
}

function countObstacles(board, r1, c1, r2, c2) {
  let count = 0;
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC + 1; c < maxC; c++) {
      if (board[r1]?.[c]) count++;
    }
  } else {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r]?.[c1]) count++;
    }
  }
  return count;
}

// Component vẽ dấu đánh dấu chữ thập góc tại các vị trí Pháo và Tốt
function XiangqiCrossMarker({ r, c }) {
  const cx = 20 + c * 40;
  const cy = 20 + r * 40;
  const d = 3.5;
  const s = 6;
  const hasLeft = c > 0;
  const hasRight = c < 8;

  return (
    <g stroke="#68340A" strokeWidth="1.2" fill="none">
      {hasLeft && (
        <>
          <path d={`M ${cx - d - s} ${cy - d} L ${cx - d} ${cy - d} L ${cx - d} ${cy - d - s}`} />
          <path d={`M ${cx - d - s} ${cy + d} L ${cx - d} ${cy + d} L ${cx - d} ${cy + d + s}`} />
        </>
      )}
      {hasRight && (
        <>
          <path d={`M ${cx + d + s} ${cy - d} L ${cx + d} ${cy - d} L ${cx + d} ${cy - d - s}`} />
          <path d={`M ${cx + d + s} ${cy + d} L ${cx + d} ${cy + d} L ${cx + d} ${cy + d + s}`} />
        </>
      )}
    </g>
  );
}

const MARKER_POSITIONS = [
  // Pháo Đen & Đỏ
  { r: 2, c: 1 }, { r: 2, c: 7 },
  { r: 7, c: 1 }, { r: 7, c: 7 },
  // Tốt Đen
  { r: 3, c: 0 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8 },
  // Tốt Đỏ
  { r: 6, c: 0 }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8 },
];

/**
 * Component cốt lõi logic Bàn Cờ Tướng
 */
function XiangqiGameCore({
  roomData,
  roomCode,
  myRole = 'r', // 'r' (Đỏ) hoặc 'b' (Đen)
  isBotMode = true,
  playerName = 'Chủ Tiệm',
  onRewardWon,
  onExit,
}) {
  const { user } = useAuth();
  const [board, setBoard] = useState(createInitialBoard);
  const [turn, setTurn] = useState('r'); // 'r' (Đỏ đi trước)
  const [selectedPos, setSelectedPos] = useState(null); // { r, c }
  const [winner, setWinner] = useState(null); // 'r' | 'b' | null
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  // Trạng thái ngắt kết nối đối thủ
  const [isLocalBotMode, setIsLocalBotMode] = useState(false);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [opponentName, setOpponentName] = useState('Đối thủ');
  const actualBotMode = isBotMode || isLocalBotMode;

  // Thiết lập onDisconnect khi vào phòng online
  useEffect(() => {
    if (isBotMode || !roomCode || !user?.uid) return;

    try {
      const myPlayerRef = ref(db, `rooms/${roomCode}/players/${user.uid}`);
      set(myPlayerRef, {
        online: true,
        name: user.displayName || playerName,
        avatar: user.avatar || '👩‍🍳',
        role: myRole,
        lastSeen: Date.now(),
      }).catch(() => {});

      const myOnlineRef = ref(db, `rooms/${roomCode}/players/${user.uid}/online`);
      onDisconnect(myOnlineRef).set(false);
    } catch (e) {
      console.error('Lỗi thiết lập onDisconnect:', e);
    }
  }, [roomCode, isBotMode, user?.uid, myRole, playerName]);

  // Lắng nghe trạng thái online của đối thủ
  useEffect(() => {
    if (isBotMode || isLocalBotMode || !roomCode || !user?.uid) return;

    const playersRef = ref(db, `rooms/${roomCode}/players`);
    const unsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const players = snapshot.val();
        if (players && typeof players === 'object') {
          const opponentEntry = Object.entries(players).find(([uid]) => uid !== user.uid);
          if (opponentEntry) {
            const [, oppData] = opponentEntry;
            if (oppData) {
              setOpponentName(oppData.name || 'Đối thủ');
              if (oppData.online === false) {
                setIsOpponentDisconnected(true);
              }
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode, isBotMode, isLocalBotMode, user?.uid]);

  const handleContinueWithBot = () => {
    sound.playClick();
    setIsLocalBotMode(true);
    setIsOpponentDisconnected(false);
  };

  const handleLeaveAndWin = async () => {
    try {
      if (roomCode) {
        await update(ref(db, `rooms/${roomCode}`), {
          status: 'finished',
          winner: myRole,
        });
      }
      if (onRewardWon) onRewardWon(350, 10);
      if (onExit) onExit();
    } catch (e) {
      if (onExit) onExit();
    }
  };

  // 1. Khởi tạo bàn cờ trên Firebase nếu là Host và chưa có dữ liệu
  useEffect(() => {
    if (!actualBotMode && roomCode && myRole === 'r') {
      const xiangqiRef = ref(db, `rooms/${roomCode}/xiangqi`);
      get(xiangqiRef)
        .then((snap) => {
          if (!snap.exists()) {
            const initBoard = createInitialBoard();
            const payload = sanitizePayload({
              board: initBoard,
              turn: 'r',
              winner: null,
              moveHistory: JSON.stringify([]),
              createdAt: Date.now(),
            });
            update(xiangqiRef, payload).catch((err) =>
              console.error('Lỗi khởi tạo bàn cờ Cờ Tướng online:', err)
            );
          }
        })
        .catch((e) => console.error('Lỗi đọc phòng Cờ Tướng:', e));
    }
  }, [actualBotMode, roomCode, myRole]);

  // 2. PHÒNG THỦ KHI NHẬN DỮ LIỆU TỪ LISTENER ONVALUE
  useEffect(() => {
    if (actualBotMode || !roomCode) return;

    const xiangqiRef = ref(db, `rooms/${roomCode}/xiangqi`);
    const unsubscribe = onValue(xiangqiRef, (snapshot) => {
      try {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        if (!data || typeof data !== 'object') return;

        // Kiểm tra an toàn trước khi gán bàn cờ
        if (data.board) {
          const cleanBoard = normalizeXiangqiBoard(data.board);
          if (cleanBoard && Array.isArray(cleanBoard) && cleanBoard.length === 10) {
            setBoard(cleanBoard);
          }
        }

        if (data.turn === 'r' || data.turn === 'b') {
          setTurn(data.turn);
        }

        if (data.winner !== undefined) {
          setWinner(data.winner);
        }

        // Bọc JSON.parse cho moveHistory một cách an toàn
        if (data.moveHistory) {
          try {
            const parsed =
              typeof data.moveHistory === 'string'
                ? JSON.parse(data.moveHistory)
                : data.moveHistory;
            if (Array.isArray(parsed)) {
              setMoveHistory(parsed);
            }
          } catch (e) {
            console.warn('Lỗi phân tích moveHistory:', e);
          }
        }

        if (data.lastMove && typeof data.lastMove === 'object') {
          setLastMove(data.lastMove);
        }
      } catch (err) {
        console.error('Lỗi khi tiếp nhận dữ liệu Firebase Cờ Tướng:', err);
      }
    });

    return () => unsubscribe();
  }, [roomCode, isBotMode]);

  // Đồng bộ fallback từ prop roomData nếu listener chưa kích hoạt
  useEffect(() => {
    if (!isBotMode && roomData?.xiangqi) {
      try {
        const xq = roomData.xiangqi;
        if (xq.board) {
          const clean = normalizeXiangqiBoard(xq.board);
          if (clean && Array.isArray(clean) && clean.length === 10) {
            setBoard(clean);
          }
        }
        if (xq.turn === 'r' || xq.turn === 'b') setTurn(xq.turn);
        if (xq.winner !== undefined) setWinner(xq.winner);
      } catch (e) {
        console.error('Lỗi đồng bộ roomData.xiangqi:', e);
      }
    }
  }, [roomData, isBotMode]);

  // Kiểm tra tướng có bị ăn không để phân định thắng thua
  const checkKingAlive = useCallback((currentBoard) => {
    try {
      let redKing = false;
      let blackKing = false;
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const p = currentBoard[r]?.[c];
          if (p?.type === 'K') {
            if (p.color === 'r') redKing = true;
            if (p.color === 'b') blackKing = true;
          }
        }
      }
      if (!redKing) return 'b';
      if (!blackKing) return 'r';
      return null;
    } catch (e) {
      console.error('Lỗi kiểm tra Tướng:', e);
      return null;
    }
  }, []);

  // 3. THỰC HIỆN DI CHUYỂN QUÂN VỚI BẢO VỆ TOÀN DIỆN & LÀM SẠCH PAYLOAD
  const makeMove = useCallback(
    (fromR, fromC, toR, toC) => {
      try {
        if (!board || !board[fromR] || !board[toR]) return;

        const newBoard = board.map((row) =>
          row ? row.map((cell) => (cell ? { ...cell } : null)) : Array(9).fill(null)
        );
        const movedPiece = newBoard[fromR]?.[fromC];
        if (!movedPiece) return;

        const targetPiece = newBoard[toR]?.[toC];

        newBoard[toR][toC] = movedPiece;
        newBoard[fromR][fromC] = null;

        sound.playCaroMove();

        const gameWinner = checkKingAlive(newBoard);
        const nextTurn = turn === 'r' ? 'b' : 'r';

        const moveRecord = {
          from: { r: fromR, c: fromC },
          to: { r: toR, c: toC },
          piece: movedPiece ? { ...movedPiece } : null,
          capturedPiece: targetPiece ? { ...targetPiece } : null,
          color: turn,
          timestamp: Date.now(),
        };

        const updatedHistory = [...moveHistory, moveRecord];

        setBoard(newBoard);
        setSelectedPos(null);
        setLastMove(moveRecord);
        setMoveHistory(updatedHistory);

        if (gameWinner) {
          setWinner(gameWinner);
          if (gameWinner === myRole) {
            sound.playWin();
            confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
            if (!rewardClaimed && onRewardWon) {
              onRewardWon(350, 10);
              setRewardClaimed(true);
            }
          } else {
            sound.playLose();
          }
        } else {
          setTurn(nextTurn);
        }

        // Đẩy lên Firebase với payload đã được làm sạch hoàn toàn
        if (!isBotMode && roomCode) {
          const sanitizedMove = {
            from: { r: fromR, c: fromC },
            to: { r: toR, c: toC },
            piece: movedPiece || null,
            capturedPiece: targetPiece || null,
            turn: nextTurn,
            moveHistory: JSON.stringify(updatedHistory),
            timestamp: Date.now(),
          };

          const rawPayload = {
            board: newBoard,
            turn: nextTurn,
            winner: gameWinner || null,
            lastMove: sanitizedMove,
            moveHistory: JSON.stringify(updatedHistory),
            updatedAt: Date.now(),
          };

          // Làm sạch đệ quy để loại bỏ hoàn toàn các key mang giá trị undefined
          const cleanData = sanitizePayload(rawPayload);

          update(ref(db, `rooms/${roomCode}/xiangqi`), cleanData).catch((e) =>
            console.error('Lỗi cập nhật Cờ Tướng Firebase:', e)
          );
        }
      } catch (err) {
        console.error('Lỗi khi thực hiện nước cờ (đã giữ an toàn giao diện):', err);
      }
    },
    [board, turn, checkKingAlive, myRole, isBotMode, roomCode, rewardClaimed, onRewardWon, moveHistory]
  );

  // Nước đi của Bot AI (Đen) khi chơi Solo
  useEffect(() => {
    if (isBotMode && turn === 'b' && !winner) {
      const timer = setTimeout(() => {
        try {
          const validMoves = [];
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
              const p = board[r]?.[c];
              if (p && p.color === 'b') {
                for (let tr = 0; tr < 10; tr++) {
                  for (let tc = 0; tc < 9; tc++) {
                    if (isValidMove(board, r, c, tr, tc, 'b')) {
                      const target = board[tr]?.[tc];
                      let weight = 1;
                      if (target?.type === 'K') weight = 1000;
                      else if (target?.type === 'R') weight = 90;
                      else if (target?.type === 'C') weight = 45;
                      else if (target?.type === 'N') weight = 40;
                      else if (target?.type === 'B') weight = 20;
                      else if (target?.type === 'A') weight = 20;
                      else if (target?.type === 'P') weight = 15;
                      validMoves.push({ fromR: r, fromC: c, toR: tr, toC: tc, weight });
                    }
                  }
                }
              }
            }
          }

          if (validMoves.length > 0) {
            validMoves.sort((a, b) => b.weight - a.weight);
            const topMoves = validMoves.filter((m) => m.weight === validMoves[0].weight);
            const chosen = topMoves[Math.floor(Math.random() * topMoves.length)];
            makeMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC);
          }
        } catch (e) {
          console.error('Lỗi tính toán nước đi Bot AI Cờ Tướng:', e);
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isBotMode, turn, winner, board, makeMove]);

  // Click vào ô bàn cờ (Bọc an toàn tuyệt đối)
  const handleCellClick = (r, c) => {
    try {
      if (winner) return;
      if (isBotMode && turn !== 'r') return;
      if (!isBotMode && turn !== myRole) return;

      const clickedPiece = board[r]?.[c];

      // Nếu đã chọn 1 quân cờ trước đó
      if (selectedPos) {
        if (selectedPos.r === r && selectedPos.c === c) {
          setSelectedPos(null); // Bỏ chọn
          return;
        }
        // Thử di chuyển đến ô mới
        if (isValidMove(board, selectedPos.r, selectedPos.c, r, c, turn)) {
          makeMove(selectedPos.r, selectedPos.c, r, c);
          return;
        }
      }

      // Chọn quân cờ của mình
      if (clickedPiece && clickedPiece.color === turn) {
        sound.playClick();
        setSelectedPos({ r, c });
      }
    } catch (err) {
      console.error('Lỗi khi nhấn ô cờ (đã được bắt an toàn):', err);
    }
  };

  const handleReset = () => {
    try {
      sound.playClick();
      const newBoard = createInitialBoard();
      setBoard(newBoard);
      setTurn('r');
      setSelectedPos(null);
      setWinner(null);
      setRewardClaimed(false);
      setMoveHistory([]);
      setLastMove(null);

      if (!isBotMode && roomCode) {
        const cleanPayload = sanitizePayload({
          board: newBoard,
          turn: 'r',
          winner: null,
          lastMove: null,
          moveHistory: JSON.stringify([]),
          updatedAt: Date.now(),
        });
        update(ref(db, `rooms/${roomCode}/xiangqi`), cleanPayload).catch(() => {});
      }
    } catch (err) {
      console.error('Lỗi làm mới ván cờ:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-2 select-none font-jakarta max-w-[440px] mx-auto w-full">
      {/* Header Thông Tin Trận Đấu chuẩn Light Pastel */}
      <div className="w-full bg-white border border-orange-100 rounded-3xl p-3 shadow-sm flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border border-amber-500 flex items-center justify-center text-xl shadow-sm">
            ♟️
          </div>
          <div>
            <div className="font-fredoka font-black text-xs text-amber-950 flex items-center gap-1.5">
              CỜ TƯỚNG TRỰC TUYẾN
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                HOT
              </span>
            </div>
            <div className="text-[10px] text-amber-800/80">
              {isBotMode
                ? 'Solo Bot AI Thông Minh'
                : `Phòng Online: #${roomCode} (${myRole === 'r' ? 'Bạn cầm Đỏ' : 'Bạn cầm Đen'})`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-2xl text-xs font-fredoka font-black flex items-center gap-1 border shadow-sm ${
              turn === 'r'
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            <span>{turn === 'r' ? '🔴 Đỏ Đi' : '⚫ Đen Đi'}</span>
          </div>

          <button
            onClick={handleReset}
            title="Ván Mới"
            className="p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thông Báo Thắng Thua */}
      {winner && (
        <div className="w-full mb-2.5 p-3 rounded-3xl bg-amber-300 border-2 border-amber-500 text-amber-950 font-fredoka font-black text-center text-xs shadow-md animate-bounce flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-amber-800" />
          <span>
            {winner === 'r'
              ? '🔴 BÊN ĐỎ CHIẾN THẮNG TUYỆT ĐỐI!'
              : '⚫ BÊN ĐEN CHIẾN THẮNG TUYỆT ĐỐI!'}
          </span>
        </div>
      )}

      {/* BÀN CỜ TƯỚNG GỖ CHUẨN 9 DỌC x 10 NGANG */}
      <div className="w-full relative aspect-[9/10] bg-[#F7E1B5] rounded-3xl p-1.5 border-4 border-[#7A3E0C] shadow-[0_12px_30px_rgba(122,62,12,0.25)] overflow-hidden">
        {/* SVG Vẽ Tất Cả Đường Kẻ Lưới, Sông Sở Hà - Hán Giới, Cung Tướng và Dấu Vạch */}
        <svg
          viewBox="0 0 360 400"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          {/* Nền gỗ với vân nhẹ */}
          <rect width="360" height="400" fill="#F7E1B5" />
          <rect
            x="8"
            y="8"
            width="344"
            height="384"
            rx="14"
            fill="none"
            stroke="#7A3E0C"
            strokeWidth="2.5"
          />
          <rect
            x="13"
            y="13"
            width="334"
            height="374"
            rx="10"
            fill="none"
            stroke="#9A5216"
            strokeWidth="1"
          />

          {/* 10 Đường Ngang */}
          {Array.from({ length: 10 }).map((_, r) => (
            <line
              key={`h-${r}`}
              x1="20"
              y1={20 + r * 40}
              x2="340"
              y2={20 + r * 40}
              stroke="#5A2805"
              strokeWidth="1.4"
            />
          ))}

          {/* 2 Đường Dọc Biên (Cột 0 và Cột 8 chạy suốt từ r=0 đến r=9) */}
          <line x1="20" y1="20" x2="20" y2="380" stroke="#5A2805" strokeWidth="1.4" />
          <line x1="340" y1="20" x2="340" y2="380" stroke="#5A2805" strokeWidth="1.4" />

          {/* 7 Đường Dọc Bên Trong (Cột 1 đến 7 đứt quãng tại Sông) */}
          {Array.from({ length: 7 }).map((_, idx) => {
            const c = idx + 1;
            const x = 20 + c * 40;
            return (
              <React.Fragment key={`v-${c}`}>
                {/* Nửa trên (Bên Đen: r=0 -> r=4) */}
                <line x1={x} y1="20" x2={x} y2="180" stroke="#5A2805" strokeWidth="1.4" />
                {/* Nửa dưới (Bên Đỏ: r=5 -> r=9) */}
                <line x1={x} y1="220" x2={x} y2="380" stroke="#5A2805" strokeWidth="1.4" />
              </React.Fragment>
            );
          })}

          {/* Cung Tướng Bên Đen (r=0 -> r=2, c=3 -> c=5) */}
          <line x1="140" y1="20" x2="220" y2="100" stroke="#5A2805" strokeWidth="1.4" />
          <line x1="220" y1="20" x2="140" y2="100" stroke="#5A2805" strokeWidth="1.4" />

          {/* Cung Tướng Bên Đỏ (r=7 -> r=9, c=3 -> c=5) */}
          <line x1="140" y1="300" x2="220" y2="380" stroke="#5A2805" strokeWidth="1.4" />
          <line x1="220" y1="300" x2="140" y2="380" stroke="#5A2805" strokeWidth="1.4" />

          {/* Sông Sở Hà - Hán Giới (Giữa r=4 và r=5: y=180 đến y=220) */}
          <text
            x="80"
            y="206"
            fill="#7A3E0C"
            fontSize="14"
            fontWeight="900"
            fontFamily="serif"
            letterSpacing="6"
            opacity="0.85"
          >
            楚 河
          </text>
          <text
            x="220"
            y="206"
            fill="#7A3E0C"
            fontSize="14"
            fontWeight="900"
            fontFamily="serif"
            letterSpacing="6"
            opacity="0.85"
          >
            漢 界
          </text>

          {/* Dấu Vạch Chữ Thập (Cross Markers) tại Pháo và Tốt */}
          {MARKER_POSITIONS.map((pos, i) => (
            <XiangqiCrossMarker key={`marker-${i}`} r={pos.r} c={pos.c} />
          ))}

          {/* Vạch đánh dấu nước đi vừa thực hiện (Last move highlight) */}
          {lastMove && (
            <g stroke="#EAB308" strokeWidth="2" strokeDasharray="3,3" fill="none">
              <circle cx={20 + lastMove.from.c * 40} cy={20 + lastMove.from.r * 40} r="16" />
              <circle cx={20 + lastMove.to.c * 40} cy={20 + lastMove.to.r * 40} r="16" />
            </g>
          )}
        </svg>

        {/* TẬP HỢP TẤT CẢ CÁC ĐIỂM GIAO ĐÚNG TIM LƯỚI */}
        <div className="absolute inset-0 w-full h-full">
          {board.map((row, r) =>
            row ? (
              row.map((cell, c) => {
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const canMoveTarget =
                  selectedPos && isValidMove(board, selectedPos.r, selectedPos.c, r, c, turn);

                // Tọa độ phần trăm tim giao điểm chuẩn xác 100%
                const leftPercent = ((20 + c * 40) / 360) * 100;
                const topPercent = ((20 + r * 40) / 400) * 100;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                      isSelected ? 'z-30' : canMoveTarget ? 'z-20' : 'z-10'
                    }`}
                  >
                    {/* Chấm tròn báo nước đi hợp lệ khi ô trống */}
                    {canMoveTarget && !cell && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse shadow-md" />
                    )}

                    {/* Quân Cờ Tròn Bằng Gỗ Khắc Nét Nổi 3D Sắc Xảo */}
                    {cell && (
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold font-serif text-sm sm:text-base select-none transition-all shadow-[0_3px_6px_rgba(0,0,0,0.3)] ${
                          cell.color === 'r'
                            ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FCEFDA] text-[#C5221F] border-[#D94E41]'
                            : 'bg-gradient-to-b from-[#3B2D26] to-[#201815] text-[#FDE68A] border-[#D4AF37]'
                        } ${
                          isSelected
                            ? 'ring-4 ring-amber-400 scale-110 shadow-lg'
                            : canMoveTarget
                            ? 'ring-3 ring-rose-500 animate-bounce'
                            : ''
                        }`}
                      >
                        {cell.label || getPieceLabel(cell.type, cell.color)}
                      </div>
                    )}
                  </button>
                );
              })
            ) : null
          )}
        </div>
      </div>

      {/* Thanh Biểu Cảm Quick Reaction Bar */}
      <QuickReactionToolbar
        roomCode={roomCode}
        myRole={myRole}
        isBotMode={isBotMode}
        className="mt-2"
      />

      {/* Hướng Dẫn & Mẹo chuẩn Pastel */}
      <div className="w-full mt-2 text-center text-[10px] text-amber-900 bg-white p-2 rounded-2xl border border-orange-100 shadow-xs">
        💡 Mẹo: Nhấn vào quân cờ của bạn để xem gợi ý nước đi. Ăn Tướng đối phương để nhận ngay +350 Xu! 🏆
      </div>
    </div>
  );
}

/**
 * 4. ERROR BOUNDARY PHÒNG THỦ TOÀN DIỆN
 * Ngăn chặn tuyệt đối White Screen of Death (màn hình trắng)
 */
export class XiangqiErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('XiangqiErrorBoundary bắt lỗi render:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border-2 border-amber-300 max-w-md mx-auto my-6 shadow-xl font-jakarta">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-sm">
            ♟️
          </div>
          <h3 className="font-fredoka text-base font-black text-amber-950 mb-1">
            ĐÃ BẢO VỆ BÀN CỜ TƯỚNG AN TOÀN
          </h3>
          <p className="text-xs text-slate-600 mb-4 max-w-xs leading-relaxed">
            Hệ thống đã tự động ngăn ngừa sự cố kết nối và bảo toàn phiên đấu trí của bạn.
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-fredoka font-black text-xs shadow-md active:scale-95 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tải Lại Bàn Cờ</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Component chính được bọc Error Boundary
 */
export function XiangqiGame(props) {
  return (
    <XiangqiErrorBoundary>
      <XiangqiGameCore {...props} />
    </XiangqiErrorBoundary>
  );
}

// Hỗ trợ cả tên gọi CoTuongGame
export const CoTuongGame = XiangqiGame;

export default XiangqiGame;
