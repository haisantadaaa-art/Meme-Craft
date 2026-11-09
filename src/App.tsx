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
import { FloatingChatFAB } from './components/FloatingChatFAB';
import { AuthModal } from './components/AuthModal';
import { FriendsModal } from './components/FriendsModal';
import { AboutModal } from './components/AboutModal';
import { MusicModal } from './components/MusicModal';
import { MusicProvider } from './context/MusicContext';
import { sound } from './utils/soundEffects';

export type ScreenState = 'AUTH' | 'PET_HOME' | 'MINIGAME_LOBBY' | 'GAME_ACTIVE';

export interface GameLaunchConfig {
  gameId: string; // 'SCHULTE' | 'GO' | 'XIANGQI' | 'CARO' | 'MONOPOLY' | 'MILLIONAIRE' | 'WORD_CHAIN' | 'TAP_WAR' | 'SLING_PUCK'
  roomCode?: string;
  myRole?: string;
  isBotMode?: boolean;
  botDifficulty?: string;
  session?: any;
}

function MainApp() {
  const { user, userProfile, addCoins, addExp, signInAsGuest, signInWithGoogle } = (useAuth() || {}) as any;

  // Hệ thống định tuyến màn hình chuẩn
  const [screenState, setScreenState] = useState<ScreenState>('PET_HOME');

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

  // Nhận thưởng từ minigame
  const handleRewardWon = (coins: number, fertilizers: number = 0) => {
    if (addCoins) addCoins(coins);
    if (addExp) addExp(Math.round(coins / 2));
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
        {/* 1. MÀN HÌNH ĐĂNG NHẬP (NẾU CHƯA CÓ USER) */}
        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#FFFDF7] to-[#FFF4DE]">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-5xl mb-3 shadow-md animate-bounce">
              🦫
            </div>
            <h1 className="font-fredoka font-black text-2xl text-amber-950 mb-1">
              TIỆM ẨM THỰC
            </h1>
            <p className="text-xs text-amber-900/80 font-fredoka mb-6 max-w-[260px]">
              Nuôi dưỡng thú cưng Cozy Haven & Tranh tài tại sảnh đấu trí đối kháng
            </p>

            <div className="w-full space-y-2.5 max-w-[280px]">
              <button
                onClick={() => {
                  sound.playClick();
                  if (signInWithGoogle) signInWithGoogle();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-fredoka font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Đăng Nhập Bằng Google</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  if (signInAsGuest) signInAsGuest();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-fredoka font-black text-xs shadow-md transition active:scale-95"
              >
                Chơi Ngay (Khách Vãng Lai) 🐾
              </button>
            </div>
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
