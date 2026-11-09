import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../utils/multiplayerPeer';
import { OnlineRoomToolbar } from '../OnlineRoomToolbar';
import { Trophy, RotateCcw, Zap, Flame, Users, Smartphone, Bot, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

export function TapWarGame({
  roomData = null,
  roomCode: initialRoomCode = '',
  myRole: initialRole = 'p1',
  isBotMode: initialBotMode = true,
  playerName = 'Chiến Binh',
  onRewardWon,
  onExit,
}) {
  // Chế độ chơi: 'local' (2 người cùng 1 điện thoại), 'bot' (đấu Bot AI), 'online' (online 2 máy)
  const [playMode, setPlayMode] = useState(initialBotMode ? 'local' : 'online');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [myRole, setMyRole] = useState(initialRole); // 'p1' (Xanh - Dưới) | 'p2' (Đỏ - Trên)
  const [connectedPlayer, setConnectedPlayer] = useState(null);
  const [matchCountdown, setMatchCountdown] = useState(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);

  // Trạng thái trận đấu
  // position: từ -50 (P2 thắng tuyệt đối) đến +50 (P1 thắng tuyệt đối), 0 là chính giữa
  const [ropePosition, setRopePosition] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'countdown' | 'playing' | 'ended'
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | null
  const [p1Combo, setP1Combo] = useState(0);
  const [p2Combo, setP2Combo] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);
  const botIntervalRef = useRef(null);
  const comboTimer1Ref = useRef(null);
  const comboTimer2Ref = useRef(null);

  // Khởi động trận đấu
  const startGame = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    setRopePosition(0);
    setWinner(null);
    setP1Combo(0);
    setP2Combo(0);
    setRewardClaimed(false);
    sound.playClick();

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playTick();
      } else if (count === 0) {
        setCountdown(0);
        sound.playTing();
      } else {
        clearInterval(timer);
        setGameState('playing');
      }
    }, 800);
  }, []);

  // Thiết lập phiên kết nối Online P2P
  useEffect(() => {
    if (playMode !== 'online') {
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }
      return;
    }

    const session = new GameRoomSession({
      gameType: 'tapwar',
      playerName,
      onState: (state) => {
        if (!state) return;
        if (state.ropePosition !== undefined) setRopePosition(state.ropePosition);
        if (state.gameState) setGameState(state.gameState);
        if (state.winner !== undefined) {
          setWinner(state.winner);
          if (state.winner && state.winner === myRole && !rewardClaimed) {
            sound.playWin();
            confetti({ particleCount: 80, spread: 80 });
            setRewardClaimed(true);
            if (onRewardWon) onRewardWon(100, 3);
          }
        }
        if (state.p2) setConnectedPlayer(state.p2.name);
      },
      onPlayerJoin: (player) => {
        setConnectedPlayer(player.name);
        sound.playTing();
      },
      onPlayerLeft: () => {
        setConnectedPlayer(null);
      },
    });

    sessionRef.current = session;

    return () => {
      session.destroy();
      sessionRef.current = null;
    };
  }, [playMode, playerName, myRole, rewardClaimed, onRewardWon]);

  // Tìm trận nhanh
  const handleQuickMatch = async () => {
    if (!sessionRef.current) return;
    setIsSearchingMatch(true);
    sound.playClick();

    const res = await sessionRef.current.quickMatch(
      { ropePosition: 0, gameState: 'ready' },
      (cd) => setMatchCountdown(cd)
    );

    setIsSearchingMatch(false);
    setRoomCode(res.roomCode);
    setMyRole(res.isHost ? 'p1' : 'p2');
    startGame();
  };

  const handleCreateRoom = async () => {
    if (!sessionRef.current) return;
    const code = await sessionRef.current.createRoom({ ropePosition: 0, gameState: 'ready' });
    setRoomCode(code);
    setMyRole('p1');
    sound.playClick();
  };

  const handleJoinRoom = async (code) => {
    if (!sessionRef.current) return;
    const ok = await sessionRef.current.joinRoom(code);
    if (ok) {
      setRoomCode(code);
      setMyRole('p2');
      sound.playTing();
      startGame();
    } else {
      alert('Không tìm thấy phòng!');
    }
  };

  const handleLeaveRoom = () => {
    if (sessionRef.current) sessionRef.current.leaveRoom();
    setRoomCode('');
    setConnectedPlayer(null);
    setPlayMode('local');
    setRopePosition(0);
    setGameState('ready');
  };

  // Bot AI tự động bấm (Tùy tốc độ)
  useEffect(() => {
    if (playMode !== 'bot' || gameState !== 'playing' || winner) {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      return;
    }

    // Bot bấm ngẫu nhiên 6-10 cú/giây
    botIntervalRef.current = setInterval(() => {
      handlePlayerTap('p2');
    }, 120 + Math.random() * 80);

    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, [playMode, gameState, winner]);

  // Xử lý cú bấm (Tap)
  const handlePlayerTap = (player) => {
    if (gameState !== 'playing' || winner) return;

    sound.playPop();

    // Tăng combo
    if (player === 'p1') {
      setP1Combo((prev) => prev + 1);
      if (comboTimer1Ref.current) clearTimeout(comboTimer1Ref.current);
      comboTimer1Ref.current = setTimeout(() => setP1Combo(0), 600);
    } else {
      setP2Combo((prev) => prev + 1);
      if (comboTimer2Ref.current) clearTimeout(comboTimer2Ref.current);
      comboTimer2Ref.current = setTimeout(() => setP2Combo(0), 600);
    }

    // Lực kéo mỗi cú bấm: +2.2 đơn vị
    const delta = player === 'p1' ? 2.2 : -2.2;

    setRopePosition((prev) => {
      const nextPos = prev + delta;

      // Kiểm tra thắng bại: ngưỡng -45 hoặc +45
      if (nextPos >= 45) {
        setWinner('p1');
        setGameState('ended');
        sound.playWin();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.8 } });
        if (!rewardClaimed && onRewardWon) {
          setRewardClaimed(true);
          onRewardWon(100, 3);
        }
        if (playMode === 'online' && sessionRef.current) {
          sessionRef.current.syncGameState({ ropePosition: 45, winner: 'p1', gameState: 'ended' });
        }
        return 45;
      } else if (nextPos <= -45) {
        setWinner('p2');
        setGameState('ended');
        sound.playLose();
        if (playMode === 'online' && sessionRef.current) {
          sessionRef.current.syncGameState({ ropePosition: -45, winner: 'p2', gameState: 'ended' });
        }
        return -45;
      }

      if (playMode === 'online' && sessionRef.current) {
        sessionRef.current.syncGameState({ ropePosition: nextPos, gameState: 'playing' });
      }

      return nextPos;
    });
  };

  // Tính tỷ lệ % độ chiếm lĩnh sân đấu
  // ropePosition chạy từ -45 đến +45 -> chuyển sang 5% đến 95%
  const boundaryPercent = 50 + (ropePosition / 45) * 45;

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. THANH CHỌN CHẾ ĐỘ & ONLINE TOOLBAR */}
      {playMode === 'online' ? (
        <OnlineRoomToolbar
          gameType="tapwar"
          isOnlineMode={true}
          onToggleMode={() => setPlayMode('local')}
          roomCode={roomCode}
          isHost={myRole === 'p1'}
          myRole={myRole}
          connectedPlayer={connectedPlayer}
          matchCountdown={matchCountdown}
          isSearchingMatch={isSearchingMatch}
          onCreateRoom={handleCreateRoom}
          onQuickMatch={handleQuickMatch}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <div className="w-full bg-white/95 border border-amber-200 rounded-2xl p-1.5 shadow-2xs mb-2 flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playClick();
                setPlayMode('local');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-fredoka font-black flex items-center gap-1 transition ${
                playMode === 'local'
                  ? 'bg-amber-400 text-black shadow-xs border border-amber-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Chung Máy (2P)</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setPlayMode('bot');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-fredoka font-black flex items-center gap-1 transition ${
                playMode === 'bot'
                  ? 'bg-amber-400 text-black shadow-xs border border-amber-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Đấu Bot AI</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setPlayMode('online');
            }}
            className="px-2.5 py-1 rounded-xl text-xs font-fredoka font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Đấu Online</span>
          </button>
        </div>
      )}

      {/* 2. KHUNG CHIẾN ĐẤU CHIA ĐÔI MÀN HÌNH (TUG OF WAR ARENA) */}
      <div className="flex-1 w-full rounded-3xl overflow-hidden border-4 border-amber-400 shadow-lg relative flex flex-col my-1 bg-slate-900">
        {/* NỬA TRÊN: PLAYER 2 (ĐỎ) */}
        <div
          onClick={() => {
            if (playMode === 'local' || (playMode === 'online' && myRole === 'p2')) {
              handlePlayerTap('p2');
            }
          }}
          style={{ height: `${100 - boundaryPercent}%` }}
          className={`w-full bg-gradient-to-b from-rose-500 via-rose-600 to-red-700 transition-all duration-75 relative flex flex-col items-center justify-start p-4 ${
            playMode === 'bot' || (playMode === 'online' && myRole === 'p1')
              ? 'cursor-default'
              : 'cursor-pointer active:brightness-110'
          }`}
        >
          {/* Header Player 2 (Xoay 180 độ nếu chơi 2 người chung máy) */}
          <div
            className={`flex items-center justify-between w-full text-white font-fredoka font-black text-sm select-none ${
              playMode === 'local' ? 'rotate-180 mb-auto' : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🔴</span>
              <span>{playMode === 'bot' ? 'Bot AI Tốc Độ' : 'Người Chơi 2'}</span>
            </div>
            {p2Combo > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-xs font-black animate-bounce flex items-center gap-0.5">
                <Flame className="w-3 h-3 fill-rose-600 text-rose-600" />
                <span>COMBO x{p2Combo}!</span>
              </span>
            )}
          </div>

          <div
            className={`mt-auto text-white/70 font-fredoka font-bold text-xs select-none ${
              playMode === 'local' ? 'rotate-180' : ''
            }`}
          >
            {gameState === 'playing' ? 'BẤM LIÊN TỤC VÀO ĐÂY! 💥' : ''}
          </div>
        </div>

        {/* RANH GIỚI & DÂY KÉO CO CAPYBARA Ở GIỮA */}
        <div
          style={{ top: `${boundaryPercent}%` }}
          className="absolute inset-x-0 -translate-y-1/2 z-20 pointer-events-none transition-all duration-75 flex items-center justify-center"
        >
          {/* Sợi dây thừng kéo co */}
          <div className="absolute inset-x-0 h-4 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 border-y-2 border-amber-900 shadow-md flex items-center justify-around">
            <span className="w-1 h-full bg-white/40" />
            <span className="w-1 h-full bg-white/40" />
            <span className="w-1 h-full bg-white/40" />
            <span className="w-1 h-full bg-white/40" />
          </div>

          {/* Bé Capybara kéo co ở tâm điểm ranh giới */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-500 shadow-xl flex items-center justify-center text-3xl animate-pulse">
            <span
              className="inline-block transition-transform duration-100"
              style={{ transform: `rotate(${ropePosition * 0.8}deg)` }}
            >
              🦫
            </span>
            <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-400 text-black font-fredoka font-black text-[9px] border border-amber-600 shadow-xs">
              KÉO CO
            </div>
          </div>
        </div>

        {/* NỬA DƯỚI: PLAYER 1 (XANH DƯƠNG) */}
        <div
          onClick={() => {
            if (playMode === 'local' || playMode === 'bot' || (playMode === 'online' && myRole === 'p1')) {
              handlePlayerTap('p1');
            }
          }}
          style={{ height: `${boundaryPercent}%` }}
          className={`w-full bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-600 transition-all duration-75 relative flex flex-col items-center justify-end p-4 ${
            playMode === 'online' && myRole === 'p2' ? 'cursor-default' : 'cursor-pointer active:brightness-110'
          }`}
        >
          <div className="mb-auto text-white/70 font-fredoka font-bold text-xs select-none">
            {gameState === 'playing' ? 'BẤM NHANH TAY LÊN! ⚡' : ''}
          </div>

          <div className="flex items-center justify-between w-full text-white font-fredoka font-black text-sm select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🔵</span>
              <span>{playMode === 'online' && myRole === 'p2' ? 'Đối thủ' : playerName || 'Bạn (Xanh)'}</span>
            </div>
            {p1Combo > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-xs font-black animate-bounce flex items-center gap-0.5">
                <Flame className="w-3 h-3 fill-orange-600 text-orange-600" />
                <span>COMBO x{p1Combo}!</span>
              </span>
            )}
          </div>
        </div>

        {/* MÀN HÌNH CHUẨN BỊ / ĐẾM NGƯỢC 3-2-1 */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-4">
            {gameState === 'ready' && (
              <div className="text-center animate-in zoom-in">
                <div className="text-5xl mb-2 animate-bounce">🦫⚡</div>
                <h3 className="font-fredoka font-black text-xl text-white mb-1">
                  ĐẠI CHIẾN BẤM TỐC ĐỘ
                </h3>
                <p className="text-xs text-amber-200 font-fredoka mb-4 max-w-[260px] mx-auto">
                  Chạm tay liên tục vào nửa sân của mình để đẩy dây thừng ép sát mép sân đối phương!
                </p>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-fredoka font-black text-sm shadow-xl active:scale-95 transition"
                >
                  BẮT ĐẦU VÁN ĐẤU! 🚀
                </button>
              </div>
            )}

            {gameState === 'countdown' && (
              <div className="text-center animate-in zoom-in duration-200">
                <span className="font-fredoka font-black text-8xl text-yellow-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] animate-pulse">
                  {countdown > 0 ? countdown : 'CHIẾN! 🔥'}
                </span>
                <p className="text-white font-fredoka text-sm mt-3">CHUẨN BỊ NGÓN TAY!</p>
              </div>
            )}

            {gameState === 'ended' && (
              <div className="text-center bg-white/95 p-5 rounded-3xl border-4 border-amber-400 shadow-2xl animate-in zoom-in max-w-[300px]">
                <div className="text-5xl mb-2">
                  {winner === 'p1' ? '🔵👑' : '🔴👑'}
                </div>
                <h3 className="font-fredoka font-black text-lg text-slate-800 mb-1">
                  {winner === 'p1'
                    ? playMode === 'local'
                      ? 'NGƯỜI CHƠI 1 CHIẾN THẮNG!'
                      : 'BẠN ĐÃ CHIẾN THẮNG TUYỆT ĐỐI!'
                    : playMode === 'local'
                    ? 'NGƯỜI CHƠI 2 CHIẾN THẮNG!'
                    : 'ĐỐI THỦ ĐÃ CHIẾN THẮNG!'}
                </h3>
                <p className="text-xs text-slate-500 font-bold mb-4">
                  Tốc độ tay thần sầu không ai sánh kịp! (+100 Xu)
                </p>
                <button
                  onClick={startGame}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-fredoka font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>PHỤC THÙ VÁN MỚI</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. NÚT RESET & THÔNG TIN DƯỚI */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[10px] text-slate-500 font-bold">
          💡 Mẹo: Dùng 2 ngón tay gõ luân phiên để đạt tốc độ bấm cao nhất!
        </span>
        <button
          onClick={startGame}
          title="Chơi lại"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 active:scale-90 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default TapWarGame;
