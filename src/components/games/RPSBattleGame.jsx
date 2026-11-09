import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Timer,
  Zap,
  Flame,
  Swords,
  Trophy,
  Shield,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RPS_CHOICES = [
  { id: 'rock', name: 'BÚA', icon: '✊', beats: 'scissors', color: 'from-amber-500 to-orange-600', ring: 'ring-amber-500' },
  { id: 'scissors', name: 'KÉO', icon: '✌️', beats: 'paper', color: 'from-rose-500 to-red-600', ring: 'ring-rose-500' },
  { id: 'paper', name: 'BAO', icon: '🖐️', beats: 'rock', color: 'from-blue-500 to-cyan-600', ring: 'ring-blue-500' },
];

export function RPSBattleGame({
  roomCode = '',
  myRole = 'p1', // 'p1' | 'p2'
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const [round, setRound] = useState(1);
  const [winsP1, setWinsP1] = useState(0); // Cần 3 ván để thắng trận (BO5)
  const [winsP2, setWinsP2] = useState(0);
  const [p1Choice, setP1Choice] = useState(null); // 'rock' | 'scissors' | 'paper'
  const [p2Choice, setP2Choice] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null); // 'p1' | 'p2' | 'tie'
  const [roundStatusText, setRoundStatusText] = useState('Chọn chiêu thức trong 5s!');

  // Thanh nộ tất sát (0 đến 3)
  const [p1Rage, setP1Rage] = useState(0);
  const [isUltActive, setIsUltActive] = useState(false);

  // Trạng thái vòng chơi: 'CHOOSING' | 'REVEALING' | 'ROUND_OVER' | 'MATCH_OVER'
  const [phase, setPhase] = useState('CHOOSING');
  const [countdown, setCountdown] = useState(5);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const sessionRef = useRef(null);
  const timerRef = useRef(null);
  const botThinkRef = useRef(null);

  // Khởi tạo trận đấu
  const initMatch = useCallback(() => {
    setRound(1);
    setWinsP1(0);
    setWinsP2(0);
    setP1Choice(null);
    setP2Choice(null);
    setRoundWinner(null);
    setP1Rage(0);
    setIsUltActive(false);
    setPhase('CHOOSING');
    setCountdown(5);
    setRoundStatusText('Hiệp 1: Hãy chọn Búa, Kéo hoặc Bao!');
    setRewardClaimed(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (botThinkRef.current) clearTimeout(botThinkRef.current);
  }, []);

  useEffect(() => {
    initMatch();
  }, [initMatch]);

  // Đồng bộ P2P Realtime
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'rps',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '✊' },
      (gameState) => {
        if (!gameState) return;
        if (gameState.phase) setPhase(gameState.phase);
        if (typeof gameState.winsP1 === 'number') setWinsP1(gameState.winsP1);
        if (typeof gameState.winsP2 === 'number') setWinsP2(gameState.winsP2);
        if (typeof gameState.round === 'number') setRound(gameState.round);
        if (gameState.roundWinner) setRoundWinner(gameState.roundWinner);
        if (gameState.roundStatusText) setRoundStatusText(gameState.roundStatusText);

        // Chỉ tiết lộ lựa chọn khi đã ở phase REVEAL
        if (gameState.phase === 'REVEALING' || gameState.phase === 'ROUND_OVER') {
          if (gameState.p1Choice) setP1Choice(gameState.p1Choice);
          if (gameState.p2Choice) setP2Choice(gameState.p2Choice);
        }
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName]);

  // Đếm ngược 5 giây chọn chiêu
  useEffect(() => {
    if (phase !== 'CHOOSING') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpire();
          return 0;
        }
        if (prev <= 3) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, p1Choice, p2Choice]);

  // Hết giờ mà chưa chọn -> Tự động gán ngẫu nhiên
  const handleTimeExpire = () => {
    const randomChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)].id;
    if (!p1Choice) {
      handleMakeChoice(randomChoice, true);
    }
  };

  // Bot AI ra chiêu bí mật
  useEffect(() => {
    if (!isBotMode || phase !== 'CHOOSING' || p2Choice) return;

    const delay = Math.random() * 1800 + 800;
    botThinkRef.current = setTimeout(() => {
      const botPick = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)].id;
      setP2Choice(botPick);
    }, delay);

    return () => {
      if (botThinkRef.current) clearTimeout(botThinkRef.current);
    };
  }, [isBotMode, phase, p2Choice]);

  // Người chơi bấm chọn chiêu
  const handleMakeChoice = (choiceId, isAuto = false) => {
    if (phase !== 'CHOOSING' || p1Choice) return;

    sound.playClick();
    setP1Choice(choiceId);

    // Nếu đối thủ đã chọn xong (hoặc là bot đã có quyết định), bắt đầu ngửa bài
    if (isBotMode) {
      // Nếu bot chưa chọn kịp, gán ngay lựa chọn cho bot
      const currentBotPick = p2Choice || RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)].id;
      setP2Choice(currentBotPick);
      startReveal(choiceId, currentBotPick);
    } else if (sessionRef.current) {
      sessionRef.current.syncGameState({
        p1HasChosen: myRole === 'p1',
        p2HasChosen: myRole === 'p2',
        choice: choiceId,
      });
    }
  };

  // Ngửa bài đối đầu đồng thời
  const startReveal = (c1, c2) => {
    setPhase('REVEALING');
    sound.playPop();

    setTimeout(() => {
      resolveRound(c1, c2);
    }, 1200);
  };

  // Phân định kết quả hiệp
  const resolveRound = (c1, c2) => {
    let winner = null;
    let status = '';

    if (c1 === c2) {
      winner = 'tie';
      status = 'Hòa hiệp! Hai bên cùng chí hướng 🤝';
      sound.playClick();
    } else {
      const p1Obj = RPS_CHOICES.find((c) => c.id === c1);
      if (p1Obj?.beats === c2) {
        winner = 'p1';
        const winPts = isUltActive ? 2 : 1;
        const newWinsP1 = winsP1 + winPts;
        setWinsP1(newWinsP1);
        setP1Rage((r) => Math.min(3, r + 1));
        setIsUltActive(false);
        status = isUltActive
          ? `💥 BẠO KÍCH TẤT SÁT! ${p1Obj.name} ĐẬP TAN ĐỐI THỦ (+2 ĐIỂM)!`
          : `🎉 ${p1Obj.name} khắc chế đối phương (+1 Điểm)!`;
        sound.playWin();
      } else {
        winner = 'p2';
        setWinsP2((w) => w + 1);
        setIsUltActive(false);
        const p2Obj = RPS_CHOICES.find((c) => c.id === c2);
        status = `😢 Đối thủ ra ${p2Obj?.name} thắng hiệp này!`;
        sound.playBomb();
      }
    }

    setRoundWinner(winner);
    setRoundStatusText(status);
    setPhase('ROUND_OVER');

    // Kiểm tra đã có người đạt 3 ván thắng (BO5) chưa
    setTimeout(() => {
      setWinsP1((curP1) => {
        setWinsP2((curP2) => {
          if (curP1 >= 3 || curP2 >= 3) {
            setPhase('MATCH_OVER');
            if (curP1 >= 3) {
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
              sound.playWin();
              if (!rewardClaimed && onRewardWon) {
                setRewardClaimed(true);
                onRewardWon(150, 3);
              }
            } else {
              sound.playBomb();
            }
          } else {
            // Bước sang hiệp kế tiếp
            nextRound();
          }
          return curP2;
        });
        return curP1;
      });
    }, 1800);
  };

  // Chuyển hiệp mới
  const nextRound = () => {
    setRound((r) => r + 1);
    setP1Choice(null);
    setP2Choice(null);
    setRoundWinner(null);
    setCountdown(5);
    setPhase('CHOOSING');
    setRoundStatusText(`Hiệp ${round + 1}: Ra đòn quyết định!`);
  };

  // Kích hoạt chiêu Tất Sát khi thanh nộ đầy 3/3
  const handleActivateUlt = () => {
    if (p1Rage < 3 || isUltActive || phase !== 'CHOOSING') return;
    sound.playTing();
    setIsUltActive(true);
    setP1Rage(0);
    setRoundStatusText('🔥 ĐÃ KÍCH HOẠT TẤT SÁT! Nếu thắng hiệp này nhận ngay +2 ĐIỂM!');
  };

  const getChoiceObj = (id) => RPS_CHOICES.find((c) => c.id === id);

  return (
    <div className="flex-1 flex flex-col justify-between p-2 select-none font-jakarta max-w-[430px] mx-auto w-full h-full overflow-hidden text-slate-800">
      {/* 1. HEADER CHUẨN: [🔙 Về Sảnh] + TÊN GAME + BADGE PHÒNG/BOT */}
      <div className="bg-white/95 p-2 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-1.5">
        <button
          onClick={() => {
            sound.playClick();
            if (onExit) onExit();
          }}
          className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-fredoka font-black text-xs flex items-center gap-1 transition active:scale-95 border border-amber-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Sảnh</span>
        </button>

        <div className="text-center leading-tight">
          <span className="font-fredoka font-black text-xs text-rose-950 block">
            OÁNH TÙ TÌ SINH TỬ
          </span>
          <span className="text-[9px] text-rose-700 font-bold">
            {isBotMode ? `Đấu Bot AI (${botDifficulty})` : `Phòng Online #${roomCode}`}
          </span>
        </div>

        <button
          onClick={initMatch}
          title="Chơi lại trận mới"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-90"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. THANH ĐỐI ĐẦU BO5: TỈ SỐ HIỆP THẮNG (3 SAO ĐỂ VÔ ĐỊCH) */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-rose-900 text-white p-2 rounded-2xl border border-white/20 shadow-xs shrink-0 flex items-center justify-between gap-2 my-1">
        {/* P1 (Bạn) */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-fredoka font-black text-sm border-2 border-white/40 shadow-xs">
            {myRole === 'p1' ? 'Bạn' : 'P1'}
          </div>
          <div className="leading-tight">
            <span className="text-[11px] font-fredoka font-black text-blue-200 block truncate max-w-[80px]">
              {myRole === 'p1' ? playerName : 'Đối Thủ'}
            </span>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`text-xs ${i < winsP1 ? 'text-amber-400 drop-shadow-xs' : 'text-slate-600 opacity-40'}`}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Thông tin hiệp đấu & Đồng hồ đếm ngược */}
        <div className="text-center shrink-0">
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-fredoka font-black tracking-wider text-amber-300 block mb-0.5">
            HIỆP {round} / BO5
          </span>
          <span className="font-mono font-black text-sm text-cyan-200 flex items-center justify-center gap-0.5">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            {phase === 'CHOOSING' ? `${countdown}s` : '---'}
          </span>
        </div>

        {/* P2 (Đối Thủ / Bot) */}
        <div className="flex items-center justify-end gap-2 text-right">
          <div className="leading-tight">
            <span className="text-[11px] font-fredoka font-black text-rose-200 block truncate max-w-[80px]">
              {isBotMode ? 'Bot AI' : myRole === 'p2' ? playerName : 'Đối Thủ'}
            </span>
            <div className="flex items-center justify-end gap-0.5 mt-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`text-xs ${i < winsP2 ? 'text-amber-400 drop-shadow-xs' : 'text-slate-600 opacity-40'}`}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-fredoka font-black text-sm border-2 border-white/40 shadow-xs">
            {isBotMode ? '🤖' : myRole === 'p2' ? 'Bạn' : 'P2'}
          </div>
        </div>
      </div>

      {/* 3. ĐẤU TRƯỜNG VA CHẠM (CLASH ARENA) */}
      <div className="flex-1 w-full bg-gradient-to-b from-[#1E112A] via-[#2A1838] to-[#1E112A] rounded-3xl border-2 border-amber-400/60 p-3 shadow-inner relative flex flex-col justify-between items-center my-1 overflow-hidden">
        {/* Banner trạng thái hiệp */}
        <div className="w-full bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-center shrink-0">
          <p className="text-xs font-fredoka font-black text-amber-200 leading-tight">
            {roundStatusText}
          </p>
        </div>

        {/* Khu vực đối đầu 2 bàn tay */}
        <div className="flex-1 w-full flex items-center justify-around relative">
          {/* Tay của Bạn (Bên Trái) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-fredoka font-bold text-blue-300 mb-1">
              Bạn
            </span>
            <div
              className={`w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-b from-blue-900/80 to-blue-950 border-2 border-blue-400 flex flex-col items-center justify-center shadow-lg transition-transform duration-300 ${
                phase === 'REVEALING'
                  ? 'translate-x-4 scale-110'
                  : p1Choice
                  ? 'scale-105'
                  : 'animate-pulse'
              }`}
            >
              <span className="text-4xl sm:text-5xl leading-none">
                {phase === 'CHOOSING'
                  ? p1Choice
                    ? '🔒'
                    : '❓'
                  : getChoiceObj(p1Choice)?.icon || '❓'}
              </span>
              <span className="text-[10px] font-fredoka font-black text-white mt-1">
                {phase === 'CHOOSING'
                  ? p1Choice
                    ? 'Đã Chọn'
                    : 'Đang Chọn'
                  : getChoiceObj(p1Choice)?.name || ''}
              </span>
            </div>
          </div>

          {/* Biểu tượng VS va chạm */}
          <div className="flex flex-col items-center justify-center shrink-0 mx-2">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 border-2 border-white flex items-center justify-center shadow-lg transition-transform duration-300 ${
                phase === 'REVEALING' ? 'scale-125 rotate-12' : ''
              }`}
            >
              <Swords className="w-5 h-5 text-white" />
            </div>
            {phase === 'REVEALING' && (
              <span className="text-[10px] font-fredoka font-black text-amber-300 animate-bounce mt-1">
                BÙM! 💥
              </span>
            )}
          </div>

          {/* Tay của Đối Thủ (Bên Phải) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-fredoka font-bold text-rose-300 mb-1">
              {isBotMode ? 'Bot AI' : 'Đối Thủ'}
            </span>
            <div
              className={`w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-b from-rose-900/80 to-rose-950 border-2 border-rose-400 flex flex-col items-center justify-center shadow-lg transition-transform duration-300 ${
                phase === 'REVEALING'
                  ? '-translate-x-4 scale-110'
                  : p2Choice
                  ? 'scale-105'
                  : 'animate-pulse'
              }`}
            >
              <span className="text-4xl sm:text-5xl leading-none">
                {phase === 'CHOOSING'
                  ? p2Choice
                    ? '🔒'
                    : '❓'
                  : getChoiceObj(p2Choice)?.icon || '❓'}
              </span>
              <span className="text-[10px] font-fredoka font-black text-white mt-1">
                {phase === 'CHOOSING'
                  ? p2Choice
                    ? 'Đã Chọn'
                    : 'Đang Chọn'
                  : getChoiceObj(p2Choice)?.name || ''}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh nộ Tất Sát (Rage Meter) */}
        <div className="w-full bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
            <span className="text-[11px] font-fredoka font-black text-orange-200">
              NỘ TẤT SÁT: {p1Rage}/3
            </span>
          </div>

          <button
            onClick={handleActivateUlt}
            disabled={p1Rage < 3 || isUltActive || phase !== 'CHOOSING'}
            className={`px-3 py-1 rounded-xl text-xs font-fredoka font-black flex items-center gap-1 shadow-md transition active:scale-95 ${
              p1Rage >= 3 && !isUltActive
                ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white animate-pulse border border-white cursor-pointer'
                : isUltActive
                ? 'bg-amber-400 text-black border border-white'
                : 'bg-slate-700/60 text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isUltActive ? 'ĐANG KÍCH HOẠT! 🔥' : 'TẤT SÁT 💥'}</span>
          </button>
        </div>
      </div>

      {/* 4. 3 NÚT CHỌN CHIÊU LỚN: [BÚA ✊] - [KÉO ✌️] - [BAO 🖐️] */}
      <div className="grid grid-cols-3 gap-2 my-1 shrink-0">
        {RPS_CHOICES.map((choice) => {
          const isSelected = p1Choice === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => handleMakeChoice(choice.id)}
              disabled={phase !== 'CHOOSING' || Boolean(p1Choice)}
              className={`py-3 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 shadow-md ${
                isSelected
                  ? `bg-gradient-to-b ${choice.color} text-white border-white scale-105 ring-4 ${choice.ring}`
                  : p1Choice
                  ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50'
                  : 'bg-white hover:bg-amber-50 border-amber-300 text-slate-800'
              }`}
            >
              <span className="text-3xl leading-none mb-1 drop-shadow-xs">
                {choice.icon}
              </span>
              <span className="font-fredoka font-black text-xs">
                {choice.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. BANNER KẾT THÚC TRẬN ĐẤU (BO5 VÔ ĐỊCH) */}
      {phase === 'MATCH_OVER' && (
        <div className="mt-1 p-2.5 bg-gradient-to-r from-amber-100 via-rose-100 to-orange-100 border-2 border-rose-400 rounded-2xl text-center shadow-md animate-in zoom-in-95 shrink-0">
          <p className="font-fredoka font-black text-sm text-rose-950 mb-1.5">
            {winsP1 >= 3
              ? `🎉 CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG TRẬN BO5 (${winsP1} - ${winsP2})! (+150 Xu)`
              : `😢 ĐỐI THỦ ĐÃ CHIẾN THẮNG TRẬN BO5 (${winsP2} - ${winsP1})!`}
          </p>
          <button
            onClick={initMatch}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-fredoka font-black text-xs transition active:scale-95 shadow-xs"
          >
            Đấu Lại Trận Mới 🔄
          </button>
        </div>
      )}
    </div>
  );
}

export default RPSBattleGame;
