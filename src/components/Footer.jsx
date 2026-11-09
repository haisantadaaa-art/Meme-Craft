import React from 'react';
import { Heart, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Footer() {
  const { setIsAboutModalOpen } = useAuth();

  return (
    <footer className="w-full bg-[#FFFBF0] border-t-2 border-amber-300 px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 z-40 text-xs shrink-0 select-none text-slate-700 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-lg bg-amber-400 border border-amber-600 flex items-center justify-center text-xs">
          🍜
        </div>
        <span className="font-fredoka font-black text-amber-900 tracking-wide text-xs">
          TIỆM ẨM THỰC
        </span>
      </div>

      {/* Mandatory Credit: "Game Được Lập Trình Bởi Huỳnh Âu" */}
      <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border border-amber-400 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span className="font-fredoka font-bold text-amber-950 text-xs sm:text-[13px] tracking-wide">
          Game Được Lập Trình Bởi <strong className="text-amber-800 uppercase underline decoration-amber-500 underline-offset-2">Huỳnh Âu</strong>
        </span>
        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline ml-0.5 animate-pulse" />
      </div>

      {/* Quick About Link */}
      <div className="flex items-center gap-2 text-[11px]">
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="text-amber-800 hover:text-amber-950 font-bold underline transition"
        >
          Thông tin & Bản quyền
        </button>
      </div>
    </footer>
  );
}

export default Footer;
