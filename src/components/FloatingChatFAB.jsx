import React, { useState, useEffect, useRef } from 'react';
import { db, ref, push, onValue, set } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { UserAvatar } from './UserAvatar';
import { MessageSquare, Send, X, Smile, MessageCircle, MessageSquareText } from 'lucide-react';

// TAB 1: MEME & EMOJIS ĐỘNG
export const MEME_EMOJIS = [
  { emoji: '😏', label: 'Cười đểu' },
  { emoji: '😭', label: 'Khóc thét' },
  { emoji: '😡', label: 'Tức giận' },
  { emoji: '🦫', label: 'Capybara' },
  { emoji: '🧋', label: 'Mời trà sữa' },
  { emoji: '🤡', label: 'Hề chúa' },
  { emoji: '🚀', label: 'Bay màu' },
  { emoji: '💣', label: 'Bom nổ' },
  { emoji: '👑', label: 'Đỉnh chóp' },
  { emoji: '🔥', label: 'Cháy quá' },
  { emoji: '🏆', label: 'Vô địch' },
  { emoji: '👀', label: 'Soi cờ' },
];

// TAB 2: CÂU THOẠI NHANH
export const QUICK_PHRASES = [
  'Đi nhanh lên bạn ơi! ⚡',
  'Nước cờ hay đấy! 👏',
  'Cay chưa nè! 🌶️',
  'Ván nữa không? 🔄',
  'Chờ chút đang bận... ☕',
  'Ủa alo? Tính đi đâu? 🧐',
  'May mắn thôi nhé! 😉',
  'Tha cho mình ván này! 🙏',
];

export function FloatingChatFAB({ roomPin, isBotMode = false }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('emoji'); // 'emoji' | 'phrases' | 'chat'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingBubbles, setFloatingBubbles] = useState([]);
  const messagesEndRef = useRef(null);

  // 1. Lắng nghe tin nhắn
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

  // 2. Lắng nghe biểu cảm reaction & câu thoại bay lên
  useEffect(() => {
    if (!roomPin || isBotMode) return;

    const reactionRef = ref(db, `rooms/${roomPin}/reactions`);
    const unsubscribe = onValue(reactionRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && val.timestamp && Date.now() - val.timestamp < 4000) {
          triggerFloatingBubble(val.content, val.type || 'emoji', val.fromName || 'Đối thủ');
        }
      }
    });

    return () => unsubscribe();
  }, [roomPin, isBotMode]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const triggerFloatingBubble = (content, type, fromName) => {
    sound.playPop();
    const id = Date.now() + Math.random();
    setFloatingBubbles((prev) => [...prev, { id, content, type, fromName }]);

    setTimeout(() => {
      setFloatingBubbles((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  // Gửi Emoji
  const handleSendEmoji = async (emoji) => {
    sound.playPop();
    triggerFloatingBubble(emoji, 'emoji', user?.displayName || 'Bạn');

    if (!roomPin || isBotMode || !user) return;
    try {
      await set(ref(db, `rooms/${roomPin}/reactions`), {
        content: emoji,
        type: 'emoji',
        fromUid: user.uid,
        fromName: user.displayName,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Lỗi gửi emoji:', e);
    }
  };

  // Gửi Câu thoại nhanh
  const handleSendPhrase = async (phrase) => {
    sound.playPop();
    triggerFloatingBubble(phrase, 'phrase', user?.displayName || 'Bạn');

    if (!roomPin || isBotMode || !user) return;
    try {
      await set(ref(db, `rooms/${roomPin}/reactions`), {
        content: phrase,
        type: 'phrase',
        fromUid: user.uid,
        fromName: user.displayName,
        timestamp: Date.now(),
      });
      // Cũng lưu vào lịch sử tin nhắn
      const msgRef = ref(db, `rooms/${roomPin}/messages`);
      await push(msgRef, {
        senderId: user.uid,
        senderName: user.displayName,
        senderAvatar: user.avatar,
        text: phrase,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Lỗi gửi câu thoại:', e);
    }
  };

  // Gửi Tin nhắn văn bản
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    sound.playClick();
    setInputText('');
    triggerFloatingBubble(text, 'text', user?.displayName || 'Bạn');

    if (!roomPin || isBotMode || !user) return;
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
      {/* HIỆU ỨNG BONG BÓNG EMOJI & CÂU THOẠI BAY LÊN MÀN HÌNH */}
      <div className="fixed inset-x-0 bottom-24 pointer-events-none z-50 flex flex-col items-center gap-2">
        {floatingBubbles.map((b) => (
          <div
            key={b.id}
            className="animate-in fade-in slide-in-from-bottom-8 duration-300 flex flex-col items-center"
          >
            {b.type === 'emoji' ? (
              <div className="text-5xl filter drop-shadow-lg animate-bounce select-none">
                {b.content}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-2xl bg-amber-400 border-2 border-white text-black font-fredoka font-black text-xs shadow-xl animate-bounce">
                💬 {b.content}
              </div>
            )}
            <span className="text-[9px] font-fredoka font-bold bg-black/70 text-white px-2 py-0.5 rounded-full mt-1">
              {b.fromName}
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
        className="fixed bottom-4 right-3 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-white active:scale-90 transition hover:brightness-105"
      >
        <MessageSquare className="w-5 h-5 fill-white/20 stroke-[2.5]" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 border border-white text-white font-black text-[10px] animate-bounce">
            +{unreadCount}
          </span>
        )}
      </button>

      {/* BOTTOM SHEET CHIẾM 42% MÀN HÌNH VỚI 3 TAB */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in select-none font-jakarta">
          <div className="w-full max-w-[440px] h-[45vh] bg-[#FFFDF9] border-t-4 border-amber-400 rounded-t-3xl shadow-2xl flex flex-col p-3 overflow-hidden animate-in slide-in-from-bottom-4">
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

            {/* 3 TABS ĐIỀU HƯỚNG */}
            <div className="grid grid-cols-3 gap-1 my-2 p-0.5 bg-amber-100/70 rounded-xl border border-amber-200">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('emoji');
                }}
                className={`py-1 rounded-lg text-xs font-fredoka font-bold flex items-center justify-center gap-1 transition ${
                  activeTab === 'emoji'
                    ? 'bg-white text-amber-950 shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Meme</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('phrases');
                }}
                className={`py-1 rounded-lg text-xs font-fredoka font-bold flex items-center justify-center gap-1 transition ${
                  activeTab === 'phrases'
                    ? 'bg-white text-amber-950 shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>Thoại Nhanh</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('chat');
                  setUnreadCount(0);
                }}
                className={`py-1 rounded-lg text-xs font-fredoka font-bold flex items-center justify-center gap-1 transition relative ${
                  activeTab === 'chat'
                    ? 'bg-white text-amber-950 shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat</span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                )}
              </button>
            </div>

            {/* TAB 1: MEME EMOJIS */}
            {activeTab === 'emoji' && (
              <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 p-1">
                {MEME_EMOJIS.map((m) => (
                  <button
                    key={m.emoji}
                    onClick={() => handleSendEmoji(m.emoji)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 hover:bg-amber-200 border border-amber-200 active:scale-90 transition shadow-2xs"
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[9px] font-fredoka font-bold text-amber-900 mt-1 truncate w-full text-center">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB 2: CÂU THOẠI NHANH */}
            {activeTab === 'phrases' && (
              <div className="flex-1 overflow-y-auto space-y-1.5 p-1">
                {QUICK_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPhrase(phrase)}
                    className="w-full p-2 text-left rounded-xl bg-white hover:bg-amber-100 border border-amber-200 text-xs font-fredoka font-bold text-amber-950 active:scale-98 transition shadow-2xs flex items-center justify-between"
                  >
                    <span>{phrase}</span>
                    <span className="text-[10px] text-amber-700">Gửi ⚡</span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB 3: TRÒ CHUYỆN VĂN BẢN TỰ DO */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 text-xs">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-[11px] py-4 font-fredoka">
                      Chưa có tin nhắn. Nhập tin nhắn gửi đối thủ nào! 👋
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
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-800 text-xs focus:outline-none focus:border-amber-500 placeholder-slate-400 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-amber-950 font-bold active:scale-95 transition shadow-2xs text-xs font-fredoka flex items-center gap-1"
                  >
                    <span>Gửi</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChatFAB;
