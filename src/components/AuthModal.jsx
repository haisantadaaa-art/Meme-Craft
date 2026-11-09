import React, { useState, useRef, useEffect } from 'react';
import { useAuth, AVATAR_LIST } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { UserAvatar } from './UserAvatar';
import {
  Sparkles,
  Heart,
  User,
  Check,
  X,
  Camera,
  Upload,
  LogOut,
  Coffee,
  Coins,
  Gem,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export function AuthModal({ forceOpen = false }) {
  const {
    user,
    isAuthModalOpen,
    setIsAuthModalOpen,
    saveProfile,
    loginWithGoogle,
    loginAsGuest,
    logout,
  } = useAuth();

  const [nickname, setNickname] = useState(user?.displayName || 'Chủ Tiệm Boba');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '👩‍🍳');
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Cập nhật khi user thay đổi
  useEffect(() => {
    if (user) {
      setNickname(user.displayName || 'Chủ Tiệm Boba');
      setSelectedAvatar(user.avatar || '👩‍🍳');
    }
  }, [user]);

  if (!isAuthModalOpen && !forceOpen) return null;

  // Xử lý nén ảnh qua HTML5 Canvas (128x128px JPEG chất lượng 0.85)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAuthError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)!');
      return;
    }

    setIsUploading(true);
    setAuthError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 128;
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');

          // Center-crop vuông
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          setSelectedAvatar(compressedBase64);
          sound.playTing();
        } catch (err) {
          console.error('Lỗi nén ảnh:', err);
          setAuthError('Không thể xử lý hình ảnh này, vui lòng thử ảnh khác!');
        } finally {
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setIsUploading(false);
        setAuthError('Không thể đọc file ảnh này!');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setIsUploading(false);
      setAuthError('Lỗi đọc tệp tin!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    saveProfile(nickname, selectedAvatar);
  };

  const handleGoogleLogin = async () => {
    sound.playClick();
    setIsLoggingInGoogle(true);
    setAuthError('');
    const res = await loginWithGoogle();
    setIsLoggingInGoogle(false);
    if (!res.success) {
      setAuthError(res.error || 'Đăng nhập Google thất bại, vui lòng thử lại!');
    }
  };

  const handleGuestLogin = () => {
    sound.playClick();
    loginAsGuest(nickname, selectedAvatar);
  };

  const handleLogout = async () => {
    sound.playClick();
    await logout();
  };

  const isCustomImage =
    typeof selectedAvatar === 'string' &&
    (selectedAvatar.startsWith('data:image') ||
      selectedAvatar.startsWith('http://') ||
      selectedAvatar.startsWith('https://'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in select-none font-jakarta">
      <div className="relative w-full max-w-md bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Nút đóng modal (chỉ hiện khi đã đăng nhập và không phải màn hình chặn bắt buộc) */}
        {!forceOpen && user && (
          <button
            onClick={() => {
              sound.playClick();
              setIsAuthModalOpen(false);
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-amber-900 transition active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Tiêu đề & Logo Tiệm */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 border-2 border-amber-500 flex items-center justify-center shadow-md mb-2">
            <Coffee className="w-8 h-8 text-amber-950 stroke-[2.2]" />
          </div>
          <h2 className="font-fredoka text-2xl font-black text-amber-950 tracking-wide mb-1">
            {user ? 'HỒ SƠ CHỦ TIỆM BOBA' : 'CHÀO MỪNG ĐẾN TIỆM ẨM THỰC'}
          </h2>

          {/* Dòng chữ bản quyền Huỳnh Âu */}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-[11px] text-amber-900 font-bold font-fredoka shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
            <span>Game Được Lập Trình Bởi <strong>Huỳnh Âu</strong></span>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {authError && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-700 text-center font-medium">
            ⚠️ {authError}
          </div>
        )}

        {/* 1. MÀN HÌNH ĐĂNG NHẬP (NẾU CHƯA ĐĂNG NHẬP HOẶC KHÁCH MUỐN KẾT NỐI GOOGLE) */}
        {(!user || user.isGuest) && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 space-y-2.5">
            <div className="text-center">
              <span className="text-xs font-black font-fredoka text-amber-950 uppercase tracking-wider block">
                {user?.isGuest ? 'ĐỒNG BỘ TÀI KHOẢN VỚI GOOGLE' : 'CHỌN CÁCH THỨC VÀO QUÁN'}
              </span>
              <p className="text-[11px] text-amber-800">
                Lưu giữ tiến trình quán, xu, kim cương và kết nối bạn bè vĩnh viễn.
              </p>
            </div>

            {/* Nút Đăng nhập Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingInGoogle}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-amber-400 rounded-2xl text-slate-800 font-fredoka font-black text-xs sm:text-sm shadow-sm active:scale-95 transition flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingInGoogle ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}</span>
            </button>

            {/* Nút Chơi Ngay (Khách Vãng Lai) nếu chưa có user */}
            {!user && (
              <button
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-fredoka font-black text-xs sm:text-sm rounded-2xl border-2 border-amber-500 shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>Chơi Ngay (Khách Vãng Lai)</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        )}

        {/* 2. KHU VỰC THAY ĐỔI AVATAR (ẢNH CÁ NHÂN HOẶC ICON CHIBI) */}
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-center">
            <label className="block text-xs font-black text-amber-950 uppercase tracking-wider mb-2 font-fredoka">
              Ảnh Đại Diện Hiện Tại
            </label>

            <div className="flex items-center justify-center gap-4">
              {/* Avatar Preview */}
              <div className="relative">
                <UserAvatar
                  avatar={selectedAvatar}
                  className="w-18 h-18 sm:w-20 sm:h-20"
                  textClassName="text-5xl"
                  border={true}
                />
                {isCustomImage && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-xs">
                    Ảnh Custom
                  </span>
                )}
              </div>

              {/* Nút Tự Tải Ảnh Lên */}
              <div className="text-left space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-fredoka font-black text-xs shadow-xs active:scale-95 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Đang nén ảnh...' : 'Tải Ảnh Của Bạn Lên'}</span>
                </button>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Tự động căn chỉnh & nén 128x128px mượt mà.
                </p>
              </div>
            </div>
          </div>

          {/* Danh sách 12 Avatar Chibi Mặc Định */}
          <div>
            <label className="block text-xs font-black text-amber-950 uppercase tracking-wider mb-1.5 font-fredoka">
              Hoặc Chọn Avatar Chibi Có Sẵn
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 bg-white rounded-2xl border border-orange-100 shadow-2xs">
              {AVATAR_LIST.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedAvatar(av);
                  }}
                  className={`text-2xl p-2 rounded-xl transition-all flex items-center justify-center ${
                    selectedAvatar === av
                      ? 'bg-amber-200 border-2 border-amber-500 scale-110 shadow-sm'
                      : 'hover:bg-amber-50 border border-transparent opacity-80'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Form Nhập Tên & Tên Quán */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-amber-950 uppercase tracking-wider mb-1 font-fredoka">
                Tên Chủ Quán (Nickname)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  placeholder="Nhập tên quán của bạn..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-amber-300 text-amber-950 font-fredoka text-sm focus:outline-none focus:border-amber-500 placeholder-slate-400 shadow-2xs"
                />
                <User className="absolute right-3 top-3 w-4 h-4 text-amber-500" />
              </div>
            </div>

            {/* Thông tin tài khoản hiện tại (Mã bạn bè, cấp độ, xu) */}
            {user && (
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Mã Bạn Bè</span>
                  <span className="font-mono font-black text-amber-900">#{user.friendCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Cấp Độ</span>
                  <span className="font-fredoka font-black text-amber-900">Lv.{user.level || 1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Tiền Vàng</span>
                  <span className="font-fredoka font-black text-amber-900">{(user.coins ?? 0).toLocaleString()} 🪙</span>
                </div>
              </div>
            )}

            {/* Nút Lưu Hồ Sơ */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 hover:brightness-105 text-amber-950 font-fredoka font-black text-sm rounded-2xl border-2 border-amber-500 shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>LƯU THAY ĐỔI HỒ SƠ</span>
            </button>
          </form>

          {/* Nút Đăng Xuất nếu đã có tài khoản */}
          {user && (
            <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {user.isGoogle ? 'Đã liên kết Google Account' : 'Tài khoản Khách Vãng Lai'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-fredoka font-bold text-xs transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
