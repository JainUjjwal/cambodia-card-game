import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

interface SpyResultModalProps {
  card: CardData;
  playerName: string;
  onAcknowledge: () => void;
}

const SpyResultModal = ({ card, playerName, onAcknowledge }: SpyResultModalProps) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-purple-500 rounded-2xl shadow-2xl p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Spy Result</h2>
        <p className="text-slate-300 mb-6">You spied on {playerName}'s card.</p>
        <div className="flex justify-center my-4">
          <Card value={card.value} suit={card.suit} isFaceUp={true} />
        </div>
        <button onClick={onAcknowledge} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg">
          Excellent!
        </button>
      </div>
    </div>
  );
};

export default SpyResultModal;