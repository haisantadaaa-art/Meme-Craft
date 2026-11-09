import React, { useState } from 'react';
import { sound } from '../../utils/soundEffects';
import { MatchmakingModal } from './MatchmakingModal';
import { LeaderboardModal } from '../rank/LeaderboardModal';
import {
  Home,
  Coins,
  Gem,
  Sparkles,
  Swords,
  Trophy,
  Zap,
  Flame,
  Search,
} from 'lucide-react';

export const LOBBY_MINIGAMES = [
  {
    id: 'SCHULTE',
    name: 'Bảng Tranh Số Schulte',
    subtitle: '1 Đến 100 Tranh Cướp ⚡',
    icon: '⚡',
    desc: 'Bảng chung 100 số, ai nhanh tay bấm trúng số mục tiêu trước ghi điểm. Phạt 1.0s nếu bấm sai!',
    badge: 'ĐỐI KHÁNG CHUNG 1-100',
    badgeColor: 'bg-amber-400 text-black border-amber-500 font-black animate-pulse',
    gradient: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'GO',
    name: 'Cờ Vây Dân Gian',
    subtitle: 'Luật Kẹp 2 Đầu ⚪⚫',
    icon: '⚪⚫',
    desc: 'Kẹp chặn 2 đầu ngang dọc nuốt chửng quân đối phương ngay lập tức. Dễ chơi, kết thúc cực nhanh!',
    badge: 'LUẬT KẸP DÂN GIAN',
    badgeColor: 'bg-slate-800 text-white border-slate-900',
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: 'XIANGQI',
    name: 'Cờ Tướng Online',
    subtitle: 'POV Flip Chuẩn ♟️',
    icon: '♟️',
    desc: 'Dù cầm Đỏ hay Đen, quân cờ luôn hướng thẳng vào mắt bạn ở nửa dưới màn hình! Cung tướng ở đáy.',
    badge: 'HOT - TỰ LẬT BÀN CỜ',
    badgeColor: 'bg-red-500 text-white border-red-600 font-bold',
    gradient: 'from-red-500 to-amber-600',
  },
  {
    id: 'CARO',
    name: 'Cờ Caro Đa Kích Thước',
    subtitle: '10x10 • 12x12 • 15x15 🎯',
    icon: '⭕',
    desc: 'Đấu trí 5 nước liên tiếp thần sầu, chặn 2 đầu, so tài cùng Bot AI hoặc bạn bè online!',
    badge: 'KINH ĐIỂN',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300 font-bold',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'MONOPOLY',
    name: 'Cờ Tỷ Phú Mini Loop',
    subtitle: '16 Ô Nhảy Từng Bước 🎩',
    icon: '🎩',
    desc: 'Vòng lặp 16 ô trực quan, nhảy từng bước kèm âm thanh sống động, thẻ khí vận trà sữa hài hước!',
    badge: 'HÀI HƯỚC 🏙️',
    badgeColor: 'bg-emerald-500 text-white border-emerald-600 font-black animate-pulse',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'MILLIONAIRE',
    name: 'Ai Là Triệu Phú',
    subtitle: 'Tích Hợp Gemini API 💡',
    icon: '💡',
    desc: 'Google Gemini tự sinh câu hỏi tiếng Việt mới 100%, MC Lại Văn Sâm tư vấn dí dỏm, 3 quyền trợ giúp!',
    badge: 'GEMINI AI 🤖',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300 font-bold',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'WORD_CHAIN',
    name: 'Nối Từ Tiếng Việt',
    subtitle: 'Trọng Tài Gemini 15s 💣',
    icon: '💣',
    desc: 'Đếm ngược 15s mỗi lượt, Trọng tài Gemini AI bắt lỗi từ ngữ chuẩn xác và cà khịa cực gắt!',
    badge: 'TRỌNG TÀI GEMINI 🔥',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-300 font-bold',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'RPS',
    name: 'Oánh Tù Tì Sinh Tử',
    subtitle: 'BO5 Búa Kéo Bao ✊✌️🖐️',
    icon: '✊✌️',
    desc: 'Đấu 5 ván thắng 3, 5s chọn bí mật rồi lật bài đập tay bùng nổ. Tích nộ tung chiêu Tất Sát bạo kích!',
    badge: 'MỚI PVP 💥',
    badgeColor: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black animate-pulse',
    gradient: 'from-rose-500 to-amber-600',
  },
  {
    id: 'REFLEX',
    name: 'Đua Bấm Đèn Tốc Độ',
    subtitle: 'Đèn Xanh Đập Nút ms 🚦⚡',
    icon: '🚦⚡',
    desc: 'Đèn đỏ chờ... ngẫu nhiên chuyển sang Đèn Xanh đập nút tính mili-giây! Bấm trước là phạm quy phạt thua.',
    badge: 'MỚI PVP ⚡',
    badgeColor: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'TAP_WAR',
    name: 'Đại Chiến Bấm Tốc Độ',
    subtitle: '2P Capybara Kéo Co 🦫⚡',
    icon: '🦫⚡',
    desc: 'Bấm ngón tay cực nhanh đẩy dây thừng Capybara sang sân đối thủ. Chơi 2P chung máy hoặc Online!',
    badge: '2P ĐỐI ĐẦU 💥',
    badgeColor: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black',
    gradient: 'from-orange-500 to-rose-600',
  },
  {
    id: 'SLING_PUCK',
    name: 'Bắn Bi Slingshot Bàn Cờ',
    subtitle: 'Kéo Thun Gỗ Bắn Khe 🎯🪵',
    icon: '🎯🪵',
    desc: 'Kéo dây thun đàn hồi bắn xuyên qua khe hẹp để dọn sạch quân sang sân đối thủ trước!',
    badge: '2P BẮN BI 🎯',
    badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    id: 'RACING',
    name: 'Đua Xe Tốc Độ',
    subtitle: 'Đua 2 Người 1.000m 🏎️💨',
    icon: '🏎️💨',
    desc: 'Đường đua chia đôi màn hình dọc, né vũng dầu nhặt nitro quýt tăng tốc cán đích 1.000m trước!',
    badge: '2P RACER 🏎️',
    badgeColor: 'bg-gradient-to-r from-red-500 to-amber-500 text-white font-black',
    gradient: 'from-red-600 to-orange-600',
  },
  {
    id: 'SOCCER',
    name: 'Bóng Đá Bàn 2 Nút',
    subtitle: 'Lao Lên & Sút Căng ⚽🔥',
    icon: '⚽🔥',
    desc: '2 nút điều khiển Lao Lên và Sút Căng, tranh bóng vật lý cực đã, vang cọc xà giòn tan chạm là sướng!',
    badge: 'MỚI 2P SOCCER ⚽',
    badgeColor: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black animate-pulse',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'BOMB',
    name: 'Truyền Bom Nổ Chậm',
    subtitle: 'Nhanh Tay Chuyền Bom 💣⚡',
    icon: '💣⚡',
    desc: 'Giải nhanh câu đố phản xạ để chuyền bom sang đối thủ trước khi ngòi nổ phát hỏa làm đen mặt!',
    badge: 'MỚI 2P BOM 💥',
    badgeColor: 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-black animate-pulse',
    gradient: 'from-red-600 to-orange-600',
  },
];

export function MinigameHub({ user, userProfile, onBackToPet, onStartGame }) {
  const [selectedGameForMatch, setSelectedGameForMatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRankOpen, setIsRankOpen] = useState(false);

  const filteredGames = LOBBY_MINIGAMES.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. HEADER BAR SẢNH CHỜ */}
      <div className="bg-white/95 border border-amber-200/80 rounded-2xl p-2 shadow-2xs shrink-0 flex items-center justify-between gap-1.5">
        <button
          onClick={() => {
            sound.playClick();
            onBackToPet();
          }}
          className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-black text-xs flex items-center gap-1 transition active:scale-95 border border-amber-300"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Về Pet</span>
        </button>

        <div className="text-center leading-tight">
          <span className="font-fredoka font-black text-xs text-amber-950 block">
            SẢNH ĐẤU TRÍ ONLINE
          </span>
          <span className="text-[9px] text-slate-500 font-bold">
            14 Trò Chơi Đối Kháng ⚔️
          </span>
        </div>

        {/* Nút Xem Hạng Elo & Tiền */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.playClick();
              setIsRankOpen(true);
            }}
            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-300 active:scale-95 transition"
            title="Bảng xếp hạng"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono text-[11px] font-black">{user?.elo ?? userProfile?.elo ?? 1000}</span>
          </button>

          <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200/60 text-xs font-mono font-black text-amber-800">
            <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{userProfile?.coins ?? 1250}</span>
          </div>
        </div>
      </div>

      {/* 2. THANH TÌM KIẾM MINIGAME */}
      <div className="my-2 relative shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm game: Cờ tướng, Cờ vây, Schulte, Triệu phú..."
          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/90 border border-amber-200/80 text-xs font-fredoka font-bold text-slate-800 focus:outline-none focus:border-amber-500 placeholder-slate-400 shadow-2xs"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* 3. DANH SÁCH THẺ GAME (GAME CARDS LIST) */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => {
              sound.playClick();
              setSelectedGameForMatch(game);
            }}
            className="w-full bg-white/95 hover:bg-amber-50/40 border border-amber-200/80 hover:border-amber-400 rounded-2xl p-2.5 shadow-2xs cursor-pointer active:scale-98 transition flex items-center justify-between gap-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-200 border border-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
              {game.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-fredoka font-black text-xs text-amber-950 truncate">
                  {game.name}
                </span>
                <span className={`text-[8px] px-1.5 py-0.2 rounded-md ${game.badgeColor}`}>
                  {game.badge}
                </span>
              </div>
              <span className="text-[10px] text-amber-800 font-bold block truncate">
                {game.subtitle}
              </span>
              <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                {game.desc}
              </p>
            </div>

            <button className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-fredoka font-black text-xs shadow-xs shrink-0 flex items-center gap-1">
              <span>Chơi</span>
              <Swords className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 4. FOOTER QUY TẮC CÔNG BẰNG */}
      <div className="mt-2 text-center text-[9px] text-amber-800/80 font-bold shrink-0">
        ⚡ TẤT CẢ MINIGAME ONLINE ĐỀU ĐỒNG BỘ P2P THỜI GIAN THỰC & KHÔNG SỬ DỤNG TRỢ CHIẾN.
      </div>

      {/* MODAL MATCHMAKING CHỌN PHÒNG / TÌM TRẬN / BOT */}
      {selectedGameForMatch && (
        <MatchmakingModal
          game={selectedGameForMatch}
          user={user}
          onStartGame={onStartGame}
          onClose={() => setSelectedGameForMatch(null)}
        />
      )}

      {/* MODAL BẢNG XẾP HẠNG ELO */}
      {isRankOpen && (
        <LeaderboardModal
          userElo={user?.elo ?? userProfile?.elo ?? 1000}
          onClose={() => setIsRankOpen(false)}
        />
      )}
    </div>
  );
}

export default MinigameHub;
