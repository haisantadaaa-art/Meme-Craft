/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FarmState, FarmOrder, CROP_CONFIG, CropType } from '../types/game';
import { sound } from '../utils/audio';
import { CropIcon } from './FarmGrid';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  CheckCircle2,
  Trash2,
  Truck,
  ArrowRight,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderBoardProps {
  farmState: FarmState;
  onDeliverOrder: (order: FarmOrder) => void;
  onDiscardOrder: (orderId: string) => void;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({
  farmState,
  onDeliverOrder,
  onDiscardOrder,
}) => {
  const handleDeliver = (order: FarmOrder) => {
    sound.playDeliver();
    sound.playCoin();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onDeliverOrder(order);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-5 select-none">
      {/* Wooden Board Header */}
      <div className="w-full bg-gradient-to-r from-[#d35400] via-[#e67e22] to-[#f39c12] border-4 border-[#ba4a00] rounded-3xl p-4 sm:p-5 shadow-[6px_6px_0px_#78281f] mb-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center shadow">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-fredoka text-amber-100 tracking-wide">
              BẢNG ĐƠN HÀNG DÂN LÀNG
            </h2>
            <p className="text-xs text-amber-100/90 font-medium">
              Giao nông sản cho cư dân thị trấn để nhận Vàng và Điểm Kinh Nghiệm (EXP)!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/30 border border-white/20 text-xs font-mono font-bold text-amber-200">
          <span>Đã hoàn thành: {farmState.stats.ordersCompleted} đơn</span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {farmState.orders.map((order) => {
          // Check if player has enough crops for all requirements
          let canFulfill = true;
          const reqChecks = order.requirements.map((req) => {
            const hasAmount = farmState.barn[req.crop] || 0;
            const isSufficient = hasAmount >= req.count;
            if (!isSufficient) canFulfill = false;
            return {
              ...req,
              hasAmount,
              isSufficient,
            };
          });

          return (
            <div
              key={order.id}
              className={`relative bg-[#f5e6cb] border-3 rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all pop-card ${
                canFulfill
                  ? 'border-[#27ae60] shadow-[5px_5px_0px_#1e8449]'
                  : 'border-[#795548] shadow-[5px_5px_0px_#4e342e]'
              }`}
            >
              {/* Customer Info */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white font-black font-fredoka flex items-center justify-center text-lg border-2 border-black/40 shadow">
                      {order.customerAvatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-black font-fredoka text-[#2d3436] truncate">
                        {order.customerName}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-500 truncate">
                        {order.customerTitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onDiscardOrder(order.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-100 transition-colors"
                    title="Đổi đơn hàng khác"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Requirements List */}
                <div className="space-y-2 mb-4 bg-white/70 rounded-2xl p-3 border border-black/10">
                  <span className="text-[11px] font-black font-fredoka text-slate-600 uppercase tracking-wider block mb-1">
                    Yêu Cầu Nông Sản:
                  </span>
                  {reqChecks.map((req, idx) => {
                    const info = CROP_CONFIG[req.crop];
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CropIcon crop={req.crop} className="w-4 h-4" />
                          <span className="truncate">{info.name}</span>
                        </div>
                        <div
                          className={`font-mono font-black ${
                            req.isSufficient ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {req.hasAmount}/{req.count} {req.isSufficient ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reward & Deliver Action */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1 text-xs font-black font-mono text-[#d35400]">
                    <Coins className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>+{order.rewardCoins} Vàng</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black font-mono text-purple-600">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>+{order.rewardExp} EXP</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeliver(order)}
                  disabled={!canFulfill}
                  className={`w-full py-2.5 rounded-2xl font-black font-fredoka text-xs sm:text-sm uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 transition-all pop-btn ${
                    canFulfill
                      ? 'bg-[#2ecc71] hover:bg-[#27ae60] text-black shadow-[3px_3px_0px_#000] animate-pulse'
                      : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{canFulfill ? 'GIAO HÀNG NGAY' : 'CHƯA ĐỦ HÀNG'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
