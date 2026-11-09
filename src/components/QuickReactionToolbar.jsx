import React, { useState, useEffect } from 'react';
import { db, ref, set, onValue } from '../services/firebase';
import { sound } from '../utils/soundEffects';

export const REACTION_EMOJIS = [
  { emoji: '😂', label: 'Cười lớn' },
  { emoji: '😭', label: 'Khóc' },
  { emoji: '😡', label: 'Tức giận' },
  { emoji: '👏', label: 'Vỗ tay' },
  { emoji: '☕', label: 'Mời trà sữa' },
  { emoji: '🏳️', label: 'Cầu hòa' },
];

export function QuickReactionToolbar({
  roomCode,
  myRole,
  isBotMode = false,
  className = '',
}) {
  const [activeReactions, setActiveReactions] = useState([]);

  // Lắng nghe reaction từ Firebase nếu online
  useEffect(() => {
    if (!roomCode || isBotMode) return;

    const reactionRef = ref(db, `rooms/${roomCode}/reaction`);
    const unsubscribe = onValue(reactionRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && val.timestamp && Date.now() - val.timestamp < 4000) {
          triggerReaction(val.emoji, val.sender === myRole ? 'me' : 'opponent');
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode, isBotMode, myRole]);

  const triggerReaction = (emoji, source = 'me') => {
    sound.playPop();
    const id = Date.now() + Math.random();
    setActiveReactions((prev) => [...prev, { id, emoji, source }]);

    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  const handleSendReaction = (item) => {
    triggerReaction(item.emoji, 'me');

    // Đồng bộ Firebase nếu online
    if (roomCode && !isBotMode) {
      set(ref(db, `rooms/${roomCode}/reaction`), {
        sender: myRole,
        emoji: item.emoji,
        timestamp: Date.now(),
      }).catch((e) => console.error('Lỗi gửi biểu cảm:', e));
    }

    // Bot AI phản hồi hài hước nếu chơi solo
    if (isBotMode) {
      setTimeout(() => {
        const botPool = ['😂', '👏', '☕', '🐱', '😎'];
        const botEmoji = botPool[Math.floor(Math.random() * botPool.length)];
        triggerReaction(botEmoji, 'opponent');
      }, 1000);
    }
  };

  return (
    <div className={`w-full relative flex flex-col items-center ${className}`}>
      {/* Bong bóng biểu cảm bay bổng (Floating Emoji Animation) */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            style={{
              left: r.source === 'me' ? '75%' : '25%',
              bottom: '100%',
            }}
            className="absolute -translate-x-1/2 flex flex-col items-center animate-[floatUpEmoji_2.2s_ease-out_forwards]"
          >
            <div className="text-3xl sm:text-4xl p-2 rounded-full bg-white/95 border-2 border-amber-400 shadow-xl scale-110">
              {r.emoji}
            </div>
            <span className="text-[10px] font-fredoka font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 mt-1 shadow-xs">
              {r.source === 'me' ? 'Bạn' : isBotMode ? 'Bot AI' : 'Đối Thủ'}
            </span>
          </div>
        ))}
      </div>

      {/* Dải Nút Biểu Cảm Phía Dưới Bàn Cờ */}
      <div className="w-full bg-white/95 border border-orange-100 rounded-2xl p-1.5 shadow-sm flex items-center justify-between gap-1">
        <span className="text-[10px] font-fredoka font-bold text-amber-900 shrink-0 ml-1 hidden sm:inline">
          Cảm Xúc:
        </span>
        <div className="flex-1 flex items-center justify-around gap-1">
          {REACTION_EMOJIS.map((item) => (
            <button
              key={item.emoji}
              onClick={() => handleSendReaction(item)}
              title={item.label}
              className="p-1.5 rounded-xl hover:bg-amber-100 active:scale-90 transition text-base sm:text-lg flex flex-col items-center group"
            >
              <span className="group-hover:scale-125 transition-transform">{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuickReactionToolbar;
