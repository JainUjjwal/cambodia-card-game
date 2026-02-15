import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

// Define the props for the modal
type DrawCardModalProps = {
  card: CardData;
  onDiscard: () => void;
  onSwap: () => void;
  onUseAction: () => void;
};

const DrawCardModal = ({ card, onDiscard, onSwap, onUseAction }: DrawCardModalProps) => {
  const hasAction = ['7', '8', '9', '10', 'J', 'Q', 'K'].includes(card.value);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-600 text-center text-white">
        <h2 className="text-xl font-bold mb-4 text-cyan-300">You Drew a Card</h2>
        <div className="flex justify-center mb-6">
            <Card value={card.value} suit={card.suit} isFaceUp={true} />
        </div>
        <div className="flex flex-col gap-3">
            <button
                onClick={onSwap}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg"
            >
                Swap Card
            </button>
            <button
                onClick={onUseAction}
                disabled={!hasAction}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                Use Action
            </button>
            <button
                onClick={onDiscard}
                className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-8 rounded-lg shadow-lg"
            >
                Discard
            </button>
        </div>
      </div>
    </div>
  );
};

export default DrawCardModal;