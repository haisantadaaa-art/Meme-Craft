import React, { useState, useEffect } from 'react';
import { sound } from '../../utils/soundEffects';
import { db, ref, get } from '../../services/firebase';
import {
  X,
  Trophy,
  Award,
  Crown,
  Flame,
  Shield,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const RANK_TIERS = [
  { id: 'master', name: 'ĐẠI SƯ', icon: '👑', minElo: 2000, color: 'from-purple-600 via-rose-500 to-amber-500', textColor: 'text-purple-600', reward: 'Vương Miện Kim Cương' },
  { id: 'diamond', name: 'KIM CƯƠNG', icon: '💎', minElo: 1700, color: 'from-cyan-500 to-blue-600', textColor: 'text-cyan-600', reward: 'Khung Avatar Neon' },
  { id: 'gold', name: 'VÀNG', icon: '🥇', minElo: 1400, color: 'from-amber-400 to-yellow-500', textColor: 'text-amber-600', reward: 'Mũ Trạng Nguyên' },
  { id: 'silver', name: 'BẠC', icon: '🥈', minElo: 1200, color: 'from-slate-400 to-zinc-500', textColor: 'text-slate-600', reward: 'Huy Hiệu Bạc' },
  { id: 'bronze', name: 'ĐỒNG', icon: '🥉', minElo: 1000, color: 'from-amber-700 to-yellow-800', textColor: 'text-amber-800', reward: 'Túi 100 Xu' },
  { id: 'novice', name: 'TẬP SỰ', icon: '🌱', minElo: 0, color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-600', reward: 'Khởi đầu hành trình' },
];

export function getRankByElo(elo = 1200) {
  return RANK_TIERS.find((t) => elo >= t.minElo) || RANK_TIERS[RANK_TIERS.length - 1];
}

export function LeaderboardModal({ user, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'tiers'

  const currentElo = user?.elo ?? 1200;
  const userRank = getRankByElo(currentElo);

  useEffect(() => {
    // Tải danh sách top người chơi từ Firebase RTDB
    const loadLeaderboard = async () => {
      try {
        const snap = await get(ref(db, 'users'));
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.values(data)
            .filter((u) => u && (u.displayName || u.name))
            .map((u) => ({
              id: u.uid || u.id,
              name: u.displayName || u.name || 'Kỳ Thủ Vô Danh',
              avatar: u.avatar || '👩‍🍳',
              elo: u.elo || 1200,
              wins: u.rankWins || 0,
              isGoogle: Boolean(u.isGoogle),
            }))
            .sort((a, b) => b.elo - a.elo)
            .slice(0, 10);

          if (list.length >= 3) {
            setLeaderboard(list);
            return;
          }
        }
      } catch (e) {
        // Fallback
      }

      // Danh sách xếp hạng tuần mặc định phong phú
      const defaultLeaderboard = [
        { id: 'top-1', name: 'Trần Gia Bảo 👑', avatar: '🦁', elo: 2450, wins: 88, title: 'Đại Sư Bất Bại' },
        { id: 'top-2', name: 'Lê Hoàng Nam ✨', avatar: '🦊', elo: 2280, wins: 74, title: 'Kỳ Thánh Schulte' },
        { id: 'top-3', name: 'Nguyễn Thảo My 💎', avatar: '🐰', elo: 1980, wins: 62, title: 'Vua Nối Từ' },
        { id: 'top-4', name: 'Đặng Tuấn Kiệt', avatar: '🐻', elo: 1720, wins: 49, title: 'Tay Đua Siêu Cấp' },
        { id: 'top-5', name: 'Vũ Minh Anh', avatar: '🦫', elo: 1610, wins: 41, title: 'Bậc Thầy Cờ Tướng' },
        { id: 'top-6', name: 'Phạm Quỳnh Chi', avatar: '🐱', elo: 1490, wins: 33, title: 'Thợ Phá Bom' },
        { id: 'top-7', name: 'Bùi Đức Trọng', avatar: '🐶', elo: 1380, wins: 28, title: 'Xạ Thủ Bàn Cờ' },
        { id: 'top-8', name: 'Hoàng Yến Nhi', avatar: '🐼', elo: 1290, wins: 22, title: 'Kỳ Thủ Triệu Phú' },
        { id: 'top-9', name: 'Đỗ Hữu Phước', avatar: '🐨', elo: 1220, wins: 18, title: 'Tân Binh Đột Phá' },
        { id: 'top-10', name: 'Trịnh Khánh Vy', avatar: '🌸', elo: 1150, wins: 14, title: 'Gà Con Chăm Chỉ' },
      ];

      // Chèn user vào vị trí phù hợp nếu chưa có
      if (user && !defaultLeaderboard.some((u) => u.name === user.displayName)) {
        defaultLeaderboard.push({
          id: user.uid,
          name: `${user.displayName} (Bạn)`,
          avatar: user.avatar || '👩‍🍳',
          elo: currentElo,
          wins: user.rankWins || 0,
        });
        defaultLeaderboard.sort((a, b) => b.elo - a.elo);
      }

      setLeaderboard(defaultLeaderboard.slice(0, 10));
    };

    loadLeaderboard();
  }, [user, currentElo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs animate-in fade-in select-none font-jakarta">
      <div className="w-full max-w-[390px] bg-[#FFFDF9] border-4 border-amber-400 rounded-3xl p-4 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Nút đóng */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition active:scale-90"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-xl shadow-xs">
            🏆
          </div>
          <div>
            <h3 className="font-fredoka font-black text-sm text-amber-950">
              ĐẤU HẠNG RANK KỲ THỦ
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">
              Bảng xếp hạng tuần & Bậc Rank vinh quang
            </span>
          </div>
        </div>

        {/* Thẻ Rank của chính người chơi */}
        <div className={`p-3 rounded-2xl bg-gradient-to-r ${userRank.color} text-white shadow-md my-1.5 shrink-0 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl filter drop-shadow-md">{userRank.icon}</span>
            <div className="leading-tight">
              <span className="text-[10px] font-fredoka font-black uppercase tracking-wider text-white/80 block">
                BẬC RANK HIỆN TẠI
              </span>
              <span className="font-fredoka font-black text-base text-white block">
                {userRank.name}
              </span>
              <span className="text-[10px] font-bold text-amber-200">
                Thắng: {user?.rankWins || 0} | Thua: {user?.rankLosses || 0}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono font-black text-xl text-yellow-300 block drop-shadow-xs">
              {currentElo}
            </span>
            <span className="text-[9px] font-fredoka font-bold text-white/90">
              ĐIỂM ELO ⚔️
            </span>
          </div>
        </div>

        {/* Tab chuyển đổi: Bảng Xếp Hạng vs Bậc Rank */}
        <div className="grid grid-cols-2 gap-1.5 my-1.5 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('weekly');
            }}
            className={`py-1.5 rounded-xl font-fredoka font-black text-xs transition ${
              activeTab === 'weekly'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Top 10 Cao Thủ 👑
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('tiers');
            }}
            className={`py-1.5 rounded-xl font-fredoka font-black text-xs transition ${
              activeTab === 'tiers'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hệ Thống Bậc Rank 🎖️
          </button>
        </div>

        {/* NỘI DUNG TAB 1: BẢNG XẾP HẠNG TOP 10 */}
        {activeTab === 'weekly' && (
          <div className="flex-1 overflow-y-auto space-y-1.5 p-1 my-1">
            {leaderboard.map((player, idx) => {
              const isTop3 = idx < 3;
              const pRank = getRankByElo(player.elo);
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

              return (
                <div
                  key={player.id || idx}
                  className={`p-2 rounded-2xl border flex items-center justify-between gap-2 transition ${
                    isTop3
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 font-fredoka font-black text-xs text-center shrink-0">
                      {medal}
                    </span>
                    <span className="text-xl shrink-0">{player.avatar}</span>
                    <div className="min-w-0 leading-tight">
                      <span className="font-fredoka font-black text-xs text-slate-800 block truncate">
                        {player.name}
                      </span>
                      <span className={`text-[9px] font-bold flex items-center gap-0.5 ${pRank.textColor}`}>
                        {pRank.icon} {pRank.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs text-amber-900 block">
                      {player.elo} Elo
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      {player.wins} Trận Thắng
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NỘI DUNG TAB 2: CÁC BẬC RANK & PHẦN THƯỞNG */}
        {activeTab === 'tiers' && (
          <div className="flex-1 overflow-y-auto space-y-2 p-1 my-1">
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[10px] text-amber-950 font-medium">
              💡 <strong>Quy tắc tính điểm Rank:</strong> Thắng trận Online nhận <strong>+25 Elo & +100 Xu</strong>. Thua trận bị trừ <strong>-10 Elo</strong>.
            </div>

            {RANK_TIERS.map((tier) => {
              const isCurrent = userRank.id === tier.id;
              const isPassed = currentElo >= tier.minElo;

              return (
                <div
                  key={tier.id}
                  className={`p-2.5 rounded-2xl border-2 flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'bg-amber-100/90 border-amber-500 shadow-sm'
                      : isPassed
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="leading-tight">
                      <span className="font-fredoka font-black text-xs text-slate-900 block">
                        {tier.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 font-bold">
                        Từ {tier.minElo} Elo trở lên
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-200/80 text-amber-950 font-fredoka font-bold text-[9px] block">
                      🎁 {tier.reward}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full mt-2 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs shadow-xs transition active:scale-95"
        >
          Đóng ✨
        </button>
      </div>
    </div>
  );
}

export default LeaderboardModal;
