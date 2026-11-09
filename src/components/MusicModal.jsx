import React, { useState } from 'react';
import { useMusic, PRESET_TRACKS } from '../context/MusicContext';
import { sound } from '../utils/soundEffects';
import {
  Music,
  Play,
  Pause,
  Link as LinkIcon,
  Check,
  Disc3,
  X,
  Sparkles,
  Volume2,
} from 'lucide-react';

export function MusicModal() {
  const {
    isMusicModalOpen,
    setIsMusicModalOpen,
    isPlaying,
    currentTrack,
    selectPreset,
    setCustomUrl,
    togglePlay,
  } = useMusic();

  const [inputUrl, setInputUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isMusicModalOpen) return null;

  const handleSelectPreset = (id) => {
    sound.playClick();
    selectPreset(id);
    setErrorMsg('');
    setSuccessMsg('Đã chuyển bài thành công! 🎶');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    sound.playClick();
    const res = setCustomUrl(inputUrl);
    if (res.success) {
      setErrorMsg('');
      setSuccessMsg('Đã kết nối link YouTube thành công! 🎧');
      setInputUrl('');
      setTimeout(() => setSuccessMsg(''), 2500);
    } else {
      setErrorMsg(res.msg || 'Link YouTube không đúng định dạng!');
      setSuccessMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-gradient-to-b from-[#241d3d] via-[#1a142e] to-[#120d22] border-4 border-[#ffb703] rounded-3xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-white relative">
        {/* Nút Đóng */}
        <button
          onClick={() => {
            sound.playClick();
            setIsMusicModalOpen(false);
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 border-2 border-black flex items-center justify-center shadow-lg">
            <Disc3 className={`w-7 h-7 text-black ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black font-fredoka text-amber-300 tracking-wide flex items-center gap-2">
              TIỆM ÂM NHẠC NỀN
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-purple-200">
              Chọn giai điệu thư giãn cho Tiệm Ẩm Thực
            </p>
          </div>
        </div>

        {/* Đang phát hiện tại */}
        <div className="bg-black/50 border border-amber-400/30 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{currentTrack?.icon || '🎵'}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Đang phát:
              </div>
              <div className="text-xs sm:text-sm font-black font-fredoka text-white truncate">
                {currentTrack?.title || 'Chưa chọn bài hát'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentTrack?.category || 'Nhạc nền'}
              </div>
            </div>
          </div>

          {/* Nút Play / Pause */}
          <button
            onClick={() => {
              sound.playClick();
              togglePlay();
            }}
            className={`px-3 py-2 rounded-xl font-fredoka font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md ${
              isPlaying
                ? 'bg-amber-400 text-black hover:bg-amber-300'
                : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Tạm Dừng
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Phát Nhạc
              </>
            )}
          </button>
        </div>

        {/* PHẦN 1: TÙY CHỌN DANH SÁCH PHÁT MẶC ĐỊNH (PRESETS) */}
        <div className="mb-4">
          <div className="text-xs font-black font-fredoka text-amber-300 mb-2 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-pink-400" />
            DANH SÁCH BÀI HÁT CÓ SẴN (PRESETS)
          </div>

          <div className="grid grid-cols-1 gap-2">
            {PRESET_TRACKS.map((track, idx) => {
              const isCurrent = currentTrack?.videoId === track.videoId;
              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectPreset(track.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2.5 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-500/25 to-pink-500/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{track.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/30 text-pink-300 border border-pink-500/40">
                          Track {idx + 1}
                        </span>
                        <span className="text-xs font-black font-fredoka text-white truncate">
                          {track.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                        {track.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isCurrent ? (
                      <span className="px-2 py-1 rounded-xl bg-amber-400 text-black font-black text-[10px] flex items-center gap-1 font-fredoka">
                        <Check className="w-3 h-3 stroke-[3]" /> Đang Chọn
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-xl bg-white/10 text-slate-300 font-bold text-[10px] hover:bg-white/20 transition">
                        Chọn Ngay
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PHẦN 2: DÁN LINK YOUTUBE TÙY CHỌN */}
        <div className="pt-2 border-t border-white/10">
          <div className="text-xs font-black font-fredoka text-amber-300 mb-1.5 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
            DÁN LINK YOUTUBE TỰ CHỌN
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Thưởng thức bất kỳ bài hát hoặc playlist nào bằng cách dán URL YouTube của bạn:
          </p>

          <form onSubmit={handleApplyCustomUrl} className="flex items-center gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="VD: https://www.youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs font-fredoka transition active:scale-95 shrink-0 shadow"
            >
              Áp Dụng
            </button>
          </form>

          {errorMsg && (
            <div className="text-rose-400 text-[11px] font-bold mt-1.5">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-emerald-400 text-[11px] font-bold mt-1.5">
              ✨ {successMsg}
            </div>
          )}
        </div>

        {/* Gợi ý & Lưu ý */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-slate-400">
          Bài hát bạn chọn sẽ được tự động lưu lại trên máy để tiếp tục phát trong các lần chơi tiếp theo! 💾
        </div>
      </div>
    </div>
  );
}

export default MusicModal;
