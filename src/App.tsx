/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CozyPetView } from './components/pet/CozyPetView';
import { MinigameHub } from './components/lobby/MinigameHub';
import { SchulteBoard } from './components/games/SchulteBoard';
import { FolkGo } from './components/games/FolkGo';
import { Xiangqi } from './components/games/Xiangqi';
import { Caro } from './components/games/Caro';
import { MonopolyMini } from './components/games/MonopolyMini';
import { Millionaire } from './components/games/Millionaire';
import { WordChain } from './components/games/WordChain';
import { TapWarGame } from './components/games/TapWarGame';
import { SlingPuckGame } from './components/games/SlingPuckGame';
import { RPSBattleGame } from './components/games/RPSBattleGame';
import { QuickReflexGame } from './components/games/QuickReflexGame';
import { MiniRacingGame } from './components/games/MiniRacingGame';
import { FingerSoccerGame } from './components/games/FingerSoccerGame';
import { PassTheBombGame } from './components/games/PassTheBombGame';
import { FloatingChatFAB } from './components/FloatingChatFAB';
import { AuthModal } from './components/AuthModal';
import { FriendsModal } from './components/FriendsModal';
import { AboutModal } from './components/AboutModal';
import { MusicModal } from './components/MusicModal';
import { MusicProvider } from './context/MusicContext';
import { sound } from './utils/soundEffects';

export type ScreenState = 'AUTH' | 'PET_HOME' | 'MINIGAME_LOBBY' | 'GAME_ACTIVE';

export interface GameLaunchConfig {
  gameId: string; // 'SCHULTE' | 'GO' | 'XIANGQI' | 'CARO' | 'MONOPOLY' | 'MILLIONAIRE' | 'WORD_CHAIN' | 'TAP_WAR' | 'SLING_PUCK' | 'RPS' | 'REFLEX' | 'RACING'
  roomCode?: string;
  myRole?: string;
  isBotMode?: boolean;
  botDifficulty?: string;
  session?: any;
}

function MainApp() {
  const {
    user,
    userProfile,
    addCoins,
    addExp,
    updateElo,
    signInWithGoogle,
    loginWithShopCredentials,
  } = (useAuth() || {}) as any;

  // Hệ thống định tuyến màn hình chuẩn
  const [screenState, setScreenState] = useState<ScreenState>('PET_HOME');

  // Modal Đăng nhập bằng Tên Tiệm & Mật khẩu
  const [showShopLoginModal, setShowShopLoginModal] = useState(false);
  const [shopNameInput, setShopNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Trạng thái minigame đang thi đấu
  const [activeGame, setActiveGame] = useState<GameLaunchConfig>({
    gameId: 'SCHULTE',
    roomCode: '',
    myRole: 'p1',
    isBotMode: true,
    botDifficulty: 'medium',
  });

  // 1-Chạm Mời Bạn Bè: Tự động vào phòng khi mở qua link chia sẻ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const joinGame = params.get('joinGame')?.toUpperCase();
      const room = params.get('room');

      if (joinGame && room) {
        sound.playTing();
        setActiveGame({
          gameId: joinGame,
          roomCode: room,
          myRole: 'p2',
          isBotMode: false,
          botDifficulty: 'medium',
        });
        setScreenState('GAME_ACTIVE');
      }
    } catch (e) {
      console.warn('Lỗi đọc tham số URL mời bạn:', e);
    }
  }, []);

  // Khởi động minigame từ Sảnh Chờ (Matchmaking Modal)
  const handleStartGame = (config: GameLaunchConfig) => {
    setActiveGame(config);
    setScreenState('GAME_ACTIVE');
  };

  // Nhận thưởng từ minigame (+25 Elo khi thắng online, -10 Elo khi thua)
  const handleRewardWon = (reward: any, fertilizers: number = 0) => {
    const coins = typeof reward === 'object' ? reward.coins : reward;
    const exp = typeof reward === 'object' ? reward.exp : Math.round((coins || 50) / 2);
    const eloDelta =
      typeof reward === 'object'
        ? reward.elo
        : activeGame.isBotMode
        ? 0
        : 25;

    if (addCoins && coins) addCoins(coins);
    if (addExp && exp) addExp(exp);
    if (updateElo && eloDelta) updateElo(eloDelta);
  };

  // Xử lý đăng nhập Tên Tiệm & Mật khẩu
  const handleShopLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopNameInput.trim()) {
      setLoginError('Vui lòng nhập tên tiệm hoặc biệt danh!');
      return;
    }
    try {
      if (loginWithShopCredentials) {
        loginWithShopCredentials(shopNameInput.trim(), passwordInput.trim());
      }
      sound.playWin();
      setShowShopLoginModal(false);
      setLoginError('');
    } catch (err: any) {
      setLoginError(err?.message || 'Đăng nhập không thành công');
    }
  };

  const handleAcceptInvite = (invitation: any) => {
    const pin = typeof invitation === 'string' ? invitation : invitation?.roomPin;
    const gameType = (typeof invitation === 'object' ? invitation?.gameType : 'CARO') || 'CARO';
    if (!pin) return;
    sound.playWin();
    setActiveGame({
      gameId: String(gameType).toUpperCase(),
      roomCode: pin,
      myRole: 'p2',
      isBotMode: false,
      botDifficulty: 'medium',
    });
    setScreenState('GAME_ACTIVE');
  };

  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] bg-[#F5EDE0] flex justify-center items-center overflow-hidden font-jakarta select-none text-slate-800">
      {/* Khung dọc App chuẩn Mobile (w-full max-w-[430px]) */}
      <div className="w-full max-w-[430px] min-h-[100dvh] h-[100dvh] bg-[#FFFDF7] flex flex-col relative shadow-2xl overflow-hidden">
        {/* 1. MÀN HÌNH ĐĂNG NHẬP BẮT BUỘC (MANDATORY AUTH GATEWAY) */}
        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#FFFDF7] via-[#FFF9EE] to-[#FFE8C2] relative">
            <div className="w-24 h-24 rounded-3xl bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-6xl mb-3 shadow-lg animate-bounce">
              🦫
            </div>
            <h1 className="font-fredoka font-black text-2xl text-amber-950 mb-1 tracking-wide">
              TIỆM ẨM THỰC
            </h1>
            <p className="text-xs text-amber-900/80 font-fredoka mb-7 max-w-[280px]">
              Nuôi dưỡng thú cưng Cozy Haven & Thi đấu sảnh trí tuệ thời gian thực
            </p>

            <div className="w-full space-y-3 max-w-[290px]">
              {/* Nút 1: Đăng nhập Google chính */}
              <button
                onClick={() => {
                  sound.playClick();
                  if (signInWithGoogle) signInWithGoogle();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-fredoka font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2.5"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Đăng Nhập Bằng Google</span>
              </button>

              {/* Nút 2: Đăng nhập bằng Tên Tiệm & Mật khẩu */}
              <button
                onClick={() => {
                  sound.playClick();
                  setShowShopLoginModal(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-105 text-amber-950 font-fredoka font-black text-xs shadow-md border border-amber-500 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🔑 Tên Tiệm & Mật Khẩu / Tạo Mới</span>
              </button>
            </div>

            <p className="text-[10px] text-amber-800/70 mt-6 font-semibold">
              ⭐ Đăng nhập để lưu tiến trình thú cưng và bảo toàn điểm xếp hạng Elo
            </p>

            {/* MODAL ĐĂNG NHẬP TÊN TIỆM & MẬT KHẨU */}
            {showShopLoginModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-5 w-full max-w-[340px] border-2 border-amber-300 shadow-2xl text-left">
                  <h3 className="font-fredoka font-black text-base text-amber-950 mb-1">
                    Đăng Nhập / Tạo Hồ Sơ Tiệm
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-3 font-medium">
                    Nhập tên tiệm và mật khẩu để đăng nhập hoặc tự động tạo tài khoản mới.
                  </p>

                  <form onSubmit={handleShopLoginSubmit} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Tên Tiệm / Biệt Danh
                      </label>
                      <input
                        type="text"
                        value={shopNameInput}
                        onChange={(e) => setShopNameInput(e.target.value)}
                        placeholder="VD: Tiệm Trà Capybara"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 focus:outline-none focus:border-amber-500 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Mật Khẩu (Tùy chọn)
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    {loginError && (
                      <p className="text-[10px] text-red-600 font-bold">
                        {loginError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowShopLoginModal(false);
                          setLoginError('');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-fredoka font-bold text-xs"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-fredoka font-black text-xs shadow-sm"
                      >
                        Vào Game
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 2. CÁC MÀN HÌNH CHÍNH */
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {/* Màn hình A: PHÒNG THÚ CƯNG (COZY PET HAVEN) */}
            {screenState === 'PET_HOME' && (
              <CozyPetView onOpenLobby={() => setScreenState('MINIGAME_LOBBY')} />
            )}

            {/* Màn hình B: SẢNH ĐẤU TRÍ (MINIGAME LOBBY) */}
            {screenState === 'MINIGAME_LOBBY' && (
              <MinigameHub
                user={user}
                userProfile={userProfile}
                onBackToPet={() => setScreenState('PET_HOME')}
                onStartGame={handleStartGame}
              />
            )}

            {/* Màn hình C: MÀN HÌNH THI ĐẤU VÁN GAME (GAME ACTIVE) */}
            {screenState === 'GAME_ACTIVE' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FFF9EE]">
                {/* 1. BẢNG TRANH SỐ SCHULTE */}
                {activeGame.gameId === 'SCHULTE' && (
                  <SchulteBoard
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 2. CỜ VÂY DÂN GIAN (KẸP 2 ĐẦU) */}
                {activeGame.gameId === 'GO' && (
                  <FolkGo
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole === 'p2' ? 'w' : 'b'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 3. CỜ TƯỚNG (POV FLIP) */}
                {activeGame.gameId === 'XIANGQI' && (
                  <Xiangqi
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole === 'p2' ? 'b' : 'r'}
                    isBotMode={activeGame.isBotMode}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 4. CỜ CARO */}
                {activeGame.gameId === 'CARO' && (
                  <Caro
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole === 'p2' ? 'O' : 'X'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 5. CỜ TỶ PHÚ MINI */}
                {activeGame.gameId === 'MONOPOLY' && (
                  <MonopolyMini
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 6. AI LÀ TRIỆU PHÚ */}
                {activeGame.gameId === 'MILLIONAIRE' && (
                  <Millionaire
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'X'}
                    isBotMode={activeGame.isBotMode}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 7. NỐI TỪ TIẾNG VIỆT */}
                {activeGame.gameId === 'WORD_CHAIN' && (
                  <WordChain
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'X'}
                    isBotMode={activeGame.isBotMode}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 8. ĐẠI CHIẾN BẤM TỐC ĐỘ (TAP WAR) */}
                {activeGame.gameId === 'TAP_WAR' && (
                  <TapWarGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    playerName={user?.displayName || 'Chiến Binh'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 9. BẮN BI SLINGSHOT BÀN CỜ */}
                {activeGame.gameId === 'SLING_PUCK' && (
                  <SlingPuckGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    playerName={user?.displayName || 'Xạ Thủ'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 10. OÁNH TÙ TÌ SINH TỬ */}
                {activeGame.gameId === 'RPS' && (
                  <RPSBattleGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Đấu Sĩ'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 11. ĐUA BẤM ĐÈN TỐC ĐỘ */}
                {activeGame.gameId === 'REFLEX' && (
                  <QuickReflexGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Xạ Thủ Tốc Độ'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 12. ĐUA XE ĐỐI KHÁNG 2 NGƯỜI */}
                {activeGame.gameId === 'RACING' && (
                  <MiniRacingGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Tay Đua'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 13. BÓNG ĐÁ BÀN 2 NÚT */}
                {activeGame.gameId === 'SOCCER' && (
                  <FingerSoccerGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Cầu Thủ'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* 14. TRUYỀN BOM NỔ CHẬM */}
                {activeGame.gameId === 'BOMB' && (
                  <PassTheBombGame
                    roomCode={activeGame.roomCode}
                    myRole={activeGame.myRole || 'p1'}
                    isBotMode={activeGame.isBotMode}
                    botDifficulty={activeGame.botDifficulty || 'medium'}
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setScreenState('MINIGAME_LOBBY')}
                  />
                )}

                {/* Khung Chat & Emoji Động Nổi Trong Minigame Online */}
                {!activeGame.isBotMode && activeGame.roomCode && (
                  <FloatingChatFAB roomPin={activeGame.roomCode} isBotMode={false} />
                )}
              </div>
            )}
          </main>
        )}

        <AuthModal />
        <FriendsModal onAcceptInvite={handleAcceptInvite} />
        <AboutModal />
        <MusicModal />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <MainApp />
      </MusicProvider>
    </AuthProvider>
  );
}
