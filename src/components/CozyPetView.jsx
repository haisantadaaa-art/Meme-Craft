import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { UserAvatar } from './UserAvatar';
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
  ShoppingBag,
  X,
  Check,
  Coins,
  Gem,
  Award,
  Info,
  ChevronRight,
  Sun,
  Flame,
  Shirt,
  Gift,
  Zap,
  Crown,
} from 'lucide-react';

// ==========================================
// 1. DANH SÁCH 3 BÉ THÚ CƯNG ĐỒNG HÀNH
// ==========================================
export const PET_COMPANIONS = [
  {
    id: 'capybara',
    name: 'Bé Capybara',
    title: 'Bộ Trưởng Ngoại Giao',
    badge: 'Điềm Tĩnh 🍊',
    color: '#B08968',
    themeBg: 'from-[#FDF0D5] via-[#FFF9EE] to-[#E9D8A6]',
    desc: 'Điềm đạm, yêu chuộng hòa bình, luôn đội một quả quýt mọng nước trên đầu.',
    soundType: 'purr',
    food: [
      { id: 'tangerine', name: 'Quýt Mọng Nước 🍊', fullness: 25, exp: 8, cost: 0, isMagic: false },
      { id: 'grass', name: 'Bó Cỏ Non Tươi 🌾', fullness: 40, exp: 12, cost: 30, isMagic: false },
    ],
  },
  {
    id: 'shiba',
    name: 'Bé Cún Shiba',
    title: 'Hiệp Sĩ Tinh Nghịch',
    badge: 'Vẫy Đuôi 🐕',
    color: '#E09F3E',
    themeBg: 'from-[#FDE2E4] via-[#FFF9EE] to-[#FFCAD4]',
    desc: 'Vui vẻ, trung thành, cực kỳ thích chơi ném bóng và ăn bánh thưởng xúc xích.',
    soundType: 'bark',
    food: [
      { id: 'kibble', name: 'Bát Hạt Cao Cấp 🥣', fullness: 25, exp: 8, cost: 0, isMagic: false },
      { id: 'sausage', name: 'Xúc Xích Nướng 🌭', fullness: 45, exp: 14, cost: 30, isMagic: false },
    ],
  },
  {
    id: 'cat',
    name: 'Mèo Chiêu Tài',
    title: 'Thần Tài May Mắn',
    badge: 'Mũm Mĩm 🐱',
    color: '#F4A261',
    themeBg: 'from-[#E8F5E9] via-[#FFF9EE] to-[#C8E6C9]',
    desc: 'Mũm mĩm, hay ôm đồng xu vàng may mắn, rừ rừ nũng nịu khi được cưng nựng.',
    soundType: 'purr',
    food: [
      { id: 'fish', name: 'Cá Hồi Tươi Ngon 🐟', fullness: 30, exp: 10, cost: 0, isMagic: false },
      { id: 'pate', name: 'Hộp Pate Béo Ngậy 🥫', fullness: 50, exp: 15, cost: 30, isMagic: false },
    ],
  },
];

// ==========================================
// 2. THỨC ĂN KỲ DIỆU (MAGIC FOODS)
// ==========================================
export const MAGIC_FOODS = [
  {
    id: 'rainbow_cake',
    name: 'Bánh Kem Cầu Vồng 🌈',
    desc: 'Kích hoạt Hào Quang Cầu Vồng rực rỡ lấp lánh!',
    fullness: 60,
    exp: 30,
    cost: 100,
    auraType: 'rainbow',
  },
  {
    id: 'glowing_tangerine',
    name: 'Quýt Phát Sáng Hoàng Kim 🍊✨',
    desc: 'Hào quang vàng rực rỡ và nhân đôi may mắn!',
    fullness: 70,
    exp: 35,
    cost: 150,
    auraType: 'golden',
  },
  {
    id: 'energy_potion',
    name: 'Nước Tăng Lực Siêu Cấp ⚡',
    desc: 'Năng lượng bùng nổ, hào quang Neon thời thượng!',
    fullness: 80,
    exp: 40,
    cost: 180,
    auraType: 'neon',
  },
];

// ==========================================
// 3. TỦ ĐỒ THỜI TRANG (PET ACCESSORIES)
// ==========================================
export const PET_ACCESSORIES = [
  {
    id: 'none',
    name: 'Mặc Định (Không Phụ Kiện)',
    icon: '✨',
    desc: 'Vẻ đẹp tự nhiên thuần khiết của bé',
    cost: 0,
  },
  {
    id: 'tangerine_hat',
    name: 'Mũ Quýt Đội Đầu 🍊',
    icon: '🍊',
    desc: 'Mũ quả quýt siêu đáng yêu trên đỉnh đầu',
    cost: 80,
  },
  {
    id: 'sunglasses',
    name: 'Kính Râm Sành Điệu 🕶️',
    icon: '🕶️',
    desc: 'Ngầu đét phong cách đường phố Y2K',
    cost: 150,
  },
  {
    id: 'royal_bow',
    name: 'Nơ Cổ Quý Tộc Đỏ 🎀',
    icon: '🎀',
    desc: 'Thắt nơ lụa mềm quý phái cho bé',
    cost: 120,
  },
  {
    id: 'angel_wings',
    name: 'Cánh Thiên Thần Trắng 🪽',
    icon: '🪽',
    desc: 'Cánh nhỏ vỗ nhẹ bồng bềnh sau lưng',
    cost: 250,
  },
  {
    id: 'golden_crown',
    name: 'Vương Miện Hoàng Gia 👑',
    icon: '👑',
    desc: 'Biểu tượng tối thượng cho thú cưng Cấp Đại Hiệp',
    cost: 350,
    requireLevel: 5,
  },
];

// ==========================================
// 4. VẬT PHẨM TRANG TRÍ PHÒNG ẤM CÚNG
// ==========================================
export const DECOR_ITEMS = [
  {
    id: 'rug',
    name: 'Thảm Len Lông Cừu',
    icon: '🧶',
    desc: 'Thảm dệt mềm mại êm ái dưới chân',
    cost: 150,
  },
  {
    id: 'plant',
    name: 'Chậu Cây Sen Đá Mini',
    icon: '🪴',
    desc: 'Thanh lọc không khí và điểm xuyết sắc xanh',
    cost: 120,
  },
  {
    id: 'cushion',
    name: 'Nệm Lười Bồng Bềnh',
    icon: '🛏️',
    desc: 'Nệm êm cho bé ngả lưng ngủ trưa',
    cost: 250,
  },
  {
    id: 'lamp',
    name: 'Đèn Ngủ Mặt Trăng Ấm',
    icon: '🌙',
    desc: 'Ánh sáng vàng dịu dàng ru bé ngủ',
    cost: 200,
  },
  {
    id: 'painting',
    name: 'Tranh Treo Tường Cảnh Núi',
    icon: '🖼️',
    desc: 'Bức tranh phong cảnh chữa lành tâm hồn',
    cost: 180,
  },
];

export function CozyPetView({ onOpenMinigames }) {
  const { user, addCoins, setIsAuthModalOpen, setIsAboutModalOpen } = useAuth();

  // 1. Thú cưng được chọn
  const [selectedPetId, setSelectedPetId] = useState(() => {
    return localStorage.getItem('cozy_pet_selected') || 'capybara';
  });

  // 2. Cấp độ thú cưng & Thanh EXP (0 - 100)
  const [petLevel, setPetLevel] = useState(() => {
    return parseInt(localStorage.getItem('cozy_pet_level') || '1', 10);
  });
  const [petExp, setPetExp] = useState(() => {
    return parseInt(localStorage.getItem('cozy_pet_exp') || '20', 10);
  });

  // 3. Chỉ số Tình Cảm (Bonding Level / Thân Thiết)
  const [bondPoints, setBondPoints] = useState(() => {
    return parseInt(localStorage.getItem('cozy_pet_bond') || '35', 10);
  });

  // 4. Túi Quà Trợ Chiến từ Minigames
  const [cheerBags, setCheerBags] = useState(() => {
    return parseInt(localStorage.getItem('cozy_pet_cheer_bags') || '1', 10);
  });

  // 5. Rương Quà May Mắn Đầu Ngày (Daily Gift Chest)
  const [hasDailyChest, setHasDailyChest] = useState(() => {
    const lastClaim = localStorage.getItem('cozy_pet_chest_claim');
    const today = new Date().toDateString();
    return lastClaim !== today;
  });

  // 6. Phụ kiện thời trang
  const [equippedAccessory, setEquippedAccessory] = useState(() => {
    return localStorage.getItem('cozy_pet_equipped_acc') || 'none';
  });
  const [ownedAccessories, setOwnedAccessories] = useState(() => {
    try {
      const saved = localStorage.getItem('cozy_pet_owned_acc');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return ['none', 'tangerine_hat'];
  });

  // 7. Hiệu ứng Hào Quang Kỳ Diệu (Aura: 'none' | 'rainbow' | 'golden' | 'neon')
  const [activeAura, setActiveAura] = useState(() => {
    return localStorage.getItem('cozy_pet_active_aura') || 'none';
  });

  // 8. Chỉ số cơ bản (0 - 100)
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('cozy_pet_stats');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { fullness: 85, cleanliness: 90, happiness: 85 };
  });

  // 9. Đồ trang trí đã mua
  const [ownedDecor, setOwnedDecor] = useState(() => {
    try {
      const saved = localStorage.getItem('cozy_pet_decor');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return ['rug'];
  });

  // 10. Trạng thái Hoạt cảnh & Combo Tap
  const [petAction, setPetAction] = useState('idle'); // 'idle' | 'happy' | 'eating' | 'bathing' | 'playing'
  const [comboCount, setComboCount] = useState(0);
  const [isFrenzy, setIsFrenzy] = useState(false);
  const [isSquished, setIsSquished] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [floatingCoins, setFloatingCoins] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [ballActive, setBallActive] = useState(false);
  const [isDecorModalOpen, setIsDecorModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const comboTimerRef = useRef(null);
  const frenzyTimerRef = useRef(null);

  const currentPet = PET_COMPANIONS.find((p) => p.id === selectedPetId) || PET_COMPANIONS[0];

  // Giai đoạn tiến hóa theo Cấp (Stage 1: Lv 1-4, Stage 2: Lv 5-9, Stage 3: Lv 10+)
  const petStage = petLevel >= 10 ? 3 : petLevel >= 5 ? 2 : 1;
  const stageName =
    petStage === 3 ? 'Đại Hiệp Hoàng Gia 👑' : petStage === 2 ? 'Nhanh Nhẹn Lanh Lợi ⚡' : 'Bé Xíu Đáng Yêu 🍼';

  // Lưu trữ dữ liệu
  useEffect(() => {
    localStorage.setItem('cozy_pet_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_selected', selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_level', String(petLevel));
  }, [petLevel]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_exp', String(petExp));
  }, [petExp]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_bond', String(bondPoints));
  }, [bondPoints]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_cheer_bags', String(cheerBags));
  }, [cheerBags]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_equipped_acc', equippedAccessory);
  }, [equippedAccessory]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_owned_acc', JSON.stringify(ownedAccessories));
  }, [ownedAccessories]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_active_aura', activeAura);
  }, [activeAura]);

  useEffect(() => {
    localStorage.setItem('cozy_pet_decor', JSON.stringify(ownedDecor));
  }, [ownedDecor]);

  // Chỉ số giảm nhẹ tự nhiên theo thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        fullness: Math.max(10, prev.fullness - 1),
        cleanliness: Math.max(10, prev.cleanliness - 1),
        happiness: Math.max(15, prev.happiness - (prev.fullness < 30 ? 2 : 1)),
      }));
    }, 20000);

    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
    if (!next) sound.playClick();
  };

  // ==========================================
  // HÀM TĂNG EXP VÀ KIỂM TRA LÊN CẤP THÚ CƯNG
  // ==========================================
  const gainExp = (amount) => {
    setPetExp((prevExp) => {
      const nextExp = prevExp + amount;
      if (nextExp >= 100) {
        // Lên cấp!
        const leftover = nextExp - 100;
        setPetLevel((prevLvl) => {
          const newLevel = prevLvl + 1;
          sound.playLevelUp();
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });

          // Rơi thông báo lên cấp
          const id = Date.now() + Math.random();
          setFloatingTexts((prev) => [
            ...prev,
            { id, text: `🎉 LÊN CẤP ${newLevel}! (${stageName})`, color: 'text-amber-500' },
          ]);
          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
          }, 2000);

          return newLevel;
        });
        return leftover;
      }
      return nextExp;
    });

    // Tăng điểm tình cảm
    setBondPoints((prev) => Math.min(1000, prev + Math.round(amount / 2)));
  };

  // ==========================================
  // HÀNH ĐỘNG 1: CHẠM / VUỐT VE BÉ (COMBO CLICKER + JUICY SQUASH)
  // ==========================================
  const handlePetTouch = (e) => {
    // 1. Squash & Stretch animation
    setIsSquished(true);
    setTimeout(() => setIsSquished(false), 140);

    // 2. Quản lý chuỗi Combo
    const nextCombo = comboCount + 1;
    setComboCount(nextCombo);

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setComboCount(0);
    }, 1600);

    // 3. Âm thanh phản hồi nhịp điệu
    sound.playComboPop(nextCombo);

    // 4. Kích hoạt Frenzy khi đạt Combo x20
    if (nextCombo === 20 && !isFrenzy) {
      setIsFrenzy(true);
      sound.playFrenzy();
      confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 } });

      const frenzyId = Date.now();
      setFloatingTexts((prev) => [
        ...prev,
        { id: frenzyId, text: '🔥 FRENZY! NHÂN ĐÔI XU & EXP! 🔥', color: 'text-rose-500' },
      ]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== frenzyId));
      }, 2500);

      if (frenzyTimerRef.current) clearTimeout(frenzyTimerRef.current);
      frenzyTimerRef.current = setTimeout(() => {
        setIsFrenzy(false);
      }, 5000);
    }

    // 5. Tính toán phần thưởng
    const coinReward = isFrenzy ? 20 : nextCombo >= 10 ? 15 : 10;
    const expReward = isFrenzy ? 8 : 4;
    addCoins(coinReward);
    gainExp(expReward);

    setPetAction('happy');
    setTimeout(() => setPetAction('idle'), 1200);

    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 4),
    }));

    // 6. Tọa độ hiệu ứng tim & xu bay
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : 100;
    const y = e.clientY ? e.clientY - rect.top : 80;

    const id = Date.now() + Math.random();
    setFloatingHearts((prev) => [...prev, { id, x, y }]);
    setFloatingCoins((prev) => [
      ...prev,
      { id, x: x + 12, y: y - 10, text: `+${coinReward} 🪙` },
    ]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((item) => item.id !== id));
      setFloatingCoins((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // ==========================================
  // HÀNH ĐỘNG 2: CHO ĂN (THƯỜNG & KỲ DIỆU)
  // ==========================================
  const handleFeed = (foodItem) => {
    if (foodItem.cost > (user?.coins || 0)) {
      alert('Bạn không đủ xu để mua món ăn này!');
      return;
    }

    if (foodItem.cost > 0) {
      addCoins(-foodItem.cost);
    }

    setIsFoodModalOpen(false);

    if (foodItem.isMagic || foodItem.auraType) {
      sound.playMagicAura();
      setActiveAura(foodItem.auraType || 'rainbow');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else {
      sound.playEating();
    }

    setPetAction('eating');
    setTimeout(() => setPetAction('idle'), 2000);

    setStats((prev) => ({
      ...prev,
      fullness: Math.min(100, prev.fullness + foodItem.fullness),
      happiness: Math.min(100, prev.happiness + 15),
    }));

    gainExp(foodItem.exp || 15);
  };

  // ==========================================
  // HÀNH ĐỘNG 3: TẮM RỬA (BATHING)
  // ==========================================
  const handleBathe = () => {
    sound.playWaterSplash();
    setPetAction('bathing');

    const newBubbles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      left: 15 + Math.random() * 70,
      size: 24 + Math.random() * 28,
      delay: i * 0.1,
    }));
    setBubbles(newBubbles);

    setTimeout(() => {
      setBubbles([]);
      setPetAction('idle');
      sound.playTing();
    }, 2200);

    setStats((prev) => ({
      ...prev,
      cleanliness: Math.min(100, prev.cleanliness + 35),
      happiness: Math.min(100, prev.happiness + 10),
    }));

    gainExp(10);
  };

  // ==========================================
  // HÀNH ĐỘNG 4: CHƠI ĐÙA NÉM BÓNG (PLAYING)
  // ==========================================
  const handlePlayBall = () => {
    sound.playBallBounce();
    setBallActive(true);
    setPetAction('playing');

    addCoins(25);
    gainExp(15);

    setTimeout(() => {
      setBallActive(false);
      setPetAction('idle');
      sound.playWin();
    }, 2200);

    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 30),
      cleanliness: Math.max(10, prev.cleanliness - 6),
      fullness: Math.max(10, prev.fullness - 4),
    }));
  };

  // ==========================================
  // HÀNH ĐỘNG 5: MỞ TÚI QUÀ TRỢ CHIẾN (TỪ MINIGAMES)
  // ==========================================
  const handleOpenCheerBag = () => {
    if (cheerBags <= 0) {
      alert('Bạn chưa có Túi Quà Trợ Chiến! Hãy chiến thắng các ván Minigames để nhận nha!');
      return;
    }

    sound.playOpenChest();
    setCheerBags((prev) => prev - 1);
    addCoins(150);
    gainExp(45);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });

    // Tặng ngẫu nhiên hào quang cầu vồng
    setActiveAura('rainbow');

    const bagId = Date.now();
    setFloatingTexts((prev) => [
      ...prev,
      { id: bagId, text: '🎁 MỞ TÚI QUÀ: +150 XU & +45 EXP! 🌈', color: 'text-amber-500' },
    ]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== bagId));
    }, 2500);
  };

  // ==========================================
  // HÀNH ĐỘNG 6: NHẬN RƯƠNG MAY MẮN ĐẦU NGÀY
  // ==========================================
  const handleClaimDailyChest = () => {
    if (!hasDailyChest) return;

    sound.playOpenChest();
    setHasDailyChest(false);
    localStorage.setItem('cozy_pet_chest_claim', new Date().toDateString());

    addCoins(200);
    gainExp(50);
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });

    const chestId = Date.now();
    setFloatingTexts((prev) => [
      ...prev,
      { id: chestId, text: '💎 RƯƠNG MAY MẮN: +200 XU & +50 EXP! 🏆', color: 'text-emerald-600' },
    ]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== chestId));
    }, 2500);
  };

  // ==========================================
  // HÀNH ĐỘNG 7: MUA & MẶC PHỤ KIỆN THỜI TRANG
  // ==========================================
  const handleEquipAccessory = (acc) => {
    if (acc.id !== 'none' && !ownedAccessories.includes(acc.id)) {
      if ((user?.coins || 0) < acc.cost) {
        alert('Bạn không đủ xu để mua phụ kiện này!');
        return;
      }
      sound.playWin();
      addCoins(-acc.cost);
      setOwnedAccessories((prev) => [...prev, acc.id]);
    }

    sound.playClick();
    setEquippedAccessory(acc.id);
  };

  // ==========================================
  // HÀNH ĐỘNG 8: MUA ĐỒ TRANG TRÍ (DECOR SHOP)
  // ==========================================
  const handleBuyDecor = (item) => {
    if (ownedDecor.includes(item.id)) return;
    if ((user?.coins || 0) < item.cost) {
      alert('Bạn không đủ xu để mua vật phẩm trang trí này!');
      return;
    }

    sound.playWin();
    addCoins(-item.cost);
    setOwnedDecor((prev) => [...prev, item.id]);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
  };

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-[100dvh] h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#FFFDF7] relative font-jakarta select-none text-slate-800 shadow-2xl border-x border-amber-200/60">
      {/* ======================================================== */}
      {/* 1. HEADER TỐI GIẢN & NÚT SẢNH ĐẤU TRÍ NỔI BẬT */}
      {/* ======================================================== */}
      <header className="px-3 py-2 bg-white/95 backdrop-blur-md border-b border-amber-200/80 flex items-center justify-between gap-1.5 z-30 shrink-0 shadow-2xs">
        {/* Góc trái: Avatar chủ nuôi + Cấp độ nuôi thú */}
        <button
          onClick={() => {
            sound.playClick();
            setIsAuthModalOpen(true);
          }}
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition active:scale-95"
          title="Hồ sơ chủ nuôi"
        >
          <UserAvatar avatar={user?.avatar} className="w-8 h-8" textClassName="text-xl" />
          <div className="text-left leading-tight hidden xs:block">
            <span className="font-fredoka font-black text-xs text-amber-950 block truncate max-w-[70px]">
              {user?.displayName || 'Chủ Nuôi'}
            </span>
            <span className="text-[10px] font-fredoka font-black text-amber-700">
              Lv.{petLevel} ({stageName.split(' ')[0]})
            </span>
          </div>
        </button>

        {/* Góc giữa: Xu Vàng + Kim Cương */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 shadow-2xs">
            <span className="text-xs leading-none">🪙</span>
            <span className="text-xs font-black font-fredoka">
              {(user?.coins ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 shadow-2xs">
            <span className="text-xs leading-none">💎</span>
            <span className="text-xs font-black font-fredoka">{user?.gems ?? 0}</span>
          </div>
        </div>

        {/* Góc phải: Tủ Đồ + Âm Thanh + NÚT SẢNH ĐẤU TRÍ */}
        <div className="flex items-center gap-1.5">
          {/* Nút Tủ Đồ Thời Trang */}
          <button
            onClick={() => {
              sound.playClick();
              setIsWardrobeModalOpen(true);
            }}
            title="Tủ Đồ Thời Trang"
            className="w-8 h-8 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-300 flex items-center justify-center text-pink-700 transition active:scale-90"
          >
            <Shirt className="w-4 h-4" />
          </button>

          {/* Âm thanh */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition active:scale-90"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Nút Sảnh Đấu Trí */}
          <div className="relative group">
            <button
              onClick={() => {
                sound.playClick();
                if (onOpenMinigames) onOpenMinigames();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:brightness-105 text-white font-fredoka font-black text-xs shadow-md border border-purple-700 active:scale-95 transition shrink-0 animate-pulse"
              title="Vào sảnh mini-games"
            >
              <Gamepad2 className="w-4 h-4 text-yellow-300" />
              <span className="hidden sm:inline">Sảnh Đấu Trí</span>
              <span className="sm:hidden">Game</span>
            </button>
          </div>
        </div>
      </header>

      {/* DÒNG BUFF TRỢ CHIẾN SẢNH ĐẤU TRÍ & CHỌN BÉ ĐỒNG HÀNH */}
      <div className="px-3 pt-1.5 shrink-0 z-20 space-y-1.5">
        {/* Banner bé cưng sẵn sàng trợ chiến */}
        <div
          onClick={() => {
            sound.playClick();
            if (onOpenMinigames) onOpenMinigames();
          }}
          className="w-full py-1 px-2.5 rounded-xl bg-gradient-to-r from-purple-100 via-indigo-50 to-pink-100 border border-purple-300 flex items-center justify-between cursor-pointer hover:border-purple-400 transition shadow-2xs"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-fredoka font-black text-purple-950">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Bé cưng đang sẵn sàng trợ chiến! 🐾</span>
          </div>
          <span className="text-[10px] font-fredoka font-bold text-purple-700 bg-white/80 px-2 py-0.5 rounded-full border border-purple-200">
            Trợ chiến ⚔️
          </span>
        </div>

        {/* 3 Tabs chọn bé */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-amber-100/60 rounded-2xl border border-amber-200">
          {PET_COMPANIONS.map((pet) => {
            const isSelected = pet.id === selectedPetId;
            return (
              <button
                key={pet.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedPetId(pet.id);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-fredoka font-black transition-all flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-white text-amber-950 shadow-sm border border-amber-300 scale-102'
                    : 'text-amber-900/80 hover:text-amber-950 hover:bg-white/40'
                }`}
              >
                <span>{pet.id === 'capybara' ? '🍊' : pet.id === 'shiba' ? '🐕' : '🐱'}</span>
                <span className="truncate">{pet.name.replace('Bé ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. KHU VỰC TRUNG TÂM: CĂN PHÒNG & BÉ CƯNG TƯƠNG TÁC */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col justify-between p-3 relative overflow-hidden">
        {/* Nền Phòng Ấm Cúng */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF9EE] via-[#FFF6E6] to-[#FCEFDA] pointer-events-none" />

        {/* HÀO QUANG KỲ DIỆU (AURA EFFECTS) */}
        {activeAura === 'rainbow' && (
          <div className="absolute inset-x-8 top-16 bottom-16 rounded-full bg-gradient-to-tr from-pink-300/30 via-yellow-200/30 to-cyan-300/30 blur-2xl animate-pulse pointer-events-none" />
        )}
        {activeAura === 'golden' && (
          <div className="absolute inset-x-8 top-16 bottom-16 rounded-full bg-amber-400/25 blur-3xl animate-pulse pointer-events-none" />
        )}
        {activeAura === 'neon' && (
          <div className="absolute inset-x-8 top-16 bottom-16 rounded-full bg-cyan-400/25 blur-3xl animate-pulse pointer-events-none" />
        )}

        {/* Khung Cửa Sổ Mặt Trời */}
        <div className="absolute top-3 left-6 w-16 h-20 rounded-t-full border-4 border-amber-200/80 bg-gradient-to-b from-sky-200 to-amber-100/40 opacity-70 flex flex-col items-center justify-center shadow-inner pointer-events-none">
          <Sun className="w-7 h-7 text-amber-400 animate-spin" style={{ animationDuration: '30s' }} />
          <div className="absolute inset-x-0 top-10 h-1 bg-amber-200/80" />
          <div className="absolute inset-y-0 left-7 w-1 bg-amber-200/80" />
        </div>

        {/* RƯƠNG MAY MẮN ĐẦU NGÀY (CLAIMABLE DAILY CHEST) */}
        {hasDailyChest && (
          <div
            onClick={handleClaimDailyChest}
            title="Nhận rương quà may mắn đầu ngày!"
            className="absolute top-3 right-6 z-20 cursor-pointer animate-bounce flex flex-col items-center group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-amber-500 shadow-md flex items-center justify-center text-xl group-hover:scale-110 transition">
              🎁
            </div>
            <span className="text-[9px] font-fredoka font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full mt-0.5 shadow-xs">
              Mở Ngay!
            </span>
          </div>
        )}

        {/* NÚT MỞ TÚI QUÀ TRỢ CHIẾN TỪ MINIGAMES */}
        {cheerBags > 0 && (
          <div
            onClick={handleOpenCheerBag}
            title="Mở Túi Quà Trợ Chiến nhận được từ Minigames!"
            className="absolute top-16 right-6 z-20 cursor-pointer flex flex-col items-center active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-purple-600 shadow-md flex items-center justify-center text-lg text-white">
              🎒
            </div>
            <span className="text-[9px] font-fredoka font-black bg-purple-700 text-white px-1.5 py-0.2 rounded-full mt-0.5">
              x{cheerBags} Túi
            </span>
          </div>
        )}

        {/* Đồ Trang Trí Trong Phòng */}
        {ownedDecor.includes('lamp') && (
          <div className="absolute top-4 right-18 text-2xl filter drop-shadow-md animate-pulse pointer-events-none">
            🌙
          </div>
        )}
        {ownedDecor.includes('painting') && (
          <div className="absolute top-12 left-26 text-2xl filter drop-shadow-xs pointer-events-none">
            🖼️
          </div>
        )}
        {ownedDecor.includes('plant') && (
          <div className="absolute bottom-16 left-6 text-3xl filter drop-shadow-sm pointer-events-none">
            🪴
          </div>
        )}
        {ownedDecor.includes('cushion') && (
          <div className="absolute bottom-14 right-6 text-4xl filter drop-shadow-sm pointer-events-none">
            🛋️
          </div>
        )}
        {ownedDecor.includes('rug') && (
          <div className="absolute bottom-12 inset-x-12 h-20 rounded-[50%] bg-gradient-to-r from-amber-200/70 via-orange-100/80 to-amber-200/70 border border-amber-300/60 shadow-xs pointer-events-none" />
        )}

        {/* ======================================================== */}
        {/* THANH EXP TIẾN HÓA VÀ 3 THANH CHỈ SỐ CỦA BÉ */}
        {/* ======================================================== */}
        <div className="relative z-10 space-y-1.5">
          {/* Thanh Tiến Hóa & EXP Cấp Độ */}
          <div className="px-2.5 py-1.5 rounded-2xl bg-white/90 border border-amber-300 shadow-2xs backdrop-blur-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm">⭐</span>
              <div className="leading-tight">
                <span className="font-fredoka font-black text-xs text-amber-950 block">
                  Cấp {petLevel} • {stageName}
                </span>
                <span className="text-[10px] text-amber-700 font-bold">
                  Thân thiết: {bondPoints} 💖
                </span>
              </div>
            </div>

            {/* Thanh tiến trình EXP 0 - 100 */}
            <div className="flex-1 max-w-[150px]">
              <div className="flex justify-between text-[10px] font-fredoka font-black text-amber-900 mb-0.5">
                <span>EXP</span>
                <span>{petExp}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden border border-amber-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 transition-all duration-300"
                  style={{ width: `${petExp}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3 Chỉ số Độ No, Độ Sạch, Vui Vẻ */}
          <div className="grid grid-cols-3 gap-2 px-1">
            <div className="p-1.5 rounded-2xl bg-white/85 border border-amber-200 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center justify-between text-[10px] font-fredoka font-black text-amber-950 mb-0.5">
                <span>🍖 No</span>
                <span>{stats.fullness}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${stats.fullness}%` }}
                />
              </div>
            </div>

            <div className="p-1.5 rounded-2xl bg-white/85 border border-amber-200 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center justify-between text-[10px] font-fredoka font-black text-amber-950 mb-0.5">
                <span>🧼 Sạch</span>
                <span>{stats.cleanliness}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-cyan-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${stats.cleanliness}%` }}
                />
              </div>
            </div>

            <div className="p-1.5 rounded-2xl bg-white/85 border border-amber-200 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center justify-between text-[10px] font-fredoka font-black text-amber-950 mb-0.5">
                <span>💖 Vui</span>
                <span>{stats.happiness}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-rose-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-300"
                  style={{ width: `${stats.happiness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BÉ THÚ CƯNG TRUNG TÂM (COMBO POP-TAP & JUICY SQUASH) */}
        {/* ======================================================== */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-1">
          {/* SỐ ĐẾM COMBO POP Ở ĐẦU BÉ */}
          {comboCount > 1 && (
            <div className="mb-1 text-center animate-in zoom-in-75 duration-150">
              <span
                className={`font-fredoka font-black text-base px-3 py-0.5 rounded-full shadow-md border ${
                  isFrenzy
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse text-lg'
                    : comboCount >= 10
                    ? 'bg-amber-400 text-black border-amber-500'
                    : 'bg-white text-amber-950 border-amber-300'
                }`}
              >
                🔥 COMBO x{comboCount}
                {isFrenzy && ' • FRENZY x2 XU!'}
              </span>
            </div>
          )}

          {/* Lời thoại nhỏ nhắn của bé */}
          <div className="mb-1 px-3 py-1 rounded-full bg-white/90 border border-amber-300 text-xs font-fredoka font-bold text-amber-900 shadow-xs animate-bounce flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isFrenzy
                ? 'HƯNG PHẤN CỰC ĐỘ! GÂU GÂU 🌟'
                : petAction === 'happy'
                ? 'Rừ rừ... Thích quá à! 💖'
                : petAction === 'eating'
                ? 'Ngon tuyệt cú mèo! 😋'
                : petAction === 'bathing'
                ? 'Tắm mát lấp lánh xà phòng ✨'
                : petAction === 'playing'
                ? 'Ném bóng tài ba! 🎾'
                : `Chạm liên tục để kích hoạt Combo! 🐾`}
            </span>
          </div>

          {/* KHUNG THÚ CƯNG VỚI HIỆU ỨNG SQUASH & STRETCH */}
          <div
            onClick={handlePetTouch}
            className={`relative cursor-pointer select-none transition-transform duration-100 ${
              isSquished
                ? 'scale-x-120 scale-y-80 -translate-y-1'
                : petAction === 'happy'
                ? 'scale-108 -translate-y-2'
                : petAction === 'playing'
                ? 'animate-bounce'
                : 'hover:scale-105 active:scale-95'
            }`}
          >
            <div className="w-48 h-48 sm:w-52 sm:h-52 relative flex items-center justify-center">
              {/* 1. BÉ CAPYBARA */}
              {currentPet.id === 'capybara' && (
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                  {/* Thân Capybara */}
                  <ellipse cx="100" cy="120" rx="72" ry="54" fill="#A47148" />
                  <ellipse cx="100" cy="122" rx="66" ry="46" fill="#BD8253" />
                  {/* Đầu Capybara */}
                  <rect x="65" y="60" width="70" height="60" rx="28" fill="#BD8253" />
                  {/* Mũi & Mõm */}
                  <rect x="75" y="85" width="50" height="32" rx="14" fill="#935E35" />
                  <ellipse cx="90" cy="95" rx="3" ry="5" fill="#3D2314" />
                  <ellipse cx="110" cy="95" rx="3" ry="5" fill="#3D2314" />
                  {/* Mắt lim dim */}
                  <path d="M 76 80 Q 84 75 92 80" stroke="#3D2314" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 108 80 Q 116 75 124 80" stroke="#3D2314" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Má hồng */}
                  <circle cx="72" cy="90" r="7" fill="#FFAAA6" opacity="0.6" />
                  <circle cx="128" cy="90" r="7" fill="#FFAAA6" opacity="0.6" />
                  {/* Tai nhỏ */}
                  <ellipse cx="62" cy="65" rx="8" ry="6" fill="#82522C" />
                  <ellipse cx="138" cy="65" rx="8" ry="6" fill="#82522C" />
                  {/* Chân trước */}
                  <rect x="75" y="152" width="16" height="20" rx="8" fill="#82522C" />
                  <rect x="109" y="152" width="16" height="20" rx="8" fill="#82522C" />

                  {/* QUẢ QUÝT TRÊN ĐẦU HOẶC MŨ QUÝT */}
                  {(equippedAccessory === 'tangerine_hat' || equippedAccessory === 'none') && (
                    <g className="animate-bounce" style={{ animationDuration: '2s' }}>
                      <circle cx="100" cy="46" r="14" fill="#FF8800" />
                      <circle cx="100" cy="45" r="12" fill="#FFA200" />
                      <path d="M 100 34 L 100 30" stroke="#4D7C0F" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 100 31 Q 108 28 110 32 Q 105 34 100 32" fill="#65A30D" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: KÍNH RÂM */}
                  {equippedAccessory === 'sunglasses' && (
                    <g>
                      <rect x="72" y="74" width="24" height="15" rx="4" fill="#1E293B" />
                      <rect x="104" y="74" width="24" height="15" rx="4" fill="#1E293B" />
                      <line x1="96" y1="80" x2="104" y2="80" stroke="#1E293B" strokeWidth="3" />
                      <line x1="74" y1="77" x2="84" y2="77" stroke="#94A3B8" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: NƠ CỔ QUÝ TỘC */}
                  {equippedAccessory === 'royal_bow' && (
                    <g>
                      <polygon points="90,115 80,108 80,122" fill="#DC2626" />
                      <polygon points="110,115 120,108 120,122" fill="#DC2626" />
                      <circle cx="100" cy="115" r="4.5" fill="#EF4444" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: CÁNH THIÊN THẦN */}
                  {equippedAccessory === 'angel_wings' && (
                    <g className="animate-pulse">
                      <path d="M 45 110 Q 20 85 45 70 Q 55 95 55 115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                      <path d="M 155 110 Q 180 85 155 70 Q 145 95 145 115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: VƯƠNG MIỆN HOÀNG GIA (HOẶC STAGE 3) */}
                  {(equippedAccessory === 'golden_crown' || petStage === 3) && (
                    <g className="animate-bounce" style={{ animationDuration: '3s' }}>
                      <polygon points="82,45 88,26 100,36 112,26 118,45" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
                      <circle cx="88" cy="26" r="2.5" fill="#EF4444" />
                      <circle cx="100" cy="36" r="2.5" fill="#3B82F6" />
                      <circle cx="112" cy="26" r="2.5" fill="#10B981" />
                    </g>
                  )}
                </svg>
              )}

              {/* 2. BÉ CÚN SHIBA VÀNG */}
              {currentPet.id === 'shiba' && (
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                  {/* Đuôi cong cuộn */}
                  <path d="M 145 120 Q 170 100 155 85 Q 140 85 145 110" fill="#E09F3E" className="origin-bottom-left animate-wiggle" />
                  {/* Thân cún */}
                  <ellipse cx="100" cy="125" rx="65" ry="50" fill="#E09F3E" />
                  <ellipse cx="100" cy="130" rx="42" ry="34" fill="#FFFDF9" />
                  {/* Đầu Shiba */}
                  <ellipse cx="100" cy="80" rx="48" ry="42" fill="#E09F3E" />
                  <ellipse cx="100" cy="90" rx="34" ry="26" fill="#FFFDF9" />
                  {/* Mắt tròn */}
                  <circle cx="85" cy="78" r="5" fill="#2E1C0C" />
                  <circle cx="87" cy="76" r="1.5" fill="#FFFFFF" />
                  <circle cx="115" cy="78" r="5" fill="#2E1C0C" />
                  <circle cx="117" cy="76" r="1.5" fill="#FFFFFF" />
                  {/* Mũi & miệng */}
                  <polygon points="100,85 96,89 104,89" fill="#2E1C0C" />
                  <path d="M 95 91 Q 100 95 105 91" stroke="#2E1C0C" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Má hồng */}
                  <circle cx="76" cy="88" r="6" fill="#FF8FA3" opacity="0.6" />
                  <circle cx="124" cy="88" r="6" fill="#FF8FA3" opacity="0.6" />
                  {/* Tai */}
                  <polygon points="62,56 75,30 90,52" fill="#C87D25" />
                  <polygon points="68,54 77,36 86,51" fill="#FFFDF9" />
                  <polygon points="138,56 125,30 110,52" fill="#C87D25" />
                  <polygon points="132,54 123,36 114,51" fill="#FFFDF9" />
                  {/* Bandana đỏ */}
                  <polygon points="85,108 115,108 100,124" fill="#E63946" />

                  {/* PHỤ KIỆN: KÍNH RÂM */}
                  {equippedAccessory === 'sunglasses' && (
                    <g>
                      <rect x="74" y="72" width="22" height="14" rx="4" fill="#1E293B" />
                      <rect x="104" y="72" width="22" height="14" rx="4" fill="#1E293B" />
                      <line x1="96" y1="78" x2="104" y2="78" stroke="#1E293B" strokeWidth="3" />
                      <line x1="76" y1="75" x2="84" y2="75" stroke="#94A3B8" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: MŨ QUÝT */}
                  {equippedAccessory === 'tangerine_hat' && (
                    <g className="animate-bounce" style={{ animationDuration: '2s' }}>
                      <circle cx="100" cy="40" r="12" fill="#FF8800" />
                      <circle cx="100" cy="39" r="10" fill="#FFA200" />
                      <path d="M 100 29 L 100 25" stroke="#4D7C0F" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: CÁNH THIÊN THẦN */}
                  {equippedAccessory === 'angel_wings' && (
                    <g className="animate-pulse">
                      <path d="M 45 110 Q 20 85 45 70 Q 55 95 55 115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                      <path d="M 155 110 Q 180 85 155 70 Q 145 95 145 115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: VƯƠNG MIỆN HOÀNG GIA (HOẶC STAGE 3) */}
                  {(equippedAccessory === 'golden_crown' || petStage === 3) && (
                    <g className="animate-bounce" style={{ animationDuration: '3s' }}>
                      <polygon points="84,40 89,22 100,32 111,22 116,40" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
                      <circle cx="89" cy="22" r="2.5" fill="#EF4444" />
                      <circle cx="100" cy="32" r="2.5" fill="#3B82F6" />
                      <circle cx="111" cy="22" r="2.5" fill="#10B981" />
                    </g>
                  )}
                </svg>
              )}

              {/* 3. BÉ MÈO CHIÊU TÀI */}
              {currentPet.id === 'cat' && (
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                  {/* Thân Mèo */}
                  <ellipse cx="100" cy="125" rx="60" ry="50" fill="#FFFDF9" />
                  <path d="M 70 100 Q 85 95 80 120 Z" fill="#F4A261" />
                  {/* Đầu mèo */}
                  <circle cx="100" cy="80" r="45" fill="#FFFDF9" />
                  <path d="M 115 50 Q 140 60 135 85 Z" fill="#2A9D8F" opacity="0.8" />
                  {/* 2 Tai */}
                  <polygon points="60,60 70,30 90,52" fill="#FFFDF9" />
                  <polygon points="65,56 72,38 85,50" fill="#FFAAA6" />
                  <polygon points="140,60 130,30 110,52" fill="#FFFDF9" />
                  <polygon points="135,56 128,38 115,50" fill="#FFAAA6" />
                  {/* Mắt híp cười */}
                  <path d="M 80 78 Q 88 84 94 78" stroke="#1D3557" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 106 78 Q 112 84 120 78" stroke="#1D3557" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Mũi & râu */}
                  <polygon points="100,82 97,85 103,85" fill="#FFAAA6" />
                  <line x1="68" y1="84" x2="52" y2="82" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" />
                  <line x1="68" y1="89" x2="54" y2="92" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" />
                  <line x1="132" y1="84" x2="148" y2="82" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" />
                  <line x1="132" y1="89" x2="146" y2="92" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" />
                  {/* Vòng cổ & Đồng xu vàng */}
                  <rect x="76" y="105" width="48" height="7" rx="3.5" fill="#E63946" />
                  <ellipse cx="100" cy="140" rx="20" ry="24" fill="#FFC300" stroke="#D4AF37" strokeWidth="2" />
                  <rect x="94" y="134" width="12" height="12" rx="2" fill="#E6A100" />
                  <ellipse cx="132" cy="115" rx="10" ry="14" fill="#FFFDF9" stroke="#E2E8F0" strokeWidth="1.5" className="origin-bottom-left animate-wiggle" />

                  {/* PHỤ KIỆN: KÍNH RÂM */}
                  {equippedAccessory === 'sunglasses' && (
                    <g>
                      <rect x="74" y="72" width="22" height="14" rx="4" fill="#1E293B" />
                      <rect x="104" y="72" width="22" height="14" rx="4" fill="#1E293B" />
                      <line x1="96" y1="78" x2="104" y2="78" stroke="#1E293B" strokeWidth="3" />
                      <line x1="76" y1="75" x2="84" y2="75" stroke="#94A3B8" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: CÁNH THIÊN THẦN */}
                  {equippedAccessory === 'angel_wings' && (
                    <g className="animate-pulse">
                      <path d="M 45 110 Q 20 85 45 70 Q 55 95 55 115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                      <path d="M 155 110 Q 180 85 155 70 Q 145 95 145 115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                    </g>
                  )}

                  {/* PHỤ KIỆN: VƯƠNG MIỆN HOÀNG GIA (HOẶC STAGE 3) */}
                  {(equippedAccessory === 'golden_crown' || petStage === 3) && (
                    <g className="animate-bounce" style={{ animationDuration: '3s' }}>
                      <polygon points="84,40 89,22 100,32 111,22 116,40" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
                      <circle cx="89" cy="22" r="2.5" fill="#EF4444" />
                      <circle cx="100" cy="32" r="2.5" fill="#3B82F6" />
                      <circle cx="111" cy="22" r="2.5" fill="#10B981" />
                    </g>
                  )}
                </svg>
              )}
            </div>
          </div>

          {/* TIM HỒNG BAY KHI VUỐT VE */}
          {floatingHearts.map((h) => (
            <div
              key={h.id}
              style={{ left: `${h.x}px`, top: `${h.y}px` }}
              className="absolute pointer-events-none text-2xl animate-in fade-in zoom-in-50 duration-500"
            >
              💖
            </div>
          ))}

          {/* XU VÀNG BAY KHI VUỐT VE */}
          {floatingCoins.map((c) => (
            <div
              key={c.id}
              style={{ left: `${c.x}px`, top: `${c.y}px` }}
              className="absolute pointer-events-none font-fredoka font-black text-xs text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shadow-xs animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {c.text}
            </div>
          ))}

          {/* THÔNG BÁO NỔI (EXP, FRENZY, CHEST) */}
          {floatingTexts.map((t) => (
            <div
              key={t.id}
              className={`absolute top-4 pointer-events-none font-fredoka font-black text-sm ${t.color} bg-white/95 border-2 border-amber-400 px-3 py-1 rounded-full shadow-lg animate-in zoom-in-75 duration-300`}
            >
              {t.text}
            </div>
          ))}

          {/* BỌT XÀ PHÒNG TẮM RỬA */}
          {bubbles.map((b) => (
            <div
              key={b.id}
              style={{
                left: `${b.left}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                animationDelay: `${b.delay}s`,
              }}
              className="absolute bottom-10 rounded-full bg-cyan-200/60 border border-white shadow-inner animate-bounce pointer-events-none flex items-center justify-center text-xs"
            >
              🫧
            </div>
          ))}

          {/* QUẢ BÓNG NẨY TƯNG TƯNG */}
          {ballActive && (
            <div className="absolute bottom-8 text-4xl animate-bounce pointer-events-none transition-all duration-300">
              🎾
            </div>
          )}
        </div>

        {/* THÔNG TIN TÓM TẮT BÉ CƯNG */}
        <div className="relative z-10 text-center mb-0.5">
          <span className="font-fredoka font-black text-xs sm:text-sm text-amber-950">
            {currentPet.name} • {currentPet.title} ({stageName})
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5 px-4 truncate">{currentPet.desc}</p>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. THANH CÔNG CỤ CHĂM SÓC Ở ĐÁY (BOTTOM ACTION BAR) */}
      {/* ======================================================== */}
      <footer className="p-2.5 bg-white/95 backdrop-blur-md border-t border-amber-200/80 z-30 shrink-0">
        <div className="grid grid-cols-4 gap-2">
          {/* Nút 1: Cho Ăn */}
          <button
            onClick={() => {
              sound.playClick();
              setIsFoodModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-400 border border-amber-500 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition">
              🍖
            </div>
            <span className="font-fredoka font-black text-[11px] text-amber-950 mt-1">
              Cho Ăn
            </span>
          </button>

          {/* Nút 2: Tắm Rửa */}
          <button
            onClick={handleBathe}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-400 border border-cyan-500 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition">
              🧼
            </div>
            <span className="font-fredoka font-black text-[11px] text-cyan-950 mt-1">
              Tắm Rửa
            </span>
          </button>

          {/* Nút 3: Chơi Đùa */}
          <button
            onClick={handlePlayBall}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-400 border border-rose-500 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition">
              🎾
            </div>
            <span className="font-fredoka font-black text-[11px] text-rose-950 mt-1">
              Chơi Đùa
            </span>
          </button>

          {/* Nút 4: Trang Trí */}
          <button
            onClick={() => {
              sound.playClick();
              setIsDecorModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-400 border border-purple-500 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition">
              🛋️
            </div>
            <span className="font-fredoka font-black text-[11px] text-purple-950 mt-1">
              Trang Trí
            </span>
          </button>
        </div>

        {/* Bản Quyền Huỳnh Âu */}
        <div className="mt-2 pt-1.5 border-t border-slate-100 text-center">
          <span className="text-[10px] font-fredoka font-bold text-slate-500 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Game Được Lập Trình Bởi <strong className="text-amber-800">Huỳnh Âu</strong>
            <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
          </span>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 4. MODAL THỰC ĐƠN: THỨC ĂN THƯỜNG & THỨC ĂN KỲ DIỆU */}
      {/* ======================================================== */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[360px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <button
              onClick={() => setIsFoodModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="text-center mb-3">
              <span className="text-3xl">🍲</span>
              <h3 className="font-fredoka text-base font-black text-amber-950 mt-1">
                BỮA ĂN CHO {currentPet.name.toUpperCase()}
              </h3>
              <p className="text-[11px] text-slate-500">
                Thức ăn bổ sung Độ No và nhận bong bóng EXP tăng cấp!
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-[11px] font-fredoka font-black text-amber-900 uppercase">
                Món Ăn Thường Ngày:
              </div>
              {currentPet.food.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFeed(f)}
                  className="w-full p-2.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 flex items-center justify-between shadow-2xs transition active:scale-95 text-left"
                >
                  <div>
                    <div className="font-fredoka font-black text-xs text-amber-950">{f.name}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      +{f.fullness}% No • +{f.exp} EXP
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 font-fredoka font-black text-xs border border-amber-300">
                    {f.cost === 0 ? 'Miễn Phí ✨' : `${f.cost} 🪙`}
                  </div>
                </button>
              ))}

              <div className="text-[11px] font-fredoka font-black text-purple-900 uppercase pt-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Thức Ăn Kỳ Diệu (Phát Hào Quang):
              </div>
              {MAGIC_FOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleFeed(m)}
                  className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-300 hover:border-purple-500 flex items-center justify-between shadow-2xs transition active:scale-95 text-left"
                >
                  <div>
                    <div className="font-fredoka font-black text-xs text-purple-950">{m.name}</div>
                    <div className="text-[10px] text-purple-700 font-medium">{m.desc}</div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      +{m.fullness}% No • +{m.exp} EXP
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-purple-500 text-white font-fredoka font-black text-xs border border-purple-600 shadow-2xs">
                    {m.cost} 🪙
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL TỦ ĐỒ THỜI TRANG (PET WARDROBE) */}
      {/* ======================================================== */}
      {isWardrobeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[360px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <button
              onClick={() => setIsWardrobeModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="text-center mb-3">
              <span className="text-3xl">👗</span>
              <h3 className="font-fredoka text-base font-black text-amber-950 mt-1">
                TỦ ĐỒ THỜI TRANG THÚ CƯNG
              </h3>
              <p className="text-[11px] text-slate-500">
                Mặc phụ kiện lên bé cưng để tạo phong cách độc bản!
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {PET_ACCESSORIES.map((acc) => {
                const isOwned = ownedAccessories.includes(acc.id);
                const isEquipped = equippedAccessory === acc.id;
                const isLocked = acc.requireLevel && petLevel < acc.requireLevel;

                return (
                  <div
                    key={acc.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between shadow-2xs transition ${
                      isEquipped
                        ? 'bg-amber-100/80 border-amber-400'
                        : 'bg-white border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1 bg-amber-50 rounded-xl border border-amber-200">
                        {acc.icon}
                      </span>
                      <div>
                        <div className="font-fredoka font-black text-xs text-amber-950">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{acc.desc}</div>
                        {isLocked && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            Yêu cầu Cấp {acc.requireLevel} trở lên
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEquipAccessory(acc)}
                      disabled={isLocked}
                      className={`px-3 py-1.5 rounded-xl font-fredoka font-black text-xs transition active:scale-95 ${
                        isEquipped
                          ? 'bg-emerald-500 text-white border border-emerald-600 shadow-2xs'
                          : isOwned
                          ? 'bg-amber-400 hover:bg-amber-500 text-black border border-amber-500'
                          : isLocked
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-400 to-orange-400 text-black border border-amber-500 shadow-2xs'
                      }`}
                    >
                      {isEquipped ? 'Đang Mặc ✨' : isOwned ? 'Mặc Ngay' : `${acc.cost} 🪙`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL TIỆM NỘI THẤT TRANG TRÍ PHÒNG */}
      {/* ======================================================== */}
      {isDecorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[360px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <button
              onClick={() => setIsDecorModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="text-center mb-3">
              <span className="text-3xl">🛋️</span>
              <h3 className="font-fredoka text-base font-black text-amber-950 mt-1">
                TIỆM NỘI THẤT ẤM CÚNG
              </h3>
              <p className="text-[11px] text-slate-500">
                Làm đẹp căn phòng ấm cúng cho các bé đồng hành!
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {DECOR_ITEMS.map((item) => {
                const isOwned = ownedDecor.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-2xl bg-white border border-amber-200 flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1 bg-amber-50 rounded-xl border border-amber-200">
                        {item.icon}
                      </span>
                      <div>
                        <div className="font-fredoka font-black text-xs text-amber-950">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyDecor(item)}
                      disabled={isOwned}
                      className={`px-3 py-1.5 rounded-xl font-fredoka font-black text-xs transition active:scale-95 ${
                        isOwned
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500 shadow-2xs'
                      }`}
                    >
                      {isOwned ? 'Đã Có ✅' : `${item.cost} 🪙`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CozyPetView;
