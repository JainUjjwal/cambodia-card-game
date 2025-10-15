import React from 'react';
import { Swords, Shield } from 'lucide-react';
import Card from './Card';
import Opponent from './Opponent';
import InitialPeekModal from './InitialPeekModal';
import DrawCardModal from './DrawCardModal';
import PeekResultModal from './PeekResultModal';
import SpyResultModal from './SpyResultModal'; // Import the new modal
import { type DocumentData } from 'firebase/firestore';
import { type CardData } from '../../utils/deck';

// Updated props to include everything for Peek and Spy actions
interface GameTableProps {
  gameData: DocumentData;
  myPlayerId: string;
  knownCards: boolean[];
  isSwapping: boolean;
  isPeeking: boolean;
  isSpying: boolean; // New prop
  onAcknowledgePeek: () => void;
  showInitialPeek: boolean;
  onDrawCard: () => void;
  drawnCard: CardData | null;
  showDrawCardModal: boolean;
  onSwap: () => void;
  onUseAction: () => void;
  onDiscard: () => void;
  onSelectCardToSwap: (index: number) => void;
  onTakeFromDiscard: () => void;
  onSelectCardToPeek: (index: number) => void;
  peekedCard: CardData | null;
  showPeekResultModal: boolean;
  onAcknowledgePeekResult: () => void;
  onSelectOpponentCardToSpy: (playerId: string, cardIndex: number) => void; // New prop
  spiedCard: CardData | null; // New prop
  spiedPlayerName: string; // New prop
  showSpyResultModal: boolean; // New prop
  onAcknowledgeSpyResult: () => void; // New prop
}

const GameTable = (props: GameTableProps) => {
  const { 
    gameData, myPlayerId, knownCards, isSwapping, isPeeking, isSpying, onAcknowledgePeek, showInitialPeek, 
    onDrawCard, drawnCard, showDrawCardModal, onSwap, onUseAction, onDiscard,
    onSelectCardToSwap, onTakeFromDiscard, onSelectCardToPeek,
    peekedCard, showPeekResultModal, onAcknowledgePeekResult,
    onSelectOpponentCardToSpy, spiedCard, spiedPlayerName, showSpyResultModal, onAcknowledgeSpyResult
  } = props;

  const { players, playOrder, currentPlayerId, discardPile } = gameData;
  const myHand = players[myPlayerId]?.hand || [];
  const isMyTurn = currentPlayerId === myPlayerId;
  
  const opponentOrder = playOrder.filter((pid: string) => pid !== myPlayerId);
  const opponentPositions = [
    { gridPosition: 'col-start-2 row-start-1', player: players[opponentOrder[0]], id: opponentOrder[0] },
    { gridPosition: 'col-start-1 row-start-2', player: players[opponentOrder[1]], id: opponentOrder[1] },
    { gridPosition: 'col-start-3 row-start-2', player: players[opponentOrder[2]], id: opponentOrder[2] },
    { gridPosition: 'col-start-1 row-start-1', player: players[opponentOrder[3]], id: opponentOrder[3] },
    { gridPosition: 'col-start-3 row-start-1', player: players[opponentOrder[4]], id: opponentOrder[4] },
  ].filter(p => p.player);

  const topCard = discardPile && discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  // Updated instructional text to handle all action states
  const getInstructionalText = () => {
    if (!isMyTurn) return `${players[currentPlayerId]?.name}'s Turn`;
    if (isSwapping) return "Select a card to swap...";
    if (isPeeking) return "Select one of your cards to peek...";
    if (isSpying) return "Select an opponent's card to spy on...";
    return "Your Turn!";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-2 md:p-4 text-white font-sans">
      
      {showInitialPeek && <InitialPeekModal hand={myHand} onAcknowledge={onAcknowledgePeek} />}
      {showDrawCardModal && drawnCard && (
        <DrawCardModal card={drawnCard} onSwap={onSwap} onUseAction={onUseAction} onDiscard={onDiscard} />
      )}
      {showPeekResultModal && peekedCard && (
        <PeekResultModal card={peekedCard} onAcknowledge={onAcknowledgePeekResult} />
      )}
      {/* Render the new SpyResultModal */}
      {showSpyResultModal && spiedCard && (
        <SpyResultModal card={spiedCard} playerName={spiedPlayerName} onAcknowledge={onAcknowledgeSpyResult} />
      )}

      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-5xl flex-grow md:aspect-video relative">
        {opponentPositions.map(({ player, gridPosition, id }) => (
          <div key={id} className={`flex justify-center items-center ${gridPosition}`}>
            {/* Pass isSpying and onSelectOpponentCardToSpy to Opponent */}
            <Opponent 
              player={player} 
              isCurrentPlayer={id === currentPlayerId} 
              playerId={id}
              onCardSelect={onSelectOpponentCardToSpy} 
              isSpying={isSpying && isMyTurn} 
            />
          </div>
        ))}
        
        <div className="col-start-2 row-start-2 flex justify-center items-center gap-4">
          <Card />
          {topCard && <Card value={topCard.value} suit={topCard.suit} isFaceUp={true} />}
        </div>

        <div className="col-span-3 row-start-3 flex flex-col items-center justify-end">
          <div className={`w-full max-w-sm p-2 rounded-lg transition-all duration-300 ${isMyTurn ? 'bg-cyan-500 bg-opacity-30' : ''}`}>
            <div className="text-center mb-2">
              <p className={`text-lg font-bold ${isMyTurn ? 'text-cyan-400' : ''}`}>
                {getInstructionalText()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 place-items-center">
              {myHand.map((card: any, index: number) => (
                <button 
                  key={index} 
                  onClick={() => {
                    if (isSwapping) onSelectCardToSwap(index);
                    if (isPeeking) onSelectCardToPeek(index);
                  }} 
                  disabled={!isSwapping && !isPeeking} 
                  className="disabled:cursor-not-allowed"
                >
                  <Card value={card.value} suit={card.suit} isKnown={knownCards[index]} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-4 p-2 bg-slate-800 bg-opacity-50 rounded-lg flex justify-center gap-2 flex-wrap">
        <button onClick={onDrawCard} disabled={!isMyTurn || isSwapping || isPeeking || isSpying} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">Draw Card</button>
        <button onClick={onTakeFromDiscard} disabled={!isMyTurn || isSwapping || isPeeking || isSpying} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">Take {topCard?.value}{topCard?.suit}</button>
        <button disabled={!isMyTurn || isSwapping || isPeeking || isSpying} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"><Swords size={16} /> Snap!</button>
        <button disabled={!isMyTurn || isSwapping || isPeeking || isSpying} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"><Shield size={16} /> Call Cambodia</button>
      </div>
    </div>
  );
};

export default GameTable;