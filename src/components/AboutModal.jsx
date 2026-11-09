import React from 'react';
import { X, Trophy, Sparkles, Heart, Sprout, Gamepad2, Award, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';

export function AboutModal() {
  const { isAboutModalOpen, setIsAboutModalOpen } = useAuth();

  if (!isAboutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none font-jakarta">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.3)] text-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Nút đóng */}
        <button
          onClick={() => {
            sound.playClick();
            setIsAboutModalOpen(false);
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề & Tác giả */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border border-amber-500 flex items-center justify-center text-2xl shadow-sm mb-2">
            🍜
          </div>
          <h2 className="font-fredoka text-xl sm:text-2xl font-black text-amber-950 tracking-wide mb-1">
            TIỆM ẨM THỰC
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border border-amber-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span className="font-fredoka font-bold text-amber-950 text-xs sm:text-sm">
              Game Được Lập Trình Bởi <strong className="text-amber-800 uppercase underline decoration-amber-500">Huỳnh Âu</strong>
            </span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline ml-0.5" />
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
          {/* Hệ thống Tiệm Ẩm Thực */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
            <h4 className="font-fredoka font-black text-amber-950 flex items-center gap-2 text-sm mb-1.5">
              🍜 1. QUẢN LÝ TIỆM ẨM THỰC
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs">
              <li><strong>Quầy Trà Sữa:</strong> Pha chế các món trà sữa thơm ngon béo ngậy, nâng cấp level quầy để tăng sức chứa và giá bán.</li>
              <li><strong>Bếp Mì Cay:</strong> Nấu mì cay hải sản, bò Mỹ từ Cấp 1 đến Cấp 7 phục vụ thực khách.</li>
              <li><strong>Bàn Ăn & Shipper:</strong> Phục vụ khách tại quán thu tiền tự động và hoàn thành đơn shipper giao hàng nhận Xu & EXP!</li>
            </ul>
          </div>

          {/* Sảnh 7 Minigame */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
            <h4 className="font-fredoka font-black text-amber-950 flex items-center gap-2 text-sm mb-1.5">
              🎮 2. SẢNH ĐẤU TRÍ 7 MINIGAME ĐỈNH CAO
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="font-bold text-rose-600 block mb-0.5">♟️ Cờ Tướng Online (HOT)</span>
                <span>Bàn cờ chuẩn 9x9 với sông Sở Hà Hán Giới, cung tướng, solo Bot AI hoặc 2 người.</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="font-bold text-slate-800 block mb-0.5">⚪⚫ Cờ Vây Online (Chiến Thuật)</span>
                <span>Đấu trí vây bắt quân kinh điển 9x9, tính Khí, bắt quân và so tài realtime.</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="font-bold text-blue-600 block mb-0.5">⚔️ Cờ Caro 10x10</span>
                <span>Đấu trí 5 nước liên tiếp giữa Chủ Tiệm và Khách Đấu Trí.</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="font-bold text-red-600 block mb-0.5">💣 Nối Từ Sinh Tử 20s</span>
                <span>Đếm lùi 20s nổ bom, nối từ tiếng Việt đỉnh cao với trọng tài AI.</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="font-bold text-amber-600 block mb-0.5">🧩 Đuổi Hình Bắt Chữ</span>
                <span>Ghép hình đoán cụm từ vui nhộn, ai 3 điểm trước là thắng!</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="font-bold text-purple-600 block mb-0.5">🏆 Ai Là Triệu Phú</span>
                <span>15s ghế nóng với ngân hàng câu hỏi kiến thức đời sống & ẩm thực phong phú.</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-100 shadow-2xs col-span-1 sm:col-span-2">
                <span className="font-bold text-emerald-600 block mb-0.5">🎲 Bầu Cua Tôm Cá</span>
                <span>Lắc 3 xúc xắc linh vật dân gian: Bầu hồ lô, Cua, Tôm, Cá, Gà, Nai nhân thưởng Xu!</span>
              </div>
            </div>
          </div>

          {/* Kết nối Realtime */}
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 text-xs">
            <h4 className="font-fredoka font-black text-amber-950 flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-amber-700" />
              3. KẾT NỐI BẠN BÈ & CHAT TRỰC TIẾP
            </h4>
            <p className="text-slate-600">
              Mỗi tài khoản có một Mã Bạn Bè riêng. Bạn có thể gửi lời mời chơi game trực tiếp, tạo phòng 4 số nhanh qua Firebase Realtime Database và trò chuyện realtime với khung chat emoji tích hợp!
            </p>
          </div>
        </div>

        {/* Nút đóng chân modal */}
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              sound.playClick();
              setIsAboutModalOpen(false);
            }}
            className="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm border-2 border-amber-600 shadow-sm active:scale-95 transition"
          >
            Đã Hiểu, Vào Chơi Ngay! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;
