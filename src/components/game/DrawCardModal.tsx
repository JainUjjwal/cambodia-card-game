import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

interface DrawCardModalProps {
  card: CardData;
  onSwap: () => void;
  onUseAction: () => void;
  onDiscard: () => void;
}

const DrawCardModal = ({ card, onSwap, onUseAction, onDiscard }: DrawCardModalProps) => {
  const hasAction = card.points >= 7 && card.points <= 13 && card.value !== 'Joker';

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-cyan-500 rounded-2xl shadow-2xl p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">You Drew a Card</h2>
        <div className="flex justify-center my-4">
          <Card value={card.value} suit={card.suit} isFaceUp={true} />
        </div>
        <p className="text-slate-300 mb-6">What would you like to do?</p>
        <div className="flex justify-center gap-2 flex-wrap">
          <button onClick={onSwap} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            Swap Card
          </button>
          {hasAction && (
            <button onClick={onUseAction} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
              Use Action
            </button>
          )}
          <button onClick={onDiscard} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawCardModal;