import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, ref, push, onValue, set } from '../services/firebase';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { UserAvatar } from './UserAvatar';
import {
  Users,
  Copy,
  Check,
  UserPlus,
  X,
  Send,
  MessageCircle,
  Sparkles,
  Swords,
  Trash2,
  Store,
  Star,
  Heart,
  ChevronRight,
  Smile,
} from 'lucide-react';

const QUICK_EMOJIS = ['👋', '🧋', '🍜', '💖', '🔥', '🏆', '😂', '👏'];

export function FriendsModal({ onAcceptInvite }) {
  const {
    user,
    addFriend,
    removeFriend,
    sendGameInvite,
    isFriendsModalOpen,
    setIsFriendsModalOpen,
    incomingInvite,
    dismissInvite,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'dm'
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [visitingFriend, setVisitingFriend] = useState(null); // Friend shop showcase popup
  const [friendToDelete, setFriendToDelete] = useState(null); // Unfriend confirm
  const [inviteModalFriend, setInviteModalFriend] = useState(null); // Game invite picker

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [invitedUids, setInvitedUids] = useState({});
  const [likedShops, setLikedShops] = useState({});

  // Direct Chat state
  const [dmText, setDmText] = useState('');
  const [dmList, setDmList] = useState([]);
  const messagesEndRef = useRef(null);

  // Lắng nghe Direct Messages với bạn bè đã chọn
  useEffect(() => {
    if (!user?.uid || !selectedFriend?.uid) return;

    const chatId = [user.uid, selectedFriend.uid].sort().join('_');
    const chatRef = ref(db, `direct_chats/${chatId}/messages`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val,
        }));
        list.sort((a, b) => a.timestamp - b.timestamp);
        setDmList(list);
      } else {
        setDmList([]);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, selectedFriend?.uid]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (activeTab === 'dm' && selectedFriend) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmList, activeTab, selectedFriend]);

  if (!isFriendsModalOpen && !incomingInvite) return null;

  const handleCopyCode = () => {
    if (!user?.friendCode) return;
    navigator.clipboard.writeText(user.friendCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setFeedback('Đang tìm bạn bè...');
    const res = await addFriend(inputCode);
    if (res.success) {
      setFeedback(`Đã kết bạn thành công với ${res.name}! 🎉`);
      setInputCode('');
    } else {
      setFeedback(res.msg);
    }
  };

  const handleSendDuelInvite = async (friend, gameType = 'XIANGQI') => {
    const targetUid = friend.uid || friend.friendCode;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const ok = await sendGameInvite(targetUid, gameType, pin);
    if (ok) {
      setInvitedUids((prev) => ({ ...prev, [targetUid]: { pin, gameType } }));
      setInviteModalFriend(null);
      const gameLabel = gameType === 'XIANGQI' ? 'Cờ Tướng' : gameType === 'GO' ? 'Cờ Vây' : 'Cờ Caro';
      setFeedback(`Đã gửi lời mời đấu ${gameLabel} tới ${friend.displayName}! (PIN: ${pin}) ⚔️`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!friendToDelete) return;
    const friendKey = friendToDelete.uid || friendToDelete.friendCode;
    await removeFriend(friendKey);
    if (selectedFriend?.uid === friendToDelete.uid) {
      setSelectedFriend(null);
    }
    setFeedback(`Đã xóa ${friendToDelete.displayName} khỏi danh sách bạn bè.`);
    setFriendToDelete(null);
  };

  const handleSendDm = async (textToSend) => {
    const text = (textToSend || dmText).trim();
    if (!text || !user || !selectedFriend) return;

    sound.playClick();
    setDmText('');

    try {
      const chatId = [user.uid, selectedFriend.uid].sort().join('_');
      const chatRef = ref(db, `direct_chats/${chatId}/messages`);

      await push(chatRef, {
        senderId: user.uid,
        senderName: user.displayName,
        senderAvatar: user.avatar,
        text,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Lỗi gửi tin nhắn riêng:', e);
    }
  };

  const friendsList = user?.friends ? Object.values(user.friends) : [];

  return (
    <>
      {/* 1. POPUP LỜI MỜI THÁCH ĐẤU NHẬN ĐƯỢC (LIGHT THEME) */}
      {incomingInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
          <div className="w-full max-w-[360px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 shadow-2xl text-slate-800 text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2 border-amber-600 mx-auto flex items-center justify-center shadow-md -mt-10 mb-2 overflow-hidden">
              <UserAvatar avatar={incomingInvite.fromAvatar} className="w-full h-full" textClassName="text-3xl" border={false} />
            </div>
            <h3 className="font-fredoka text-lg font-black text-amber-950 mb-1">
              LỜI MỜI THÁCH ĐẤU! ⚔️
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              <strong>{incomingInvite.fromName}</strong> vừa mời bạn vào phòng đấu trí{' '}
              <span className="text-amber-700 font-black uppercase">
                {incomingInvite.gameType === 'XIANGQI'
                  ? 'Cờ Tướng Online'
                  : incomingInvite.gameType === 'GO'
                  ? 'Cờ Vây Online'
                  : 'Cờ Caro'}
              </span>!
              <br />
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 inline-block mt-1.5">
                Mã Phòng: {incomingInvite.roomPin}
              </span>
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  dismissInvite();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-fredoka font-bold text-xs transition"
              >
                Từ Chối
              </button>
              <button
                onClick={() => {
                  sound.playWin();
                  const inv = { ...incomingInvite };
                  dismissInvite();
                  if (onAcceptInvite) onAcceptInvite(inv);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black font-black font-fredoka text-xs shadow-md active:scale-95 transition"
              >
                Vào Phòng Ngay 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. POPUP GHÉ THĂM TIỆM ẨM THỰC BẠN BÈ */}
      {visitingFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
          <div className="w-full max-w-[360px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 shadow-2xl text-slate-800 text-center relative">
            <button
              onClick={() => setVisitingFriend(null)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-200 border-2 border-amber-400 mx-auto flex items-center justify-center shadow-sm mb-2 overflow-hidden">
              <UserAvatar avatar={visitingFriend.avatar} className="w-full h-full" textClassName="text-3xl" border={false} />
            </div>

            <h3 className="font-fredoka text-base font-black text-amber-950">
              TIỆM ẨM THỰC CỦA {visitingFriend.displayName.toUpperCase()}
            </h3>
            <div className="text-[11px] text-slate-500 font-mono mb-2">
              Mã Bạn Bè: #{visitingFriend.friendCode} • Cấp Độ {visitingFriend.level || 1}
            </div>

            {/* Đánh giá sao quán */}
            <div className="flex items-center justify-center gap-1 my-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
              ))}
              <span className="text-xs font-bold text-amber-800 font-fredoka ml-1">
                Quán 5 Sao Michelin ✨
              </span>
            </div>

            {/* Mô hình showcase mini quán */}
            <div className="my-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-fredoka font-bold text-slate-700">
                <span>🧋 Quầy Trà Sữa Hoàng Kim</span>
                <span className="text-emerald-700 font-black">Lv.10 (Tối Đa)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-fredoka font-bold text-slate-700">
                <span>🍜 Bếp Mì Cay 7 Cấp</span>
                <span className="text-red-700 font-black">Mở Đủ Cấp 7 🔥</span>
              </div>
              <div className="flex items-center justify-between text-xs font-fredoka font-bold text-slate-700">
                <span>🪑 Bàn Ghế Gỗ Sồi Sang Trọng</span>
                <span className="text-amber-800 font-black">+30% Tip</span>
              </div>
            </div>

            <p className="text-xs text-amber-900 bg-amber-100/60 p-2 rounded-xl mb-3 font-medium">
              "Chào mừng bạn ghé thăm tiệm của mình! Chúc tiệm chúng mình buôn may bán đắt nha! 🍜✨"
            </p>

            <button
              onClick={() => {
                sound.playCoin();
                confetti({ particleCount: 40, spread: 60 });
                setLikedShops((prev) => ({ ...prev, [visitingFriend.friendCode]: true }));
              }}
              disabled={likedShops[visitingFriend.friendCode]}
              className={`w-full py-2.5 rounded-xl font-fredoka font-black text-xs shadow transition active:scale-95 flex items-center justify-center gap-1.5 ${
                likedShops[visitingFriend.friendCode]
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white'
              }`}
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>
                {likedShops[visitingFriend.friendCode] ? 'Đã Thả Tim Tiệm Bạn ❤️' : 'Thả Tim & Chúc Quán Đắt Khách! (+5 Xu)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MODAL CHỌN MÔN THÁCH ĐẤU (CỜ TƯỚNG / CARO / CỜ VÂY) */}
      {inviteModalFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
          <div className="w-full max-w-[340px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 shadow-2xl text-slate-800 text-center relative">
            <button
              onClick={() => setInviteModalFriend(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="font-fredoka font-black text-sm text-amber-950 mb-1">
              ⚔️ THÁCH ĐẤU VỚI {inviteModalFriend.displayName}
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Chọn môn đấu trí bạn muốn so tài:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSendDuelInvite(inviteModalFriend, 'XIANGQI')}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:brightness-105 text-white font-fredoka font-black text-xs shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">♟️</span>
                  <span>Cờ Tướng Online (HOT)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/20">Mời Ngay ➔</span>
              </button>

              <button
                onClick={() => handleSendDuelInvite(inviteModalFriend, 'CARO')}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 text-white font-fredoka font-black text-xs shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭕</span>
                  <span>Cờ Caro 10x10</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/20">Mời Ngay ➔</span>
              </button>

              <button
                onClick={() => handleSendDuelInvite(inviteModalFriend, 'GO')}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 hover:brightness-105 text-white font-fredoka font-black text-xs shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚪⚫</span>
                  <span>Cờ Vây 9x9</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/20">Mời Ngay ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL XÁC NHẬN XÓA BẠN BÈ */}
      {friendToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
          <div className="w-full max-w-[320px] bg-[#FFFDF9] border-4 border-red-400 rounded-3xl p-5 shadow-2xl text-slate-800 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto mb-2 text-2xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-fredoka font-black text-sm text-slate-900 mb-1">
              XÁC NHẬN HỦY KẾT BẠN?
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc muốn xóa <b>{friendToDelete.displayName}</b> khỏi danh sách bạn bè không?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setFriendToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fredoka font-bold text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-fredoka font-black text-xs shadow active:scale-95"
              >
                Xóa Bạn Bè
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CHÍNH DANH BẠ BẠN BÈ & NHẮN TIN RIÊNG TƯ (LIGHT PASTEL) */}
      {isFriendsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
          <div className="relative w-full max-w-lg bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-800 flex flex-col max-h-[90vh]">
            {/* Nút đóng */}
            <button
              onClick={() => {
                sound.playClick();
                setIsFriendsModalOpen(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Tabs: Bạn bè vs Tin nhắn riêng */}
            <div className="flex items-center gap-2 mb-3 border-b border-amber-200 pb-2.5 pr-8">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('friends');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fredoka font-black text-xs sm:text-sm transition ${
                  activeTab === 'friends'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Bạn Bè ({friendsList.length})</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('dm');
                  if (!selectedFriend && friendsList.length > 0) {
                    setSelectedFriend(friendsList[0]);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fredoka font-black text-xs sm:text-sm transition ${
                  activeTab === 'dm'
                    ? 'bg-cyan-400 text-black shadow-sm'
                    : 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Tin Nhắn Riêng (DM)</span>
              </button>
            </div>

            {/* TAB 1: DANH SÁCH BẠN BÈ */}
            {activeTab === 'friends' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Mã của tôi */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                      MÃ BẠN BÈ CỦA BẠN:
                    </span>
                    <span className="font-mono font-black text-base sm:text-lg text-amber-950 tracking-widest">
                      {user?.friendCode || '------'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs shadow-sm transition active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Đã copy' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* Ô thêm bạn */}
                <form onSubmit={handleAddFriend} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="Nhập mã bạn bè (VD: HA6868)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-300 text-slate-800 font-mono text-xs uppercase focus:outline-none focus:border-amber-500 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs shadow active:scale-95 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </form>

                {feedback && (
                  <div className="p-2 bg-amber-100 rounded-xl text-center text-xs text-amber-900 border border-amber-300 font-medium">
                    {feedback}
                  </div>
                )}

                {/* Danh sách bạn bè */}
                <div className="space-y-2">
                  {friendsList.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs bg-amber-50/50 rounded-2xl border border-amber-200">
                      Chưa có bạn bè nào. Hãy chia sẻ Mã Bạn Bè của bạn để kết bạn nhé!
                    </div>
                  ) : (
                    friendsList.map((fr) => {
                      const friendKey = fr.uid || fr.friendCode;
                      return (
                        <div
                          key={friendKey}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white rounded-2xl border border-orange-100 hover:border-amber-300 shadow-sm transition gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <UserAvatar avatar={fr.avatar} className="w-9 h-9" textClassName="text-xl" />
                            <div className="min-w-0">
                              <div className="font-fredoka font-black text-sm text-slate-800 truncate">
                                {fr.displayName}
                              </div>
                              <div className="text-[10px] text-amber-800 font-mono">
                                #{fr.friendCode} • Cấp {fr.level || 1}
                              </div>
                            </div>
                          </div>

                          {/* 4 NÚT HÀNH ĐỘNG CHO MỖI BẠN BÈ */}
                          <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                            {/* 1. Mời Đấu */}
                            <button
                              onClick={() => {
                                sound.playClick();
                                setInviteModalFriend(fr);
                              }}
                              title="Mời Thách Đấu Minigame"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-[11px] shadow-sm active:scale-95 transition"
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>Mời Đấu</span>
                            </button>

                            {/* 2. Ghé Thăm Tiệm */}
                            <button
                              onClick={() => {
                                sound.playClick();
                                setVisitingFriend(fr);
                              }}
                              title="Ghé Thăm Tiệm Ẩm Thực"
                              className="p-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200 transition"
                            >
                              <Store className="w-4 h-4" />
                            </button>

                            {/* 3. Nhắn Tin Riêng (DM) */}
                            <button
                              onClick={() => {
                                sound.playClick();
                                setSelectedFriend(fr);
                                setActiveTab('dm');
                              }}
                              title="Nhắn tin riêng"
                              className="p-1.5 rounded-xl bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-cyan-200 transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            {/* 4. Xóa Bạn */}
                            <button
                              onClick={() => {
                                sound.playClick();
                                setFriendToDelete(fr);
                              }}
                              title="Xóa bạn bè"
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TIN NHẮN RIÊNG TƯ (DIRECT MESSAGES 1-1) */}
            {activeTab === 'dm' && (
              <div className="flex-1 flex flex-col min-h-[340px]">
                {friendsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs bg-amber-50/50 rounded-2xl border border-amber-200">
                    Bạn chưa có bạn bè để nhắn tin. Hãy thêm bạn bè ở tab Bạn Bè trước nhé!
                  </div>
                ) : (
                  <>
                    {/* Dải avatar bạn bè chọn chat */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-amber-200 mb-2">
                      {friendsList.map((fr) => {
                        const isChosen = selectedFriend?.friendCode === fr.friendCode;
                        return (
                          <button
                            key={fr.friendCode}
                            onClick={() => {
                              sound.playClick();
                              setSelectedFriend(fr);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-fredoka font-bold transition shrink-0 ${
                              isChosen
                                ? 'bg-cyan-400 text-black shadow-sm font-black'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <UserAvatar avatar={fr.avatar} className="w-5 h-5" textClassName="text-xs" border={false} />
                            <span className="truncate max-w-[90px]">{fr.displayName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Hộp thoại chat 1-1 */}
                    {selectedFriend && (
                      <div className="flex-1 flex flex-col bg-amber-50/40 rounded-2xl border border-amber-200 p-2.5 min-h-[220px]">
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                          {dmList.length === 0 ? (
                            <div className="text-center text-slate-500 text-[11px] py-10">
                              Chưa có tin nhắn riêng nào với {selectedFriend.displayName}.
                              <br />
                              Hãy gửi lời chào hoặc biểu cảm đầu tiên! 👋
                            </div>
                          ) : (
                            dmList.map((m) => {
                              const isMe = m.senderId === user?.uid;
                              return (
                                <div
                                  key={m.id}
                                  className={`flex items-start gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                  {!isMe && (
                                    <UserAvatar avatar={m.senderAvatar} className="w-6 h-6" textClassName="text-xs" />
                                  )}
                                  <div
                                    className={`max-w-[78%] px-3 py-1.5 rounded-2xl text-[12px] leading-tight break-words ${
                                      isMe
                                        ? 'bg-amber-400 text-black font-semibold rounded-tr-none shadow-xs'
                                        : 'bg-white text-slate-800 rounded-tl-none border border-amber-200 shadow-xs'
                                    }`}
                                  >
                                    <div>{m.text}</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Quick emoji */}
                        <div className="flex items-center gap-1 py-1 overflow-x-auto border-t border-amber-200 mt-1">
                          {QUICK_EMOJIS.map((em) => (
                            <button
                              key={em}
                              onClick={() => handleSendDm(em)}
                              className="text-base px-1.5 py-0.5 rounded-lg hover:bg-amber-200 active:scale-90 transition shrink-0"
                            >
                              {em}
                            </button>
                          ))}
                        </div>

                        {/* Input gửi tin */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendDm();
                          }}
                          className="flex items-center gap-1.5 pt-1"
                        >
                          <input
                            type="text"
                            value={dmText}
                            onChange={(e) => setDmText(e.target.value)}
                            placeholder={`Nhắn tin cho ${selectedFriend.displayName}...`}
                            maxLength={100}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-800 text-xs focus:outline-none focus:border-amber-500 placeholder-slate-400"
                          />
                          <button
                            type="submit"
                            disabled={!dmText.trim()}
                            className="p-2 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-black font-bold active:scale-95 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FriendsModal;
