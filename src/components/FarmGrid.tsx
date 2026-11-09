/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FarmState, FarmPlot, CropType, CROP_CONFIG } from '../types/game';
import { sound } from '../utils/audio';
import {
  Sprout,
  Wheat,
  Clock,
  Sparkles,
  Zap,
  Warehouse,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface FarmGridProps {
  farmState: FarmState;
  onPlant: (plotId: number, crop: CropType) => void;
  onHarvest: (plotId: number) => void;
  onFertilize: (plotId: number) => void;
}

// Custom Lucide/SVG Crop Icons
export const CropIcon: React.FC<{ crop: CropType; className?: string }> = ({ crop, className = 'w-6 h-6' }) => {
  switch (crop) {
    case 'wheat':
      return <Wheat className={`${className} text-amber-500`} />;
    case 'corn':
      return (
        <span className="inline-flex items-center justify-center font-black select-none text-xl sm:text-2xl animate-pulse">
          🌽
        </span>
      );
    case 'carrot':
      return (
        <span className="inline-flex items-center justify-center font-black select-none text-xl sm:text-2xl animate-pulse">
          🥕
        </span>
      );
    case 'strawberry':
      return (
        <span className="inline-flex items-center justify-center font-black select-none text-xl sm:text-2xl animate-pulse">
          🍓
        </span>
      );
    default:
      return <Sprout className={`${className} text-emerald-400`} />;
  }
};

export const FarmGrid: React.FC<FarmGridProps> = ({
  farmState,
  onPlant,
  onHarvest,
  onFertilize,
}) => {
  const [selectedCrop, setSelectedCrop] = useState<CropType>('wheat');
  const [now, setNow] = useState<number>(Date.now());

  // 1-second interval to update plot countdowns smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCropsInBarn = Object.values(farmState.barn).reduce((acc, c) => acc + c, 0);
  const isBarnFull = totalCropsInBarn >= farmState.barnCapacity;

  const handlePlotClick = (plot: FarmPlot) => {
    if (!plot.crop) {
      // Empty plot -> Plant selected crop if affordable
      const info = CROP_CONFIG[selectedCrop];
      if (farmState.level < info.unlockLevel) {
        sound.playLose();
        return;
      }
      if (farmState.coins < info.cost) {
        sound.playLose();
        return;
      }
      onPlant(plot.id, selectedCrop);
    } else {
      // Crop planted -> check if ready
      const isReady = plot.readyAt ? now >= plot.readyAt : false;
      if (isReady) {
        if (isBarnFull) {
          sound.playLose();
          return;
        }
        onHarvest(plot.id);
      } else {
        // Crop still growing -> ask to speed up with fertilizer
        if (farmState.fertilizers > 0) {
          onFertilize(plot.id);
        } else {
          sound.playClick();
        }
      }
    }
  };

  const cropKeys: CropType[] = ['wheat', 'corn', 'carrot', 'strawberry'];

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center select-none p-3 sm:p-5">
      {/* Seed Selection Bar */}
      <div className="w-full bg-[#2d5a27]/90 border-3 border-[#1e3c1a] rounded-3xl p-3 sm:p-4 shadow-[4px_4px_0px_#1e3c1a] mb-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs sm:text-sm font-black font-fredoka text-amber-200 flex items-center gap-1.5 uppercase tracking-wide">
            <Sprout className="w-4 h-4 text-emerald-300" />
            Túi Hạt Giống Nông Trại
          </span>
          <span className="text-[11px] font-bold text-emerald-200">
            Chạm chọn giống rồi chạm vào ô đất để gieo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {cropKeys.map((c) => {
            const info = CROP_CONFIG[c];
            const isUnlocked = farmState.level >= info.unlockLevel;
            const isSelected = selectedCrop === c;
            const canAfford = farmState.coins >= info.cost;

            return (
              <button
                key={c}
                disabled={!isUnlocked}
                onClick={() => {
                  sound.playClick();
                  setSelectedCrop(c);
                }}
                className={`relative p-2.5 rounded-2xl border-2 transition-all flex items-center gap-2.5 pop-btn text-left ${
                  !isUnlocked
                    ? 'bg-black/40 border-black/50 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#ffeaa7] border-[#d63031] shadow-[3px_3px_0px_#d63031] scale-[1.02]'
                    : 'bg-[#558b2f] hover:bg-[#689f38] border-[#2e7d32] text-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/30 ${
                    isSelected ? 'bg-amber-400' : 'bg-black/25'
                  }`}
                >
                  <CropIcon crop={c} className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-black font-fredoka truncate ${
                      isSelected ? 'text-[#2d3436]' : 'text-white'
                    }`}
                  >
                    {info.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold mt-0.5">
                    <span className={isSelected ? 'text-[#e17055]' : 'text-amber-200'}>
                      {info.cost} Vàng
                    </span>
                    <span className={isSelected ? 'text-slate-600' : 'text-emerald-200'}>
                      ⏱ {info.growTimeSeconds}s
                    </span>
                  </div>
                </div>

                {!isUnlocked && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold border border-black shadow">
                    Cấp {info.unlockLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2D Hay Day Farming Plots Grid */}
      <div className="w-full bg-[#8d6e63]/40 border-4 border-[#5d4037] rounded-3xl p-4 sm:p-6 shadow-[6px_6px_0px_#3e2723] backdrop-blur-sm mb-5">
        <div className="flex items-center justify-between mb-3 text-xs sm:text-sm font-fredoka font-black text-amber-200">
          <span className="flex items-center gap-1.5">
            <span>ĐẤT TRỒNG TRỌT ({farmState.plots.length} Ô)</span>
          </span>
          <span className="text-[11px] text-amber-300 font-bold">
            Mẹo: Dùng Phân Bón để cây lớn ngay lập tức!
          </span>
        </div>

        {/* 8-Plot Isometric-Inspired Garden Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {farmState.plots.map((plot) => {
            const isPlanted = plot.crop !== null;
            const cropInfo = plot.crop ? CROP_CONFIG[plot.crop] : null;
            const isReady = isPlanted && plot.readyAt ? now >= plot.readyAt : false;

            const totalMs = cropInfo ? cropInfo.growTimeSeconds * 1000 : 10000;
            const remainingMs = plot.readyAt ? Math.max(0, plot.readyAt - now) : 0;
            const elapsedMs = Math.max(0, totalMs - remainingMs);
            const progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
            const remainingSec = Math.ceil(remainingMs / 1000);

            return (
              <div
                key={plot.id}
                onClick={() => handlePlotClick(plot)}
                className={`relative aspect-square rounded-2xl border-3 transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center pop-card select-none ${
                  !isPlanted
                    ? 'bg-[#795548] hover:bg-[#8d6e63] border-[#4e342e] shadow-[4px_4px_0px_#3e2723]'
                    : isReady
                    ? 'bg-gradient-to-b from-[#fbc531] to-[#e1b12c] border-[#e84118] shadow-[4px_4px_0px_#c23616] animate-pulse'
                    : 'bg-[#5d4037] border-[#3e2723] shadow-[4px_4px_0px_#271914]'
                }`}
              >
                {/* Visual Soil & Plants */}
                {!isPlanted ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-amber-200/80">
                      <Plus className="w-6 h-6 stroke-[3]" />
                    </div>
                    <span className="text-[11px] font-fredoka font-bold text-amber-100/90">
                      Gieo Hạt
                    </span>
                  </div>
                ) : isReady ? (
                  <div className="flex flex-col items-center gap-1 animate-bounce">
                    <CropIcon crop={plot.crop!} className="w-10 h-10 drop-shadow-md" />
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-fredoka text-[11px] font-black border border-black shadow">
                      Thu Hoạch!
                    </span>
                    <span className="text-[10px] font-bold text-black/80 font-mono">
                      +{cropInfo?.harvestAmount} Nông Sản
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full px-1">
                    <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center mb-1 text-emerald-400">
                      <Sprout className="w-5 h-5 animate-pulse" />
                    </div>

                    <span className="text-[10px] font-fredoka font-bold text-amber-100 truncate w-full mb-1">
                      {cropInfo?.name}
                    </span>

                    {/* Progress Bar */}
                    <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-black/40 mb-1">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full text-[9px] font-mono font-bold text-amber-200">
                      <span>{remainingSec}s</span>
                      {farmState.fertilizers > 0 && (
                        <span className="text-pink-300 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-pink-300" /> Bón
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Barn & Silo Capacity Status Bar */}
      <div className="w-full bg-[#1b2a1a]/90 border-2 border-[#2e4d2b] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-600 border border-black flex items-center justify-center shadow">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-fredoka text-amber-300">
                Kho Nông Sản (Barn):
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  isBarnFull ? 'text-rose-400 animate-bounce' : 'text-emerald-300'
                }`}
              >
                {totalCropsInBarn}/{farmState.barnCapacity}
              </span>
            </div>
            {isBarnFull && (
              <p className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Kho đã đầy! Hãy giao đơn hàng ở Bảng Đơn Hàng.
              </p>
            )}
          </div>
        </div>

        {/* Barn Inventory Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {cropKeys.map((c) => (
            <div
              key={c}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 border border-black/50 text-xs font-mono font-bold text-white shadow-inner"
              title={CROP_CONFIG[c].name}
            >
              <CropIcon crop={c} className="w-4 h-4" />
              <span>{farmState.barn[c] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
