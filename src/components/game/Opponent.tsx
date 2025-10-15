import React from 'react';
import Card from './Card';
import { type DocumentData } from 'firebase/firestore';

interface OpponentProps {
  player: DocumentData;
  isCurrentPlayer: boolean;
  playerId: string; // This line is added
  isSpying: boolean;
  onCardSelect: (playerId: string, cardIndex: number) => void;
}

const Opponent = ({ player, isCurrentPlayer, playerId, isSpying, onCardSelect }: OpponentProps) => {
  if (!player) return null;

  const handleCardClick = (cardIndex: number) => {
    if (isSpying) {
      onCardSelect(playerId, cardIndex);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-300 ${isCurrentPlayer ? 'bg-purple-500 bg-opacity-30' : ''}`}>
      <span className="font-bold text-sm truncate max-w-24">{player.name}</span>
      <div className="grid grid-cols-2 gap-2">
        {player.hand.map((card: any, index: number) => (
          <button key={index} onClick={() => handleCardClick(index)} disabled={!isSpying} className="disabled:cursor-not-allowed">
            <Card value={card.value} suit={card.suit} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Opponent;