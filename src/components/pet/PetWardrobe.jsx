import React from 'react';
import { sound } from '../../utils/soundEffects';
import { X, Check, Sparkles } from 'lucide-react';

export const WARDROBE_HATS = [
  { id: 'tangerine', name: 'Quýt Mọng Nước', icon: '🍊', desc: 'Đặc sản của bé Capybara điềm đạm.', cost: 0 },
  { id: 'straw_hat', name: 'Mũ Rơm Du Mục', icon: '👒', desc: 'Che nắng khi ra đồng hái trà.', cost: 50 },
  { id: 'crown', name: 'Vương Miện Quý Tộc', icon: '👑', desc: 'Phong thái hoàng gia đỉnh chóp.', cost: 120 },
  { id: 'sunglasses', name: 'Kính Mát Siêu Ngầu', icon: '🕶️', desc: 'Sành điệu phong cách barista.', cost: 80 },
  { id: 'chef_hat', name: 'Mũ Đầu Bếp Trưởng', icon: '👨‍🍳', desc: 'Bậc thầy ẩm thực món ngon.', cost: 60 },
  { id: 'flower', name: 'Hoa Cài Đóa Hồng', icon: '🌸', desc: 'Ngọt ngào, dịu dàng, đáng yêu.', cost: 40 },
];

export function PetWardrobe({ currentHat, onSelectHat, onClose, userCoins = 0 }) {
  const handleSelect = (hat) => {
    sound.playClick();
    onSelectHat(hat.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in select-none font-jakarta">
      <div className="w-full max-w-[380px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative flex flex-col">
        {/* Nút Đóng */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition active:scale-90"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">👒</span>
          <div>
            <h3 className="font-fredoka font-black text-sm text-amber-950">
              TỦ ĐỒ PHỤ KIỆN THÚ CƯNG
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">
              Lựa chọn chiếc mũ xinh xắn nhất cho bé yêu
            </span>
          </div>
        </div>

        {/* Danh sách mũ */}
        <div className="grid grid-cols-2 gap-2 my-2 max-h-[50vh] overflow-y-auto p-1">
          {WARDROBE_HATS.map((hat) => {
            const isSelected = currentHat === hat.id;
            return (
              <button
                key={hat.id}
                onClick={() => handleSelect(hat)}
                className={`p-2.5 rounded-2xl border-2 flex flex-col items-center text-center transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-100 border-amber-500 shadow-sm scale-102'
                    : 'bg-white hover:bg-amber-50/50 border-amber-200'
                }`}
              >
                <span className="text-3xl mb-1">{hat.icon}</span>
                <span className="font-fredoka font-black text-xs text-amber-950 truncate w-full">
                  {hat.name}
                </span>
                <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                  {hat.desc}
                </span>

                <div className="mt-2 flex items-center justify-center w-full">
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white font-fredoka font-black text-[9px] flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Đang Đội</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-950 font-fredoka font-bold text-[9px]">
                      {hat.cost > 0 ? `${hat.cost} Xu` : 'Miễn Phí'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full mt-2 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs shadow-xs transition active:scale-95"
        >
          Xong ✨
        </button>
      </div>
    </div>
  );
}

export default PetWardrobe;
