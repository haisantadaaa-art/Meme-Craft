import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../utils/soundEffects';
import { UserAvatar } from '../UserAvatar';
import { PetStats } from './PetStats';
import { PetWardrobe } from './PetWardrobe';
import { LeaderboardModal } from '../rank/LeaderboardModal';
import { FriendHavenVisitModal } from '../social/FriendHavenVisitModal';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Gamepad2,
  Utensils,
  Bath,
  Smile,
  Shirt,
  Coins,
  Gem,
  Flame,
  Check,
  Trophy,
  Home,
} from 'lucide-react';

export const PET_COMPANIONS = [
  {
    id: 'capybara',
    name: 'Bé Capybara',
    badge: 'Điềm Tĩnh 🍊',
    color: '#B08968',
    themeBg: 'from-[#FDF0D5] via-[#FFF9EE] to-[#E9D8A6]',
    desc: 'Điềm đạm, yêu chuộng hòa bình, luôn đội một quả quýt mọng nước trên đầu.',
    avatarEmoji: '🦫',
    hat: '🍊',
    food: [
      { id: 'tangerine', name: 'Quýt Mọng Nước 🍊', fullness: 25, exp: 8, cost: 0 },
      { id: 'grass', name: 'Bó Cỏ Non Tươi 🌾', fullness: 40, exp: 12, cost: 25 },
    ],
  },
  {
    id: 'shiba',
    name: 'Bé Cún Shiba',
    badge: 'Vẫy Đuôi 🐕',
    color: '#E09F3E',
    themeBg: 'from-[#FDE2E4] via-[#FFF9EE] to-[#FFCAD4]',
    desc: 'Vui vẻ, trung thành, cực kỳ thích chơi ném bóng và ăn bánh thưởng xúc xích.',
    avatarEmoji: '🐕',
    hat: '👒',
    food: [
      { id: 'kibble', name: 'Bát Hạt Cao Cấp 🥣', fullness: 25, exp: 8, cost: 0 },
      { id: 'sausage', name: 'Xúc Xích Nướng 🌭', fullness: 45, exp: 14, cost: 25 },
    ],
  },
  {
    id: 'cat',
    name: 'Mèo Chiêu Tài',
    badge: 'Mũm Mĩm 🐱',
    color: '#F4A261',
    themeBg: 'from-[#E8F5E9] via-[#FFF9EE] to-[#C8E6C9]',
    desc: 'Mũm mĩm, hay ôm đồng xu vàng may mắn, rừ rừ nũng nịu khi được cưng nựng.',
    avatarEmoji: '🐱',
    hat: '👑',
    food: [
      { id: 'fish', name: 'Cá Hồi Tươi Ngon 🐟', fullness: 30, exp: 10, cost: 0 },
      { id: 'pate', name: 'Hộp Pate Béo Ngậy 🥫', fullness: 50, exp: 15, cost: 25 },
    ],
  },
];

export function CozyPetView({ onOpenLobby }) {
  const { user, userProfile, addCoins, addExp, signOut } = useAuth() || {};

  // Linh vật đang chọn
  const [selectedPetId, setSelectedPetId] = useState(() => {
    return localStorage.getItem('cozy_selected_pet') || 'capybara';
  });

  // Mũ phụ kiện đang đội
  const [selectedHat, setSelectedHat] = useState(() => {
    return localStorage.getItem('cozy_pet_hat') || 'tangerine';
  });

  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isFriendVisitOpen, setIsFriendVisitOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Chỉ số thú cưng
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('cozy_pet_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { hunger: 85, cleanliness: 90, happiness: 95 };
  });

  const [petExp, setPetExp] = useState(() => {
    return parseInt(localStorage.getItem('cozy_pet_exp') || '20', 10);
  });
  const [petLevel, setPetLevel] = useState(() => {
    return parseInt(localStorage.getItem('cozy_pet_level') || '1', 10);
  });
  const [bondingLevel, setBondingLevel] = useState(1);

  // Hiệu ứng tương tác: hạt tim, xu rơi, combo clicker
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [tapCombo, setTapCombo] = useState(0);
  const [petMoodAction, setPetMoodAction] = useState('idle'); // 'idle' | 'happy' | 'eating' | 'bathing' | 'playing'

  const comboTimerRef = useRef(null);
  const actionTimerRef = useRef(null);

  const currentPet = PET_COMPANIONS.find((p) => p.id === selectedPetId) || PET_COMPANIONS[0];

  // Lưu trữ dữ liệu
  useEffect(() => {
    localStorage.setItem('cozy_selected_pet', selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_hat', selectedHat);
  }, [selectedHat]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_exp', String(petExp));
    localStorage.setItem('cozy_pet_level', String(petLevel));
  }, [petExp, petLevel]);

  // Tăng EXP và kiểm tra lên cấp
  const gainExp = (amount) => {
    setPetExp((prev) => {
      const nextExp = prev + amount;
      if (nextExp >= 100) {
        setPetLevel((lvl) => lvl + 1);
        sound.playWin();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        return nextExp - 100;
      }
      return nextExp;
    });
  };

  // Tương tác chạm vuốt ve (Petting)
  const handlePetTap = (e) => {
    sound.playPop();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;

    // Tăng combo tapper
    setTapCombo((prev) => {
      const nextCombo = prev + 1;
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => setTapCombo(0), 1200);

      // Thưởng xu may mắn mỗi mốc combo 10, 20
      if (nextCombo % 10 === 0 && addCoins) {
        addCoins(10);
        sound.playTing();
      }

      return nextCombo;
    });

    // Tạo hiệu ứng tim & hạt bồng bềnh
    const newId = Date.now() + Math.random();
    setFloatingParticles((prev) => [
      ...prev,
      {
        id: newId,
        x: Math.max(20, Math.min(rect.width - 20, x + (Math.random() - 0.5) * 40)),
        y: Math.max(20, Math.min(rect.height - 20, y + (Math.random() - 0.5) * 40)),
        type: Math.random() > 0.4 ? 'heart' : 'sparkle',
      },
    ]);

    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== newId));
    }, 1200);

    // Tăng hạnh phúc & EXP
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 2),
    }));
    gainExp(2);

    setPetMoodAction('happy');
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setPetMoodAction('idle'), 800);
  };

  // Thao tác 1: Cho ăn
  const handleFeed = () => {
    sound.playTing();
    setStats((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 25),
    }));
    gainExp(8);
    setPetMoodAction('eating');
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setPetMoodAction('idle'), 1200);
  };

  // Thao tác 2: Tắm bọt
  const handleBath = () => {
    sound.playPop();
    setStats((prev) => ({
      ...prev,
      cleanliness: Math.min(100, prev.cleanliness + 30),
    }));
    gainExp(10);
    setPetMoodAction('bathing');
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setPetMoodAction('idle'), 1200);
  };

  // Thao tác 3: Chơi bóng
  const handlePlayBall = () => {
    sound.playPop();
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 25),
      hunger: Math.max(0, prev.hunger - 10),
    }));
    gainExp(12);
    setPetMoodAction('playing');
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setPetMoodAction('idle'), 1200);
  };

  // Mũ phụ kiện icon
  const getHatIcon = () => {
    if (selectedHat === 'tangerine') return '🍊';
    if (selectedHat === 'straw_hat') return '👒';
    if (selectedHat === 'crown') return '👑';
    if (selectedHat === 'sunglasses') return '🕶️';
    if (selectedHat === 'chef_hat') return '👨‍🍳';
    if (selectedHat === 'flower') return '🌸';
    return '🍊';
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. HEADER BAR CHUẨN */}
      <div className="bg-white/95 border border-amber-200/80 rounded-2xl p-2 shadow-2xs shrink-0 flex items-center justify-between gap-1.5">
        {/* Trái: Avatar + Nickname + Cấp độ */}
        <div className="flex items-center gap-1.5 min-w-0">
          <UserAvatar avatar={user?.avatar || '🍊'} className="w-8 h-8 rounded-xl shadow-xs" />
          <div className="leading-tight min-w-0">
            <span className="font-fredoka font-black text-xs text-amber-950 block truncate">
              {user?.displayName || 'Chủ Tiệm'}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              Cấp {petLevel} • {currentPet.name}
            </span>
          </div>
        </div>

        {/* Giữa: Ví Tiền Vàng & Kim Cương */}
        <div className="flex items-center gap-1.5 bg-amber-50/80 px-2 py-1 rounded-xl border border-amber-200/60">
          <div className="flex items-center gap-0.5 text-xs font-mono font-black text-amber-800">
            <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{userProfile?.coins ?? 1250}</span>
          </div>
          <div className="flex items-center gap-0.5 text-xs font-mono font-black text-blue-800">
            <Gem className="w-3.5 h-3.5 text-blue-500 fill-blue-400" />
            <span>{userProfile?.diamonds ?? 25}</span>
          </div>
        </div>

        {/* Phải: Âm thanh & NÚT NỔI BẬT: SẢNH ĐẤU TRÍ */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              sound.playClick();
            }}
            title="Bật/tắt âm thanh"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition active:scale-90"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              if (onOpenLobby) onOpenLobby();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-black font-fredoka font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1 border border-amber-500"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Sảnh Game</span>
          </button>
        </div>
      </div>

      {/* QUICK SOCIAL & RANK NAV BAR */}
      <div className="flex items-center justify-between gap-2 mt-2 mb-0.5 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            setIsRankOpen(true);
          }}
          className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300 text-amber-950 font-fredoka font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Đấu Hạng ({user?.elo ?? userProfile?.elo ?? 1000} Elo)</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setIsFriendVisitOpen(true);
          }}
          className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-300 text-rose-950 font-fredoka font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition"
        >
          <Home className="w-3.5 h-3.5 text-rose-600" />
          <span>Ghé Thăm Bạn</span>
        </button>
      </div>

      {/* 2. THANH CHỌN 3 BÉ THÚ CƯNG (CAPYBARA / SHIBA / MÈO) */}
      <div className="grid grid-cols-3 gap-1.5 my-2 shrink-0">
        {PET_COMPANIONS.map((pet) => {
          const isSelected = pet.id === selectedPetId;
          return (
            <button
              key={pet.id}
              onClick={() => {
                sound.playClick();
                setSelectedPetId(pet.id);
              }}
              className={`p-1.5 rounded-2xl border-2 flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-amber-100 border-amber-500 shadow-2xs scale-102'
                  : 'bg-white/80 hover:bg-white border-amber-200/60'
              }`}
            >
              <span className="text-lg">{pet.avatarEmoji}</span>
              <div className="text-left leading-tight min-w-0">
                <span className="font-fredoka font-black text-[11px] text-amber-950 block truncate">
                  {pet.name}
                </span>
                <span className="text-[9px] text-slate-500 line-clamp-1">
                  {pet.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. TRUNG TÂM PHÒNG THÚ CƯNG TƯƠNG TÁC (COZY HAVEN ROOM) */}
      <div
        onClick={handlePetTap}
        className={`flex-1 w-full rounded-3xl border-4 border-amber-300 shadow-md relative flex flex-col items-center justify-center overflow-hidden cursor-pointer active:brightness-105 transition-all bg-gradient-to-b ${currentPet.themeBg}`}
      >
        {/* Bong bóng gợi ý vuốt ve */}
        <div className="absolute top-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-amber-300 shadow-2xs text-[10px] font-fredoka font-bold text-amber-950 animate-pulse flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>Chạm/Vuốt ve để cưng nựng bé!</span>
        </div>

        {/* COMBO TAPPER HUY HIỆU */}
        {tapCombo > 3 && (
          <div className="absolute top-10 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-fredoka font-black text-xs shadow-md animate-bounce flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
            <span>COMBO x{tapCombo}! 🔥</span>
          </div>
        )}

        {/* Hạt tim và tia sáng bay lên khi chạm */}
        {floatingParticles.map((p) => (
          <div
            key={p.id}
            style={{ left: p.x, top: p.y }}
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in slide-out-to-top-8 duration-700"
          >
            {p.type === 'heart' ? (
              <span className="text-2xl filter drop-shadow-md">💖</span>
            ) : (
              <span className="text-xl filter drop-shadow-md">✨</span>
            )}
          </div>
        ))}

        {/* BÉ THÚ CƯNG HOẠT HÌNH & MŨ PHỤ KIỆN */}
        <div className="relative flex flex-col items-center">
          {/* Mũ phụ kiện trên đầu */}
          <div className="text-4xl absolute -top-8 z-10 filter drop-shadow-md animate-bounce">
            {getHatIcon()}
          </div>

          {/* Bé thú cưng chính */}
          <div
            className={`text-8xl select-none filter drop-shadow-2xl transition-transform duration-200 ${
              petMoodAction === 'happy'
                ? 'scale-115 -rotate-3'
                : petMoodAction === 'eating'
                ? 'scale-110 animate-bounce'
                : petMoodAction === 'bathing'
                ? 'scale-110 animate-pulse'
                : 'animate-float'
            }`}
          >
            {currentPet.avatarEmoji}
          </div>

          {/* Hiệu ứng hành động đang làm */}
          {petMoodAction === 'eating' && (
            <div className="text-2xl absolute -right-4 top-2 animate-spin">
              🍎
            </div>
          )}
          {petMoodAction === 'bathing' && (
            <div className="text-2xl absolute -left-4 top-2 animate-bounce">
              🫧
            </div>
          )}
          {petMoodAction === 'playing' && (
            <div className="text-2xl absolute -right-4 bottom-0 animate-bounce">
              🎾
            </div>
          )}

          {/* Bóng đổ dưới chân */}
          <div className="w-24 h-4 bg-black/15 rounded-full filter blur-xs mt-2" />
        </div>

        {/* Lời thoại của bé */}
        <div className="absolute bottom-3 px-3 py-1 rounded-2xl bg-white/90 backdrop-blur-xs border border-amber-200 shadow-2xs text-[11px] font-fredoka font-black text-amber-950">
          {petMoodAction === 'happy'
            ? 'Rừ rừ... Thích quá à! 💕'
            : petMoodAction === 'eating'
            ? 'Ngon quá! Măm măm... 😋'
            : petMoodAction === 'bathing'
            ? 'Bọt xà phòng thơm lừng! 🫧'
            : petMoodAction === 'playing'
            ? 'Bắt bóng cừ khôi chưa nè! 🎾'
            : currentPet.desc}
        </div>
      </div>

      {/* 4. THANH CHỈ SỐ PET STATS (NO, SẠCH, VUI VẺ) */}
      <div className="my-2">
        <PetStats
          stats={stats}
          exp={petExp}
          maxExp={100}
          level={petLevel}
          bondingLevel={bondingLevel}
        />
      </div>

      {/* 5. THANH CÔNG CỤ ĐÁY: [CHO ĂN] - [TẮM BỌT] - [CHƠI BÓNG] - [ĐỔI MŨ] */}
      <div className="grid grid-cols-4 gap-2 bg-white/95 border border-amber-200/80 rounded-2xl p-2 shadow-2xs shrink-0 select-none">
        <button
          onClick={handleFeed}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 active:scale-95 transition"
        >
          <Utensils className="w-4 h-4 text-amber-600 mb-0.5" />
          <span className="font-fredoka font-black text-[10px]">Cho Ăn</span>
        </button>

        <button
          onClick={handleBath}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 active:scale-95 transition"
        >
          <Bath className="w-4 h-4 text-blue-600 mb-0.5" />
          <span className="font-fredoka font-black text-[10px]">Tắm Bọt</span>
        </button>

        <button
          onClick={handlePlayBall}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-950 border border-pink-200 active:scale-95 transition"
        >
          <Smile className="w-4 h-4 text-pink-600 mb-0.5" />
          <span className="font-fredoka font-black text-[10px]">Chơi Bóng</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setIsWardrobeOpen(true);
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 active:scale-95 transition"
        >
          <Shirt className="w-4 h-4 text-purple-600 mb-0.5" />
          <span className="font-fredoka font-black text-[10px]">Đổi Mũ</span>
        </button>
      </div>

      {/* MODAL TỦ ĐỒ MŨ PHỤ KIỆN */}
      {isWardrobeOpen && (
        <PetWardrobe
          currentHat={selectedHat}
          onSelectHat={(hatId) => setSelectedHat(hatId)}
          onClose={() => setIsWardrobeOpen(false)}
          userCoins={userProfile?.coins ?? 1000}
          userElo={user?.elo ?? userProfile?.elo ?? 1000}
        />
      )}

      {/* MODAL BẢNG XẾP HẠNG & ĐẤU HẠNG RANK */}
      {isRankOpen && (
        <LeaderboardModal
          userElo={user?.elo ?? userProfile?.elo ?? 1000}
          onClose={() => setIsRankOpen(false)}
        />
      )}

      {/* MODAL GHÉ THĂM NHÀ BẠN */}
      {isFriendVisitOpen && (
        <FriendHavenVisitModal
          userCoins={userProfile?.coins ?? 1000}
          onRewardCoins={(earned) => {
            if (addCoins) addCoins(earned);
          }}
          onClose={() => setIsFriendVisitOpen(false)}
        />
      )}
    </div>
  );
}

export default CozyPetView;
