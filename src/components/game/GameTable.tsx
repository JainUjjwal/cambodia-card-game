import React, { useEffect, useState } from 'react';
import { type DocumentData } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { List, Clock } from 'lucide-react';
import Card from './Card';
import Opponent from './Opponent';
import InitialPeekModal from './InitialPeekModal';
import DrawCardModal from './DrawCardModal';
import PeekResultModal from './PeekResultModal';
import SpyResultModal from './SpyResultModal';
import SpySwapModal from './SpySwapModal';
import ScoreboardModal from './ScoreboardModal';
import { type CardData } from '../../utils/deck';

// Define the props for the GameTable component
export type GameTableProps = {
  gameData: DocumentData;
  currentUser: User | null;
  me: any;
  showInitialPeek: boolean;
  onInitialPeekDone: () => void;
  onDrawCard: () => void;
  drawnCard: CardData | null;
  showDrawCardModal: boolean;
  onDiscard: () => void;
  onUseAction: () => void;
  isSwapping: boolean;
  onTakeFromDiscard: () => void;
  onSwapCardSelect: (cardIndex: number) => void;
  onSwapStart: () => void;
  isPeeking: boolean;
  onPeekCardSelect: (cardIndex: number) => void;
  showPeekResultModal: boolean;
  peekedCardResult: CardData | null;
  onClosePeekResultModal: () => void;
  isSpying: boolean;
  onSpyCardSelect: (playerId: string, cardIndex: number) => void;
  showSpyResultModal: boolean;
  spiedCardResult: { card: CardData; playerName: string } | null;
  onCloseSpyResultModal: () => void;
  isBlindSwapping: boolean;
  blindSwapOwnIndex: number | null;
  onBlindSwapCardSelect: (playerId: string, cardIndex: number) => void;
  isSpySwapping: boolean;
  spySwapStep: 'opponent' | 'own' | 'decision' | 'idle';
  onSpySwapCardSelect: (playerId: string, cardIndex: number) => void;
  spySwapResult: { opponentCard: CardData; ownCard: CardData; opponentName: string } | null;
  onSpySwapComplete: (shouldSwap: boolean) => void;
  onSnapCardSelect: (cardIndex: number) => void;
  onCallCambodia: () => void;
  showScoreboard: boolean;
  onToggleScoreboard: () => void;
  onTimerExpire: () => void;
};

export const GameTable = ({
  gameData,
  currentUser,
  me,
  showInitialPeek,
  onInitialPeekDone,
  onDrawCard,
  drawnCard,
  showDrawCardModal,
  onDiscard,
  onUseAction,
  isSwapping,
  onTakeFromDiscard,
  onSwapCardSelect,
  onSwapStart,
  isPeeking,
  onPeekCardSelect,
  showPeekResultModal,
  peekedCardResult,
  onClosePeekResultModal,
  isSpying,
  onSpyCardSelect,
  showSpyResultModal,
  spiedCardResult,
  onCloseSpyResultModal,
  isBlindSwapping,
  blindSwapOwnIndex,
  onBlindSwapCardSelect,
  isSpySwapping,
  spySwapStep,
  onSpySwapCardSelect,
  spySwapResult,
  onSpySwapComplete,
  onSnapCardSelect,
  onCallCambodia,
  showScoreboard,
  onToggleScoreboard,
  onTimerExpire,
}: GameTableProps) => {

  const opponents = gameData.playOrder
    .filter((id: string) => id !== currentUser?.uid)
    .map((id: string) => ({ id, ...gameData.players[id] }));

  const isMyTurn = gameData.currentPlayerId === currentUser?.uid;
  const topCardOfDiscard = gameData.discardPile[0];
  const cambodiaCalled = !!gameData.cambodiaCalledBy;

  // Timer Logic
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!gameData.turnTimerDuration || !gameData.lastTurnStartTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const startTime = typeof gameData.lastTurnStartTime.toMillis === 'function' 
        ? gameData.lastTurnStartTime.toMillis() 
        : (gameData.lastTurnStartTime.seconds * 1000);
        
      const durationMs = parseInt(gameData.turnTimerDuration) * 1000;
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));

      setTimeLeft(remaining);

      if (remaining === 0 && isMyTurn) {
        onTimerExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData.lastTurnStartTime, gameData.turnTimerDuration, isMyTurn, onTimerExpire]);

  const opponentPositions: { [key: number]: string[] } = {
    1: ['top-center'],
    2: ['top-center', 'middle-left'],
    3: ['top-center', 'middle-left', 'middle-right'],
    4: ['top-left', 'top-right', 'middle-left', 'middle-right'],
    5: ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right'],
  };

  const getPositionClass = (index: number) => {
    const positions = opponentPositions[opponents.length] || [];
    return positions[index] || '';
  };

  const getInstructionalText = () => {
    if (cambodiaCalled && isMyTurn) return "FINAL TURN! Make your last move.";
    if (!isMyTurn) return `Waiting for ${gameData.players[gameData.currentPlayerId]?.name}...`;
    if (isSwapping) return "Select a card to swap...";
    if (isPeeking) return "Select a card to peek at...";
    if (isSpying) return "Select card to spy on...";
    if (isBlindSwapping) {
      return blindSwapOwnIndex === null 
        ? "Select your card..." 
        : "Select opponent's card...";
    }
    if (isSpySwapping) {
      return spySwapStep === 'opponent'
        ? "Spy opponent's card..."
        : "Peek your card...";
    }
    return "Draw, Take, Snap or Cambodia.";
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-900 to-green-900 p-2 md:p-4 text-white overflow-x-hidden">
        
        {cambodiaCalled && (
          <div className="w-full max-w-5xl bg-red-600 text-white px-6 py-2 mb-2 rounded-xl text-center font-bold shadow-lg z-10 animate-pulse whitespace-nowrap text-xs md:text-base">
            CAMBODIA CALLED BY {gameData.players[gameData.cambodiaCalledBy]?.name.toUpperCase()}
          </div>
        )}

        {/* Main Game Board - Dynamic layout */}
        <div className="relative w-full max-w-5xl flex-grow flex flex-col md:grid md:grid-cols-3 md:grid-rows-3 gap-2 md:gap-4 p-2 md:p-4 bg-green-800/30 rounded-3xl border-2 md:border-4 border-amber-900/30">

          {/* Opponent Areas */}
          <div className="md:contents grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-0">
            {opponents.map((player: any, index: number) => (
              <Opponent
                key={player.id}
                player={player}
                position={getPositionClass(index)}
                isCurrentPlayer={gameData.currentPlayerId === player.id}
                currentUserId={currentUser?.uid}
                onCardSelect={(playerId, cardIdx) => {
                  if (isSpying) onSpyCardSelect(playerId, cardIdx);
                  if (isBlindSwapping && blindSwapOwnIndex !== null) onBlindSwapCardSelect(playerId, cardIdx);
                  if (isSpySwapping && spySwapStep === 'opponent') onSpySwapCardSelect(playerId, cardIdx);
                }}
                isSpying={(isSpying || (isBlindSwapping && blindSwapOwnIndex !== null) || (isSpySwapping && spySwapStep === 'opponent')) && isMyTurn}
              />
            ))}
          </div>
          
          {/* Center Area (Deck & Discard) */}
          <div className="md:col-start-2 md:row-start-2 flex items-center justify-center gap-4 py-2 md:py-0 scale-90 md:scale-100">
              <Card className="shadow-xl" />
              <Card value={topCardOfDiscard.value} suit={topCardOfDiscard.suit} isFaceUp={true} className="shadow-xl" />
          </div>

          {/* Current Player Area */}
          <div className={`md:col-span-3 md:row-start-3 self-center md:self-end flex flex-col items-center gap-1 md:gap-2 p-2 rounded-2xl transition-all duration-300 ${isMyTurn ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : 'bg-slate-800/30'}`}>
              <div className="flex justify-center gap-1.5 sm:gap-4">
                {me?.hand.map((card: CardData, index: number) => (
                  <button
                    key={index}
                    disabled={(!isSwapping && !isPeeking && !(isBlindSwapping && blindSwapOwnIndex === null) && !(isSpySwapping && spySwapStep === 'own') && !(isMyTurn && !drawnCard)) || !isMyTurn}
                    onClick={() => {
                      if (isSwapping) onSwapCardSelect(index);
                      if (isPeeking) onPeekCardSelect(index);
                      if (isBlindSwapping && blindSwapOwnIndex === null) onBlindSwapCardSelect(currentUser?.uid || '', index);
                      if (isSpySwapping && spySwapStep === 'own') onSpySwapCardSelect(currentUser?.uid || '', index);
                      if (isMyTurn && !isSwapping && !isPeeking && !isBlindSwapping && !isSpySwapping && !drawnCard) onSnapCardSelect(index);
                    }}
                    className="disabled:cursor-not-allowed transform hover:scale-110 active:scale-95 transition-all"
                  >
                    <Card value={card.value} suit={card.suit} isFaceUp={false} isKnown={card.knownBy.includes(currentUser?.uid || '')} />
                  </button>
                ))}
              </div>
              <span className="font-bold text-xs md:text-lg">{me?.name} (You)</span>
          </div>
        </div>

        {/* Action Bar - Mobile Optimized */}
        <div className="mt-2 w-full max-w-5xl p-2 md:p-4 bg-slate-800/90 backdrop-blur shadow-2xl rounded-2xl flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 sticky bottom-2 z-20">
            <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
              {timeLeft !== null && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${timeLeft <= 10 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                  <Clock size={16} />
                  <span className="font-mono text-base md:text-xl font-bold">{timeLeft}s</span>
                </div>
              )}
              <div className="text-left leading-tight overflow-hidden">
                <p className="text-[9px] md:text-xs text-slate-400 uppercase font-bold tracking-tight">Status</p>
                <p className="font-semibold text-xs md:text-base truncate">{getInstructionalText()}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-4 w-full md:w-auto">
              <button 
                onClick={onToggleScoreboard}
                className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 md:p-2 rounded-lg transition-colors shadow-lg"
                title="View Scoreboard"
              >
                <List size={20} />
              </button>
              <button onClick={onDrawCard} disabled={!isMyTurn || isSwapping || isPeeking || isSpying || isBlindSwapping || isSpySwapping || drawnCard} className="flex-grow md:flex-grow-0 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1.5 md:py-2 px-3 md:px-6 rounded-lg text-xs md:text-base disabled:bg-slate-600 disabled:cursor-not-allowed">
                Draw
              </button>
              <button onClick={onTakeFromDiscard} disabled={!isMyTurn || isSwapping || isPeeking || isSpying || isBlindSwapping || isSpySwapping || drawnCard} className="flex-grow md:flex-grow-0 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 md:py-2 px-3 md:px-6 rounded-lg text-xs md:text-base disabled:bg-slate-600 disabled:cursor-not-allowed">
                Take {topCardOfDiscard.value}{topCardOfDiscard.suit}
              </button>
              <button 
                onClick={onCallCambodia} 
                disabled={!isMyTurn || isSwapping || isPeeking || isSpying || isBlindSwapping || isSpySwapping || drawnCard || cambodiaCalled} 
                className="flex-grow md:flex-grow-0 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 md:py-2 px-3 md:px-6 rounded-lg text-xs md:text-base disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg border-2 border-red-400/50"
              >
                Cambodia!
              </button>
            </div>
        </div>

        {/* Modals */}
        {showInitialPeek && me?.hand && <InitialPeekModal hand={me.hand} onDone={onInitialPeekDone} />}
        {showDrawCardModal && drawnCard && (
          <DrawCardModal 
            card={drawnCard} 
            onDiscard={onDiscard} 
            onSwap={onSwapStart} 
            onUseAction={onUseAction}
          />
        )}
        {showPeekResultModal && peekedCardResult && <PeekResultModal card={peekedCardResult} onClose={onClosePeekResultModal} />}
        {showSpyResultModal && spiedCardResult && (
          <SpyResultModal 
            card={spiedCardResult.card} 
            playerName={spiedCardResult.playerName} 
            onClose={onCloseSpyResultModal} 
          />
        )}
        {isSpySwapping && spySwapStep === 'decision' && spySwapResult && (
          <SpySwapModal 
            opponentCard={spySwapResult.opponentCard}
            ownCard={spySwapResult.ownCard}
            opponentName={spySwapResult.opponentName}
            onSwap={() => onSpySwapComplete(true)}
            onKeep={() => onSpySwapComplete(false)}
          />
        )}
        {showScoreboard && (
          <ScoreboardModal 
            players={gameData.playOrder.map((id: string) => ({ id, ...gameData.players[id] }))}
            roundHistory={gameData.roundHistory || []}
            onClose={onToggleScoreboard}
          />
        )}
    </div>
  );
};
