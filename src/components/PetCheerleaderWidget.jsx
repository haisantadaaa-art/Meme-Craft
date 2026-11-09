import React, { useState, useEffect } from 'react';
import { sound } from '../utils/soundEffects';
import { Sparkles, Heart } from 'lucide-react';

const CHEER_MESSAGES = [
  'Cố lên chủ nhân ơi! 🐾',
  'Nước cờ thần sầu quá! ✨',
  'Bé cưng tin chủ nhân sẽ thắng! 🏆',
  'Tập trung cao độ nào! 🔥',
  'Bé đang cổ vũ hết mình nè! 💖',
  'Tuyệt vời ông mặt trời! ☀️',
];

export function PetCheerleaderWidget({ petId = 'capybara', lastAction = '' }) {
  const [cheerText, setCheerText] = useState('Bé cưng đang cổ vũ! 🐾');
  const [isJumping, setIsJumping] = useState(false);
  const [hearts, setHearts] = useState([]);

  const currentPetId = petId || localStorage.getItem('cozy_pet_selected') || 'capybara';

  // Tự động nhảy và cổ vũ định kỳ hoặc khi có hành động
  useEffect(() => {
    const timer = setInterval(() => {
      const randomMsg = CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
      setCheerText(randomMsg);
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 900);
    }, 9000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (lastAction) {
      setCheerText(lastAction);
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 900);
    }
  }, [lastAction]);

  const handlePetCheer = () => {
    sound.playCheer();
    setIsJumping(true);
    setCheerText('Gâu gâu! Cố lên nào! 🔥');
    setTimeout(() => setIsJumping(false), 1000);

    const id = Date.now();
    setHearts((prev) => [...prev, id]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h !== id)), 1200);
  };

  return (
    <div className="fixed bottom-3 right-3 sm:right-auto sm:left-[calc(50%+140px)] z-40 flex items-end gap-1.5 pointer-events-auto select-none">
      {/* Bong bóng thoại cổ vũ */}
      <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl rounded-br-xs border-2 border-amber-300 shadow-lg text-[11px] font-fredoka font-black text-amber-950 max-w-[130px] leading-tight animate-bounce">
        {cheerText}
      </div>

      {/* Mascot thú cưng mini nhún nhảy - Thuần túy cổ động viên, không can thiệp ván cờ */}
      <div
        onClick={handlePetCheer}
        title="Cổ động viên hậu trường! Bấm để xem bé nhảy múa"
        className={`w-12 h-12 rounded-2xl bg-amber-100/90 border-2 border-amber-400 p-1 flex items-center justify-center cursor-pointer shadow-md transition-transform duration-300 active:scale-90 ${
          isJumping ? '-translate-y-2 scale-110' : 'hover:scale-105'
        }`}
      >
        <span className="text-2xl leading-none">
          {currentPetId === 'capybara' ? '🍊' : currentPetId === 'shiba' ? '🐕' : '🐱'}
        </span>

        {hearts.map((h) => (
          <span
            key={h}
            className="absolute -top-3 -right-1 text-sm animate-in fade-in zoom-in-50 duration-500 pointer-events-none"
          >
            💖
          </span>
        ))}
      </div>
    </div>
  );
}

export default PetCheerleaderWidget;
