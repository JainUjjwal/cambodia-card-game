import React from 'react';
import { User, Swords, Shield } from 'lucide-react';
import Card from '../game/Card';

// Helper component for opponent display
const Opponent = ({ player }: { player: any }) => {
  return (
    <div className="flex flex-col items-center gap-2">
       <div className="flex items-center gap-2 text-xs md:text-sm bg-slate-700 px-2 py-1 rounded-md">
        <User size={14} />
        <span>{player.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Card className="w-10 md:w-12" isKnown={player.isKnown[0]} />
        <Card className="w-10 md:w-12" isKnown={player.isKnown[1]} />
        <Card className="w-10 md:w-12" isKnown={player.isKnown[2]} />
        <Card className="w-10 md:w-12" isKnown={player.isKnown[3]} />
      </div>
    </div>
  );
};

const GamePage = () => {
  // Placeholder data for a 6-player game (1 player + 5 opponents)
  const opponents = [
    { name: 'Player 2', cardCount: 4, isKnown: [false, false, false, false] },
    { name: 'Player 3', cardCount: 4, isKnown: [false, true, false, false] },
    { name: 'Player 4', cardCount: 4, isKnown: [false, false, false, false] },
    { name: 'Player 5', cardCount: 3, isKnown: [false, false, false, false] },
    { name: 'Player 6', cardCount: 4, isKnown: [false, false, false, false] },
  ];
  const myHand = { isKnown: [false, false, true, true] };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-2 md:p-4 text-white font-sans">
      {/* Main Game Board */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-4xl flex-grow md:aspect-video">
        
        {/* Top Opponents */}
        <div className="flex justify-center items-center"><Opponent player={opponents[0]} /></div>
        <div className="flex justify-center items-center"><Opponent player={opponents[1]} /></div>
        <div className="flex justify-center items-center"><Opponent player={opponents[2]} /></div>

        {/* Middle Row */}
        <div className="flex justify-center items-center"><Opponent player={opponents[3]} /></div>
        <div className="flex justify-center items-center gap-4">
          <Card />
          <Card value="A" suit="♦" isFaceUp={true} />
        </div>
        <div className="flex justify-center items-center"><Opponent player={opponents[4]} /></div>

        {/* Player Area */}
        <div className="col-span-3 flex flex-col items-center justify-end">
          <div className="text-center mb-2">
            <p className="text-lg font-bold">Your Turn! (Player 1)</p>
            <p className="text-xs text-slate-400">Last Move: Player 6 peeked their top left card</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card isKnown={myHand.isKnown[0]} />
            <Card isKnown={myHand.isKnown[1]} />
            <Card isKnown={myHand.isKnown[2]} />
            <Card isKnown={myHand.isKnown[3]} />
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div className="w-full max-w-4xl mt-4 p-2 bg-slate-800 bg-opacity-50 rounded-lg flex justify-center gap-2 flex-wrap">
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Draw Card</button>
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg">Take 7♦</button>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Swords size={16} /> Snap!</button>
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Shield size={16} /> Call Cambodia</button>
      </div>

      {/* Turn Timer */}
      <div className="w-full max-w-4xl mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-400" style={{ width: '80%' }}></div>
      </div>
    </div>
  );
};

export default GamePage;
