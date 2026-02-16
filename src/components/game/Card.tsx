import React from 'react';
import { Eye } from 'lucide-react';

type CardProps = {
  value?: string;
  suit?: '♠' | '♥' | '♦' | '♣' | 'Joker';
  isFaceUp?: boolean;
  isKnown?: boolean;
  className?: string;
};

const Card = ({ value, suit, isFaceUp = false, isKnown = false, className = '' }: CardProps) => {
  const suitColor = suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-slate-800';
  const isJoker = value?.toLowerCase() === 'joker';

  return (
    <div className={`aspect-[2.5/3.5] w-10 sm:w-12 md:w-16 rounded-lg shadow-md flex items-center justify-center transition-transform duration-300 ${className}`}>
      {isFaceUp ? (
        <div className={`relative w-full h-full bg-white rounded-lg flex flex-col items-center justify-center overflow-hidden ${isJoker ? '' : 'p-0.5 md:p-1'}`}>
          {isJoker ? (
            // Joker rendering with a larger, full-bleed emoji
            <div className="text-4xl sm:text-6xl md:text-8xl leading-none -translate-y-px">
              🃏
            </div>
          ) : (
            // Standard card rendering
            <>
              <div className={`font-bold text-xl sm:text-3xl md:text-5xl ${suitColor}`}>{value}</div>
              <div className={`text-lg sm:text-2xl md:text-4xl ${suitColor}`}>{suit}</div>
            </>
          )}
        </div>
      ) : (
        // This is the back of the card
        <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg border-2 border-cyan-300 flex items-center justify-center">
          {isKnown && <Eye className="absolute top-0.5 right-0.5 text-white opacity-75" size={12} />}
        </div>
      )}
    </div>
  );
};

export default Card;