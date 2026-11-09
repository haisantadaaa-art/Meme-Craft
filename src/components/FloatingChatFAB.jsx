import React, { useState, useEffect, useRef } from 'react';
import { db, ref, push, onValue, set } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { UserAvatar } from './UserAvatar';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

export const QUICK_EMOJIS = ['😂', '😭', '😡', '👏', '☕', '🏳️'];

export function FloatingChatFAB({ roomPin, isBotMode = false }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const messagesEndRef = useRef(null);

  // 1. Lắng nghe tin nhắn từ node rooms/{roomPin}/messages
  useEffect(() => {
    if (!roomPin || isBotMode) return;

    const msgRef = ref(db, `rooms/${roomPin}/messages`);
    const unsubscribe = onValue(msgRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val,
        }));
        list.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(list);

        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    });

    return () => unsubscribe();
  }, [roomPin, isBotMode, isOpen]);

  // 2. Lắng nghe biểu cảm reaction nhanh từ node rooms/{roomPin}/reactions
  useEffect(() => {
    if (!roomPin || isBotMode) return;

    const reactionRef = ref(db, `rooms/${roomPin}/reactions`);
    const unsubscribe = onValue(reactionRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && val.timestamp && Date.now() - val.timestamp < 4000) {
          triggerFloatingReaction(val.emoji, val.fromName || 'Đối thủ');
        }
      }
    });

    return () => unsubscribe();
  }, [roomPin, isBotMode]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const triggerFloatingReaction = (emoji, fromName) => {
    sound.playPop();
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, fromName }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  const handleSendQuickEmoji = async (emoji) => {
    if (!roomPin || isBotMode || !user) return;
    sound.playPop();
    triggerFloatingReaction(emoji, user.displayName);

    try {
      await set(ref(db, `rooms/${roomPin}/reactions`), {
        emoji,
        fromUid: user.uid,
        fromName: user.displayName,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Lỗi gửi reaction:', e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !roomPin || !user) return;

    sound.playClick();
    setInputText('');

    try {
      const msgRef = ref(db, `rooms/${roomPin}/messages`);
      await push(msgRef, {
        senderId: user.uid,
        senderName: user.displayName,
        senderAvatar: user.avatar,
        text,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Lỗi gửi tin nhắn:', e);
    }
  };

  return (
    <>
      {/* HIỆU ỨNG EMOJI BAY LÊN TRÊN MÀN HÌNH */}
      <div className="fixed inset-x-0 bottom-24 pointer-events-none z-50 flex justify-center">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="animate-in fade-in slide-in-from-bottom-6 duration-300 flex flex-col items-center mx-2"
          >
            <div className="text-4xl filter drop-shadow-md animate-bounce">{r.emoji}</div>
            <span className="text-[10px] font-fredoka font-bold bg-black/60 text-white px-2 py-0.5 rounded-full mt-1">
              {r.fromName}
            </span>
          </div>
        ))}
      </div>

      {/* NÚT FAB GÓC DƯỚI PHẢI */}
      <button
        onClick={() => {
          sound.playClick();
          setIsOpen(true);
        }}
        title="Mở Chat & Cảm Xúc Nhanh"
        className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border-2 border-white shadow-xl flex items-center justify-center text-white active:scale-90 transition hover:brightness-105"
      >
        <MessageSquare className="w-5 h-5 fill-white/20 stroke-[2.5]" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 border border-white text-white font-black text-[10px] animate-bounce">
            +{unreadCount}
          </span>
        )}
      </button>

      {/* BOTTOM SHEET CHIẾM 40% MÀN HÌNH */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in select-none font-jakarta">
          <div className="w-full max-w-[440px] h-[40vh] bg-[#FFFDF9] border-t-4 border-amber-400 rounded-t-3xl shadow-2xl flex flex-col p-3 overflow-hidden animate-in slide-in-from-bottom-4">
            {/* Header Bottom Sheet */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="font-fredoka font-black text-xs text-amber-950">
                  TRÒ CHUYỆN & CẢM XÚC NHANH
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsOpen(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Hàng trên cùng: Dãy 6 Quick Emojis */}
            <div className="flex items-center justify-around py-2 border-b border-amber-100 bg-amber-50/50 rounded-2xl my-1.5">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendQuickEmoji(emoji)}
                  className="text-2xl p-1 rounded-xl hover:bg-amber-200 active:scale-90 transition"
                  title="Gửi cảm xúc"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Hàng dưới: Lịch sử tin nhắn */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 text-xs">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 text-[11px] py-4">
                  Chưa có tin nhắn nào. Gửi lời chào đối thủ nhé! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <UserAvatar avatar={msg.senderAvatar} className="w-5 h-5" textClassName="text-xs" />
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-[11px] leading-tight break-words ${
                          isMe
                            ? 'bg-amber-400 text-amber-950 font-bold rounded-tr-none shadow-2xs'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-2xs'
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[9px] text-amber-800 font-bold mb-0.5">
                            {msg.senderName}
                          </div>
                        )}
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Ô input nhập tin nhắn */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-1.5 border-t border-amber-200">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                maxLength={80}
                className="flex-1 px-3 py-2 rounded-2xl bg-white border border-amber-300 text-slate-800 text-xs focus:outline-none focus:border-amber-500 placeholder-slate-400 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-2xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-amber-950 font-bold active:scale-95 transition shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChatFAB;
