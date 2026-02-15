import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

// Define the props for the modal
type InitialPeekModalProps = {
  hand: CardData[];
  onDone: () => void;
};

const InitialPeekModal = ({ hand, onDone }: InitialPeekModalProps) => {
  if (!hand || hand.length < 4) return null;

  const bottomLeftCard = hand[2];
  const bottomRightCard = hand[3];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-600 text-center text-white">
        <h2 className="text-2xl font-bold mb-4 text-cyan-300">Your Bottom Cards</h2>
        <p className="mb-6 text-slate-300">Remember these! This is your only chance to see them.</p>
        <div className="flex justify-center gap-4 mb-8">
          <div className="flex flex-col items-center">
            <Card value={bottomLeftCard.value} suit={bottomLeftCard.suit} isFaceUp={true} />
            <span className="mt-2 text-sm font-semibold text-slate-400">Bottom Left</span>
          </div>
          <div className="flex flex-col items-center">
            <Card value={bottomRightCard.value} suit={bottomRightCard.suit} isFaceUp={true} />
            <span className="mt-2 text-sm font-semibold text-slate-400">Bottom Right</span>
          </div>
        </div>
        <button
          onClick={onDone} // <-- And here
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default InitialPeekModal;
