import React from 'react';
import { sound } from '../utils/soundEffects';
import { WifiOff, Bot, Trophy, ArrowRight } from 'lucide-react';

export function DisconnectModal({
  isOpen,
  opponentName = 'Đối thủ',
  onContinueWithBot,
  onLeaveAndWin,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in select-none font-jakarta">
      <div className="w-full max-w-[360px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-5 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-400 mx-auto flex items-center justify-center text-3xl shadow-sm animate-pulse">
          <WifiOff className="w-8 h-8 text-rose-600" />
        </div>

        <div>
          <h3 className="font-fredoka text-lg font-black text-amber-950">
            ĐỐI THỦ ĐÃ RỜI VÁN ĐẤU!
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Người chơi <strong>{opponentName}</strong> đã ngắt kết nối hoặc mất mạng quá 10 giây. Hãy chọn phương án tiếp theo:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {/* Lựa chọn 1: Tiếp tục đấu với Bot AI */}
          <button
            onClick={() => {
              sound.playClick();
              if (onContinueWithBot) onContinueWithBot();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-fredoka font-black text-xs sm:text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 border border-emerald-600"
          >
            <Bot className="w-4 h-4" />
            <span>Tiếp Tục Đấu Với Bot AI</span>
          </button>

          {/* Lựa chọn 2: Rời phòng & Nhận thắng */}
          <button
            onClick={() => {
              sound.playWin();
              if (onLeaveAndWin) onLeaveAndWin();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-fredoka font-black text-xs sm:text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 border-2 border-amber-500"
          >
            <Trophy className="w-4 h-4 text-amber-900" />
            <span>Rời Phòng & Nhận Thắng (+350 Xu)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisconnectModal;
