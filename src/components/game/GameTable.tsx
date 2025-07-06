import React from 'react';
import { User, Swords, Shield } from 'lucide-react';
import Card from './Card';
import Opponent from './Opponent';
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
    { player: players[opponentOrder[0]] },
    { player: players[opponentOrder[1]] },
    { player: players[opponentOrder[2]] },
    { player: players[opponentOrder[3]] },
    { player: players[opponentOrder[4]] },
  ].filter(p => p.player);

  const topCard = discardPile && discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-2 md:p-4 text-white font-sans">
      {showInitialPeek && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
          <h2 className="text-2xl font-bold mb-4">Your Bottom Two Cards</h2>
          <div className="flex gap-4 mb-6">
            <Card value={myHand[2]?.value} suit={myHand[2]?.suit} isFaceUp={true} />
            <Card value={myHand[3]?.value} suit={myHand[3]?.suit} isFaceUp={true} />
          </div>
          <button onClick={onAcknowledgePeek} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg">
            Got it!
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-4xl flex-grow md:aspect-video">
        {opponentPositions.slice(0, 3).map((op, index) => (
          <div key={index} className="flex justify-center items-center">
            <Opponent player={op.player} />
          </div>
        ))}
        <div className="flex justify-center items-center">
          {opponentPositions[3] && <Opponent player={opponentPositions[3].player} />}
        </div>
        <div className="flex justify-center items-center gap-4">
          <Card />
          {topCard && <Card value={topCard.value} suit={topCard.suit} isFaceUp={true} />}
        </div>
        <div className="flex justify-center items-center">
          {opponentPositions[4] && <Opponent player={opponentPositions[4].player} />}
        </div>

        <div className="col-span-3 flex flex-col items-center justify-end">
          <div className="text-center mb-2">
            <p className={`text-lg font-bold ${currentPlayerId === myPlayerId ? 'text-cyan-400' : ''}`}>
              {currentPlayerId === myPlayerId ? "Your Turn!" : `${players[currentPlayerId]?.name}'s Turn`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {myHand.map((card: any, index: number) => (
              <Card key={index} value={card.value} suit={card.suit} isKnown={knownCards[index]} />
            ))}
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
