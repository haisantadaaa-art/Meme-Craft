import React, { useState } from 'react';
import { sound } from '../utils/soundEffects';
import { Bot, Globe, Copy, Check, LogOut, Wifi, Play, Users, Sparkles } from 'lucide-react';

export function OnlineRoomToolbar({
  isOnlineMode,
  onToggleMode, // (boolean) => void
  roomCode,
  isHost,
  myRole,
  connectedPlayer,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    if (!inputCode.trim()) return;
    setIsJoining(true);
    sound.playClick();
    if (onJoinRoom) {
      await onJoinRoom(inputCode.trim().toUpperCase());
    }
    setIsJoining(false);
  };

  return (
    <div className="w-full bg-white/95 border border-amber-200 rounded-2xl p-2 shadow-2xs mb-2 select-none">
      {/* 1. NÚT CHỌN MỞ MÀN: [🤖 Đấu Với Bot AI] vs [🌐 Đấu Online 2 Người] */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          <button
            onClick={() => {
              if (isOnlineMode) {
                sound.playClick();
                onToggleMode(false);
              }
            }}
            className={`py-1 px-2 rounded-xl text-xs font-fredoka font-black transition flex items-center justify-center gap-1.5 ${
              !isOnlineMode
                ? 'bg-amber-400 text-black shadow-xs border border-amber-500 scale-101'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Đấu Với Bot AI</span>
          </button>

          <button
            onClick={() => {
              if (!isOnlineMode) {
                sound.playClick();
                onToggleMode(true);
              }
            }}
            className={`py-1 px-2 rounded-xl text-xs font-fredoka font-black transition flex items-center justify-center gap-1.5 ${
              isOnlineMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs border border-blue-700 scale-101'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Đấu Online 2 Người</span>
          </button>
        </div>
      </div>

      {/* 2. NỘI DUNG CHẾ ĐỘ ONLINE (NẾU ĐANG BẬT) */}
      {isOnlineMode && (
        <div className="pt-1.5 border-t border-slate-100 animate-in fade-in">
          {roomCode ? (
            // Đã kết nối phòng
            <div className="flex items-center justify-between gap-2 bg-blue-50/90 p-1.5 rounded-xl border border-blue-200">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-fredoka font-black text-blue-950 truncate">
                  Phòng: <strong className="text-blue-700 text-xs">{roomCode}</strong>
                </span>
                <button
                  onClick={handleCopy}
                  title="Sao chép mã phòng"
                  className="p-1 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 transition active:scale-90"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-fredoka font-bold text-slate-600">
                  {connectedPlayer ? '🟢 Đã ghép đôi' : '⏳ Đang đợi khách...'}
                </span>
                <button
                  onClick={onLeaveRoom}
                  className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-fredoka font-bold transition active:scale-95 flex items-center gap-1"
                >
                  <LogOut className="w-2.5 h-2.5" />
                  <span>Rời</span>
                </button>
              </div>
            </div>
          ) : (
            // Chưa có phòng: Chọn Tạo Phòng hoặc Nhập Mã Phòng
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onCreateRoom}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-fredoka font-black text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo Mã Phòng 6 Số</span>
                </button>

                <form onSubmit={handleJoin} className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="VD: TT-9921"
                    maxLength={8}
                    className="w-full px-2 py-1 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isJoining || !inputCode.trim()}
                    className="py-1 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-fredoka font-black text-xs transition active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    Vào
                  </button>
                </form>
              </div>

              <div className="text-[9px] text-amber-800 text-center font-bold">
                ⚠️ Chế độ Online công bằng: Thú cưng tự động ngắt buff trợ chiến.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OnlineRoomToolbar;
