import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
import { Trophy, Dices, RotateCcw, Home, Sparkles, Building2, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// 16 Ô VÒNG LẶP MOBILE CHUẨN (5x5 PERIMETER)
// ==========================================
export const MONOPOLY_TILES = [
  // Hàng Trên (r: 0, c: 0 -> 4)
  { id: 0, name: 'Xuất Phát', icon: '🚩', type: 'start', color: '#10B981', desc: 'Nhận 200k khi qua' },
  { id: 1, name: 'Phố Cổ', icon: '🏮', type: 'property', cost: 120, rent: 40, color: '#F59E0B' },
  { id: 2, name: 'Khí Vận', icon: '🎁', type: 'chance', color: '#8B5CF6', desc: 'Rút thẻ may mắn' },
  { id: 3, name: 'Hồ Gươm', icon: '🌳', type: 'property', cost: 160, rent: 60, color: '#F59E0B' },
  { id: 4, name: 'Bến Tàu', icon: '🚆', type: 'property', cost: 200, rent: 80, color: '#3B82F6' },

  // Cột Phải (r: 1 -> 3, c: 4)
  { id: 5, name: 'Kẹt Tiền', icon: '🚔', type: 'jail', color: '#EF4444', desc: 'Nghỉ 1 lượt hoặc -50k' },
  { id: 6, name: 'Bến Thành', icon: '🏙️', type: 'property', cost: 240, rent: 90, color: '#EC4899' },
  { id: 7, name: 'Cơ Hội', icon: '🌟', type: 'chance', color: '#8B5CF6', desc: 'Biến cố ngẫu nhiên' },

  // Hàng Dưới (r: 4, c: 4 -> 0)
  { id: 8, name: 'Đồng Khởi', icon: '💎', type: 'property', cost: 280, rent: 110, color: '#EC4899' },
  { id: 9, name: 'Nghỉ Dưỡng', icon: '🏖️', type: 'rest', color: '#06B6D4', desc: 'Nghỉ ngơi an toàn' },
  { id: 10, name: 'Nguyễn Huệ', icon: '🌸', type: 'property', cost: 320, rent: 130, color: '#10B981' },
  { id: 11, name: 'Khí Vận', icon: '❓', type: 'chance', color: '#8B5CF6', desc: 'Rút thẻ may mắn' },
  { id: 12, name: 'Sân Bay', icon: '✈️', type: 'airport', color: '#3B82F6', desc: 'Bay tới ô Bến Thành' },

  // Cột Trái (r: 3 -> 1, c: 0)
  { id: 13, name: 'Lê Lợi', icon: '🏛️', type: 'property', cost: 350, rent: 150, color: '#6366F1' },
  { id: 14, name: 'Thuế Phố', icon: '💸', type: 'tax', cost: 60, color: '#EF4444', desc: 'Nộp phạt 60k' },
  { id: 15, name: 'Landmark', icon: '🏰', type: 'property', cost: 400, rent: 180, color: '#6366F1' },
];

export const TILE_POSITIONS = {
  0: { r: 0, c: 0 },
  1: { r: 0, c: 1 },
  2: { r: 0, c: 2 },
  3: { r: 0, c: 3 },
  4: { r: 0, c: 4 },
  5: { r: 1, c: 4 },
  6: { r: 2, c: 4 },
  7: { r: 3, c: 4 },
  8: { r: 4, c: 4 },
  9: { r: 4, c: 3 },
  10: { r: 4, c: 2 },
  11: { r: 4, c: 1 },
  12: { r: 4, c: 0 },
  13: { r: 3, c: 0 },
  14: { r: 2, c: 0 },
  15: { r: 1, c: 0 },
};

// THẺ KHÍ VẬN & BIẾN CỐ HÀI HƯỚC THEO ĐÚNG YÊU CẦU
export const FUNNY_CHANCE_CARDS = [
  { text: '🍌 Đạp trúng vỏ chuối trượt vào viện dưỡng lão dưỡng thương 1 lượt (-50k)!', money: -50 },
  { text: '🧋 Bị người yêu giận vì quên mua trà sữa full topping (-100k làm hòa)!', money: -100 },
  { text: '👮 Bắt được kẻ trộm két tiệm trà sữa, được công an phường thưởng nóng (+200k)!', money: 200 },
  { text: '📉 Đầu tư nhầm coin rác tụt dốc không phanh (-150k)!', money: -150 },
  { text: '✨ Được fan donate ly trà sữa dát vàng (+300k)!', money: 300 },
];

export function MonopolyGame({ onRewardWon, onExit, playerName = 'Chủ Tiệm' }) {
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [myRole, setMyRole] = useState('p1'); // 'p1' (Bạn 🍊) | 'p2' (Khách/Bot 🐕)
  const [connectedGuest, setConnectedGuest] = useState(null);

  const [players, setPlayers] = useState([
    { id: 0, name: playerName, avatar: '🍊', money: 1000, pos: 0, isBot: false, inJail: false },
    { id: 1, name: 'Bot Shiba', avatar: '🐕', money: 1000, pos: 0, isBot: true, inJail: false },
  ]);

  const [turnIdx, setTurnIdx] = useState(0); // 0: Player 1, 1: Player 2/Bot
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [properties, setProperties] = useState({}); // { [tileId]: { ownerId: 0, level: 1 } }
  const [gameLog, setGameLog] = useState('Lắc xúc xắc để bắt đầu hành trình trở thành Vua Địa Ốc! 🎲');
  const [activeModal, setActiveModal] = useState(null);
  const [winner, setWinner] = useState(null);

  const sessionRef = useRef(null);

  const currentPlayer = players[turnIdx];
  const isMyTurn = isOnlineMode ? (myRole === 'p1' ? turnIdx === 0 : turnIdx === 1) : turnIdx === 0;

  // LẮC XÚC XẮC 3D VỚI HIỆU ỨNG XOAY TRÒN 1S
  const rollDice = () => {
    if (isRolling || isStepping || winner) return;

    sound.playBallBounce();
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalDice);
        setIsRolling(false);
        sound.playTing();

        // BẮT ĐẦU NHẢY TỪNG BƯỚC MỘT (STEP-BY-STEP ANIMATION)
        stepByStepMovement(turnIdx, finalDice);
      }
    }, 90);
  };

  // NHẢY TỪNG BƯỚC MỘT VỚI ÂM THANH TƯNG TƯNG
  const stepByStepMovement = (pIdx, totalSteps) => {
    setIsStepping(true);
    let remaining = totalSteps;
    let currentP = players[pIdx].pos;

    const stepInterval = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(stepInterval);
        setIsStepping(false);

        // Kích hoạt ô hạ cánh
        handleTileLand(pIdx, currentP);
        return;
      }

      currentP = (currentP + 1) % 16;
      remaining--;
      sound.playPop();

      // Kiểm tra đi qua ô xuất phát
      let addMoney = 0;
      if (currentP === 0) {
        addMoney = 200;
        sound.playCoin();
        setGameLog(`${players[pIdx].name} vừa qua Ô Xuất Phát! Nhận ngay +200k! 🚩`);
      }

      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === pIdx
            ? { ...p, pos: currentP, money: p.money + addMoney }
            : p
        )
      );
    }, 240); // 240ms mỗi bước nhảy rõ nét, nảy tưng tưng
  };

  // Xử lý khi rơi vào từng ô
  const handleTileLand = (pIdx, tileId) => {
    const tile = MONOPOLY_TILES[tileId];
    const player = players[pIdx];

    if (tile.type === 'property') {
      const prop = properties[tileId];

      if (!prop) {
        // Đất trống
        if (player.isBot) {
          if (player.money >= tile.cost) {
            buyProperty(pIdx, tileId);
          } else {
            setGameLog(`${player.name} không đủ tiền mua ${tile.name}!`);
            endTurn();
          }
        } else {
          setActiveModal({ type: 'buy', tile });
        }
      } else if (prop.ownerId === pIdx) {
        // Đất của mình -> Cho phép nâng cấp nhà
        if (prop.level < 4) {
          if (player.isBot) {
            const upgradeCost = Math.round(tile.cost * 0.5);
            if (player.money >= upgradeCost) {
              upgradeProperty(pIdx, tileId);
            } else {
              endTurn();
            }
          } else {
            setActiveModal({ type: 'upgrade', tile, prop });
          }
        } else {
          setGameLog(`${tile.name} đã là Khách Sạn 5 Sao tối thượng! 🏰`);
          endTurn();
        }
      } else {
        // Đất của đối thủ -> Nộp tiền thuê
        const owner = players[prop.ownerId];
        const rentMultiplier = prop.level === 4 ? 2.5 : prop.level === 3 ? 1.8 : prop.level === 2 ? 1.4 : 1;
        const rentFee = Math.round(tile.rent * rentMultiplier);

        sound.playBomb();
        setGameLog(`${player.name} dẫm vào đất của ${owner.name}! Nộp tiền thuê ${rentFee}k! 💸`);

        setPlayers((prev) =>
          prev.map((p, idx) => {
            if (idx === pIdx) return { ...p, money: Math.max(0, p.money - rentFee) };
            if (idx === prop.ownerId) return { ...p, money: p.money + rentFee };
            return p;
          })
        );

        if (player.money - rentFee <= 0) {
          setWinner(owner);
          sound.playWin();
          confetti({ particleCount: 80, spread: 80 });
          return;
        }

        endTurn();
      }
    } else if (tile.type === 'chance') {
      // Rút thẻ biến cố hài hước
      const card = FUNNY_CHANCE_CARDS[Math.floor(Math.random() * FUNNY_CHANCE_CARDS.length)];
      sound.playTing();
      setGameLog(`🎁 BIẾN CỐ HÀI HƯỚC: ${card.text}`);

      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === pIdx ? { ...p, money: Math.max(0, p.money + card.money) } : p
        )
      );
      endTurn();
    } else if (tile.type === 'jail') {
      sound.playBomb();
      setGameLog(`${player.name} bị kẹt xe/tạm giữ! Nghỉ 1 lượt! 🚔`);
      endTurn();
    } else if (tile.type === 'tax') {
      sound.playBomb();
      setGameLog(`${player.name} nộp thuế thành phố -${tile.cost}k! 💸`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === pIdx ? { ...p, money: Math.max(0, p.money - tile.cost) } : p))
      );
      endTurn();
    } else if (tile.type === 'airport') {
      sound.playWin();
      setGameLog(`${player.name} bay thẳng tới Bến Thành sắm sửa! ✈️`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === pIdx ? { ...p, pos: 6 } : p))
      );
      endTurn();
    } else {
      endTurn();
    }
  };

  const buyProperty = (pIdx, tileId) => {
    const tile = MONOPOLY_TILES[tileId];
    sound.playCoin();

    const nextProperties = {
      ...properties,
      [tileId]: { ownerId: pIdx, level: 1 },
    };

    const nextPlayers = players.map((p, idx) =>
      idx === pIdx ? { ...p, money: p.money - tile.cost } : p
    );

    setProperties(nextProperties);
    setPlayers(nextPlayers);
    setGameLog(`${players[pIdx].name} đã mua ${tile.name} giá ${tile.cost}k! 🏠`);
    setActiveModal(null);
    endTurn();

    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        properties: nextProperties,
        players: nextPlayers,
      });
    }
  };

  const upgradeProperty = (pIdx, tileId) => {
    const tile = MONOPOLY_TILES[tileId];
    const upgradeCost = Math.round(tile.cost * 0.5);
    sound.playWin();

    const nextProperties = {
      ...properties,
      [tileId]: {
        ...properties[tileId],
        level: Math.min(4, properties[tileId].level + 1),
      },
    };

    const nextPlayers = players.map((p, idx) =>
      idx === pIdx ? { ...p, money: p.money - upgradeCost } : p
    );

    setProperties(nextProperties);
    setPlayers(nextPlayers);
    setGameLog(`${players[pIdx].name} nâng cấp ${tile.name} lên cấp cao hơn! 🏢`);
    setActiveModal(null);
    endTurn();

    if (isOnlineMode && sessionRef.current) {
      sessionRef.current.syncGameState({
        properties: nextProperties,
        players: nextPlayers,
      });
    }
  };

  const endTurn = () => {
    setTimeout(() => {
      const nextTurn = (turnIdx + 1) % players.length;
      setTurnIdx(nextTurn);

      if (players[nextTurn].isBot && !winner) {
        setTimeout(() => rollDice(), 800);
      }
    }, 400);
  };

  // P2P Online Room
  const handleCreateOnlineRoom = async () => {
    const session = new GameRoomSession(
      'monopoly',
      { uid: 'host_' + Date.now(), displayName: playerName, avatar: '🍊' },
      (gameState) => {
        if (gameState.players) setPlayers(gameState.players);
        if (gameState.properties) setProperties(gameState.properties);
        if (typeof gameState.turnIdx === 'number') setTurnIdx(gameState.turnIdx);
        if (typeof gameState.diceValue === 'number') setDiceValue(gameState.diceValue);
        if (gameState.gameLog) setGameLog(gameState.gameLog);
        if (gameState.winner) setWinner(gameState.winner);
      },
      (guest) => {
        setConnectedGuest(guest);
        setPlayers((prev) => [
          prev[0],
          { id: 1, name: guest.name || 'Khách', avatar: '🐕', money: 1000, pos: 0, isBot: false, inJail: false },
        ]);
      },
      () => setConnectedGuest(null)
    );

    const code = await session.createRoom({
      players,
      properties: {},
      turnIdx: 0,
      diceValue: 1,
      gameLog: 'Phòng online sẵn sàng! Host đi trước!',
    });

    sessionRef.current = session;
    setRoomCode(code);
    setMyRole('p1');
  };

  const handleJoinOnlineRoom = async (codeToJoin) => {
    const session = new GameRoomSession(
      'monopoly',
      { uid: 'guest_' + Date.now(), displayName: playerName, avatar: '🐕' },
      (gameState) => {
        if (gameState.players) setPlayers(gameState.players);
        if (gameState.properties) setProperties(gameState.properties);
        if (typeof gameState.turnIdx === 'number') setTurnIdx(gameState.turnIdx);
        if (typeof gameState.diceValue === 'number') setDiceValue(gameState.diceValue);
        if (gameState.gameLog) setGameLog(gameState.gameLog);
        if (gameState.winner) setWinner(gameState.winner);
      },
      (guest) => setConnectedGuest(guest),
      () => setConnectedGuest(null)
    );

    await session.joinRoom(codeToJoin);
    sessionRef.current = session;
    setRoomCode(codeToJoin);
    setMyRole('p2');
    setConnectedGuest({ name: 'Chủ Phòng' });
  };

  const handleLeaveOnlineRoom = () => {
    if (sessionRef.current) {
      sessionRef.current.leaveRoom();
      sessionRef.current = null;
    }
    setRoomCode('');
    setConnectedGuest(null);
    setMyRole('p1');
    setPlayers([
      { id: 0, name: playerName, avatar: '🍊', money: 1000, pos: 0, isBot: false, inJail: false },
      { id: 1, name: 'Bot Shiba', avatar: '🐕', money: 1000, pos: 0, isBot: true, inJail: false },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CHỌN CHẾ ĐỘ: BOT vs ONLINE 2 NGƯỜI */}
      <OnlineRoomToolbar
        isOnlineMode={isOnlineMode}
        onToggleMode={(online) => {
          setIsOnlineMode(online);
          if (!online) handleLeaveOnlineRoom();
        }}
        roomCode={roomCode}
        isHost={myRole === 'p1'}
        myRole={myRole}
        connectedPlayer={connectedGuest}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onLeaveRoom={handleLeaveOnlineRoom}
      />

      {/* 2. HEADER TỶ PHÚ: THÔNG TIN TIỀN TỆ & TÀI SẢN */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        <div className={`flex items-center gap-1.5 p-1 rounded-xl transition ${turnIdx === 0 ? 'bg-amber-100/90 border border-amber-300' : 'bg-slate-50'}`}>
          <span className="text-xl">🍊</span>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-amber-950 block truncate max-w-[80px]">
              {players[0].name}
            </span>
            <span className="text-[10px] font-fredoka font-bold text-amber-800">
              {players[0].money}k 🪙
            </span>
          </div>
        </div>

        <div className="text-center">
          <span className="font-fredoka font-black text-xs text-amber-950 block">CỜ TỶ PHÚ</span>
          <span className="text-[9px] font-bold text-emerald-700">Mobile Loop 16 Ô</span>
        </div>

        <div className={`flex items-center gap-1.5 p-1 rounded-xl transition ${turnIdx === 1 ? 'bg-orange-100/90 border border-orange-300' : 'bg-slate-50'}`}>
          <div className="leading-tight text-right">
            <span className="font-fredoka font-black text-xs text-orange-950 block truncate max-w-[80px]">
              {players[1].name}
            </span>
            <span className="text-[10px] font-fredoka font-bold text-orange-800">
              {players[1].money}k 🪙
            </span>
          </div>
          <span className="text-xl">🐕</span>
        </div>
      </div>

      {/* 3. BÀN CỜ VÒNG LẶP 16 Ô VỚI NHẢY TỪNG BƯỚC */}
      <div className="flex-1 flex items-center justify-center p-0.5 relative my-auto">
        <div className="w-full max-w-[360px] aspect-square bg-[#FFF9EE] rounded-3xl p-1.5 shadow-lg border-2 border-amber-300 grid grid-cols-5 grid-rows-5 gap-1 relative">
          {MONOPOLY_TILES.map((tile) => {
            const pos = TILE_POSITIONS[tile.id];
            const prop = properties[tile.id];
            const hasPlayer0 = players[0].pos === tile.id;
            const hasPlayer1 = players[1].pos === tile.id;

            return (
              <div
                key={tile.id}
                style={{
                  gridColumnStart: pos.c + 1,
                  gridRowStart: pos.r + 1,
                }}
                className={`rounded-xl border flex flex-col items-center justify-between p-1 transition-all relative ${
                  tile.type === 'start'
                    ? 'bg-emerald-50 border-emerald-400'
                    : tile.type === 'jail'
                    ? 'bg-rose-50 border-rose-400'
                    : tile.type === 'chance'
                    ? 'bg-purple-50 border-purple-400'
                    : 'bg-white border-amber-200'
                }`}
              >
                {prop && (
                  <div
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black shadow-xs ${
                      prop.ownerId === 0 ? 'bg-amber-400 text-black' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {prop.level === 4 ? '🏰' : prop.level === 3 ? '🏢' : prop.level === 2 ? '🏡' : '🏠'}
                  </div>
                )}

                <span className="text-xs sm:text-sm leading-none">{tile.icon}</span>
                <span className="font-fredoka font-black text-[9px] text-slate-800 truncate w-full text-center leading-none">
                  {tile.name}
                </span>

                <span className="text-[8px] font-bold text-slate-500 leading-none">
                  {tile.cost ? `${tile.cost}k` : tile.type === 'start' ? '+200k' : 'Biến cố'}
                </span>

                {/* Linh vật nhảy từng bước */}
                <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none z-20">
                  {hasPlayer0 && <span className="text-base drop-shadow-sm animate-bounce">🍊</span>}
                  {hasPlayer1 && <span className="text-base drop-shadow-sm animate-bounce">🐕</span>}
                </div>
              </div>
            );
          })}

          {/* VÙNG TRUNG TÂM (LẮC XÚC XẮC XOAY TRÒN & NHẢY BƯỚC) */}
          <div className="col-start-2 col-span-3 row-start-2 row-span-3 bg-gradient-to-tr from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-300 p-2 flex flex-col items-center justify-between text-center relative shadow-inner">
            <div className="w-full bg-white/90 px-2 py-1 rounded-xl border border-amber-200 text-[10px] font-fredoka font-bold text-amber-950 line-clamp-2 min-h-[32px] flex items-center justify-center">
              {gameLog}
            </div>

            <div className="flex flex-col items-center my-0.5">
              <div
                className={`w-13 h-13 rounded-2xl bg-white border-2 border-amber-400 shadow-md flex items-center justify-center text-3xl font-black text-amber-950 transition-transform ${
                  isRolling ? 'rotate-180 scale-110' : ''
                }`}
              >
                {diceValue === 1 ? '⚀' : diceValue === 2 ? '⚁' : diceValue === 3 ? '⚂' : diceValue === 4 ? '⚃' : diceValue === 5 ? '⚄' : '⚅'}
              </div>
              <span className="text-[10px] font-fredoka font-bold text-amber-800 mt-0.5">
                {isRolling ? 'Đang xoay xúc xắc...' : isStepping ? 'Đang nhảy từng bước! 🐾' : `Số nút: ${diceValue}`}
              </span>
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || isStepping || !isMyTurn || Boolean(winner)}
              className={`w-full py-1.5 px-3 rounded-xl font-fredoka font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 ${
                isMyTurn && !isRolling && !isStepping && !winner
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black border border-amber-500 animate-pulse'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>{isMyTurn ? 'Lắc Xúc Xắc! 🎲' : 'Chờ đối thủ đánh... ⏳'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* POPUP MUA ĐẤT RÕ RÀNG TRƯỚC KHI TRỪ TIỀN */}
      {activeModal && activeModal.type === 'buy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl text-center animate-in zoom-in-95">
            <span className="text-3xl">{activeModal.tile.icon}</span>
            <h3 className="font-fredoka font-black text-base text-amber-950 mt-1">
              BẠN CÓ MUỐN MUA {activeModal.tile.name.toUpperCase()}?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Giá bán: <strong className="text-amber-700">{activeModal.tile.cost}k 🪙</strong>
              <br />
              Thu tiền thuê đối thủ: {activeModal.tile.rent}k/lượt
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveModal(null);
                  endTurn();
                }}
                className="py-2 rounded-xl bg-slate-100 text-slate-700 font-fredoka font-bold text-xs border border-slate-300"
              >
                Bỏ Qua
              </button>
              <button
                onClick={() => buyProperty(0, activeModal.tile.id)}
                disabled={players[0].money < activeModal.tile.cost}
                className="py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-sm"
              >
                Mua Ngay! 🏠
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NÂNG CẤP NHÀ RÕ RÀNG */}
      {activeModal && activeModal.type === 'upgrade' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl text-center animate-in zoom-in-95">
            <span className="text-3xl">🏢</span>
            <h3 className="font-fredoka font-black text-base text-amber-950 mt-1">
              NÂNG CẤP {activeModal.tile.name.toUpperCase()}?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Chi phí nâng cấp: <strong className="text-amber-700">{Math.round(activeModal.tile.cost * 0.5)}k 🪙</strong>
              <br />
              Tăng tiền thuê thêm 40%!
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveModal(null);
                  endTurn();
                }}
                className="py-2 rounded-xl bg-slate-100 text-slate-700 font-fredoka font-bold text-xs border border-slate-300"
              >
                Để Sau
              </button>
              <button
                onClick={() => upgradeProperty(0, activeModal.tile.id)}
                className="py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-emerald-950 font-fredoka font-black text-xs border border-emerald-500 shadow-sm"
              >
                Nâng Cấp! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonopolyGame;
