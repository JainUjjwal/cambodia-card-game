import React from 'react';
import { Swords, Shield } from 'lucide-react';
import Card from './Card';
import Opponent from './Opponent';
import InitialPeekModal from './InitialPeekModal';
import DrawCardModal from './DrawCardModal';
import PeekResultModal from './PeekResultModal'; // Import the new modal
import { type DocumentData } from 'firebase/firestore';
import { type CardData } from '../../utils/deck';

interface GameTableProps {
  gameData: DocumentData;
  myPlayerId: string;
  knownCards: boolean[];
  isSwapping: boolean;
  isPeeking: boolean;
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
}

const GameTable = (props: GameTableProps) => {
  const { 
    gameData, myPlayerId, knownCards, isSwapping, isPeeking, onAcknowledgePeek, showInitialPeek, 
    onDrawCard, drawnCard, showDrawCardModal, onSwap, onUseAction, onDiscard,
    onSelectCardToSwap, onTakeFromDiscard, onSelectCardToPeek,
    peekedCard, showPeekResultModal, onAcknowledgePeekResult
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-2 md:p-4 text-white font-sans">
      
      {showInitialPeek && <InitialPeekModal hand={myHand} onAcknowledge={onAcknowledgePeek} />}
      {showDrawCardModal && drawnCard && (
        <DrawCardModal card={drawnCard} onSwap={onSwap} onUseAction={onUseAction} onDiscard={onDiscard} />
      )}
      {showPeekResultModal && peekedCard && (
        <PeekResultModal card={peekedCard} onAcknowledge={onAcknowledgePeekResult} />
      )}

      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-5xl flex-grow md:aspect-video relative">
        {opponentPositions.map(({ player, gridPosition, id }) => (
          <div key={id} className={`flex justify-center items-center ${gridPosition}`}>
            <Opponent player={player} isCurrentPlayer={id === currentPlayerId} />
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
                {isMyTurn ? (isSwapping ? "Select a card to swap..." : isPeeking ? "Select a card to peek..." : "Your Turn!") : `${players[currentPlayerId]?.name}'s Turn`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 place-items-center">
              {myHand.map((card: any, index: number) => (
                <button key={index} onClick={() => isSwapping ? onSelectCardToSwap(index) : onSelectCardToPeek(index)} disabled={!isSwapping && !isPeeking} className="disabled:cursor-not-allowed">
                  <Card value={card.value} suit={card.suit} isKnown={knownCards[index]} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-4 p-2 bg-slate-800 bg-opacity-50 rounded-lg flex justify-center gap-2 flex-wrap">
        <button onClick={onDrawCard} disabled={!isMyTurn || isSwapping || isPeeking} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">Draw Card</button>
        <button onClick={onTakeFromDiscard} disabled={!isMyTurn || isSwapping || isPeeking} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">Take {topCard?.value}{topCard?.suit}</button>
        <button disabled={!isMyTurn || isSwapping || isPeeking} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"><Swords size={16} /> Snap!</button>
        <button disabled={!isMyTurn || isSwapping || isPeeking} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"><Shield size={16} /> Call Cambodia</button>
      </div>
    </div>
  );
};

export default GameTable;
