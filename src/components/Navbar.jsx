import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { useMusic } from '../context/MusicContext';
import { UserAvatar } from './UserAvatar';
import {
  Coins,
  Gem,
  Users,
  Info,
  Volume2,
  VolumeX,
  Edit3,
  Disc3,
  UtensilsCrossed,
} from 'lucide-react';

export function Navbar({ onOpenMinigames }) {
  const { user, setIsAuthModalOpen, setIsFriendsModalOpen, setIsAboutModalOpen } = useAuth();
  const { setIsMusicModalOpen, isPlaying, currentTrack } = useMusic();
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
    if (!next) sound.playClick();
  };

  const expPercent = user
    ? Math.min(100, Math.max(0, Math.round((user.exp / user.expToNext) * 100)))
    : 0;

  return (
    <header className="bg-[#FFFDF9] border-b-2 border-amber-300/80 px-3 py-2 flex items-center justify-between gap-1.5 shadow-sm z-40 shrink-0 select-none text-slate-800">
      {/* 1. Chủ Quán & Cấp Độ */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => {
            sound.playClick();
            setIsAuthModalOpen(true);
          }}
          title="Bấm để đổi tên & avatar"
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 transition active:scale-95 shrink-0"
        >
          <UserAvatar
            avatar={user?.avatar}
            className="w-7 h-7 sm:w-8 sm:h-8"
            textClassName="text-xl sm:text-2xl"
          />
          <div className="text-left leading-tight hidden xs:block">
            <span className="font-fredoka font-black text-xs text-amber-950 block truncate max-w-[85px]">
              {user?.displayName || 'Chủ Quán'}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black text-amber-700 font-fredoka">
                Lv.{user?.level || 1}
              </span>
              <div className="w-10 h-1.5 rounded-full bg-amber-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 2. Tài nguyên Tiền Xu & Kim Cương */}
      <div className="flex items-center gap-1.5">
        {/* Tiền Xu */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 shadow-sm">
          <span className="text-xs leading-none">🪙</span>
          <span className="text-xs font-black font-fredoka">
            {(user?.coins ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Kim Cương */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 shadow-sm">
          <span className="text-xs leading-none">💎</span>
          <span className="text-xs font-black font-fredoka">
            {user?.gems ?? 0}
          </span>
        </div>
      </div>

      {/* 3. Nút Tiện Ích: Nhạc Nền, Âm Thanh, Bạn Bè, Info */}
      <div className="flex items-center gap-1">
        {/* Nút Nhạc Nền YouTube */}
        <button
          onClick={() => {
            sound.playClick();
            setIsMusicModalOpen(true);
          }}
          title={isPlaying ? `Đang phát: ${currentTrack?.title}` : 'Cài đặt nhạc nền'}
          className="relative w-8 h-8 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 flex items-center justify-center text-purple-700 transition active:scale-90 shadow-sm"
        >
          <Disc3
            className={`w-4 h-4 ${isPlaying ? 'animate-spin text-purple-600' : 'text-purple-400'}`}
            style={{ animationDuration: '3s' }}
          />
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Nút Âm Thanh FX */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition active:scale-90"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
        </button>

        {/* Nút Bạn Bè */}
        <button
          onClick={() => {
            sound.playClick();
            setIsFriendsModalOpen(true);
          }}
          title="Bạn bè & Thách đấu"
          className="relative w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-amber-800 transition active:scale-90"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Nút Bản Quyền & Luật Chơi */}
        <button
          onClick={() => {
            sound.playClick();
            setIsAboutModalOpen(true);
          }}
          title="Thông tin & Bản quyền Huỳnh Âu"
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition active:scale-90"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
