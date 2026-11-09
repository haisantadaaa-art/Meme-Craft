import React from 'react';
import { Utensils, Bath, Smile, Award } from 'lucide-react';

export function PetStats({ stats, exp, maxExp = 100, level = 1, bondingLevel = 1 }) {
  const hunger = Math.max(0, Math.min(100, stats?.hunger ?? 85));
  const clean = Math.max(0, Math.min(100, stats?.cleanliness ?? 90));
  const happy = Math.max(0, Math.min(100, stats?.happiness ?? 95));

  return (
    <div className="w-full bg-white/90 backdrop-blur-xs border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs select-none">
      {/* Cấp độ & Thanh EXP */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-fredoka font-black text-xs shadow-2xs">
            Cấp {level}
          </span>
          <span className="text-[11px] font-fredoka font-bold text-amber-900">
            Tình cảm: Lv.{bondingLevel} 💕
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-500">
          EXP: {exp} / {maxExp}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-2.5">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 rounded-full"
          style={{ width: `${Math.min(100, (exp / maxExp) * 100)}%` }}
        />
      </div>

      {/* 3 Thanh Chỉ Số: No, Sạch, Vui Vẻ */}
      <div className="grid grid-cols-3 gap-2 text-[10px] font-fredoka font-bold">
        {/* Độ No */}
        <div className="flex flex-col items-center bg-amber-50/70 p-1.5 rounded-xl border border-amber-200/60">
          <div className="flex items-center gap-1 mb-1 text-amber-900">
            <Utensils className="w-3 h-3 text-amber-600" />
            <span>Độ No</span>
          </div>
          <div className="w-full h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                hunger > 50 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${hunger}%` }}
            />
          </div>
          <span className="text-[9px] text-amber-800 font-mono mt-0.5">{hunger}%</span>
        </div>

        {/* Độ Sạch */}
        <div className="flex flex-col items-center bg-blue-50/70 p-1.5 rounded-xl border border-blue-200/60">
          <div className="flex items-center gap-1 mb-1 text-blue-900">
            <Bath className="w-3 h-3 text-blue-600" />
            <span>Độ Sạch</span>
          </div>
          <div className="w-full h-1.5 bg-blue-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                clean > 50 ? 'bg-blue-500' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${clean}%` }}
            />
          </div>
          <span className="text-[9px] text-blue-800 font-mono mt-0.5">{clean}%</span>
        </div>

        {/* Độ Vui Vẻ */}
        <div className="flex flex-col items-center bg-pink-50/70 p-1.5 rounded-xl border border-pink-200/60">
          <div className="flex items-center gap-1 mb-1 text-pink-900">
            <Smile className="w-3 h-3 text-pink-600" />
            <span>Vui Vẻ</span>
          </div>
          <div className="w-full h-1.5 bg-pink-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                happy > 50 ? 'bg-pink-500' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${happy}%` }}
            />
          </div>
          <span className="text-[9px] text-pink-800 font-mono mt-0.5">{happy}%</span>
        </div>
      </div>
    </div>
  );
}

export default PetStats;
