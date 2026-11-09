import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession, generateInviteLink } from '../../services/peerNetwork';
import {
  X,
  Zap,
  Plus,
  Key,
  Bot,
  Copy,
  Check,
  Share2,
  Users,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function MatchmakingModal({ game, user, onStartGame, onClose }) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'create' | 'join' | 'bot' | 'quick_searching'
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchCountdown, setMatchCountdown] = useState(null);
  const [connectedGuest, setConnectedGuest] = useState(null);

  const sessionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.leaveRoom();
        sessionRef.current = null;
      }
    };
  }, []);

  // 1. TÌM TRẬN NHANH (QUICK MATCH)
  const handleQuickMatch = async () => {
    sound.playClick();
    setActiveTab('quick_searching');
    setIsSearching(true);

    const session = new GameRoomSession(
      game.id.toLowerCase(),
      user,
      null,
      (guest) => {
        setConnectedGuest(guest);
        sound.playTing();
      },
      () => setConnectedGuest(null)
    );
    sessionRef.current = session;

    const res = await session.quickMatch({}, (count) => {
      setMatchCountdown(count);
      if (count === 0) {
        onStartGame({
          gameId: game.id,
          roomCode: res.roomCode,
          myRole: res.isHost ? 'p1' : 'p2',
          isBotMode: false,
          botDifficulty: 'medium',
          session,
        });
      }
    });

    setRoomCode(res.roomCode);
    setIsSearching(false);

    if (res.matched) {
      // Nếu khớp ngay với host đang chờ
      setConnectedGuest({ name: 'Đối Thủ Online' });
    }
  };

  // 2. TẠO PHÒNG MỚI (CREATE ROOM)
  const handleCreateRoom = async () => {
    sound.playClick();
    setActiveTab('create');

    const session = new GameRoomSession(
      game.id.toLowerCase(),
      user,
      null,
      (guest) => {
        setConnectedGuest(guest);
        sound.playWin();
        // Bắt đầu đếm ngược 2s vào trận
        setTimeout(() => {
          onStartGame({
            gameId: game.id,
            roomCode: session.roomCode,
            myRole: 'p1',
            isBotMode: false,
            botDifficulty: 'medium',
            session,
          });
        }, 1200);
      },
      () => setConnectedGuest(null)
    );
    sessionRef.current = session;

    const code = await session.createRoom({});
    setRoomCode(code);
  };

  // 3. VÀO PHÒNG BẰNG MÃ (JOIN ROOM)
  const handleJoinByCode = async (e) => {
    e?.preventDefault();
    if (!inputCode.trim()) return;

    sound.playClick();
    const cleanCode = inputCode.trim().toUpperCase();

    const session = new GameRoomSession(
      game.id.toLowerCase(),
      user,
      null,
      null,
      null
    );
    sessionRef.current = session;

    const ok = await session.joinRoom(cleanCode);
    if (ok) {
      sound.playTing();
      onStartGame({
        gameId: game.id,
        roomCode: cleanCode,
        myRole: 'p2',
        isBotMode: false,
        botDifficulty: 'medium',
        session,
      });
    } else {
      alert('Không tìm thấy phòng hoặc phòng đã đủ người!');
    }
  };

  // 4. ĐẤU VỚI BOT AI
  const handleStartBot = (diff) => {
    sound.playClick();
    onStartGame({
      gameId: game.id,
      roomCode: '',
      myRole: 'p1',
      isBotMode: true,
      botDifficulty: diff,
      session: null,
    });
  };

  // Sao chép mã phòng
  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Mời bạn 1 chạm
  const handleInviteFriend = async () => {
    if (!roomCode) return;
    const link = generateInviteLink(game.id, roomCode);
    sound.playClick();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Đấu ${game.name} cùng mình!`,
          text: `Vào phòng #${roomCode} tranh tài ngay nào!`,
          url: link,
        });
        return;
      } catch (e) {}
    }

    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in select-none font-jakarta">
      <div className="w-full max-w-[390px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative flex flex-col">
        {/* Nút Đóng */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition active:scale-90"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header Game */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-xs shrink-0">
            {game.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-fredoka font-black text-sm text-amber-950 truncate">
              {game.name}
            </h3>
            <span className="text-[10px] text-slate-500 line-clamp-1">
              {game.desc}
            </span>
          </div>
        </div>

        {/* CẢNH BÁO CÔNG BẰNG: TẮT BUFF PET KHI ĐẤU ONLINE */}
        <div className="mb-3 p-2 rounded-xl bg-amber-50 border border-amber-300 text-[10px] font-fredoka font-bold text-amber-900 flex items-center gap-1.5 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Luật thi đấu công bằng: Thú cưng tự động ngắt buff trợ chiến.</span>
        </div>

        {/* NỘI DUNG THEO TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-2">
            {/* Nút 1: Tìm Trận Nhanh */}
            <button
              onClick={handleQuickMatch}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-fredoka font-black text-xs shadow-md active:scale-98 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-yellow-200 text-yellow-200" />
                <span>⚡ Tìm Trận Nhanh (Ghép Tức Thì)</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">3s Vào</span>
            </button>

            {/* Nút 2: Tạo Phòng Mới */}
            <button
              onClick={handleCreateRoom}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-fredoka font-black text-xs shadow-md active:scale-98 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>➕ Tạo Phòng Mới (Mã 6 Số)</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Làm Host</span>
            </button>

            {/* Nút 3: Vào Bằng Mã */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('join');
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-fredoka font-black text-xs shadow-md active:scale-98 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>🔑 Vào Bằng Mã Phòng</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Nhập Mã</span>
            </button>

            {/* Nút 4: Đấu Với Bot AI */}
            <div className="pt-2 border-t border-amber-200">
              <span className="text-[10px] font-fredoka font-black text-slate-600 block mb-1.5">
                🤖 Hoặc luyện tập cùng Bot AI:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleStartBot('easy')}
                  className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-fredoka font-bold text-xs active:scale-95 transition"
                >
                  Dễ 🌱
                </button>
                <button
                  onClick={() => handleStartBot('medium')}
                  className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-fredoka font-bold text-xs active:scale-95 transition"
                >
                  Vừa ⚔️
                </button>
                <button
                  onClick={() => handleStartBot('hard')}
                  className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 font-fredoka font-bold text-xs active:scale-95 transition"
                >
                  Khó 👑
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB TÌM TRẬN NHANH ĐANG DÒ PHÒNG */}
        {activeTab === 'quick_searching' && (
          <div className="py-6 flex flex-col items-center justify-center text-center animate-in zoom-in">
            {matchCountdown !== null && matchCountdown > 0 ? (
              <div className="space-y-2">
                <span className="text-4xl animate-bounce">🎉</span>
                <h4 className="font-fredoka font-black text-lg text-emerald-700">
                  ĐÃ TÌM THẤY ĐỐI THỦ!
                </h4>
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-fredoka font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                  {matchCountdown}
                </div>
                <span className="text-xs text-slate-500 font-bold block">
                  Đang tải bàn cờ thi đấu...
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                <h4 className="font-fredoka font-black text-sm text-amber-950">
                  Đang quét phòng trống trên máy chủ...
                </h4>
                <p className="text-[10px] text-slate-500 max-w-[240px]">
                  Nếu không có phòng sẵn, hệ thống sẽ tự động tạo phòng mở và đợi đối thủ tiếp theo.
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fredoka font-bold text-xs transition"
                >
                  Hủy Quét
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB TẠO PHÒNG MỚI */}
        {activeTab === 'create' && (
          <div className="py-4 space-y-3 animate-in zoom-in">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-fredoka font-bold text-blue-900 block mb-1">
                MÃ PHÒNG CỦA BẠN:
              </span>
              <span className="font-mono font-black text-2xl text-blue-700 tracking-wider block">
                {roomCode || 'Đang tạo...'}
              </span>

              {/* Nút sao chép & mời bạn */}
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-xl bg-white border border-blue-300 text-blue-800 text-xs font-fredoka font-bold hover:bg-blue-100 transition flex items-center gap-1 active:scale-95 shadow-2xs"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Đã Chép Mã' : 'Chép Mã'}</span>
                </button>

                <button
                  onClick={handleInviteFriend}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-fredoka font-black transition flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-white" /> : <Share2 className="w-3 h-3" />}
                  <span>{copiedLink ? 'Đã Chép Link!' : 'Mời Bạn 1 Chạm'}</span>
                </button>
              </div>
            </div>

            {/* Trạng thái chờ đối thủ */}
            <div className="flex items-center justify-center gap-2 text-xs font-fredoka font-bold text-slate-600 py-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {connectedGuest ? `🟢 ${connectedGuest.name} đã vào phòng! Đang vào ván...` : '⏳ Đang chờ bạn bè kết nối vào...'}
              </span>
            </div>

            <button
              onClick={() => setActiveTab('menu')}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fredoka font-bold text-xs transition"
            >
              Hủy Phòng
            </button>
          </div>
        )}

        {/* TAB VÀO BẰNG MÃ */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinByCode} className="py-4 space-y-3 animate-in zoom-in">
            <div>
              <label className="text-[11px] font-fredoka font-black text-slate-700 block mb-1">
                Nhập mã phòng bạn bè chia sẻ:
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="VD: TT-9921"
                maxLength={8}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border-2 border-amber-300 focus:border-amber-500 font-mono font-bold text-sm text-center uppercase tracking-wider text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fredoka font-bold text-xs"
              >
                Quay Lại
              </button>

              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-fredoka font-black text-xs shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                Vào Phòng Ngay 🚀
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default MatchmakingModal;
