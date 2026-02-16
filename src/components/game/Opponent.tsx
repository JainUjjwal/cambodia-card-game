import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

// Define the props for the Opponent component
export type OpponentProps = {
  player: any;
  position: string; // <-- The fix is here
  isCurrentPlayer: boolean;
  currentUserId?: string;
  onCardSelect: (playerId: string, cardIndex: number) => void;
  isSpying: boolean;
};

const Opponent = ({ player, position, isCurrentPlayer, currentUserId, onCardSelect, isSpying }: OpponentProps) => {
  const positionClasses: { [key: string]: string } = {
    'top-left': 'col-start-1 row-start-1 justify-self-start self-start',
    'top-center': 'col-start-2 row-start-1 justify-self-center self-start',
    'top-right': 'col-start-3 row-start-1 justify-self-end self-start',
    'middle-left': 'col-start-1 row-start-2 justify-self-start self-center',
    'middle-right': 'col-start-3 row-start-2 justify-self-end self-center',
  };

  return (
    <div className={`flex flex-col items-center gap-1 md:gap-2 ${positionClasses[position]}`}>
      <span className={`px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 ${isCurrentPlayer ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-white'}`}>{player.name}</span>
      <div className="flex justify-center gap-1 md:gap-2">
        {player.hand.map((card: CardData, index: number) => (
          <button
            key={index}
            disabled={!isSpying}
            onClick={() => onCardSelect(player.id, index)}
            className="disabled:cursor-not-allowed"
          >
            <Card value={card.value} suit={card.suit} isFaceUp={false} isKnown={card.knownBy.includes(currentUserId || '')}/>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Opponent;
