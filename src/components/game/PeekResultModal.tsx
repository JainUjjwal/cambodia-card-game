import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

interface PeekResultModalProps {
  card: CardData;
  onAcknowledge: () => void;
}

const PeekResultModal = ({ card, onAcknowledge }: PeekResultModalProps) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-cyan-500 rounded-2xl shadow-2xl p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">You Peeked</h2>
        <div className="flex justify-center my-4">
          <Card value={card.value} suit={card.suit} isFaceUp={true} />
        </div>
        <p className="text-slate-300 mb-6">Remember this card!</p>
        <button onClick={onAcknowledge} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg">
          Got it!
        </button>
      </div>
    </div>
  );
};

export default PeekResultModal;
