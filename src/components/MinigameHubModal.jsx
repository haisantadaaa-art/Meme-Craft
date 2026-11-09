import React from 'react';
import { sound } from '../utils/soundEffects';
import {
  Gamepad2,
  X,
  Trophy,
  Sparkles,
  Swords,
  Brain,
  HelpCircle,
  Dices,
  Flame,
} from 'lucide-react';

const MINIGAMES = [
  {
    id: 'XIANGQI',
    name: 'Cờ Tướng Online',
    icon: '♟️',
    desc: 'Solo Bot AI thông minh hoặc Ghép phòng đối kháng 2 người thời gian thực.',
    badge: 'HOT - Đấu Trí Thời Gian Thực',
    badgeColor: 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-600 shadow-sm animate-pulse',
    color: 'from-red-500 to-amber-600',
  },
  {
    id: 'GO',
    name: 'Cờ Vây Online',
    icon: '⚪⚫',
    desc: 'Đấu trí vây bắt quân kinh điển trên bàn cờ chuẩn.',
    badge: 'Chiến Thuật',
    badgeColor: 'bg-slate-800 text-white border-slate-900',
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 'CARO',
    name: 'Cờ Caro Đa Kích Thước',
    icon: '⭕',
    desc: 'Tùy chọn 10x10, 12x12, 15x15 chặn 2 đầu kinh điển, solo Bot hoặc Online bạn bè!',
    badge: 'Kinh Điển',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'MONOPOLY',
    name: 'Cờ Tỷ Phú Mini Loop',
    icon: '🎩',
    desc: 'Mobile Loop 16 ô trực quan, lắc xúc xắc 3D mua đất xây khách sạn làm đối thủ phá sản!',
    badge: 'HOT - Đô Thị 🏙️',
    badgeColor: 'bg-emerald-500 text-white border-emerald-600 font-black animate-pulse',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'MILLIONAIRE',
    name: 'Ai Là Triệu Phú (Gemini AI)',
    icon: '💡',
    desc: 'Google Gemini tự động sinh đề vô tận thời gian thực, thang 15 câu hỏi kịch tính!',
    badge: 'Gemini AI 🤖',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300 font-bold',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'WORD_CHAIN',
    name: 'Nối Từ Sinh Tử 15s',
    icon: '💣',
    desc: 'Đấu từ 15s đếm lùi, Trọng tài Gemini AI thẩm định bắt lỗi và cà khịa cực gắt!',
    badge: 'Gemini Referee 🔥',
    badgeColor: 'bg-red-100 text-red-700 border-red-300 font-bold',
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 'CATCH_WORD',
    name: 'Đuổi Hình Bắt Chữ',
    icon: '🎯',
    desc: 'Tranh vector nghệ thuật trực quan, bấm ghép ký tự ô chữ đoán cụm từ!',
    badge: 'Hot Nhất',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'SCHULTE',
    name: 'Bảng Số Schulte 5x5',
    icon: '⚡',
    desc: 'Luyện phản xạ & tầm nhìn bao quát cực nhanh, bé cưng cổ vũ theo từng số bấm!',
    badge: 'Trợ Chiến 🐾',
    badgeColor: 'bg-amber-400 text-black border-amber-500 font-black',
    color: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'TAP_WAR',
    name: 'Đại Chiến Bấm Tốc Độ',
    icon: '🦫⚡',
    desc: 'Bấm ngón tay cực nhanh đẩy dây thừng Capybara sang sân đối thủ. Chơi 2P chung máy hoặc Online!',
    badge: 'MỚI 2P 💥',
    badgeColor: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-orange-600 font-black animate-pulse',
    color: 'from-orange-500 to-rose-600',
  },
  {
    id: 'SLING_PUCK',
    name: 'Bắn Bi Slingshot Bàn Cờ',
    icon: '🎯🪵',
    desc: 'Kéo dây thun đàn hồi bắn xuyên qua khe hẹp để dọn sạch quân sang sân đối thủ trước!',
    badge: 'MỚI 2P 🎯',
    badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 font-black animate-pulse',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'BAU_CUA',
    name: 'Bầu Cua Tôm Cá',
    icon: '🎲',
    desc: 'Lắc 3 quân xúc xắc linh vật dân gian ngày Tết, x1 x2 x3 tiền thưởng!',
    badge: 'May Mắn',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: 'from-emerald-500 to-teal-600',
  },
];

export function MinigameHubModal({ onSelectGame, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn select-none font-jakarta">
      <div className="w-full max-w-[400px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.3)] text-slate-800 relative max-h-[90vh] flex flex-col">
        {/* Nút Đóng */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3 mb-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border-2 border-black flex items-center justify-center shadow">
            <Gamepad2 className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black font-fredoka text-amber-900 leading-tight">
              SẢNH ĐẤU TRÍ MINIGAME
            </h3>
            <p className="text-[11px] text-amber-700/80">
              Giải trí so tài & kiếm thêm Xu, Kim Cương cho Quán!
            </p>
          </div>
        </div>

        {/* Danh sách 7 Minigame */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {MINIGAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                sound.playClick();
                onSelectGame(game.id);
              }}
              className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-200/80 hover:border-amber-400 shadow-sm transition active:scale-95 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl shrink-0 group-hover:scale-110 transition">
                  {game.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-fredoka font-black text-sm text-slate-800 truncate">
                      {game.name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {game.desc}
                  </p>
                </div>
              </div>

              <div className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-400 group-hover:bg-amber-500 text-black font-fredoka font-black text-[11px] shadow-sm">
                Vào Chơi
              </div>
            </button>
          ))}
        </div>

        {/* Ghi chú chân trang */}
        <div className="mt-3 pt-2.5 border-t border-amber-200 text-center text-[10px] text-slate-500">
          Chơi game nhận thưởng Xu và Kim Cương để nâng cấp Tiệm Ẩm Thực! 🏆
        </div>
      </div>
    </div>
  );
}

export default MinigameHubModal;
