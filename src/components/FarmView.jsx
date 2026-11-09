import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { sound } from '../utils/soundEffects';
import {
  Sprout,
  Wheat,
  Clock,
  Sparkles,
  Zap,
  Warehouse,
  CheckCircle2,
  Truck,
  RotateCcw,
  Flame,
  X,
  ChevronRight,
  Disc3,
  HelpCircle,
  Coins,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CROPS = {
  wheat: {
    name: 'Lúa Mì',
    growSec: 15,
    cost: 5,
    rewardCoins: 12,
    rewardExp: 8,
    icon: '🌾',
    color: 'from-amber-400 to-yellow-500',
  },
  corn: {
    name: 'Bắp Ngô',
    growSec: 30,
    cost: 10,
    rewardCoins: 25,
    rewardExp: 15,
    icon: '🌽',
    color: 'from-yellow-400 to-amber-500',
  },
  carrot: {
    name: 'Cà Rốt',
    growSec: 45,
    cost: 15,
    rewardCoins: 40,
    rewardExp: 22,
    icon: '🥕',
    color: 'from-orange-400 to-amber-600',
  },
  strawberry: {
    name: 'Dâu Tây',
    growSec: 70,
    cost: 25,
    rewardCoins: 65,
    rewardExp: 35,
    icon: '🍓',
    color: 'from-rose-400 to-red-500',
  },
};

export function FarmView({ onNavigateToRestaurant }) {
  const { user, farmData, setFarmData, addCoins, addExp, addFertilizers } = useAuth();
  const { setIsMusicModalOpen, isPlaying } = useMusic();
  const [selectedSeed, setSelectedSeed] = useState('wheat');
  const [truckDelivering, setTruckDelivering] = useState(false);
  const [isOrderBoardOpen, setIsOrderBoardOpen] = useState(false);
  const [isBarnModalOpen, setIsBarnModalOpen] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Timer đồng bộ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!farmData) return null;

  // Hiệu ứng bay chữ (+12 Vàng, +25 EXP)
  const spawnFloatingText = (text, color = 'text-amber-300', x = '50%', y = '50%') => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, color, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  // 1. TRỒNG CÂY
  const handlePlant = (plotId, e) => {
    const seed = CROPS[selectedSeed];
    if ((user?.coins ?? 0) < seed.cost) {
      spawnFloatingText('Thiếu Vàng!', 'text-rose-400 font-bold', '50%', '40%');
      return;
    }

    sound.playPlant();
    addCoins(-seed.cost);

    const currentTime = Date.now();
    const readyTime = currentTime + seed.growSec * 1000;

    setFarmData((prev) => ({
      ...prev,
      plots: prev.plots.map((p) =>
        p.id === plotId ? { ...p, crop: selectedSeed, plantedAt: currentTime, readyAt: readyTime } : p
      ),
    }));

    spawnFloatingText(`-${seed.cost} 🪙`, 'text-rose-300');
  };

  // 2. THU HOẠCH NÔNG SẢN
  const handleHarvest = (plotId, e) => {
    const plot = farmData.plots.find((p) => p.id === plotId);
    if (!plot || !plot.crop) return;

    const seed = CROPS[plot.crop];
    sound.playHarvest();
    sound.playCoin();
    addCoins(seed.rewardCoins);
    addExp(seed.rewardExp);

    setFarmData((prev) => ({
      ...prev,
      barn: {
        ...prev.barn,
        [plot.crop]: (prev.barn[plot.crop] || 0) + 2,
      },
      plots: prev.plots.map((p) =>
        p.id === plotId ? { ...p, crop: null, plantedAt: null, readyAt: null } : p
      ),
    }));

    spawnFloatingText(`+${seed.rewardCoins} 🪙 +${seed.rewardExp} ✨`, 'text-amber-300 font-black');
  };

  // 3. BÓN PHÂN (CHÍN TỨC THÌ)
  const handleFertilize = (plotId, e) => {
    e?.stopPropagation();
    if ((user?.fertilizers ?? 0) <= 0) {
      spawnFloatingText('Hết Phân Bón!', 'text-yellow-400');
      return;
    }
    sound.playFertilize();
    addFertilizers(-1);

    setFarmData((prev) => ({
      ...prev,
      plots: prev.plots.map((p) =>
        p.id === plotId ? { ...p, readyAt: Date.now() - 1000 } : p
      ),
    }));

    spawnFloatingText('Chín Ngay! ⚡', 'text-emerald-300 font-black');
  };

  // 4. CHO GÀ ĂN LÚA
  const handleFeedChicken = (chickId) => {
    if ((farmData.barn.wheat || 0) < 1) {
      spawnFloatingText('Cần 1 Lúa Mì 🌾', 'text-yellow-300 font-bold');
      return;
    }

    sound.playChicken();
    const readyAt = Date.now() + 20000; // 20s

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, wheat: prev.barn.wheat - 1 },
      chickens: prev.chickens.map((c) =>
        c.id === chickId ? { ...c, isFed: true, readyAt } : c
      ),
    }));

    spawnFloatingText('-1 🌾 Đang Mổ Thóc...', 'text-amber-300');
  };

  // 5. THU HOẠCH TRỨNG GÀ
  const handleCollectEgg = (chickId) => {
    sound.playHarvest();
    sound.playCoin();
    addCoins(25);
    addExp(15);

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, egg: (prev.barn.egg || 0) + 1 },
      chickens: prev.chickens.map((c) =>
        c.id === chickId ? { ...c, isFed: false, readyAt: null } : c
      ),
    }));

    spawnFloatingText('+1 🥚 (+25 🪙 +15 ✨)', 'text-amber-300 font-black');
  };

  // 6. CHO BÒ ĂN BẮP
  const handleFeedCow = (cowId) => {
    if ((farmData.barn.corn || 0) < 1) {
      spawnFloatingText('Cần 1 Bắp Ngô 🌽', 'text-yellow-300 font-bold');
      return;
    }

    sound.playCow();
    const readyAt = Date.now() + 40000; // 40s

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, corn: prev.barn.corn - 1 },
      cows: prev.cows.map((c) =>
        c.id === cowId ? { ...c, isFed: true, readyAt } : c
      ),
    }));

    spawnFloatingText('-1 🌽 Đang Nhai Cỏ...', 'text-yellow-300');
  };

  // 7. VẮT SỮA BÒ
  const handleCollectMilk = (cowId) => {
    sound.playHarvest();
    sound.playCoin();
    addCoins(50);
    addExp(25);

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, milk: (prev.barn.milk || 0) + 1 },
      cows: prev.cows.map((c) =>
        c.id === cowId ? { ...c, isFed: false, readyAt: null } : c
      ),
    }));

    spawnFloatingText('+1 🥛 (+50 🪙 +25 ✨)', 'text-cyan-300 font-black');
  };

  // 8. NƯỚNG BÁNH MÌ (CỐI XAY / LÒ BÁNH)
  const handleStartBakeBread = () => {
    if ((farmData.barn.wheat || 0) < 2) {
      spawnFloatingText('Cần 2 Lúa Mì 🌾', 'text-yellow-300 font-bold');
      return;
    }
    sound.playPlant();
    const readyAt = Date.now() + 30000; // 30s

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, wheat: prev.barn.wheat - 2 },
      bakery: { isBaking: true, readyAt },
    }));

    spawnFloatingText('-2 🌾 Đang Nướng Bánh...', 'text-orange-300 font-bold');
  };

  // 9. THU HOẠCH BÁNH MÌ
  const handleCollectBread = () => {
    sound.playHarvest();
    sound.playCoin();
    addCoins(60);
    addExp(30);

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, bread: (prev.barn.bread || 0) + 1 },
      bakery: { isBaking: false, readyAt: null },
    }));

    spawnFloatingText('+1 🍞 (+60 🪙 +30 ✨)', 'text-orange-300 font-black');
  };

  // 10. CHẾ BIẾN BƠ
  const handleStartProcessButter = () => {
    if ((farmData.barn.milk || 0) < 1) {
      spawnFloatingText('Cần 1 Sữa Tươi 🥛', 'text-cyan-300 font-bold');
      return;
    }
    sound.playPlant();
    const readyAt = Date.now() + 35000; // 35s

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, milk: prev.barn.milk - 1 },
      dairy: { isProcessing: true, readyAt },
    }));

    spawnFloatingText('-1 🥛 Đang Chế Biến Bơ...', 'text-yellow-300 font-bold');
  };

  // 11. THU HOẠCH BƠ
  const handleCollectButter = () => {
    sound.playHarvest();
    sound.playCoin();
    addCoins(85);
    addExp(40);

    setFarmData((prev) => ({
      ...prev,
      barn: { ...prev.barn, butter: (prev.barn.butter || 0) + 1 },
      dairy: { isProcessing: false, readyAt: null },
    }));

    spawnFloatingText('+1 🧈 (+85 🪙 +40 ✨)', 'text-yellow-300 font-black');
  };

  // 12. GIAO ĐƠN HÀNG XE TẢI
  const handleDeliverOrder = (order) => {
    const hasEnough = order.items.every(
      (req) => (farmData.barn[req.item] || 0) >= req.count
    );

    if (!hasEnough) {
      spawnFloatingText('Chưa Đủ Nông Sản!', 'text-rose-400 font-bold');
      return;
    }

    sound.playTruck();
    setTruckDelivering(true);
    setIsOrderBoardOpen(false);

    const newBarn = { ...farmData.barn };
    order.items.forEach((req) => {
      newBarn[req.item] -= req.count;
    });

    addCoins(order.rewardCoins);
    addExp(order.rewardExp);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    spawnFloatingText(`+${order.rewardCoins} 🪙 +${order.rewardExp} ✨ (Xe Tải Giao Hàng!)`, 'text-amber-300 font-black');

    setTimeout(() => {
      setTruckDelivering(false);
      setFarmData((prev) => ({
        ...prev,
        barn: newBarn,
        orders: prev.orders.map((o) =>
          o.id === order.id
            ? {
                ...o,
                rewardCoins: Math.round(o.rewardCoins * 1.1),
                rewardExp: Math.round(o.rewardExp * 1.1),
              }
            : o
        ),
      }));
    }, 2500);
  };

  return (
    <div className="relative w-full h-[calc(100vh-108px)] overflow-hidden bg-gradient-to-b from-[#1b3b19] via-[#244c21] to-[#163014] select-none flex flex-col">
      {/* Floating Rewards Numbers */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingTexts.map((item) => (
          <div
            key={item.id}
            style={{ left: item.x, top: item.y }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 text-sm sm:text-base font-black font-fredoka px-3 py-1 rounded-2xl bg-black/80 border-2 border-amber-400 shadow-2xl animate-[floatUp_1.8s_ease-out_forwards] ${item.color}`}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Hiệu ứng xe tải chạy ngang khi giao đơn */}
      {truckDelivering && (
        <div className="fixed inset-x-0 top-20 z-50 pointer-events-none overflow-hidden">
          <div className="animate-[truckRun_2.5s_linear_forwards] inline-flex items-center gap-3 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white px-5 py-2.5 rounded-3xl border-3 border-black shadow-[0_8px_25px_rgba(0,0,0,0.8)] font-fredoka font-black text-sm">
            <span className="text-3xl">🚚💨</span>
            <span>Bim Bim! Xe Tải Đang Giao Đơn Hàng Cho Dân Làng!</span>
          </div>
        </div>
      )}

      {/* THANH HUD TRÊN: KHO NÔNG SẢN NHANH & NÚT TIỆN ÍCH */}
      <div className="shrink-0 z-30 px-3 py-2 bg-black/60 backdrop-blur-md border-b-2 border-amber-600/40 flex items-center justify-between gap-2 shadow-lg">
        {/* Nút Mở Chi Tiết Kho */}
        <button
          onClick={() => {
            sound.playClick();
            setIsBarnModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-600/80 hover:bg-amber-500 border-2 border-black text-white font-fredoka font-black text-xs transition active:scale-95 shadow"
        >
          <Warehouse className="w-4 h-4" />
          <span>KHO NÔNG TRẠI</span>
        </button>

        {/* Danh sách nông sản nhanh */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5 px-1 scrollbar-none">
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 font-bold text-amber-200">
            🌾 <span>{farmData.barn.wheat || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 font-bold text-yellow-200">
            🌽 <span>{farmData.barn.corn || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 font-bold text-orange-200">
            🥕 <span>{farmData.barn.carrot || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 font-bold text-rose-200">
            🍓 <span>{farmData.barn.strawberry || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/20 font-bold text-amber-300">
            🥚 <span>{farmData.barn.egg || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-500/20 font-bold text-cyan-200">
            🥛 <span>{farmData.barn.milk || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-500/20 font-bold text-orange-300">
            🍞 <span>{farmData.barn.bread || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-yellow-500/20 font-bold text-yellow-300">
            🧈 <span>{farmData.barn.butter || 0}</span>
          </div>
        </div>

        {/* Nút Đơn Hàng Xe Tải */}
        <button
          onClick={() => {
            sound.playClick();
            setIsOrderBoardOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 border-2 border-black text-white font-fredoka font-black text-xs transition active:scale-95 shadow shrink-0"
        >
          <Truck className="w-4 h-4" />
          <span>ĐƠN HÀNG XE TẢI</span>
        </button>
      </div>

      {/* KHUNG NHÌN NÔNG TRẠI 2.5D ISOMETRIC VỚI TƯƠNG TÁC THỰC SỰ */}
      <div className="flex-1 overflow-auto relative flex items-center justify-center p-4">
        {/* Isometric 3D World Scene */}
        <div
          className="relative shrink-0 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-[#2d5023] overflow-hidden"
          style={{
            width: '920px',
            height: '620px',
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 50%, #2f855a 100%)',
          }}
        >
          {/* Nền đất cỏ có hoa dại li ti */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#fef08a_1.5px,transparent_1.5px),radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:36px_36px,24px_24px] bg-[position:0_0,12px_12px]" />

          {/* Dòng suối uốn lượn có hiệu ứng lấp lánh */}
          <svg
            className="absolute top-0 right-0 w-80 h-72 pointer-events-none opacity-85"
            viewBox="0 0 320 280"
          >
            <path
              d="M140 0 C 180 80, 240 120, 280 280 L320 280 L320 0 Z"
              fill="url(#riverGradient)"
            />
            {/* Gợn sóng lấp lánh */}
            <path
              d="M170 50 Q 210 90, 260 160"
              stroke="#bae6fd"
              strokeWidth="3"
              strokeDasharray="8 12"
              fill="none"
              className="animate-[waterGleam_3s_ease-in-out_infinite]"
            />
            <path
              d="M210 120 Q 250 180, 290 240"
              stroke="#e0f2fe"
              strokeWidth="2.5"
              strokeDasharray="6 10"
              fill="none"
              className="animate-[waterGleam_2.5s_ease-in-out_infinite_reverse]"
            />
            <defs>
              <linearGradient id="riverGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="60%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>

          {/* Cầu gỗ bắc qua suối */}
          <div
            className="absolute top-28 right-16 w-16 h-8 bg-amber-800 rounded border border-amber-950 shadow-md rotate-12 flex flex-col justify-between py-0.5 px-1 pointer-events-none"
            title="Cầu gỗ bắc qua suối"
          >
            <div className="h-1 bg-amber-700 rounded-sm" />
            <div className="h-1 bg-amber-900 rounded-sm" />
            <div className="h-1 bg-amber-700 rounded-sm" />
          </div>

          {/* Đường đất mòn nối liền các khu vực */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 920 620">
            {/* Đường đất chính */}
            <path
              d="M 50 380 Q 200 370, 320 320 T 560 310 T 840 450"
              stroke="#b45309"
              strokeWidth="42"
              strokeLinecap="round"
              fill="none"
              opacity="0.35"
            />
            <path
              d="M 50 380 Q 200 370, 320 320 T 560 310 T 840 450"
              stroke="#d97706"
              strokeWidth="32"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            {/* Lối rẽ vào chuồng bò chuồng gà */}
            <path
              d="M 540 320 Q 640 380, 720 480"
              stroke="#d97706"
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          </svg>

          {/* 1. TÒA NHÀ NÔNG TRẠI CHÍNH (Main Farmhouse) - Góc Trên Bên Trái */}
          <div
            onClick={() => {
              sound.playClick();
              setIsBarnModalOpen(true);
            }}
            className="absolute top-8 left-10 cursor-pointer group transition-transform hover:scale-105"
            title="Nhà Chính & Kho Lúa (Bấm để xem kho)"
          >
            <div className="relative">
              {/* Bóng đổ 3D */}
              <div className="absolute -bottom-2 left-2 w-36 h-10 bg-black/40 rounded-full blur-sm" />

              {/* Ngôi nhà ngói đỏ */}
              <div className="relative w-36 bg-[#8b4513] border-3 border-black rounded-b-2xl shadow-2xl p-2 text-center">
                {/* Ống khói */}
                <div className="absolute -top-6 right-6 w-5 h-8 bg-stone-700 border-2 border-black rounded-t">
                  <span className="absolute -top-5 left-0 text-xs animate-bounce">☁️</span>
                </div>

                {/* Mái ngói đỏ viền trắng */}
                <div className="w-40 -ml-4 -mt-6 h-14 bg-gradient-to-b from-red-500 via-rose-600 to-red-800 border-3 border-white rounded-t-3xl shadow-md flex items-center justify-center">
                  <span className="text-white font-fredoka font-black text-xs drop-shadow">
                    HAY DAY HOUSE
                  </span>
                </div>

                {/* Cửa chính & Cửa sổ */}
                <div className="mt-2 flex items-center justify-around">
                  <div className="w-6 h-7 bg-amber-200 border-2 border-black rounded-t shadow-inner" />
                  <div className="w-8 h-10 bg-amber-950 border-2 border-black rounded-t-xl flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="w-6 h-7 bg-amber-200 border-2 border-black rounded-t shadow-inner" />
                </div>
              </div>

              {/* Huy hiệu nhà chính */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-400 border border-black rounded-full text-[10px] font-black font-fredoka text-black shadow">
                NHÀ CHÍNH
              </div>
            </div>
          </div>

          {/* 2. THÁP CHỨA LÚA (SILO BẠC) */}
          <div
            onClick={() => {
              sound.playClick();
              setIsBarnModalOpen(true);
            }}
            className="absolute top-10 left-52 cursor-pointer group transition-transform hover:scale-105"
            title="Tháp Silo Chứa Lúa"
          >
            {/* Bóng đổ */}
            <div className="absolute -bottom-2 left-1 w-20 h-6 bg-black/40 rounded-full blur-sm" />

            <div className="relative w-20 flex flex-col items-center">
              {/* Chóp nón kim loại */}
              <div className="w-0 h-0 border-l-[38px] border-l-transparent border-r-[38px] border-r-transparent border-b-[32px] border-b-slate-300 drop-shadow" />
              {/* Thân trụ bạc */}
              <div className="w-18 h-24 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border-3 border-black rounded-b-xl shadow-lg flex flex-col justify-between py-2 items-center">
                <div className="w-full h-1 bg-black/20" />
                <div className="text-xl">🌾</div>
                <div className="w-full h-1 bg-black/20" />
                <span className="text-[9px] font-black text-black bg-amber-300 px-1 rounded border border-black">
                  SILO
                </span>
              </div>
            </div>
          </div>

          {/* 3. CỐI XAY GIÓ (WINDMILL / LÒ BÁNH MÌ) */}
          <div
            onClick={() => {
              if (farmData.bakery.isBaking) {
                if (farmData.bakery.readyAt && now >= farmData.bakery.readyAt) {
                  handleCollectBread();
                } else {
                  spawnFloatingText('Đang Nướng Bánh...', 'text-orange-300');
                }
              } else {
                handleStartBakeBread();
              }
            }}
            className="absolute top-8 left-80 cursor-pointer group transition-transform hover:scale-105"
            title="Cối Xay Gió & Lò Nướng Bánh Mì (Bấm để nướng/thu hoạch)"
          >
            {/* Bóng đổ */}
            <div className="absolute -bottom-2 left-2 w-28 h-8 bg-black/40 rounded-full blur-sm" />

            <div className="relative w-28 flex flex-col items-center">
              {/* Cánh quạt cối xay gió quay đều CSS */}
              <div
                className="absolute -top-4 z-20 w-24 h-24 animate-[windmillSpin_8s_linear_infinite] flex items-center justify-center pointer-events-none"
              >
                {/* 4 cánh cối xay */}
                <div className="absolute w-2 h-24 bg-amber-900 border border-black rounded" />
                <div className="absolute w-24 h-2 bg-amber-900 border border-black rounded" />
                <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-black z-30 shadow" />
              </div>

              {/* Tháp đá */}
              <div className="mt-8 w-22 h-24 bg-gradient-to-b from-stone-200 to-stone-400 border-3 border-black rounded-t-2xl rounded-b-xl shadow-xl flex flex-col items-center justify-end p-2 relative">
                <div className="w-8 h-10 bg-amber-950 border-2 border-black rounded-t flex items-center justify-center">
                  <span className="text-xs">🔥</span>
                </div>
              </div>

              {/* Trạng thái Bánh mì */}
              <div className="absolute -bottom-3 px-2 py-0.5 rounded-full bg-black/80 border border-amber-400 text-[10px] font-fredoka font-black text-amber-300 shadow">
                {farmData.bakery.isBaking ? (
                  farmData.bakery.readyAt && now >= farmData.bakery.readyAt ? (
                    <span className="text-emerald-300 animate-pulse">🍞 Lấy Bánh!</span>
                  ) : (
                    <span className="text-amber-200">
                      ⏳ {Math.max(0, Math.ceil(((farmData.bakery.readyAt || now) - now) / 1000))}s
                    </span>
                  )
                ) : (
                  <span>🍞 Nướng Bánh (2🌾)</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. MÁY CHẾ BIẾN BƠ (DAIRY CHURN) */}
          <div
            onClick={() => {
              if (farmData.dairy.isProcessing) {
                if (farmData.dairy.readyAt && now >= farmData.dairy.readyAt) {
                  handleCollectButter();
                } else {
                  spawnFloatingText('Đang Chế Biến Bơ...', 'text-yellow-300');
                }
              } else {
                handleStartProcessButter();
              }
            }}
            className="absolute top-12 left-[440px] cursor-pointer group transition-transform hover:scale-105"
            title="Máy Chế Biến Bơ Thơm (Bấm để làm bơ/thu hoạch)"
          >
            {/* Bóng đổ */}
            <div className="absolute -bottom-2 left-1 w-20 h-6 bg-black/40 rounded-full blur-sm" />

            <div className="relative w-20 bg-amber-800 border-3 border-black rounded-2xl p-2 text-center shadow-lg">
              <div className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>
                ⚙️
              </div>
              <div className="text-xl -mt-1">🧈</div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-black/80 border border-yellow-400 text-[9px] font-fredoka font-black text-yellow-300 whitespace-nowrap">
                {farmData.dairy.isProcessing ? (
                  farmData.dairy.readyAt && now >= farmData.dairy.readyAt ? (
                    <span className="text-emerald-300 animate-pulse">Lấy Bơ!</span>
                  ) : (
                    <span>
                      ⏳ {Math.max(0, Math.ceil(((farmData.dairy.readyAt || now) - now) / 1000))}s
                    </span>
                  )
                ) : (
                  <span>Làm Bơ (1🥛)</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. GÓC TIỆM ẨM THỰC (Bấm vào để mở Quán Ăn & Bếp Mì Cay) */}
          <div
            onClick={() => {
              sound.playClick();
              if (onNavigateToRestaurant) {
                onNavigateToRestaurant();
              } else {
                setIsMusicModalOpen(true);
              }
            }}
            className="absolute top-14 left-[545px] cursor-pointer group transition-transform hover:scale-110"
            title="Tiệm Ẩm Thực & Quầy Trà Sữa (Bấm để vào Quán)"
          >
            <div className="relative w-20 h-18 bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 border-3 border-amber-300 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-1">
              <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🍜</span>
              <span className="text-[9px] font-black font-fredoka text-white mt-0.5 tracking-tight">TIỆM ĂN</span>
              <span className="absolute -top-2 -right-2 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-yellow-400 text-black border border-black shadow">
                HOT
              </span>
            </div>
          </div>

          {/* 6. BẾN XE TẢI & BIỂN BÁO ĐƠN HÀNG (Roadside Order Area) - Góc Dưới Bên Trái */}
          <div className="absolute bottom-10 left-8 flex items-end gap-3 z-20">
            {/* Biển Báo Gỗ Đơn Hàng */}
            <div
              onClick={() => {
                sound.playClick();
                setIsOrderBoardOpen(true);
              }}
              className="cursor-pointer group transition-transform hover:scale-105"
              title="Biển Báo Đơn Hàng Dân Làng (Bấm để xem)"
            >
              <div className="w-24 bg-gradient-to-b from-amber-700 to-amber-900 border-3 border-black rounded-xl p-2 shadow-2xl text-center relative">
                <div className="text-xl">📋</div>
                <div className="font-fredoka font-black text-[10px] text-amber-200 leading-tight">
                  ĐƠN HÀNG DÂN LÀNG
                </div>
                <div className="mt-1 px-1 py-0.5 bg-red-500 rounded text-[9px] font-bold text-white">
                  3 Đơn Mới!
                </div>
                {/* Cọc gỗ cắm đất */}
                <div className="w-3 h-8 bg-amber-950 border-x-2 border-black mx-auto -mb-8" />
              </div>
            </div>

            {/* Xe Tải Nhỏ Màu Đỏ (Red Delivery Truck) */}
            <div
              onClick={() => {
                sound.playClick();
                setIsOrderBoardOpen(true);
              }}
              className="cursor-pointer group transition-transform hover:scale-105 ml-2"
              title="Xe Tải Giao Hàng Đỏ"
            >
              <div className="relative">
                {/* Bóng xe */}
                <div className="absolute -bottom-1 left-2 w-32 h-6 bg-black/50 rounded-full blur-sm" />

                {/* Thân xe */}
                <div className="flex items-end">
                  {/* Thùng hàng gỗ */}
                  <div className="w-16 h-14 bg-amber-800 border-3 border-black rounded-t flex flex-col justify-between p-1">
                    <div className="flex justify-around text-xs">
                      <span>🌾</span>
                      <span>🥕</span>
                    </div>
                    <div className="text-[8px] font-black text-amber-200 text-center font-fredoka">
                      HAY DAY
                    </div>
                  </div>
                  {/* Đầu xe tải đỏ */}
                  <div className="w-14 h-12 bg-red-600 border-3 border-black rounded-r-2xl relative shadow-md">
                    {/* Kính xe */}
                    <div className="absolute top-1 right-2 w-7 h-5 bg-cyan-200 border-2 border-black rounded-tr-lg" />
                    {/* Đèn pha */}
                    <div className="absolute bottom-2 right-0.5 w-2 h-3 bg-yellow-300 border border-black rounded-r" />
                  </div>
                </div>

                {/* Bánh xe tải */}
                <div className="flex justify-between px-3 -mt-2">
                  <div className="w-6 h-6 rounded-full bg-stone-900 border-2 border-slate-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-stone-900 border-2 border-slate-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. CÁNH ĐỒNG 8 Ô ĐẤT TRỒNG CÂY 3D NỔI KHỐI (Isometric Crop Plots) */}
          <div className="absolute top-44 left-[200px] grid grid-cols-4 gap-4 z-10">
            {farmData.plots.map((plot) => {
              const isPlanted = Boolean(plot.crop);
              const isReady = isPlanted && plot.readyAt && now >= plot.readyAt;
              const seed = isPlanted ? CROPS[plot.crop] : null;

              // Tính % trưởng thành
              let progressPercent = 0;
              let remainSec = 0;
              if (isPlanted && plot.plantedAt && plot.readyAt) {
                const total = plot.readyAt - plot.plantedAt;
                const elapsed = now - plot.plantedAt;
                progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                remainSec = Math.max(0, Math.ceil((plot.readyAt - now) / 1000));
              }

              return (
                <div
                  key={plot.id}
                  onClick={(e) => {
                    if (isReady) {
                      handleHarvest(plot.id, e);
                    } else if (!isPlanted) {
                      handlePlant(plot.id, e);
                    } else {
                      spawnFloatingText(`Còn ${remainSec}s`, 'text-yellow-300 font-bold');
                    }
                  }}
                  className={`relative w-24 h-24 rounded-2xl cursor-pointer transition-all group ${
                    isReady
                      ? 'scale-105 shadow-[0_0_18px_rgba(251,191,36,0.8)]'
                      : 'hover:scale-102 hover:shadow-lg'
                  }`}
                  style={{
                    perspective: '600px',
                  }}
                >
                  {/* Khối đất 3D viền nâu nổi */}
                  <div
                    className="w-full h-full rounded-2xl border-3 border-[#542a0b] shadow-xl flex flex-col items-center justify-center relative overflow-hidden"
                    style={{
                      background: 'radial-gradient(circle, #78350f 20%, #451a03 90%)',
                    }}
                  >
                    {/* Rãnh luống đất cày xới */}
                    <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(45deg,#000,#000_6px,transparent_6px,transparent_12px)] pointer-events-none" />

                    {/* Khi ô đất chưa gieo */}
                    {!isPlanted && (
                      <div className="flex flex-col items-center text-amber-200/60 group-hover:text-amber-300 group-hover:scale-110 transition">
                        <span className="text-2xl opacity-70">🌱</span>
                        <span className="text-[10px] font-black font-fredoka mt-0.5">
                          + Gieo Hạt
                        </span>
                      </div>
                    )}

                    {/* Giai đoạn 1: Mầm non đang mọc */}
                    {isPlanted && !isReady && (
                      <div className="flex flex-col items-center relative z-10">
                        {/* Biểu tượng mầm trồi lên */}
                        <div className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>
                          🌱
                        </div>

                        {/* Thanh đo thời gian đếm lùi */}
                        <div className="w-16 h-2 bg-black/60 rounded-full border border-black/40 overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-white font-bold mt-0.5">
                          {remainSec}s
                        </span>

                        {/* Nút bón phân nhanh chín tức thì */}
                        {(user?.fertilizers ?? 0) > 0 && (
                          <button
                            onClick={(e) => handleFertilize(plot.id, e)}
                            title="Bón phân chín ngay!"
                            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-black text-black flex items-center justify-center shadow-lg active:scale-90"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Giai đoạn 2: Cây chín trĩu quả đung đưa trong gió */}
                    {isReady && seed && (
                      <div className="flex flex-col items-center relative z-10">
                        {/* Cây chín đung đưa */}
                        <div className="text-3xl animate-[sway_2s_ease-in-out_infinite] drop-shadow-md">
                          {seed.icon}
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-[9px] font-fredoka border border-black shadow mt-0.5 animate-pulse">
                          THU HOẠCH!
                        </div>
                        {/* Hạt bụi lấp lánh */}
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-ping" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 8. KHU CHUỒNG TRẠI (LIVESTOCK ZONE) - Góc Dưới Bên Phải */}
          <div className="absolute bottom-8 right-8 flex items-end gap-5 z-20">
            {/* Chuồng Gà (Chicken Coop) */}
            <div className="relative">
              {/* Bóng chuồng */}
              <div className="absolute -bottom-1 left-2 w-32 h-8 bg-black/40 rounded-full blur-sm" />

              <div className="w-36 bg-amber-900/90 border-3 border-black rounded-2xl p-2 shadow-2xl relative">
                {/* Hàng rào cọc gỗ */}
                <div className="absolute -top-3 inset-x-2 flex justify-between pointer-events-none">
                  <div className="w-1.5 h-5 bg-amber-700 border border-black rounded-t" />
                  <div className="w-1.5 h-5 bg-amber-700 border border-black rounded-t" />
                  <div className="w-1.5 h-5 bg-amber-700 border border-black rounded-t" />
                  <div className="w-1.5 h-5 bg-amber-700 border border-black rounded-t" />
                </div>

                <div className="text-[10px] font-black font-fredoka text-amber-300 text-center mb-1">
                  CHUỒNG GÀ ĐẺ TRỨNG
                </div>

                {/* 2 Chú gà mổ thóc hoạt hình */}
                <div className="flex items-center justify-around">
                  {farmData.chickens.map((chick) => {
                    const isReady = chick.isFed && chick.readyAt && now >= chick.readyAt;
                    const remain = chick.readyAt ? Math.max(0, Math.ceil((chick.readyAt - now) / 1000)) : 0;

                    return (
                      <div
                        key={chick.id}
                        onClick={() => {
                          if (isReady) {
                            handleCollectEgg(chick.id);
                          } else if (!chick.isFed) {
                            handleFeedChicken(chick.id);
                          } else {
                            spawnFloatingText(`Gà đẻ sau ${remain}s 🥚`, 'text-amber-200');
                          }
                        }}
                        className="cursor-pointer group flex flex-col items-center transition-transform hover:scale-110"
                      >
                        {/* Ổ rơm vàng */}
                        <div className="relative w-12 h-12 rounded-full bg-amber-600/80 border-2 border-black flex items-center justify-center shadow">
                          {/* Chú gà trắng mào đỏ mổ thóc */}
                          <span className="text-2xl animate-[peckAnim_1.8s_ease-in-out_infinite]">
                            🐔
                          </span>

                          {/* Bong bóng thông báo */}
                          {isReady ? (
                            <span className="absolute -top-3 -right-2 text-base animate-bounce">
                              🥚
                            </span>
                          ) : !chick.isFed ? (
                            <span className="absolute -top-2 -right-1 text-[9px] bg-red-500 text-white font-bold px-1 rounded-full border border-black animate-pulse">
                              🌾 Đói
                            </span>
                          ) : (
                            <span className="absolute -top-2 -right-1 text-[9px] bg-black/80 text-amber-300 font-mono px-1 rounded-full border border-white/20">
                              {remain}s
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-fredoka font-black text-amber-200 mt-0.5">
                          {isReady ? 'Nhặt Trứng' : !chick.isFed ? 'Cho Ăn (1🌾)' : `${remain}s`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chuồng Bò Sữa (Cow Pasture) */}
            <div className="relative">
              {/* Bóng chuồng */}
              <div className="absolute -bottom-1 left-2 w-32 h-8 bg-black/40 rounded-full blur-sm" />

              <div className="w-36 bg-emerald-900/90 border-3 border-black rounded-2xl p-2 shadow-2xl relative">
                {/* Hàng rào cọc trắng */}
                <div className="absolute -top-3 inset-x-2 flex justify-between pointer-events-none">
                  <div className="w-1.5 h-5 bg-white border border-black rounded-t" />
                  <div className="w-1.5 h-5 bg-white border border-black rounded-t" />
                  <div className="w-1.5 h-5 bg-white border border-black rounded-t" />
                  <div className="w-1.5 h-5 bg-white border border-black rounded-t" />
                </div>

                <div className="text-[10px] font-black font-fredoka text-emerald-300 text-center mb-1">
                  ĐỒNG CỎ BÒ SỮA
                </div>

                {/* Bò sữa đốm đen ngúng nguẩy đuôi */}
                {farmData.cows.map((cow) => {
                  const isReady = cow.isFed && cow.readyAt && now >= cow.readyAt;
                  const remain = cow.readyAt ? Math.max(0, Math.ceil((cow.readyAt - now) / 1000)) : 0;

                  return (
                    <div
                      key={cow.id}
                      onClick={() => {
                        if (isReady) {
                          handleCollectMilk(cow.id);
                        } else if (!cow.isFed) {
                          handleFeedCow(cow.id);
                        } else {
                          spawnFloatingText(`Có sữa sau ${remain}s 🥛`, 'text-cyan-200');
                        }
                      }}
                      className="cursor-pointer group flex flex-col items-center transition-transform hover:scale-110"
                    >
                      <div className="relative w-16 h-12 rounded-2xl bg-emerald-700/80 border-2 border-black flex items-center justify-center shadow">
                        <span className="text-3xl animate-[tailWag_2.2s_ease-in-out_infinite]">
                          🐮
                        </span>

                        {isReady ? (
                          <span className="absolute -top-3 -right-2 text-base animate-bounce">
                            🥛
                          </span>
                        ) : !cow.isFed ? (
                          <span className="absolute -top-2 -right-1 text-[9px] bg-red-500 text-white font-bold px-1 rounded-full border border-black animate-pulse">
                            🌽 Đói
                          </span>
                        ) : (
                          <span className="absolute -top-2 -right-1 text-[9px] bg-black/80 text-cyan-300 font-mono px-1 rounded-full border border-white/20">
                            {remain}s
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-fredoka font-black text-cyan-200 mt-0.5">
                        {isReady ? 'Vắt Sữa' : !cow.isFed ? 'Cho Ăn (1🌽)' : `${remain}s`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ CHỌN HẠT GIỐNG NỔI (FLOATING SEED SELECTOR TOOLBAR) */}
      <div className="shrink-0 z-30 p-2 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
        <div className="bg-[#1e1b18]/90 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2">
          <span className="text-xs font-black font-fredoka text-amber-300 px-2 hidden sm:inline">
            HẠT GIỐNG:
          </span>

          {Object.entries(CROPS).map(([key, crop]) => {
            const isSelected = selectedSeed === key;
            return (
              <button
                key={key}
                onClick={() => {
                  sound.playClick();
                  setSelectedSeed(key);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 font-bold'
                }`}
              >
                <span className="text-xl">{crop.icon}</span>
                <div className="text-left leading-tight">
                  <div className="text-xs font-fredoka font-black">{crop.name}</div>
                  <div className="text-[9px] text-amber-200/90 font-mono">
                    {crop.cost}🪙 • {crop.growSec}s
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: BẢNG ĐƠN HÀNG XE TẢI (ORDER BOARD MODAL) */}
      {isOrderBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#3a2211] via-[#2a170c] to-[#1a0e07] border-4 border-[#b45309] rounded-3xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.9)] text-white relative">
            <button
              onClick={() => {
                sound.playClick();
                setIsOrderBoardOpen(false);
              }}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 border-2 border-black flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-fredoka text-amber-300 tracking-wide">
                  ĐƠN HÀNG XE TẢI NÔNG TRẠI
                </h2>
                <p className="text-xs text-amber-200/80">
                  Giao nông sản cho dân làng để nhận Vàng và Điểm Kinh Nghiệm!
                </p>
              </div>
            </div>

            {/* Danh sách 3 đơn hàng */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {farmData.orders.map((order) => {
                const canDeliver = order.items.every(
                  (req) => (farmData.barn[req.item] || 0) >= req.count
                );

                return (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-black/40 border-2 border-amber-600/30 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="font-fredoka font-black text-sm text-amber-200">
                        {order.title}
                      </div>

                      {/* Nguyên liệu yêu cầu */}
                      <div className="flex items-center gap-2 mt-2">
                        {order.items.map((req, idx) => {
                          const currentInBarn = farmData.barn[req.item] || 0;
                          const hasEnough = currentInBarn >= req.count;

                          return (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                                hasEnough
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              <span>{req.name}</span>
                              <span>
                                {currentInBarn}/{req.count}
                              </span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Phần thưởng */}
                      <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                        <span className="text-amber-300 flex items-center gap-0.5">
                          🪙 +{order.rewardCoins} Vàng
                        </span>
                        <span className="text-emerald-300 flex items-center gap-0.5">
                          ✨ +{order.rewardExp} EXP
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeliverOrder(order)}
                      disabled={!canDeliver}
                      className={`px-4 py-2.5 rounded-xl font-fredoka font-black text-xs transition active:scale-95 shadow flex items-center gap-1.5 ${
                        canDeliver
                          ? 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>{canDeliver ? 'Giao Hàng!' : 'Thiếu Hàng'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHI TIẾT KHO NÔNG SẢN (BARN STORAGE MODAL) */}
      {isBarnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-[#2a170c] via-[#1f1008] to-[#120804] border-4 border-[#ffb703] rounded-3xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.9)] text-white relative">
            <button
              onClick={() => {
                sound.playClick();
                setIsBarnModalOpen(false);
              }}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 border-2 border-black flex items-center justify-center shadow-lg">
                <Warehouse className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-fredoka text-amber-300 tracking-wide">
                  KHO CHỨA NÔNG SẢN
                </h2>
                <p className="text-xs text-amber-200/80">
                  Tất cả sản vật thu hoạch từ cánh đồng & chuồng trại
                </p>
              </div>
            </div>

            {/* Grid nông sản */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'Lúa Mì', icon: '🌾', count: farmData.barn.wheat || 0, color: 'text-amber-200' },
                { name: 'Bắp Ngô', icon: '🌽', count: farmData.barn.corn || 0, color: 'text-yellow-200' },
                { name: 'Cà Rốt', icon: '🥕', count: farmData.barn.carrot || 0, color: 'text-orange-200' },
                { name: 'Dâu Tây', icon: '🍓', count: farmData.barn.strawberry || 0, color: 'text-rose-200' },
                { name: 'Trứng Gà', icon: '🥚', count: farmData.barn.egg || 0, color: 'text-amber-300' },
                { name: 'Sữa Tươi', icon: '🥛', count: farmData.barn.milk || 0, color: 'text-cyan-200' },
                { name: 'Bánh Mì', icon: '🍞', count: farmData.barn.bread || 0, color: 'text-orange-300' },
                { name: 'Bơ Thơm', icon: '🧈', count: farmData.barn.butter || 0, color: 'text-yellow-300' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center text-center shadow-inner"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-fredoka font-black mt-1 text-white truncate max-w-full">
                    {item.name}
                  </span>
                  <span className={`text-base font-black font-mono mt-0.5 ${item.color}`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-amber-200/70">
              Mẹo: Trồng thêm trọt và chăn nuôi liên tục để luôn sẵn sàng nông sản giao đơn hàng xe tải! 🚜
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmView;
