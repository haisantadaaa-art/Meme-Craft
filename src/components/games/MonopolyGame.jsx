import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/soundEffects';
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
  { id: 12, name: 'Sân Bay', icon: '✈️', type: 'airport', color: '#3B82F6', desc: 'Bay tới ô kế tiếp' },

  // Cột Trái (r: 3 -> 1, c: 0)
  { id: 13, name: 'Lê Lợi', icon: '🏛️', type: 'property', cost: 350, rent: 150, color: '#6366F1' },
  { id: 14, name: 'Thuế Phố', icon: '💸', type: 'tax', cost: 60, color: '#EF4444', desc: 'Nộp phạt 60k' },
  { id: 15, name: 'Landmark', icon: '🏰', type: 'property', cost: 400, rent: 180, color: '#6366F1' },
];

// Bản đồ tọa độ 16 ô trên lưới 5x5
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

export const CHANCE_CARDS = [
  { text: 'Trúng Xổ Số Kiến Thiết! Nhận ngay 150k!', money: 150 },
  { text: 'Thưởng Doanh Thu Tiệm Ẩm Thực! +100k!', money: 100 },
  { text: 'Sửa chữa đường sá, đóng góp quỹ xanh -50k!', money: -50 },
  { text: 'Sinh nhật bạn bè tặng quà mừng +80k!', money: 80 },
  { text: 'Vi phạm tốc độ xe giao hàng, bị phạt -40k!', money: -40 },
];

export function MonopolyGame({ onRewardWon, onExit, playerName = 'Chủ Tiệm' }) {
  // Người chơi & Bot
  const [players, setPlayers] = useState([
    { id: 0, name: playerName, avatar: '🍊', money: 1000, pos: 0, isBot: false, inJail: false, color: 'text-amber-600' },
    { id: 1, name: 'Bot Shiba', avatar: '🐕', money: 1000, pos: 0, isBot: true, inJail: false, color: 'text-orange-600' },
  ]);

  const [turnIdx, setTurnIdx] = useState(0); // 0: Bạn, 1: Bot
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [properties, setProperties] = useState({}); // { tileId: { ownerId: 0, level: 1 } }
  const [gameLog, setGameLog] = useState('Chào mừng đến với Cờ Tỷ Phú Mini! Bấm lắc xúc xắc nào! 🎲');
  const [activeModal, setActiveModal] = useState(null); // { type: 'buy', tile: {...} }
  const [winner, setWinner] = useState(null);

  const currentPlayer = players[turnIdx];

  // ==========================================
  // HÀNH ĐỘNG: LẮC XÚC XẮC
  // ==========================================
  const rollDice = () => {
    if (isRolling || winner) return;

    sound.playBallBounce();
    setIsRolling(true);

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalDice);
        setIsRolling(false);
        sound.playTing();
        movePlayer(turnIdx, finalDice);
      }
    }, 70);
  };

  // Di chuyển quân cờ từng bước
  const movePlayer = (pIdx, steps) => {
    const player = players[pIdx];

    if (player.inJail) {
      // Thoát tù
      setGameLog(`${player.name} đã ra tù và sẵn sàng tiếp tục! 🚔`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === pIdx ? { ...p, inJail: false } : p))
      );
      endTurn();
      return;
    }

    const oldPos = player.pos;
    const newPos = (oldPos + steps) % 16;
    const passedStart = oldPos + steps >= 16;

    let updatedMoney = player.money;
    if (passedStart) {
      updatedMoney += 200;
      sound.playCoin();
      setGameLog(`${player.name} đi qua Ô Xuất Phát! Nhận thưởng +200k! 🚩`);
    }

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === pIdx ? { ...p, pos: newPos, money: updatedMoney } : p
      )
    );

    // Kích hoạt ô dừng chân
    setTimeout(() => {
      handleTileLand(pIdx, newPos);
    }, 400);
  };

  // Xử lý khi rơi vào từng ô
  const handleTileLand = (pIdx, tileId) => {
    const tile = MONOPOLY_TILES[tileId];
    const player = players[pIdx];

    if (tile.type === 'property') {
      const prop = properties[tileId];

      if (!prop) {
        // Đất trống chưa ai mua
        if (player.isBot) {
          // Bot tự động mua nếu đủ tiền
          if (player.money >= tile.cost) {
            buyProperty(pIdx, tileId);
          } else {
            setGameLog(`${player.name} không đủ tiền mua ${tile.name}!`);
            endTurn();
          }
        } else {
          // Người chơi -> Hiện popup mua nhanh 1 chạm
          setActiveModal({ type: 'buy', tile });
        }
      } else if (prop.ownerId === pIdx) {
        // Đất của mình -> Cho phép nâng cấp nhà (Level 1 -> 2 -> 3 -> Khách sạn)
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
          setGameLog(`${tile.name} đã đạt cấp Khách Sạn tối thượng! 🏰`);
          endTurn();
        }
      } else {
        // Đất của đối thủ -> Trả tiền thuê
        const owner = players[prop.ownerId];
        const rentMultiplier = prop.level === 4 ? 2.5 : prop.level === 3 ? 1.8 : prop.level === 2 ? 1.4 : 1;
        const rentFee = Math.round(tile.rent * rentMultiplier);

        sound.playBomb();
        setGameLog(
          `${player.name} dẫm vào đất của ${owner.name}! Trả phí thuê ${rentFee}k! 💸`
        );

        setPlayers((prev) =>
          prev.map((p, idx) => {
            if (idx === pIdx) return { ...p, money: Math.max(0, p.money - rentFee) };
            if (idx === prop.ownerId) return { ...p, money: p.money + rentFee };
            return p;
          })
        );

        // Kiểm tra phá sản
        if (player.money - rentFee <= 0) {
          setWinner(owner);
          sound.playWin();
          confetti({ particleCount: 80, spread: 80 });
          return;
        }

        endTurn();
      }
    } else if (tile.type === 'chance') {
      // Rút thẻ khí vận
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      sound.playTing();
      setGameLog(`🎁 KHÍ VẬN: ${card.text}`);

      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === pIdx ? { ...p, money: Math.max(0, p.money + card.money) } : p
        )
      );
      endTurn();
    } else if (tile.type === 'jail') {
      sound.playBomb();
      setGameLog(`${player.name} bị phạt kẹt xe/tạm giữ! Nghỉ 1 lượt! 🚔`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === pIdx ? { ...p, inJail: true } : p))
      );
      endTurn();
    } else if (tile.type === 'tax') {
      sound.playBomb();
      setGameLog(`${player.name} nộp thuế thành phố -${tile.cost}k! 💸`);
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === pIdx ? { ...p, money: Math.max(0, p.money - tile.cost) } : p
        )
      );
      endTurn();
    } else if (tile.type === 'airport') {
      sound.playWin();
      setGameLog(`${player.name} bay thẳng tới Bến Thành du lịch! ✈️`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === pIdx ? { ...p, pos: 6 } : p))
      );
      endTurn();
    } else {
      endTurn();
    }
  };

  // Mua đất
  const buyProperty = (pIdx, tileId) => {
    const tile = MONOPOLY_TILES[tileId];
    sound.playCoin();

    setProperties((prev) => ({
      ...prev,
      [tileId]: { ownerId: pIdx, level: 1 },
    }));

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === pIdx ? { ...p, money: p.money - tile.cost } : p
      )
    );

    setGameLog(`${players[pIdx].name} đã mua ${tile.name} với giá ${tile.cost}k! 🏠`);
    setActiveModal(null);
    endTurn();
  };

  // Nâng cấp nhà
  const upgradeProperty = (pIdx, tileId) => {
    const tile = MONOPOLY_TILES[tileId];
    const upgradeCost = Math.round(tile.cost * 0.5);
    sound.playWin();

    setProperties((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        level: Math.min(4, prev[tileId].level + 1),
      },
    }));

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === pIdx ? { ...p, money: p.money - upgradeCost } : p
      )
    );

    setGameLog(`${players[pIdx].name} đã nâng cấp ${tile.name} lên cấp cao hơn! 🏢`);
    setActiveModal(null);
    endTurn();
  };

  // Kết thúc lượt và chuyển cho người kế tiếp
  const endTurn = () => {
    setTimeout(() => {
      const nextTurn = (turnIdx + 1) % players.length;
      setTurnIdx(nextTurn);

      // Nếu tới lượt Bot: Bot tự động lắc xúc xắc sau 700ms
      if (players[nextTurn].isBot && !winner) {
        setTimeout(() => {
          rollDice();
        }, 700);
      }
    }, 400);
  };

  const handleResetGame = () => {
    sound.playClick();
    setPlayers([
      { id: 0, name: playerName, avatar: '🍊', money: 1000, pos: 0, isBot: false, inJail: false, color: 'text-amber-600' },
      { id: 1, name: 'Bot Shiba', avatar: '🐕', money: 1000, pos: 0, isBot: true, inJail: false, color: 'text-orange-600' },
    ]);
    setTurnIdx(0);
    setDiceValue(1);
    setProperties({});
    setWinner(null);
    setGameLog('Ván mới bắt đầu! Lắc xúc xắc để giành quyền mua đất! 🎲');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. Header: Trạng thái 2 người chơi */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2">
        {/* Người chơi 1: Bạn */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl transition ${turnIdx === 0 ? 'bg-amber-100/80 border border-amber-300' : ''}`}>
          <span className="text-xl">🍊</span>
          <div className="leading-tight">
            <span className="font-fredoka font-black text-xs text-amber-950 block truncate max-w-[75px]">
              {players[0].name}
            </span>
            <span className="text-[10px] font-fredoka font-bold text-amber-800">
              {players[0].money}k 🪙
            </span>
          </div>
        </div>

        {/* Nút Reset & Tiêu đề */}
        <div className="text-center">
          <span className="font-fredoka font-black text-xs text-amber-950 block">CỜ TỶ PHÚ MINI</span>
          <span className="text-[9px] font-bold text-emerald-700">Mobile Loop 16 Ô</span>
        </div>

        {/* Người chơi 2: Bot */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl transition ${turnIdx === 1 ? 'bg-orange-100/80 border border-orange-300' : ''}`}>
          <div className="leading-tight text-right">
            <span className="font-fredoka font-black text-xs text-orange-950 block truncate max-w-[75px]">
              {players[1].name}
            </span>
            <span className="text-[10px] font-fredoka font-bold text-orange-800">
              {players[1].money}k 🪙
            </span>
          </div>
          <span className="text-xl">🐕</span>
        </div>
      </div>

      {/* 2. Bàn Cờ Vòng Lặp 16 Ô (5x5 Perimeter Grid) */}
      <div className="flex-1 flex items-center justify-center p-1 relative my-auto">
        <div className="w-full max-w-[360px] aspect-square bg-[#FFF9EE] rounded-3xl p-1.5 shadow-lg border-2 border-amber-300 grid grid-cols-5 grid-rows-5 gap-1 relative">
          {/* 16 Ô Viền Bàn Cờ */}
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
                {/* Chủ sở hữu đất (Cờ hiệu) */}
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

                {/* Giá tiền hoặc loại ô */}
                <span className="text-[8px] font-bold text-slate-500 leading-none">
                  {tile.cost ? `${tile.cost}k` : tile.type === 'start' ? '+200k' : 'Biến cố'}
                </span>

                {/* Linh vật của người chơi đứng trên ô */}
                <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none z-20">
                  {hasPlayer0 && <span className="text-base drop-shadow-sm animate-bounce">🍊</span>}
                  {hasPlayer1 && <span className="text-base drop-shadow-sm animate-bounce">🐕</span>}
                </div>
              </div>
            );
          })}

          {/* VÙNG TRUNG TÂM (3x3 Ô GIỮA): LẮC XÚC XẮC & THÔNG BÁO */}
          <div className="col-start-2 col-span-3 row-start-2 row-span-3 bg-gradient-to-tr from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-300 p-2 flex flex-col items-center justify-between text-center relative shadow-inner">
            {/* Lời thoại diễn biến ván cờ */}
            <div className="w-full bg-white/90 px-2 py-1 rounded-xl border border-amber-200 text-[10px] font-fredoka font-bold text-amber-950 line-clamp-2 min-h-[32px] flex items-center justify-center">
              {gameLog}
            </div>

            {/* XÚC XẮC 3D VUI NHỘN */}
            <div className="flex flex-col items-center my-1">
              <div
                className={`w-14 h-14 rounded-2xl bg-white border-2 border-amber-400 shadow-md flex items-center justify-center text-3xl font-black text-amber-950 transition-transform ${
                  isRolling ? 'rotate-180 scale-110' : ''
                }`}
              >
                {diceValue === 1
                  ? '⚀'
                  : diceValue === 2
                  ? '⚁'
                  : diceValue === 3
                  ? '⚂'
                  : diceValue === 4
                  ? '⚃'
                  : diceValue === 5
                  ? '⚄'
                  : '⚅'}
              </div>
              <span className="text-[10px] font-fredoka font-bold text-amber-800 mt-0.5">
                {isRolling ? 'Đang lắc xúc xắc...' : `Số nút: ${diceValue}`}
              </span>
            </div>

            {/* Nút Lắc Xúc Xắc */}
            <button
              onClick={rollDice}
              disabled={isRolling || turnIdx !== 0 || Boolean(winner)}
              className={`w-full py-2 px-3 rounded-xl font-fredoka font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 ${
                turnIdx === 0 && !isRolling && !winner
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black border border-amber-500 animate-pulse'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>{turnIdx === 0 ? 'Lắc Xúc Xắc! 🎲' : 'Chờ Bot đánh... 🤖'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Footer Điều Khiển & Thoát */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between">
        <span className="text-[11px] font-fredoka font-bold text-amber-900 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Mục tiêu: Đạt nhiều đất và làm đối thủ phá sản!
        </span>
        <button
          onClick={handleResetGame}
          className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-black text-xs border border-amber-300 transition active:scale-90"
        >
          Ván Mới 🔄
        </button>
      </div>

      {/* MODAL MUA ĐẤT NHANH 1 CHẠM */}
      {activeModal && activeModal.type === 'buy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl text-center animate-in zoom-in-95">
            <span className="text-3xl">{activeModal.tile.icon}</span>
            <h3 className="font-fredoka font-black text-base text-amber-950 mt-1">
              MUA {activeModal.tile.name.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Giá bán: <strong className="text-amber-700">{activeModal.tile.cost}k 🪙</strong>
              <br />
              Tiền thuê thu của đối thủ: {activeModal.tile.rent}k/lượt
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

      {/* MODAL NÂNG CẤP NHÀ */}
      {activeModal && activeModal.type === 'upgrade' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl text-center animate-in zoom-in-95">
            <span className="text-3xl">🏢</span>
            <h3 className="font-fredoka font-black text-base text-amber-950 mt-1">
              NÂNG CẤP {activeModal.tile.name.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Chi phí nâng cấp: <strong className="text-amber-700">{Math.round(activeModal.tile.cost * 0.5)}k 🪙</strong>
              <br />
              Tăng tiền thuê thu của đối thủ thêm 40%!
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

      {/* MODAL CHIẾN THẮNG */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[340px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 text-center shadow-2xl animate-in zoom-in-95">
            <span className="text-4xl">🏆</span>
            <h2 className="font-fredoka font-black text-lg text-amber-950 mt-2">
              {winner.id === 0 ? '🎉 BẠN LÀ VUA ĐỊA ỐC!' : '😢 BOT ĐÃ CHIẾN THẮNG!'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {winner.id === 0
                ? 'Xuất sắc thâu tóm toàn bộ bất động sản! Nhận ngay +150 Xu & 1 Túi Quà Trợ Chiến!'
                : 'Đối thủ đã làm bạn phá sản! Hãy phục thù ở ván tiếp theo nào!'}
            </p>
            <button
              onClick={handleResetGame}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs border border-amber-500 shadow-sm"
            >
              Chơi Lại Ván Mới 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonopolyGame;
