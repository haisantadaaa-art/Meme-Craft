/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CozyPetView } from './components/CozyPetView';
import { MinigameHubModal } from './components/MinigameHubModal';
import { CaroGame } from './components/games/CaroGame';
import { WordChainGame } from './components/games/WordChainGame';
import { CatchWordGame } from './components/games/CatchWordGame';
import { MillionaireGame } from './components/games/MillionaireGame';
import { BauCuaGame } from './components/games/BauCuaGame';
import { XiangqiGame } from './components/games/XiangqiGame';
import { GoGame } from './components/games/GoGame';
import { SchulteGame } from './components/games/SchulteGame';
import { MonopolyGame } from './components/games/MonopolyGame';
import { TapWarGame } from './components/games/TapWarGame';
import { SlingPuckGame } from './components/games/SlingPuckGame';
import { FloatingChatFAB } from './components/FloatingChatFAB';
import { PetCheerleaderWidget } from './components/PetCheerleaderWidget';
import { AuthModal } from './components/AuthModal';
import { FriendsModal } from './components/FriendsModal';
import { AboutModal } from './components/AboutModal';
import { MusicModal } from './components/MusicModal';
import { GameLobbyModal } from './components/GameLobbyModal';
import { MusicProvider } from './context/MusicContext';
import { db, ref, onValue, update, set } from './services/firebase';
import { sound } from './utils/soundEffects';
import { ArrowLeft } from 'lucide-react';

type GameView =
  | 'COZY_PET'
  | 'XIANGQI_GAME'
  | 'GO_GAME'
  | 'CARO_GAME'
  | 'WORD_CHAIN_GAME'
  | 'CATCH_WORD_GAME'
  | 'MILLIONAIRE_GAME'
  | 'BAU_CUA_GAME'
  | 'SCHULTE_GAME'
  | 'MONOPOLY_GAME'
  | 'TAP_WAR_GAME'
  | 'SLING_PUCK_GAME';

function MainApp() {
  const { user, addCoins, addFertilizers, addExp } = (useAuth() || {}) as any;
  const [currentView, setCurrentView] = useState<GameView>('COZY_PET');
  const [isMinigamesModalOpen, setIsMinigamesModalOpen] = useState(false);
  const [lobbyGameType, setLobbyGameType] = useState<string | null>(null);

  // Mini-Game State
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');
  const [isBotGame, setIsBotGame] = useState<boolean>(true);
  const [myRole, setMyRole] = useState<'X' | 'O'>('X');
  const [roomData, setRoomData] = useState<any>(null);

  // 1-Chạm Mời Bạn Bè: Tự động vào phòng khi mở qua link chia sẻ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const joinGame = params.get('joinGame')?.toLowerCase();
      const room = params.get('room');

      if (joinGame && room) {
        const gameMap: Record<string, GameView> = {
          xiangqi: 'XIANGQI_GAME',
          caro: 'CARO_GAME',
          go: 'GO_GAME',
          wordchain: 'WORD_CHAIN_GAME',
          millionaire: 'MILLIONAIRE_GAME',
          schulte: 'SCHULTE_GAME',
          monopoly: 'MONOPOLY_GAME',
          tapwar: 'TAP_WAR_GAME',
          slingpuck: 'SLING_PUCK_GAME',
        };

        const target = gameMap[joinGame];
        if (target) {
          setActiveRoomCode(room);
          setIsBotGame(false);
          setMyRole('O');
          setCurrentView(target);
          sound.playTing();
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc tham số URL mời bạn:', e);
    }
  }, []);

  // Lắng nghe dữ liệu phòng realtime từ Firebase nếu đang trong phòng online
  useEffect(() => {
    if (isBotGame || !activeRoomCode) return;

    const roomRef = ref(db, `rooms/${activeRoomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomData(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [activeRoomCode, isBotGame]);

  // Khi bấm chọn game từ Sảnh Minigame Hub:
  // Nếu là Cờ Tướng, Cờ Caro, hoặc Cờ Vây -> Mở Modal Chọn Chế Độ Chơi (Game Lobby)
  // Các game khác -> Bắt đầu chơi ngay
  const handleSelectMinigame = (gameType: string) => {
    setIsMinigamesModalOpen(false);
    const norm = (gameType || '').toUpperCase();
    if (norm === 'XIANGQI' || norm === 'CARO' || norm === 'GO') {
      setLobbyGameType(norm);
    } else {
      handleStartGame(norm, '', true, 'X');
    }
  };

  // Bắt đầu Mini-Game từ popup Sảnh Mini-Game
  const handleStartGame = (gameType: string, roomCode: string = '', isBot: boolean = true, role: 'X' | 'O' = 'X') => {
    setActiveRoomCode(roomCode);
    setIsBotGame(isBot);
    setMyRole(role);
    setIsMinigamesModalOpen(false);

    const type = (gameType || '').toUpperCase();
    if (type === 'XIANGQI') {
      setCurrentView('XIANGQI_GAME');
    } else if (type === 'GO') {
      setCurrentView('GO_GAME');
    } else if (type === 'CARO') {
      setCurrentView('CARO_GAME');
    } else if (type === 'WORD_CHAIN') {
      setCurrentView('WORD_CHAIN_GAME');
    } else if (type === 'CATCH_WORD') {
      setCurrentView('CATCH_WORD_GAME');
    } else if (type === 'MILLIONAIRE') {
      setCurrentView('MILLIONAIRE_GAME');
    } else if (type === 'BAU_CUA') {
      setCurrentView('BAU_CUA_GAME');
    } else if (type === 'SCHULTE') {
      setCurrentView('SCHULTE_GAME');
    } else if (type === 'MONOPOLY') {
      setCurrentView('MONOPOLY_GAME');
    } else if (type === 'TAP_WAR') {
      setCurrentView('TAP_WAR_GAME');
    } else if (type === 'SLING_PUCK') {
      setCurrentView('SLING_PUCK_GAME');
    } else {
      setCurrentView('XIANGQI_GAME');
    }
  };

  // Nhận thưởng từ Mini-game (Xu, Phân bón, EXP & Túi Quà Trợ Chiến cho Bé Cưng)
  const handleRewardWon = (coins: number, fertilizers: number) => {
    addCoins(coins);
    if (addFertilizers) addFertilizers(fertilizers);
    addExp(Math.round(coins / 2));

    // Thưởng 1 Túi Quà Trợ Chiến về phòng nuôi thú cưng
    try {
      const currentBags = parseInt(localStorage.getItem('cozy_pet_cheer_bags') || '0', 10);
      localStorage.setItem('cozy_pet_cheer_bags', String(currentBags + 1));
    } catch (e) {
      // ignore
    }
  };

  // Chấp nhận lời mời từ bạn bè: cập nhật thẳng vào room và chuyển cảnh < 0.3s
  const handleAcceptInvite = async (invitation: any) => {
    const pin = typeof invitation === 'string' ? invitation : invitation?.roomPin;
    const gameType = (typeof invitation === 'object' ? invitation?.gameType : 'CARO') || 'CARO';

    if (!pin) return;

    sound.playWin();
    setActiveRoomCode(pin);
    setIsBotGame(false);
    setMyRole('O');

    try {
      const guestPlayer = {
        id: user?.uid || 'guest_1',
        name: user?.displayName || 'Khách Ghé Thăm',
        avatar: user?.avatar || '👩‍🍳',
        symbol: 'O',
      };
      await update(ref(db, `rooms/${pin}`), {
        guest: guestPlayer,
        status: 'playing',
        currentTurn: 'X',
      });
      if (user?.uid) {
        set(ref(db, `invitations/${user.uid}`), null).catch(() => {});
      }
    } catch (e) {
      console.error('Lỗi đồng bộ tham gia phòng:', e);
    }

    const normType = String(gameType).toUpperCase();
    if (normType === 'XIANGQI') setCurrentView('XIANGQI_GAME');
    else if (normType === 'GO') setCurrentView('GO_GAME');
    else if (normType === 'CARO') setCurrentView('CARO_GAME');
    else if (normType === 'WORD_CHAIN') setCurrentView('WORD_CHAIN_GAME');
    else if (normType === 'CATCH_WORD') setCurrentView('CATCH_WORD_GAME');
    else if (normType === 'MILLIONAIRE') setCurrentView('MILLIONAIRE_GAME');
    else if (normType === 'BAU_CUA') setCurrentView('BAU_CUA_GAME');
    else setCurrentView('XIANGQI_GAME');
  };

  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] bg-[#F5EDE0] flex justify-center items-center overflow-hidden font-jakarta select-none text-slate-800">
      {/* Khung dọc App chuẩn Mobile (w-full max-w-[430px]) */}
      <div className="w-full max-w-[430px] min-h-[100dvh] h-[100dvh] bg-[#FFFDF7] flex flex-col relative shadow-2xl overflow-hidden">
        {/* 1. Màn Hình Chính Thú Cưng (CozyPetView) hoặc Màn Hình Mini-Game */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentView === 'COZY_PET' ? (
            <CozyPetView onOpenMinigames={() => setIsMinigamesModalOpen(true)} />
          ) : (
            <div className="flex-1 flex flex-col bg-[#FFF9EE] pb-4 h-full overflow-hidden">
              {/* Thanh Thoát Mini-Game để Trở Về Phòng Thú Cưng */}
              <div className="bg-[#FFFDF9] border-b-2 border-amber-300 px-3 py-2 flex items-center justify-between shadow-sm shrink-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    setCurrentView('COZY_PET');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-fredoka font-black text-xs shadow-sm transition active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Về Phòng Thú Cưng 🐾</span>
                </button>
                <span className="font-fredoka font-black text-xs text-amber-950">
                  GÓC ĐẤU TRÍ MINIGAME
                </span>
              </div>

              {/* Nội dung Game */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                {currentView === 'XIANGQI_GAME' && (
                  <XiangqiGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole === 'X' ? 'r' : 'b'}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chủ Nuôi'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'GO_GAME' && (
                  <GoGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole === 'X' ? 'b' : 'w'}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chủ Nuôi'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'CARO_GAME' && (
                  <CaroGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole}
                    isBotMode={isBotGame}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'WORD_CHAIN_GAME' && (
                  <WordChainGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chủ Nuôi'}
                    playerId={user?.uid || 'user_1'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'CATCH_WORD_GAME' && (
                  <CatchWordGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chủ Nuôi'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'MILLIONAIRE_GAME' && (
                  <MillionaireGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chủ Nuôi'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'BAU_CUA_GAME' && (
                  <BauCuaGame
                    roomCode={activeRoomCode}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'SCHULTE_GAME' && (
                  <SchulteGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole === 'X' ? 'p1' : 'p2'}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chủ Nuôi'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'MONOPOLY_GAME' && (
                  <MonopolyGame
                    playerName={user?.displayName || 'Chủ Tiệm'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'TAP_WAR_GAME' && (
                  <TapWarGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole === 'X' ? 'p1' : 'p2'}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Chiến Binh'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}

                {currentView === 'SLING_PUCK_GAME' && (
                  <SlingPuckGame
                    roomData={roomData}
                    roomCode={activeRoomCode}
                    myRole={myRole === 'X' ? 'p1' : 'p2'}
                    isBotMode={isBotGame}
                    playerName={user?.displayName || 'Xạ Thủ'}
                    onRewardWon={handleRewardWon}
                    onExit={() => setCurrentView('COZY_PET')}
                  />
                )}
              </div>

              {/* Khung Chat & Emoji Động Nổi Trong Minigame Online */}
              {!isBotGame && activeRoomCode && (
                <FloatingChatFAB roomPin={activeRoomCode} isBotMode={false} />
              )}
            </div>
          )}
        </main>

        {/* 2. Modals Quản Lý & Sảnh Mini-Game */}
        {isMinigamesModalOpen && (
          <MinigameHubModal
            onSelectGame={handleSelectMinigame}
            onClose={() => setIsMinigamesModalOpen(false)}
          />
        )}
        {lobbyGameType && (
          <GameLobbyModal
            gameType={lobbyGameType}
            onStartGame={(type: string, pin: string, isBot: boolean, role: 'X' | 'O') => {
              handleStartGame(type, pin, isBot, role);
              setLobbyGameType(null);
            }}
            onClose={() => setLobbyGameType(null)}
          />
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
