import React, { useState, useEffect } from 'react';
import { db, ref, set, get, update, onValue } from '../services/firebase';
import { sound } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Users,
  Swords,
  Bot,
  Copy,
  Check,
  LogIn,
  Trophy,
  ArrowLeft,
  Gamepad2,
  HelpCircle,
  Bomb,
  Dices,
} from 'lucide-react';
import { ChatBox } from './ChatBox';

const GAMES = [
  {
    id: 'CARO',
    name: 'Cờ Caro 10x10',
    desc: 'Đấu trí 5 ô thẳng hàng trên bàn cờ gỗ',
    icon: '⚔️',
    color: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'WORD_CHAIN',
    name: 'Nối Từ Sinh Tử 20s',
    desc: 'Đếm lùi 20s, bom nổ khi hết giờ hoặc sai luật',
    icon: '💣',
    color: 'from-rose-600 to-red-700',
  },
  {
    id: 'CATCH_WORD',
    name: 'Đuổi Hình Bắt Chữ',
    desc: 'Đoán từ ghép tiếng Việt qua 2 hình ảnh',
    icon: '🧩',
    color: 'from-yellow-600 to-amber-700',
  },
  {
    id: 'MILLIONAIRE',
    name: 'Ai Là Triệu Phú',
    desc: '15s trắc nghiệm 4 đáp án A, B, C, D vui nhộn',
    icon: '🏆',
    color: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'BAU_CUA',
    name: 'Bầu Cua Tôm Cá',
    desc: 'Đặt cược tiền vàng nông trại vào 6 linh vật',
    icon: '🎲',
    color: 'from-emerald-600 to-teal-700',
  },
];

export function ArcadeLobby({ onStartGame, onExit }) {
  const { user, setIsFriendsModalOpen } = useAuth();
  const [selectedGame, setSelectedGame] = useState('CARO');
  const [createdRoomPin, setCreatedRoomPin] = useState(null);
  const [joinPin, setJoinPin] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Lắng nghe khi có người vào phòng (Host chờ Guest)
  useEffect(() => {
    if (!createdRoomPin) return;

    const roomRef = ref(db, `rooms/${createdRoomPin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.guest && data.status === 'playing') {
          sound.playWin();
          onStartGame(data.gameType || selectedGame, createdRoomPin, false, 'X');
        }
      }
    });

    return () => unsubscribe();
  }, [createdRoomPin, onStartGame, selectedGame]);

  // Tạo phòng mới 4 số trên Firebase
  const handleCreateRoom = async () => {
    if (isCreating) return;
    setIsCreating(true);
    sound.playClick();
    setErrorMsg('');

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const empty10x10 = Array(10).fill(null).map(() => Array(10).fill(''));

    const newRoom = {
      roomCode: pin,
      gameType: selectedGame,
      status: 'waiting',
      host: {
        id: user?.uid || 'host_1',
        name: user?.displayName || 'Chủ Tiệm Boba',
        avatar: user?.avatar || '👩‍🍳',
        symbol: 'X',
      },
      guest: null,
      createdAt: Date.now(),
      board: selectedGame === 'CARO' ? empty10x10 : null,
      currentTurn: 'X',
      winner: null,
      wordHistory: ['Trà Sữa'],
      puzzleIndex: 0,
      scores: { X: 0, O: 0 },
    };

    try {
      await set(ref(db, `rooms/${pin}`), newRoom);
      setCreatedRoomPin(pin);
    } catch (e) {
      console.error('Lỗi tạo phòng:', e);
      setErrorMsg('Lỗi kết nối Firebase. Vui lòng thử lại!');
    } finally {
      setIsCreating(false);
    }
  };

  // Vào phòng bằng mã PIN
  const handleJoinRoom = async () => {
    if (!joinPin.trim()) return;
    sound.playClick();
    setErrorMsg('');
    const pin = joinPin.trim();

    try {
      const roomRef = ref(db, `rooms/${pin}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setErrorMsg('Phòng không tồn tại! Vui lòng kiểm tra lại mã PIN.');
        return;
      }

      const data = snapshot.val();
      if (data.guest && data.status !== 'waiting') {
        setErrorMsg('Phòng này đã đủ người chơi!');
        return;
      }

      const guestPlayer = {
        id: user?.uid || 'guest_1',
        name: user?.displayName || 'Khách Ghé Thăm',
        avatar: user?.avatar || '👩‍🍳',
        symbol: 'O',
      };

      const empty10x10 = Array(10).fill(null).map(() => Array(10).fill(''));

      await update(roomRef, {
        guest: guestPlayer,
        status: 'playing',
        board: data.board || empty10x10,
        currentTurn: data.currentTurn || 'X',
        winner: null,
      });

      sound.playWin();
      onStartGame(data.gameType || 'CARO', pin, false, 'O');
    } catch (e) {
      console.error('Lỗi vào phòng:', e);
      setErrorMsg('Không thể kết nối vào phòng!');
    }
  };

  const handleCopyPin = () => {
    if (!createdRoomPin) return;
    navigator.clipboard.writeText(createdRoomPin);
    setIsCopied(true);
    sound.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 select-none pb-12 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-[#1b2b18] p-3 rounded-2xl border-2 border-amber-600/60 shadow-lg">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-amber-300 font-bold text-xs border border-amber-400/30 active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Nông Trại</span>
        </button>

        <div className="text-center">
          <h2 className="font-fredoka text-lg sm:text-xl font-black text-amber-300">
            KHU HỘI CHỢ MINI-GAME 🎪
          </h2>
          <span className="text-[11px] text-emerald-200">Đấu trí 2 người chơi thời gian thực</span>
        </div>

        <button
          onClick={() => setIsFriendsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-400/40 active:scale-95 transition"
        >
          <Users className="w-4 h-4" />
          <span>Mời Bạn Bè</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/80 border-2 border-rose-500 text-rose-200 text-xs rounded-2xl text-center">
          {errorMsg}
        </div>
      )}

      {/* DANH SÁCH 5 TRÒ CHƠI HỘI CHỢ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-5">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => {
              sound.playClick();
              setSelectedGame(game.id);
            }}
            className={`p-3 rounded-2xl border-3 text-left transition-all flex flex-col justify-between ${
              selectedGame === game.id
                ? 'bg-gradient-to-b from-amber-500 to-orange-500 border-black text-white shadow-[3px_3px_0px_#000] scale-105'
                : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60'
            }`}
          >
            <div>
              <span className="text-3xl block mb-1">{game.icon}</span>
              <h4 className="font-fredoka font-black text-xs sm:text-sm leading-tight mb-1">
                {game.name}
              </h4>
            </div>
            <p className="text-[10px] opacity-80 line-clamp-2 leading-tight">{game.desc}</p>
          </button>
        ))}
      </div>

      {/* KHU VỰC TẠO PHÒNG / VÀO PHÒNG / CHƠI VỚI BOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TẠO PHÒNG HOẶC HIỂN THỊ PIN */}
        <div className="bg-[#241c14] border-4 border-amber-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <h3 className="font-fredoka font-black text-base text-amber-300">TẠO PHÒNG MỚI (CHỦ PHÒNG)</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Sinh mã PIN 4 số ngẫu nhiên qua Firebase. Gửi mã này cho bạn bè để cùng vào so tài!
            </p>
          </div>

          {!createdRoomPin ? (
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-fredoka font-black text-sm rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition"
            >
              {isCreating ? 'Đang Tạo Phòng...' : `Tạo Phòng ${GAMES.find((g) => g.id === selectedGame)?.name} 🚀`}
            </button>
          ) : (
            <div className="p-4 bg-black/60 rounded-2xl border-2 border-yellow-400 text-center animate-in zoom-in-95">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-1">
                MÃ PIN PHÒNG CỦA BẠN:
              </span>
              <div className="text-4xl font-mono font-black text-yellow-300 tracking-widest my-1">
                {createdRoomPin}
              </div>
              <p className="text-xs text-emerald-300 animate-pulse my-2">
                ⏳ Đang đợi bạn bè nhập mã PIN vào phòng...
              </p>

              <button
                onClick={handleCopyPin}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 border border-yellow-400 text-yellow-300 text-xs font-bold transition active:scale-95"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Đã Sao Chép PIN' : 'Sao Chép Mã PIN'}</span>
              </button>
            </div>
          )}
        </div>

        {/* VÀO PHÒNG BẰNG PIN HOẶC CHƠI VỚI BOT */}
        <div className="bg-[#241c14] border-4 border-amber-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="w-5 h-5 text-cyan-400" />
              <h3 className="font-fredoka font-black text-base text-cyan-300">VÀO PHÒNG BẠN BÈ</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Nhập mã PIN 4 chữ số do bạn bè gửi để vào phòng thách đấu ngay lập tức:
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Nhập 4 số PIN..."
                maxLength={4}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-black/70 border-2 border-cyan-500/50 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-cyan-400 placeholder-slate-500"
              />
              <button
                onClick={handleJoinRoom}
                disabled={joinPin.length < 4}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 text-white font-fredoka font-black text-xs rounded-2xl border-2 border-black shadow active:scale-95 transition"
              >
                Vào Phòng
              </button>
            </div>
          </div>

          {/* CHƠI VỚI BOT AI */}
          <div className="pt-3 border-t border-white/10">
            <button
              onClick={() => {
                sound.playClick();
                onStartGame(selectedGame, 'BOT_SOLO', true, 'X');
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-fredoka font-black text-xs flex items-center justify-center gap-2 border-2 border-black shadow active:scale-95 transition"
            >
              <Bot className="w-4 h-4" />
              <span>Chơi Luyện Tập Với Máy AI (Solo) 🤖</span>
            </button>
          </div>
        </div>
      </div>

      {/* KHUNG CHAT PHÒNG CHỜ */}
      {createdRoomPin && <ChatBox roomPin={createdRoomPin} defaultExpanded={true} />}
    </div>
  );
}

export default ArcadeLobby;
