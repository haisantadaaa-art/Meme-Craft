import React, { useState, useEffect } from 'react';
import { db, ref, set, get, update, onValue, remove } from '../services/firebase';
import { sound } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Bot,
  Zap,
  Users,
  Copy,
  Check,
  KeyRound,
  Swords,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export function GameLobbyModal({
  gameType,
  onStartGame,
  onClose,
}) {
  const { user, sendGameInvite } = useAuth();
  const [tab, setTab] = useState('menu'); // 'menu' | 'quick_match' | 'custom_room' | 'invite_friends'

  // Custom room state
  const [customPin, setCustomPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [roomStatus, setRoomStatus] = useState('idle'); // 'waiting' | 'joining'
  const [statusMsg, setStatusMsg] = useState('');

  // Quick matchmaking state
  const [isSearchingQuick, setIsSearchingQuick] = useState(false);
  const [quickSearchTimer, setQuickSearchTimer] = useState(0);

  // Invite friends state
  const [invitedMap, setInvitedMap] = useState({});

  const gameInfo = {
    XIANGQI: {
      name: 'Cờ Tướng Online',
      icon: '♟️',
      roleHost: 'r',
      roleGuest: 'b',
      badge: 'HOT - Đấu Trí Thời Gian Thực',
      theme: 'from-red-500 to-orange-500',
    },
    GO: {
      name: 'Cờ Vây Online',
      icon: '⚪⚫',
      roleHost: 'b',
      roleGuest: 'w',
      badge: 'Chiến Thuật 9x9',
      theme: 'from-slate-700 to-slate-900',
    },
    CARO: {
      name: 'Cờ Caro 10x10',
      icon: '⭕',
      roleHost: 'X',
      roleGuest: 'O',
      badge: 'Kinh Điển',
      theme: 'from-blue-500 to-indigo-600',
    },
  }[gameType] || {
    name: 'Đấu Trí Online',
    icon: '🎮',
    roleHost: 'X',
    roleGuest: 'O',
    badge: 'Minigame',
    theme: 'from-amber-500 to-orange-500',
  };

  // 1. TÙY CHỌN 1: ĐẤU VỚI BOT AI NGAY LẬP TỨC
  const handlePlayBot = () => {
    sound.playClick();
    onStartGame(gameType, '', true, 'X');
    onClose();
  };

  // 2. TÙY CHỌN 2: TÌM TRẬN NHANH (GHÉP 2 NGƯỜI ONLINE QUA FIREBASE)
  const handleQuickMatch = async () => {
    sound.playClick();
    setTab('quick_match');
    setIsSearchingQuick(true);
    setStatusMsg('Đang tìm kiếm phòng của người chơi khác...');

    try {
      const mmRef = ref(db, `matchmaking/${gameType}`);
      const snap = await get(mmRef);

      if (snap.exists()) {
        const rooms = snap.val();
        // Tìm phòng đang đợi mà không phải do chính mình tạo
        const availableEntry = Object.entries(rooms).find(
          ([pin, data]) => data?.status === 'waiting' && data?.hostId !== user?.uid
        );

        if (availableEntry) {
          const [foundPin, roomData] = availableEntry;
          setStatusMsg(`Đã ghép trận thành công! Vào phòng #${foundPin}...`);
          sound.playWin();

          // Cập nhật làm Guest
          await update(ref(db, `rooms/${foundPin}`), {
            guest: {
              id: user?.uid || 'guest_1',
              name: user?.displayName || 'Khách Ghé Thăm',
              avatar: user?.avatar || '👩‍🍳',
              role: gameInfo.roleGuest,
            },
            status: 'playing',
          });

          // Xóa khỏi hàng chờ matchmaking
          await remove(ref(db, `matchmaking/${gameType}/${foundPin}`));

          setTimeout(() => {
            onStartGame(gameType, foundPin, false, 'O');
            onClose();
          }, 600);
          return;
        }
      }

      // Nếu không có phòng nào chờ -> Tạo phòng mới và đợi
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      setCustomPin(newPin);
      setStatusMsg('Đang đợi người chơi khác ghép vào...');

      // Ghi phòng vào rooms và matchmaking
      await set(ref(db, `rooms/${newPin}`), {
        gameType,
        pin: newPin,
        status: 'waiting',
        host: {
          id: user?.uid || 'host_1',
          name: user?.displayName || 'Chủ Quán',
          avatar: user?.avatar || '👩‍🍳',
          role: gameInfo.roleHost,
        },
        createdAt: Date.now(),
      });

      await set(ref(db, `matchmaking/${gameType}/${newPin}`), {
        hostId: user?.uid || 'host_1',
        status: 'waiting',
        createdAt: Date.now(),
      });

      // Lắng nghe người chơi khác tham gia
      const roomListener = onValue(ref(db, `rooms/${newPin}`), (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val.status === 'playing' && val.guest) {
            sound.playWin();
            setStatusMsg(`Đối thủ ${val.guest.name} đã vào trận! 🚀`);
            remove(ref(db, `matchmaking/${gameType}/${newPin}`)).catch(() => {});
            setTimeout(() => {
              onStartGame(gameType, newPin, false, 'X');
              onClose();
            }, 500);
          }
        }
      });

      return () => roomListener();
    } catch (e) {
      console.error('Lỗi tìm trận nhanh:', e);
      setStatusMsg('Lỗi kết nối Firebase. Bạn có thể thử lại hoặc đấu với Bot AI.');
    }
  };

  // Đếm giây tìm trận nhanh
  useEffect(() => {
    let interval = null;
    if (isSearchingQuick) {
      interval = setInterval(() => {
        setQuickSearchTimer((t) => t + 1);
      }, 1000);
    } else {
      setQuickSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearchingQuick]);

  // 3. TÙY CHỌN 3: TẠO PHÒNG RIÊNG 4 SỐ PIN
  const handleCreateCustomRoom = async () => {
    sound.playClick();
    setTab('custom_room');
    setRoomStatus('waiting');
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setCustomPin(newPin);

    try {
      await set(ref(db, `rooms/${newPin}`), {
        gameType,
        pin: newPin,
        status: 'waiting',
        host: {
          id: user?.uid || 'host_1',
          name: user?.displayName || 'Chủ Quán',
          avatar: user?.avatar || '👩‍🍳',
          role: gameInfo.roleHost,
        },
        createdAt: Date.now(),
      });

      // Lắng nghe người chơi khác vào phòng
      const roomListener = onValue(ref(db, `rooms/${newPin}`), (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val.status === 'playing' && val.guest) {
            sound.playWin();
            setTimeout(() => {
              onStartGame(gameType, newPin, false, 'X');
              onClose();
            }, 400);
          }
        }
      });

      return () => roomListener();
    } catch (e) {
      console.error('Lỗi tạo phòng riêng:', e);
    }
  };

  // Vào phòng bằng mã PIN 4 số
  const handleJoinByPin = async (e) => {
    e.preventDefault();
    const pin = inputPin.trim();
    if (pin.length !== 4) {
      setStatusMsg('Mã phòng phải gồm đúng 4 chữ số!');
      return;
    }

    sound.playClick();
    setRoomStatus('joining');
    setStatusMsg(`Đang kiểm tra phòng #${pin}...`);

    try {
      const roomSnap = await get(ref(db, `rooms/${pin}`));
      if (!roomSnap.exists()) {
        setStatusMsg('Phòng không tồn tại hoặc đã bị hủy!');
        setRoomStatus('idle');
        return;
      }

      const roomData = roomSnap.val();
      if (roomData.status === 'playing' && roomData.guest) {
        setStatusMsg('Phòng này đã đủ 2 người chơi!');
        setRoomStatus('idle');
        return;
      }

      // Tham gia phòng
      await update(ref(db, `rooms/${pin}`), {
        guest: {
          id: user?.uid || 'guest_1',
          name: user?.displayName || 'Khách Ghé Thăm',
          avatar: user?.avatar || '👩‍🍳',
          role: gameInfo.roleGuest,
        },
        status: 'playing',
      });

      sound.playWin();
      setTimeout(() => {
        onStartGame(gameType, pin, false, 'O');
        onClose();
      }, 400);
    } catch (e) {
      console.error('Lỗi vào phòng:', e);
      setStatusMsg('Lỗi kết nối khi tham gia phòng!');
      setRoomStatus('idle');
    }
  };

  // 4. TÙY CHỌN 4: MỜI BẠN BÈ ĐANG ONLINE
  const handleInviteFriendToGame = async (fr) => {
    sound.playClick();
    const newPin = customPin || Math.floor(1000 + Math.random() * 9000).toString();
    setCustomPin(newPin);

    // Tạo phòng trước
    await set(ref(db, `rooms/${newPin}`), {
      gameType,
      pin: newPin,
      status: 'waiting',
      host: {
        id: user?.uid || 'host_1',
        name: user?.displayName || 'Chủ Quán',
        avatar: user?.avatar || '👩‍🍳',
        role: gameInfo.roleHost,
      },
      createdAt: Date.now(),
    });

    const targetUid = fr.uid || fr.friendCode;
    const ok = await sendGameInvite(targetUid, gameType, newPin);
    if (ok) {
      setInvitedMap((prev) => ({ ...prev, [targetUid]: true }));
      setStatusMsg(`Đã gửi lời mời tới ${fr.displayName}! Đang đợi bạn ấy chấp nhận...`);

      // Lắng nghe bạn bè bấm Tham Gia Ngay
      const roomListener = onValue(ref(db, `rooms/${newPin}`), (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val.status === 'playing' && val.guest) {
            sound.playWin();
            setTimeout(() => {
              onStartGame(gameType, newPin, false, 'X');
              onClose();
            }, 400);
          }
        }
      });
      return () => roomListener();
    }
  };

  const copyPin = () => {
    if (!customPin) return;
    navigator.clipboard.writeText(customPin);
    setIsCopied(true);
    sound.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const friendsList = user?.friends ? Object.values(user.friends) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
      <div className="w-full max-w-[390px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-800 relative max-h-[92vh] flex flex-col">
        {/* Nút Đóng */}
        <button
          onClick={() => {
            sound.playClick();
            if (customPin) {
              remove(ref(db, `rooms/${customPin}`)).catch(() => {});
              remove(ref(db, `matchmaking/${gameType}/${customPin}`)).catch(() => {});
            }
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-2.5 mb-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border border-amber-500 flex items-center justify-center text-2xl shadow-sm">
            {gameInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-fredoka font-black text-sm sm:text-base text-amber-950">
                {gameInfo.name}
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-red-500 text-white animate-pulse">
                HOT
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80">
              Chọn chế độ so tài trí tuệ
            </p>
          </div>
        </div>

        {/* NỘI DUNG THEO TAB */}
        {tab === 'menu' && (
          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 py-1">
            {/* 1. Luyện Tập Với Bot AI */}
            <button
              onClick={handlePlayBot}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white font-fredoka shadow-md transition active:scale-95 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
                  🤖
                </div>
                <div>
                  <div className="font-black text-sm">Luyện Tập Với Bot AI</div>
                  <div className="text-[10px] text-emerald-100 font-medium">
                    Không cần đợi, tập dượt khai cuộc & chiến thuật
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 text-white/80" />
            </button>

            {/* 2. Tìm Trận Nhanh 2 Người Online */}
            <button
              onClick={handleQuickMatch}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white font-fredoka shadow-md transition active:scale-95 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
                  ⚡
                </div>
                <div>
                  <div className="font-black text-sm flex items-center gap-1.5">
                    <span>Tìm Trận Nhanh (Online)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-yellow-300 text-black font-black">
                      Ghép 2 người
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-100 font-medium">
                    Tự động ghép nối với kỳ thủ đang online
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 text-white/80" />
            </button>

            {/* 3. Tạo Phòng Chơi Riêng & Nhập Mã PIN */}
            <button
              onClick={handleCreateCustomRoom}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 text-white font-fredoka shadow-md transition active:scale-95 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
                  🔑
                </div>
                <div>
                  <div className="font-black text-sm">Tạo Phòng Chơi Riêng</div>
                  <div className="text-[10px] text-blue-100 font-medium">
                    Mã PIN 4 số chia sẻ bạn bè hoặc nhập mã vào phòng
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 text-white/80" />
            </button>

            {/* 4. Mời Bạn Bè Đang Online */}
            <button
              onClick={() => {
                sound.playClick();
                setTab('invite_friends');
              }}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 hover:brightness-105 text-white font-fredoka shadow-md transition active:scale-95 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
                  👥
                </div>
                <div>
                  <div className="font-black text-sm flex items-center gap-1.5">
                    <span>Mời Bạn Bè Trong Tiệm</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-black">
                      {friendsList.length} Bạn
                    </span>
                  </div>
                  <div className="text-[10px] text-purple-100 font-medium">
                    Thách đấu 1 chạm trực tiếp tới bạn bè
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 text-white/80" />
            </button>
          </div>
        )}

        {/* TAB 2: TÌM TRẬN NHANH */}
        {tab === 'quick_match' && (
          <div className="p-4 bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl border border-amber-200 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
              <span className="text-3xl animate-pulse">⚡</span>
            </div>

            <div>
              <div className="font-fredoka font-black text-base text-amber-950">
                ĐANG GHÉP TRẬN ONLINE
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Thời gian tìm kiếm: <span className="font-mono font-bold text-amber-800">{quickSearchTimer}s</span>
              </div>
              <p className="text-[11px] text-amber-900 mt-2 font-medium bg-amber-100/70 p-2 rounded-xl">
                {statusMsg || 'Đang quét hàng chờ kỳ thủ trên hệ thống...'}
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsSearchingQuick(false);
                if (customPin) {
                  remove(ref(db, `matchmaking/${gameType}/${customPin}`)).catch(() => {});
                  remove(ref(db, `rooms/${customPin}`)).catch(() => {});
                }
                setTab('menu');
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-fredoka font-bold text-xs"
            >
              Hủy Tìm Trận
            </button>
          </div>
        )}

        {/* TAB 3: TẠO PHÒNG RIÊNG & NHẬP MÃ PIN */}
        {tab === 'custom_room' && (
          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {/* Khối Hiển thị Mã Phòng của Bạn */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                MÃ PHÒNG RIÊNG CỦA BẠN:
              </span>
              <div className="font-mono font-black text-3xl sm:text-4xl text-amber-950 tracking-[0.25em] my-1.5 animate-pulse">
                {customPin || '----'}
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={copyPin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs shadow-sm transition active:scale-95"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Đã sao chép' : 'Sao chép mã'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 mt-2">
                ⏳ Gửi mã này cho bạn bè. Khi bạn bè nhập mã, trận đấu sẽ tự động bắt đầu ngay!
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-amber-200 w-full" />
              <span className="bg-[#FFFDF9] px-2 text-[10px] text-slate-400 font-bold uppercase">
                HOẶC VÀO PHÒNG CỦA BẠN BÈ
              </span>
            </div>

            {/* Form Nhập Mã Phòng */}
            <form onSubmit={handleJoinByPin} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập mã 4 số..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-300 text-center font-mono font-black text-base tracking-widest focus:outline-none focus:border-amber-500 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={inputPin.length !== 4}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-fredoka font-black text-xs shadow active:scale-95 transition"
                >
                  Vào Phòng
                </button>
              </div>
            </form>

            {statusMsg && (
              <div className="p-2 bg-amber-100 rounded-xl text-center text-[11px] text-amber-900 border border-amber-300 font-medium">
                {statusMsg}
              </div>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setTab('menu');
              }}
              className="w-full py-2 text-center text-xs font-fredoka font-bold text-slate-500 hover:text-slate-700"
            >
              ⬅ Quay lại chọn chế độ
            </button>
          </div>
        )}

        {/* TAB 4: MỜI BẠN BÈ ĐANG ONLINE */}
        {tab === 'invite_friends' && (
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            <div className="text-xs font-fredoka font-bold text-amber-950 flex items-center justify-between">
              <span>DANH SÁCH BẠN BÈ ({friendsList.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Mời 1 chạm</span>
            </div>

            {statusMsg && (
              <div className="p-2 bg-amber-100 rounded-xl text-center text-[11px] text-amber-900 border border-amber-300 font-medium">
                {statusMsg}
              </div>
            )}

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {friendsList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-amber-50/50 rounded-2xl border border-amber-200">
                  Bạn chưa có bạn bè trong danh bạ. Hãy qua mục Bạn Bè kết bạn trước nhé!
                </div>
              ) : (
                friendsList.map((fr) => {
                  const targetUid = fr.uid || fr.friendCode;
                  const isInvited = invitedMap[targetUid];
                  return (
                    <div
                      key={targetUid}
                      className="p-2 bg-white rounded-2xl border border-orange-100 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar avatar={fr.avatar} className="w-8 h-8" textClassName="text-xl" />
                        <div>
                          <div className="font-fredoka font-black text-xs text-slate-800">
                            {fr.displayName}
                          </div>
                          <div className="text-[10px] text-amber-800">
                            #{fr.friendCode} • Cấp {fr.level || 1}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInviteFriendToGame(fr)}
                        disabled={isInvited}
                        className={`px-3 py-1.5 rounded-xl font-fredoka font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1 ${
                          isInvited
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:brightness-105'
                        }`}
                      >
                        <Swords className="w-3 h-3" />
                        <span>{isInvited ? 'Đã Mời...' : 'Mời Đấu'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setTab('menu');
              }}
              className="w-full py-2 text-center text-xs font-fredoka font-bold text-slate-500 hover:text-slate-700"
            >
              ⬅ Quay lại chọn chế độ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameLobbyModal;
