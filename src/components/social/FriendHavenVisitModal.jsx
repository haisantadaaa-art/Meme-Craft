import React, { useState } from 'react';
import { sound } from '../../utils/soundEffects';
import {
  X,
  Home,
  Heart,
  Sparkles,
  Users,
  Search,
  Gift,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const POPULAR_NEIGHBORS = [
  {
    id: 'n-1',
    code: 'HA-8821',
    name: 'Tiệm Trà Capy Mập',
    owner: 'Trần Gia Bảo 👑',
    avatar: '🦫',
    hat: '🎓',
    petName: 'Bé Capy Đại Hiệp',
    level: 12,
    theme: 'from-[#FDF0D5] to-[#E9D8A6]',
    desc: 'Phòng trà phong cách thiền định Nhật Bản.',
  },
  {
    id: 'n-2',
    code: 'HA-9943',
    name: 'Tiệm Bánh Shiba Vàng',
    owner: 'Lê Hoàng Nam ✨',
    avatar: '🐕',
    hat: '👒',
    petName: 'Cún Shiba Tăng Động',
    level: 9,
    theme: 'from-[#FDE2E4] to-[#FFCAD4]',
    desc: 'Bánh mì nướng bơ tỏi thơm nức cả xóm.',
  },
  {
    id: 'n-3',
    code: 'HA-7732',
    name: 'Gia Đình Mèo Chiêu Tài',
    owner: 'Nguyễn Thảo My 💎',
    avatar: '🐱',
    hat: '👑',
    petName: 'Mèo Hoàng Gia Mochi',
    level: 15,
    theme: 'from-[#E8F5E9] to-[#C8E6C9]',
    desc: 'Đầy ắp chuông vàng và cá hồi nướng béo ngậy.',
  },
];

export function FriendHavenVisitModal({ user, onClose, onRewardFriendship }) {
  const [visitedNeighbor, setVisitedNeighbor] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [hasPetToday, setHasPetToday] = useState(false);
  const [hearts, setHearts] = useState([]);

  // Ghé thăm bạn bè
  const handleVisit = (neighbor) => {
    sound.playTing();
    setVisitedNeighbor(neighbor);
    setHasPetToday(false);
  };

  // Vuốt ve thú cưng của bạn bè
  const handlePetFriendAnimal = (e) => {
    sound.playPop();
    const rect = e.currentTarget.getBoundingClientRect();
    const newId = Date.now();

    setHearts((prev) => [
      ...prev,
      {
        id: newId,
        x: rect.width / 2 + (Math.random() - 0.5) * 60,
        y: rect.height / 2 - 20,
      },
    ]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newId));
    }, 1000);

    if (!hasPetToday) {
      setHasPetToday(true);
      sound.playWin();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      if (onRewardFriendship) {
        onRewardFriendship(20); // +20 Xu quà hữu nghị
      }
    }
  };

  const handleSearchCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const clean = inputCode.trim().toUpperCase();
    const found = POPULAR_NEIGHBORS.find((n) => n.code === clean);
    if (found) {
      handleVisit(found);
    } else {
      // Giả lập phòng bạn bè ngẫu nhiên từ mã
      handleVisit({
        id: 'custom-' + clean,
        code: clean,
        name: `Tiệm Bạn Bè #${clean}`,
        owner: 'Hàng Xóm Mới',
        avatar: '🦫',
        hat: '🍊',
        petName: 'Bé Cưng Đáng Yêu',
        level: Math.floor(Math.random() * 8) + 2,
        theme: 'from-[#FFF8E7] to-[#FFE8D6]',
        desc: 'Một góc nhỏ bình yên chan chứa tình cảm.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs animate-in fade-in select-none font-jakarta">
      <div className="w-full max-w-[390px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Nút đóng */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition active:scale-90"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {!visitedNeighbor ? (
          /* DANH SÁCH HÀNG XÓM */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏠</span>
              <div>
                <h3 className="font-fredoka font-black text-sm text-amber-950">
                  GHÉ THĂM NHÀ BẠN BÈ
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  Ghé thăm & vuốt ve bé cưng nhận quà hữu nghị (+20 Xu)
                </span>
              </div>
            </div>

            {/* Ô tìm kiếm mã bạn bè */}
            <form onSubmit={handleSearchCode} className="flex gap-1.5">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã bạn bè (VD: HA-8821)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-fredoka font-black text-xs transition active:scale-95"
              >
                Ghé Thăm
              </button>
            </form>

            <span className="text-[10px] font-fredoka font-black text-slate-600 block mt-3">
              🌟 Hoặc ghé thăm hàng xóm nổi bật:
            </span>

            <div className="space-y-2 max-h-[48vh] overflow-y-auto p-1">
              {POPULAR_NEIGHBORS.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleVisit(n)}
                  className="p-2.5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 flex items-center justify-between gap-2 cursor-pointer transition active:scale-98 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                      {n.avatar}
                    </div>
                    <div className="leading-tight">
                      <span className="font-fredoka font-black text-xs text-amber-950 block">
                        {n.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">
                        Chủ tiệm: {n.owner} • Cấp {n.level}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-xl bg-amber-100 text-amber-950 font-fredoka font-bold text-[10px]">
                    Vào Xem ➡️
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* KHÔNG GIAN PHÒNG BẠN BÈ ĐANG GHÉ THĂM */
          <div className="space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <button
                onClick={() => setVisitedNeighbor(null)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fredoka font-bold text-[10px]"
              >
                ⬅ Danh Sách
              </button>
              <div className="text-center">
                <span className="font-fredoka font-black text-xs text-amber-950 block">
                  {visitedNeighbor.name}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Mã: #{visitedNeighbor.code}
                </span>
              </div>
              <div className="w-12" />
            </div>

            {/* Phòng bạn bè */}
            <div
              onClick={handlePetFriendAnimal}
              className={`w-full h-56 rounded-3xl border-4 border-amber-300 p-3 shadow-inner relative flex flex-col items-center justify-center overflow-hidden cursor-pointer bg-gradient-to-b ${visitedNeighbor.theme}`}
            >
              <span className="absolute top-2 text-[10px] font-fredoka font-bold bg-white/80 px-2.5 py-0.5 rounded-full text-amber-950 animate-pulse">
                💖 Chạm vào bé cưng để vuốt ve & tặng quà hữu nghị!
              </span>

              {/* Bé thú cưng của bạn */}
              <div className="relative flex flex-col items-center">
                <span className="text-3xl absolute -top-6 animate-bounce">
                  {visitedNeighbor.hat}
                </span>
                <span className="text-7xl filter drop-shadow-xl animate-pulse">
                  {visitedNeighbor.avatar}
                </span>
                <span className="font-fredoka font-black text-xs text-amber-950 mt-1">
                  {visitedNeighbor.petName} (Lv.{visitedNeighbor.level})
                </span>
              </div>

              {/* Hạt tim bay lên khi vuốt ve */}
              {hearts.map((h) => (
                <div
                  key={h.id}
                  style={{ left: h.x, top: h.y }}
                  className="absolute pointer-events-none text-2xl animate-in zoom-in slide-out-to-top-8 duration-700"
                >
                  💖
                </div>
              ))}
            </div>

            {/* Trạng thái nhận quà */}
            <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between text-xs font-fredoka font-black text-amber-950">
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-rose-500" />
                <span>Quà hữu nghị hôm nay:</span>
              </div>
              <span className={hasPetToday ? 'text-emerald-600 font-bold' : 'text-amber-800'}>
                {hasPetToday ? 'Đã Nhận +20 Xu ✨' : '+20 Xu Vàng 🪙'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendHavenVisitModal;
