import React from 'react';
import Card from './Card';
import { type DocumentData } from 'firebase/firestore';

interface InitialPeekModalProps {
  hand: DocumentData[];
  onAcknowledge: () => void;
}

const InitialPeekModal = ({ hand, onAcknowledge }: InitialPeekModalProps) => {
  // Ensure we have cards to show before trying to access them
  const bottomCard1 = hand && hand.length > 2 ? hand[2] : null;
  const bottomCard2 = hand && hand.length > 3 ? hand[3] : null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-cyan-500 rounded-2xl shadow-2xl p-6 text-center">
        <h2 className="text-2xl font-bold mb-4 text-white">Your Bottom Two Cards</h2>
        <p className="text-slate-300 mb-6">Memorize these cards. You won't be able to look again freely!</p>
        <div className="flex gap-4 mb-6 justify-center">
          
          {/* Card with Label */}
          <div className="flex flex-col items-center gap-2">
            {bottomCard1 && <Card value={bottomCard1.value} suit={bottomCard1.suit} isFaceUp={true} />}
            <p className="text-sm font-semibold text-slate-300">Bottom Left</p>
          </div>

          {/* Card with Label */}
          <div className="flex flex-col items-center gap-2">
            {bottomCard2 && <Card value={bottomCard2.value} suit={bottomCard2.suit} isFaceUp={true} />}
            <p className="text-sm font-semibold text-slate-300">Bottom Right</p>
          </div>

        </div>
        <button onClick={onAcknowledge} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg">
          Got it!
        </button>
      </div>
    </div>
  );
};

export default InitialPeekModal;
