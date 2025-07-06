import React from 'react';
import { Swords, Shield } from 'lucide-react';
import Card from './Card';
import Opponent from './Opponent';
import InitialPeekModal from './InitialPeekModal'; // Import the new component
import { type DocumentData } from 'firebase/firestore';

interface GameTableProps {
  gameData: DocumentData;
  myPlayerId: string;
  knownCards: boolean[];
  onAcknowledgePeek: () => void;
  showInitialPeek: boolean;
}

const GameTable = ({ gameData, myPlayerId, knownCards, onAcknowledgePeek, showInitialPeek }: GameTableProps) => {
  const { players, playOrder, currentPlayerId, discardPile } = gameData;
  const myHand = players[myPlayerId]?.hand || [];
  
  const opponentOrder = playOrder.filter((pid: string) => pid !== myPlayerId);

  const opponentPositions = [
    { gridPosition: 'col-start-2 row-start-1', player: players[opponentOrder[0]] },
    { gridPosition: 'col-start-1 row-start-2', player: players[opponentOrder[1]] },
    { gridPosition: 'col-start-3 row-start-2', player: players[opponentOrder[2]] },
    { gridPosition: 'col-start-1 row-start-1', player: players[opponentOrder[3]] },
    { gridPosition: 'col-start-3 row-start-1', player: players[opponentOrder[4]] },
  ].filter(p => p.player);

  const topCard = discardPile && discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-2 md:p-4 text-white font-sans">
      
      {/* The modal logic is now cleanly handled by its own component */}
      {showInitialPeek && <InitialPeekModal hand={myHand} onAcknowledge={onAcknowledgePeek} />}

      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-5xl flex-grow md:aspect-video relative">
        {opponentPositions.map(({ player, gridPosition }, index) => (
          <div key={index} className={`flex justify-center items-center ${gridPosition}`}>
            <Opponent player={player} isCurrentPlayer={playOrder.find((p: string) => p === player.id) === currentPlayerId} />
          </div>
        ))}
        
        <div className="col-start-2 row-start-2 flex justify-center items-center gap-4">
          <Card />
          {topCard && <Card value={topCard.value} suit={topCard.suit} isFaceUp={true} />}
        </div>

        <div className="col-span-3 row-start-3 flex flex-col items-center justify-end">
          <div className={`w-full max-w-sm p-2 rounded-lg transition-all duration-300 ${currentPlayerId === myPlayerId ? 'bg-cyan-500 bg-opacity-30' : ''}`}>
            <div className="text-center mb-2">
              <p className={`text-lg font-bold ${currentPlayerId === myPlayerId ? 'text-cyan-400' : ''}`}>
                {currentPlayerId === myPlayerId ? "Your Turn!" : `${players[currentPlayerId]?.name}'s Turn`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 place-items-center">
              {myHand.map((card: any, index: number) => (
                <Card key={index} value={card.value} suit={card.suit} isKnown={knownCards[index]} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-4 p-2 bg-slate-800 bg-opacity-50 rounded-lg flex justify-center gap-2 flex-wrap">
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Draw Card</button>
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg">Take {topCard?.value}{topCard?.suit}</button>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Swords size={16} /> Snap!</button>
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Shield size={16} /> Call Cambodia</button>
      </div>

      <div className="w-full max-w-4xl mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-400" style={{ width: '80%' }}></div>
      </div>
    </div>
  );
};

export default GameTable;
