import React from 'react';
import { type DocumentData } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import Card from './Card';
import Opponent from './Opponent';
import InitialPeekModal from './InitialPeekModal';
import DrawCardModal from './DrawCardModal';
import PeekResultModal from './PeekResultModal';
import SpyResultModal from './SpyResultModal';
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
}: GameTableProps) => {

  const opponents = gameData.playOrder
    .filter((id: string) => id !== currentUser?.uid)
    .map((id: string) => ({ id, ...gameData.players[id] }));

  const isMyTurn = gameData.currentPlayerId === currentUser?.uid;
  const topCardOfDiscard = gameData.discardPile[0];

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
    if (!isMyTurn) return `Waiting for ${gameData.players[gameData.currentPlayerId]?.name}'s turn...`;
    if (isSwapping) return "Select one of your cards to swap...";
    if (isPeeking) return "Select one of your cards to peek at...";
    if (isSpying) return "Select an opponent's card to spy on...";
    if (isBlindSwapping) {
      return blindSwapOwnIndex === null 
        ? "Blind Swap: Select one of your cards..." 
        : "Blind Swap: Select an opponent's card to swap with...";
    }
    return "Your turn. Draw a card or take from the discard pile.";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-green-900 p-2 md:p-4 text-white">
        {/* Main Game Board */}
        <div className="relative w-full max-w-4xl aspect-video bg-green-800 bg-opacity-50 rounded-3xl shadow-2xl p-4 grid grid-cols-3 grid-rows-3 gap-4 border-4 border-amber-900/50">

          {/* Opponent Areas */}
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
              }}
              isSpying={(isSpying || (isBlindSwapping && blindSwapOwnIndex !== null)) && isMyTurn}
            />
          ))}
          
          {/* Center Area */}
          <div className="col-start-2 row-start-2 flex items-center justify-center gap-4">
              <Card className="shadow-xl" />
              <Card value={topCardOfDiscard.value} suit={topCardOfDiscard.suit} isFaceUp={true} className="shadow-xl" />
          </div>

          {/* Current Player Area */}
          <div className={`col-span-3 row-start-3 self-end flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-300 ${isMyTurn ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : ''}`}>
              <div className="flex justify-center gap-2 sm:gap-4">
                {me?.hand.map((card: CardData, index: number) => (
                  <button
                    key={index}
                    disabled={(!isSwapping && !isPeeking && !(isBlindSwapping && blindSwapOwnIndex === null)) || !isMyTurn}
                    onClick={() => {
                      if (isSwapping) onSwapCardSelect(index);
                      if (isPeeking) onPeekCardSelect(index);
                      if (isBlindSwapping && blindSwapOwnIndex === null) onBlindSwapCardSelect(currentUser?.uid || '', index);
                    }}
                    className="disabled:cursor-not-allowed transform hover:scale-110 transition-transform"
                  >
                    <Card value={card.value} suit={card.suit} isFaceUp={false} isKnown={card.knownBy.includes(currentUser?.uid || '')} />
                  </button>
                ))}
              </div>
              <span className="font-bold text-lg">{me?.name} (You)</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 w-full max-w-4xl p-4 bg-slate-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-slate-300">Turn Status</p>
              <p className="font-semibold text-lg">{getInstructionalText()}</p>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button onClick={onDrawCard} disabled={!isMyTurn || isSwapping || isPeeking || isSpying} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                Draw Card
              </button>
              <button onClick={onTakeFromDiscard} disabled={!isMyTurn || isSwapping || isPeeking || isSpying} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                Take {topCardOfDiscard.value}{topCardOfDiscard.suit}
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
    </div>
  );
};

