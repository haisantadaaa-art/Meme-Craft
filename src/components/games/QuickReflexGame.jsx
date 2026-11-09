import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/soundEffects';
import { GameRoomSession } from '../../services/peerNetwork';
import {
  ArrowLeft,
  RotateCcw,
  Zap,
  Timer,
  AlertTriangle,
  Trophy,
  Gauge,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function QuickReflexGame({
  roomCode = '',
  myRole = 'p1', // 'p1' | 'p2'
  isBotMode = true,
  botDifficulty = 'medium',
  playerName = 'Bạn',
  onRewardWon,
  onExit,
}) {
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // Số hiệp thắng
  const [history, setHistory] = useState([]); // [{ round, p1Ms, p2Ms, winner }]

  // Trạng thái đèn: 'IDLE' | 'WAITING' (Đỏ) | 'READY' (Xanh) | 'PENALTY' (Phạm quy) | 'ROUND_OVER' | 'MATCH_OVER'
  const [lightState, setLightState] = useState('IDLE');
  const [p1ReactionMs, setP1ReactionMs] = useState(null);
  const [p2ReactionMs, setP2ReactionMs] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Bấm "SẴN SÀNG" để bắt đầu hiệp 1!');
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const greenTimeRef = useRef(0);
  const lightTimerRef = useRef(null);
  const botReactTimerRef = useRef(null);
  const sessionRef = useRef(null);

  // Khởi tạo trận đấu 5 hiệp
  const initMatch = useCallback(() => {
    setRound(1);
    setScores({ p1: 0, p2: 0 });
    setHistory([]);
    setLightState('IDLE');
    setP1ReactionMs(null);
    setP2ReactionMs(null);
    setStatusMessage('Bấm "SẴN SÀNG" để thử tài phản xạ!');
    setRewardClaimed(false);

    if (lightTimerRef.current) clearTimeout(lightTimerRef.current);
    if (botReactTimerRef.current) clearTimeout(botReactTimerRef.current);
  }, []);

  useEffect(() => {
    initMatch();
  }, [initMatch]);

  // Đồng bộ P2P online
  useEffect(() => {
    if (isBotMode || !roomCode) return;

    const session = new GameRoomSession(
      'quick_reflex',
      { uid: 'player_' + Date.now(), displayName: playerName, avatar: '⚡' },
      (gameState) => {
        if (!gameState) return;
        if (gameState.lightState) setLightState(gameState.lightState);
        if (gameState.scores) setScores(gameState.scores);
        if (typeof gameState.round === 'number') setRound(gameState.round);
        if (gameState.statusMessage) setStatusMessage(gameState.statusMessage);
        if (gameState.p1ReactionMs !== undefined) setP1ReactionMs(gameState.p1ReactionMs);
        if (gameState.p2ReactionMs !== undefined) setP2ReactionMs(gameState.p2ReactionMs);
        if (gameState.history) setHistory(gameState.history);
      }
    );

    session.joinRoom(roomCode);
    sessionRef.current = session;

    return () => {
      session.leaveRoom();
      sessionRef.current = null;
    };
  }, [isBotMode, roomCode, playerName]);

  // Bắt đầu hiệp mới: Đèn Đỏ -> Ngẫu nhiên 2.0s đến 5.5s chuyển sang Đèn Xanh
  const startRoundCountdown = useCallback(() => {
    if (lightTimerRef.current) clearTimeout(lightTimerRef.current);
    if (botReactTimerRef.current) clearTimeout(botReactTimerRef.current);

    setP1ReactionMs(null);
    setP2ReactionMs(null);
    setLightState('WAITING');
    setStatusMessage('🔴 ĐÈN ĐỎ - CHỜ... ĐỪNG BẤM TRƯỚC!');
    sound.playTick();

    // Thời gian ngẫu nhiên 2000ms đến 5200ms
    const randomDelay = Math.floor(Math.random() * 3200) + 2000;

    lightTimerRef.current = setTimeout(() => {
      // ĐỔI SANG ĐÈN XANH!
      greenTimeRef.current = performance.now();
      setLightState('READY');
      setStatusMessage('🟢 ĐÈN XANH! ĐẬP NÚT NGAYYY! ⚡⚡⚡');
      sound.playTing();

      // Bot AI chuẩn bị phản xạ
      if (isBotMode) {
        let minBotMs = 280;
        let maxBotMs = 430;
        if (botDifficulty === 'easy') {
          minBotMs = 400;
          maxBotMs = 620;
        } else if (botDifficulty === 'hard') {
          minBotMs = 180;
          maxBotMs = 280;
        }

        const botDelay = Math.floor(Math.random() * (maxBotMs - minBotMs)) + minBotMs;
        botReactTimerRef.current = setTimeout(() => {
          handleBotReaction(botDelay);
        }, botDelay);
      }
    }, randomDelay);
  }, [isBotMode, botDifficulty]);

  // Xử lý bot phản xạ
  const handleBotReaction = (reactionMs) => {
    setP2ReactionMs(reactionMs);

    setP1ReactionMs((playerMs) => {
      if (playerMs === null) {
        // Bot bấm trước khi người chơi bấm
        resolveRoundResult(null, reactionMs, 'p2');
      }
      return playerMs;
    });
  };

  // Người chơi đập nút phản xạ
  const handlePlayerTap = () => {
    if (lightState === 'IDLE' || lightState === 'ROUND_OVER' || lightState === 'MATCH_OVER') return;

    // 1. PHẠM QUY (FALSE START) KHI BẤM LÚC ĐÈN ĐỎ!
    if (lightState === 'WAITING') {
      if (lightTimerRef.current) clearTimeout(lightTimerRef.current);
      if (botReactTimerRef.current) clearTimeout(botReactTimerRef.current);

      sound.playBomb();
      setLightState('PENALTY');
      setStatusMessage('🚨 PHẠM QUY! BẤM KHI ĐÈN CÒN ĐỎ! (+1 Điểm cho đối thủ)');

      resolveRoundResult(null, null, 'p2', true);
      return;
    }

    // 2. BẤM KHI ĐÈN XANH (READY) -> TÍNH THỜI GIAN PHẢN XẠ (MS)
    if (lightState === 'READY' && p1ReactionMs === null) {
      const now = performance.now();
      const elapsedMs = Math.round(now - greenTimeRef.current);

      sound.playPop();
      setP1ReactionMs(elapsedMs);

      // Nếu đang đấu với Bot:
      if (isBotMode) {
        // Nếu Bot chưa ra tay hoặc Bot chậm hơn
        if (p2ReactionMs === null || elapsedMs < p2ReactionMs) {
          if (botReactTimerRef.current) clearTimeout(botReactTimerRef.current);
          const simulatedBotMs = Math.round(elapsedMs + Math.random() * 80 + 30);
          setP2ReactionMs(simulatedBotMs);
          resolveRoundResult(elapsedMs, simulatedBotMs, 'p1');
        } else {
          resolveRoundResult(elapsedMs, p2ReactionMs, 'p2');
        }
      } else if (sessionRef.current) {
        sessionRef.current.syncGameState({
          playerTapTime: elapsedMs,
          role: myRole,
        });
      }
    }
  };

  // Phân định kết quả hiệp đấu
  const resolveRoundResult = (p1Ms, p2Ms, winnerRole, isPenalty = false) => {
    setLightState('ROUND_OVER');

    const nextScores = {
      ...scores,
      [winnerRole]: scores[winnerRole] + 1,
    };
    setScores(nextScores);

    const isP1Win = winnerRole === 'p1';
    let msg = '';

    if (isPenalty) {
      msg = isP1Win
        ? 'Đối thủ phạm quy đèn đỏ! Bạn được tặng 1 điểm!'
        : 'Bạn phạm quy đèn đỏ! Mất điểm hiệp này!';
    } else {
      msg = isP1Win
        ? `🎉 Bạn nhanh hơn đối thủ! (${p1Ms} ms vs ${p2Ms} ms)`
        : `😢 Đối thủ nhanh hơn! (${p2Ms} ms vs ${p1Ms || 'Chậm'} ms)`;
    }
    setStatusMessage(msg);

    const newHistory = [
      ...history,
      { round, p1Ms: p1Ms || 999, p2Ms: p2Ms || 999, winner: winnerRole, isPenalty },
    ];
    setHistory(newHistory);

    if (isP1Win) sound.playWin();
    else sound.playBomb();

    // Kiểm tra xem đã kết thúc trận 5 hiệp chưa
    setTimeout(() => {
      if (round >= 5) {
        // KẾT THÚC TRẬN ĐẤU (MATCH OVER)
        setLightState('MATCH_OVER');
        if (nextScores.p1 > nextScores.p2) {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          sound.playWin();
          if (!rewardClaimed && onRewardWon) {
            setRewardClaimed(true);
            onRewardWon(150, 3);
          }
        }
      } else {
        // Tự động sang hiệp kế tiếp sau 2s
        setRound((r) => r + 1);
        startRoundCountdown();
      }
    }, 2200);
  };

  // Tính tốc độ phản xạ trung bình
  const validP1 = history.filter((h) => !h.isPenalty && h.p1Ms < 999);
  const avgP1Ms = validP1.length > 0
    ? Math.round(validP1.reduce((sum, h) => sum + h.p1Ms, 0) / validP1.length)
    : 0;

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
          <span className="font-fredoka font-black text-xs text-emerald-950 block">
            ĐUA BẤM ĐÈN TỐC ĐỘ
          </span>
          <span className="text-[9px] text-emerald-700 font-bold">
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

      {/* 2. THANH TỈ SỐ HIỆP ĐẤU (5 HIỆP ĐẤU ĐỐI KHÁNG) */}
      <div className="bg-white/95 p-1.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0 flex items-center justify-between gap-2 my-1">
        {/* P1 */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl flex-1 min-w-0 bg-blue-50 border border-blue-200">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-fredoka font-black text-xs shrink-0">
            {myRole === 'p1' ? 'Bạn' : 'P1'}
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-fredoka font-black text-[11px] text-blue-950 block truncate">
              {myRole === 'p1' ? playerName : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-xs text-blue-700">
              {scores.p1} Hiệp Thắng
            </span>
          </div>
        </div>

        {/* Hiệp đấu */}
        <div className="text-center px-1 shrink-0">
          <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full text-[10px] font-fredoka font-black block mb-0.5">
            HIỆP {round} / 5
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-500">
            TB: {avgP1Ms > 0 ? `${avgP1Ms}ms` : '---'}
          </span>
        </div>

        {/* P2 */}
        <div className="flex items-center justify-end gap-1.5 p-1 rounded-xl flex-1 min-w-0 bg-emerald-50 border border-emerald-200">
          <div className="min-w-0 leading-tight text-right">
            <span className="font-fredoka font-black text-[11px] text-emerald-950 block truncate">
              {isBotMode ? 'Bot AI' : myRole === 'p2' ? playerName : 'Đối Thủ'}
            </span>
            <span className="font-mono font-black text-xs text-emerald-700">
              {scores.p2} Hiệp Thắng
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-fredoka font-black text-xs shrink-0">
            {isBotMode ? '🤖' : myRole === 'p2' ? 'Bạn' : 'P2'}
          </div>
        </div>
      </div>

      {/* 3. ĐÈN TÍN HIỆU GIAO THÔNG KHỔNG LỒ (SIGNAL LIGHT ARENA) */}
      <div className="flex-1 w-full bg-gradient-to-b from-[#111827] via-[#1F2937] to-[#111827] rounded-3xl border-2 border-amber-400/60 p-3 shadow-inner relative flex flex-col justify-between items-center my-1 overflow-hidden">
        {/* Banner thông báo trạng thái */}
        <div className="w-full bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-center shrink-0">
          <p className="text-xs font-fredoka font-black text-amber-200 leading-tight">
            {statusMessage}
          </p>
        </div>

        {/* CỘT ĐÈN TÍN HIỆU TRUNG TÂM */}
        <div className="flex flex-col items-center justify-center my-auto">
          {/* Hộp đèn */}
          <div className="w-24 sm:w-28 bg-black/90 p-3 rounded-3xl border-4 border-slate-700 shadow-2xl flex flex-col items-center gap-3">
            {/* Đèn Đỏ 🔴 */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                lightState === 'WAITING' || lightState === 'PENALTY'
                  ? 'bg-rose-500 border-rose-300 shadow-[0_0_35px_#f43f5e] animate-pulse'
                  : 'bg-rose-950/60 border-rose-900/40 opacity-30'
              }`}
            >
              {lightState === 'WAITING' && (
                <span className="text-xs font-fredoka font-black text-white">CHỜ...</span>
              )}
              {lightState === 'PENALTY' && (
                <AlertTriangle className="w-7 h-7 text-white animate-bounce" />
              )}
            </div>

            {/* Đèn Xanh 🟢 */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                lightState === 'READY'
                  ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_40px_#10b981] scale-105'
                  : 'bg-emerald-950/60 border-emerald-900/40 opacity-30'
              }`}
            >
              {lightState === 'READY' && (
                <Zap className="w-8 h-8 text-white animate-bounce" />
              )}
            </div>
          </div>

          {/* Chỉ số ms của 2 bên ở hiệp hiện tại */}
          {lightState === 'ROUND_OVER' && (
            <div className="mt-3 flex items-center gap-4 bg-black/60 backdrop-blur-xs px-4 py-1.5 rounded-2xl border border-white/20 animate-in fade-in">
              <div className="text-center">
                <span className="text-[10px] text-blue-300 font-bold block">Bạn</span>
                <span className="font-mono font-black text-sm text-white">
                  {p1ReactionMs ? `${p1ReactionMs} ms` : 'Phạm quy'}
                </span>
              </div>
              <span className="text-xs font-fredoka font-black text-amber-400">VS</span>
              <div className="text-center">
                <span className="text-[10px] text-emerald-300 font-bold block">Đối Thủ</span>
                <span className="font-mono font-black text-sm text-white">
                  {p2ReactionMs ? `${p2ReactionMs} ms` : 'Phạm quy'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nút bắt đầu khi ở trạng thái IDLE */}
        {lightState === 'IDLE' && (
          <button
            onClick={startRoundCountdown}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 font-fredoka font-black text-sm shadow-xl active:scale-95 transition border-2 border-white animate-pulse"
          >
            SẴN SÀNG THI ĐẤU! 🚦⚡
          </button>
        )}
      </div>

      {/* 4. NÚT ĐẬP PHẢN XẠ SIÊU LỚN CHO NGƯỜI CHƠI */}
      <div className="my-1 shrink-0">
        <button
          onClick={handlePlayerTap}
          disabled={lightState === 'IDLE' || lightState === 'ROUND_OVER' || lightState === 'MATCH_OVER'}
          className={`w-full py-5 rounded-3xl font-fredoka font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-90 border-4 select-none ${
            lightState === 'READY'
              ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-white ring-4 ring-emerald-400/80 animate-pulse cursor-pointer'
              : lightState === 'WAITING'
              ? 'bg-gradient-to-b from-rose-500 to-rose-700 text-white border-rose-300 shadow-rose-900/50 cursor-pointer active:bg-rose-800'
              : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
          }`}
        >
          <Zap className="w-6 h-6" />
          <span>
            {lightState === 'READY'
              ? 'ĐẬP NÚT NGAYYYY! ⚡'
              : lightState === 'WAITING'
              ? 'BẤM LÀ PHẠM QUY ĐẤY! (CHỜ...)'
              : 'NÚT PHẢN XẠ'}
          </span>
        </button>
      </div>

      {/* 5. BANNER KẾT THÚC TRẬN ĐẤU (5 HIỆP) */}
      {lightState === 'MATCH_OVER' && (
        <div className="mt-1 p-2.5 bg-gradient-to-r from-emerald-100 via-amber-100 to-teal-100 border-2 border-emerald-400 rounded-2xl text-center shadow-md animate-in zoom-in-95 shrink-0">
          <p className="font-fredoka font-black text-sm text-emerald-950 mb-1">
            {scores.p1 > scores.p2
              ? `🎉 VÔ ĐỊCH PHẢN XẠ! BẠN THẮNG (${scores.p1} - ${scores.p2})! (+150 Xu)`
              : scores.p1 < scores.p2
              ? `😢 ĐỐI THỦ THẮNG TRẬN (${scores.p2} - ${scores.p1})!`
              : '🤝 HÒA NHAU VỀ SỐ HIỆP THẮNG!'}
          </p>
          <p className="text-[11px] font-fredoka font-bold text-slate-700 mb-2">
            Tốc độ phản xạ trung bình của bạn: <span className="font-mono text-emerald-700 font-black">{avgP1Ms} ms</span>
          </p>
          <button
            onClick={initMatch}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-fredoka font-black text-xs transition active:scale-95 shadow-xs"
          >
            Đua Lại Trận Mới 🔄
          </button>
        </div>
      )}
    </div>
  );
}

export default QuickReflexGame;
