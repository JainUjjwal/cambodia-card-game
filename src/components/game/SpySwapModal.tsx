import React from 'react';
import Card from './Card';
import { type CardData } from '../../utils/deck';

interface SpySwapModalProps {
  opponentCard: CardData;
  ownCard: CardData;
  opponentName: string;
  onSwap: () => void;
  onKeep: () => void;
}

const SpySwapModal = ({ opponentCard, ownCard, opponentName, onSwap, onKeep }: SpySwapModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border-2 border-amber-500 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center text-white">
        <h2 className="text-3xl font-bold mb-2 text-amber-400">Spy & Swap</h2>
        <p className="text-slate-300 mb-8">You've seen both cards. Do you want to swap them?</p>
        
        <div className="flex justify-center gap-8 mb-10">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">{opponentName}'s Card</span>
            <Card value={opponentCard.value} suit={opponentCard.suit} isFaceUp={true} />
          </div>
          
          <div className="flex items-center text-4xl text-amber-500 font-bold">VS</div>
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">Your Card</span>
            <Card value={ownCard.value} suit={ownCard.suit} isFaceUp={true} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onSwap} 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors text-lg"
          >
            Swap Cards
          </button>
          <button 
            onClick={onKeep} 
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors text-lg"
          >
            Keep My Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpySwapModal;
