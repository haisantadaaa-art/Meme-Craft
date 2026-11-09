/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WordChainItem, WordChainGameState, ArcadeRoomData } from '../types/game';
import { sound } from '../utils/audio';
import { db, ref, update } from '../services/firebase';
import { judgeWordChainWithGemini } from '../services/geminiService';
import { Timer, Send, Trophy, ArrowLeft, RotateCcw, Sparkles, MessageSquare, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WordChainGameProps {
  roomData?: ArcadeRoomData | null;
  roomCode?: string;
  currentPlayerId: string;
  playerName: string;
  isBotMode?: boolean;
  onRewardWon: (coins: number, fertilizers: number) => void;
  onExit: () => void;
}

const BOT_WORDS: Record<string, string[]> = {
  vàng: ['vàng hoe', 'vàng khè', 'vàng anh'],
  khè: ['khè lửa', 'khè bạn'],
  lửa: ['lửa trại', 'lửa thiêng', 'lửa hồng'],
  trại: ['trại hè', 'trại cá', 'trại giam'],
  hè: ['hè phố', 'hè thu'],
  phố: ['phố cổ', 'phố xá', 'phố phường'],
  xá: ['xá tội', 'xá xíu'],
  xíu: ['xíu mại', 'xíu xiu'],
  cổ: ['cổ thụ', 'cổ tích', 'cổ phần'],
  thụ: ['thụ phấn', 'thụ động', 'thụ thai'],
  phấn: ['phấn đấu', 'phấn hoa', 'phấn khởi'],
  hoa: ['hoa quả', 'hoa hồng', 'hoa thơm'],
  quả: ['quả ngọt', 'quả trám', 'quả mít'],
  ngọt: ['ngọt ngào', 'ngọt lịm', 'ngọt bùi'],
};

export const WordChainGame: React.FC<WordChainGameProps> = ({
  roomData,
  roomCode,
  currentPlayerId,
  playerName,
  isBotMode = false,
  onRewardWon,
  onExit,
}) => {
  // Local state for Bot mode
  const [localChain, setLocalChain] = useState<WordChainItem[]>([
    {
      word: 'Nông Trại',
      playerId: 'bot',
      playerName: 'Bot Nông Dân',
      timestamp: Date.now(),
    },
  ]);
  const [localTurnPlayerId, setLocalTurnPlayerId] = useState<string>(currentPlayerId);
  const [localWinner, setLocalWinner] = useState<string | null>(null);
  const [localRoast, setLocalRoast] = useState<string>('Bắt đầu bằng chữ "Trại" nhé!');

  const [inputWord, setInputWord] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Active state
  const activeChain = isBotMode ? localChain : roomData?.wordChainState?.chain || [];
  const activeTurnPlayerId = isBotMode
    ? localTurnPlayerId
    : roomData?.wordChainState?.currentTurnPlayerId || currentPlayerId;
  const activeWinner = isBotMode ? localWinner : roomData?.wordChainState?.winnerId || null;
  const activeRoast = isBotMode ? localRoast : roomData?.wordChainState?.lastRefereeComment || '';

  const isMyTurn = activeTurnPlayerId === currentPlayerId && !activeWinner;
  const lastWordItem = activeChain[activeChain.length - 1];

  // Auto-focus on my turn
  useEffect(() => {
    if (isMyTurn) {
      inputRef.current?.focus();
    }
  }, [isMyTurn]);

  // Turn timer
  useEffect(() => {
    if (activeWinner) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
        if (timeLeft <= 4 && isMyTurn) {
          sound.playTick();
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !activeWinner) {
      // Time expired: active turn player loses
      handleTimeExpired();
    }
  }, [timeLeft, activeWinner, isMyTurn]);

  // Reward triggers
  useEffect(() => {
    if (activeWinner && !rewardClaimed) {
      if (activeWinner === currentPlayerId) {
        sound.playWin();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onRewardWon(250, 5); // 250 Coins + 5 Fertilizers!
        setRewardClaimed(true);
      } else {
        sound.playLose();
      }
    }
  }, [activeWinner, currentPlayerId, rewardClaimed, onRewardWon]);

  // Bot Turn Simulation
  useEffect(() => {
    if (isBotMode && localTurnPlayerId === 'bot' && !localWinner) {
      const botTimer = setTimeout(() => {
        makeBotTurn();
      }, 1200);
      return () => clearTimeout(botTimer);
    }
  }, [isBotMode, localTurnPlayerId, localWinner, localChain]);

  const makeBotTurn = () => {
    const lastWord = localChain[localChain.length - 1]?.word || '';
    const parts = lastWord.trim().toLowerCase().split(/\s+/);
    const lastSyl = parts[parts.length - 1];

    const possibleWords = BOT_WORDS[lastSyl] || [`${lastSyl} tươi`, `${lastSyl} đẹp`];
    const picked = possibleWords[Math.floor(Math.random() * possibleWords.length)];

    sound.playPlant();
    setLocalChain((prev) => [
      ...prev,
      {
        word: picked,
        playerId: 'bot',
        playerName: 'Bot Nông Dân',
        timestamp: Date.now(),
      },
    ]);
    setLocalRoast(`✨ Bot đã nối: "${picked}"`);
    setLocalTurnPlayerId(currentPlayerId);
    setTimeLeft(10);
  };

  const handleTimeExpired = async () => {
    const loserId = activeTurnPlayerId;
    const winnerId = isBotMode
      ? loserId === currentPlayerId
        ? 'bot'
        : currentPlayerId
      : loserId === roomData?.host?.id
      ? roomData?.guest?.id || 'guest'
      : roomData?.host?.id || 'host';

    if (isBotMode) {
      setLocalWinner(winnerId);
      setLocalRoast('Hết 10 giây suy nghĩ! Quá chậm chạp!');
    } else if (roomCode && roomData) {
      await update(ref(db, `rooms/${roomCode}/wordChainState`), {
        winnerId,
        loserId,
        lastRefereeComment: 'Hết 10 giây suy nghĩ! Đối thủ giành chiến thắng!',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || !inputWord.trim() || isEvaluating) return;

    setIsEvaluating(true);
    const word = inputWord.trim();
    const prevWord = lastWordItem?.word || '';

    const judgeResult = await judgeWordChainWithGemini(prevWord, word, playerName);

    if (judgeResult.isValid) {
      sound.playHarvest();
      setInputWord('');
      const newItem: WordChainItem = {
        word,
        playerId: currentPlayerId,
        playerName,
        timestamp: Date.now(),
        roastComment: judgeResult.comment,
      };

      if (isBotMode) {
        setLocalChain((prev) => [...prev, newItem]);
        setLocalRoast(`✨ Bạn vừa nối: "${word}"`);
        setLocalTurnPlayerId('bot');
        setTimeLeft(10);
      } else if (roomCode && roomData) {
        const nextTurnId = currentPlayerId === roomData.host.id ? roomData.guest?.id : roomData.host.id;
        const newChain = [...activeChain, newItem];
        await update(ref(db, `rooms/${roomCode}/wordChainState`), {
          chain: newChain,
          currentTurnPlayerId: nextTurnId || 'opponent',
          turnDeadline: Date.now() + 10000,
          lastRefereeComment: `✨ ${playerName}: "${word}"`,
        });
      }
    } else {
      sound.playLose();
      // Penalty: player loses
      const winnerId = isBotMode
        ? 'bot'
        : currentPlayerId === roomData?.host?.id
        ? roomData?.guest?.id || 'guest'
        : roomData?.host?.id || 'host';

      if (isBotMode) {
        setLocalWinner(winnerId);
        setLocalRoast(judgeResult.comment);
      } else if (roomCode && roomData) {
        await update(ref(db, `rooms/${roomCode}/wordChainState`), {
          winnerId,
          loserId: currentPlayerId,
          lastRefereeComment: judgeResult.comment,
        });
      }
    }

    setIsEvaluating(false);
  };

  const handleRematch = async () => {
    sound.playClick();
    setRewardClaimed(false);
    setTimeLeft(10);
    setInputWord('');

    if (isBotMode) {
      setLocalChain([
        {
          word: 'Nông Trại',
          playerId: 'bot',
          playerName: 'Bot Nông Dân',
          timestamp: Date.now(),
        },
      ]);
      setLocalTurnPlayerId(currentPlayerId);
      setLocalWinner(null);
      setLocalRoast('Bắt đầu bằng chữ "Trại" nhé!');
    } else if (roomCode) {
      const resetState: WordChainGameState = {
        chain: [
          {
            word: 'Nông Trại',
            playerId: 'referee',
            playerName: 'Trọng Tài AI',
            timestamp: Date.now(),
          },
        ],
        currentTurnPlayerId: currentPlayerId,
        turnDeadline: Date.now() + 10000,
        winnerId: null,
        loserId: null,
        lastRefereeComment: 'Bắt đầu hiệp mới!',
      };
      await update(ref(db, `rooms/${roomCode}/wordChainState`), resetState);
    }
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto flex flex-col items-center select-none p-3 sm:p-5">
      {/* Game Header */}
      <div className="w-full bg-[#1b4332] border-3 border-[#081c15] rounded-2xl p-3 shadow-[4px_4px_0px_#081c15] text-white flex items-center justify-between gap-3 mb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-fredoka border border-slate-600 pop-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Rời Game</span>
        </button>

        <div className="text-xs sm:text-sm font-black font-fredoka text-amber-300 uppercase tracking-wide">
          NỐI TỪ CÀ KHỊA (10s)
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-mono font-black text-xs border border-black shadow">
          <Timer className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Chain Stream Display */}
      <div className="w-full bg-slate-900 border-3 border-black rounded-3xl p-4 shadow-[5px_5px_0px_#000] mb-3 flex-1 flex flex-col justify-between min-h-[300px]">
        {/* Referee Banner */}
        <div className="w-full bg-black/40 border border-black/40 rounded-2xl p-2.5 mb-3 text-center">
          <span className="text-[11px] font-bold text-amber-300 block mb-0.5">
            ⚖️ Trọng Tài Gemini AI:
          </span>
          <p className="text-xs text-slate-200 font-medium">{activeRoast}</p>
        </div>

        {/* Word Chain History Bubbles */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] p-2 bg-slate-950/60 rounded-2xl border border-black/20 mb-3">
          {activeChain.map((item, idx) => {
            const isMe = item.playerId === currentPlayerId;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 font-bold mb-0.5">
                  {item.playerName}
                </span>
                <div
                  className={`px-3.5 py-2 rounded-2xl font-black font-fredoka text-sm max-w-[80%] shadow border-2 ${
                    isMe
                      ? 'bg-amber-400 text-black border-black'
                      : 'bg-emerald-600 text-white border-black'
                  }`}
                >
                  {item.word}
                </div>
              </div>
            );
          })}
        </div>

        {/* Word Input Form */}
        {!activeWinner && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              disabled={!isMyTurn}
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder={
                isMyTurn
                  ? `Nối từ bắt đầu bằng "${lastWordItem?.word.trim().split(/\s+/).pop()}"...`
                  : 'Đang đợi đối thủ nối...'
              }
              className="flex-1 px-4 py-2.5 bg-slate-950 border-2 border-black rounded-2xl text-white font-fredoka font-bold text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isMyTurn || !inputWord.trim()}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black font-fredoka text-xs border-2 border-black pop-btn disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>GỬI</span>
            </button>
          </form>
        )}
      </div>

      {/* Winner Overlay Modal */}
      {activeWinner && (
        <div className="w-full bg-slate-900 border-3 border-black rounded-3xl p-4 sm:p-5 text-center shadow-[5px_5px_0px_#000] animate-in zoom-in-95">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400 border-2 border-black flex items-center justify-center shadow mb-2">
            <Trophy className="w-6 h-6 text-black fill-yellow-400" />
          </div>

          <h3 className="text-lg sm:text-xl font-black font-fredoka text-amber-400 mb-1">
            {activeWinner === currentPlayerId
              ? '🎉 BẠN ĐÃ CHIẾN THẮNG!'
              : '😢 BẠN ĐÃ THUA CUỘC!'}
          </h3>

          {activeWinner === currentPlayerId && (
            <p className="text-xs text-emerald-400 font-bold mb-3">
              +250 Vàng & +5 Túi Phân Bón Tăng Tốc đã cộng vào nông trại!
            </p>
          )}

          <button
            onClick={handleRematch}
            className="w-full py-2.5 rounded-2xl font-black font-fredoka text-xs sm:text-sm text-black bg-gradient-to-r from-amber-400 to-pink-500 border-2 border-black pop-btn shadow-[3px_3px_0px_#000] flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI HIỆP MỚI</span>
          </button>
        </div>
      )}
    </div>
  );
};
