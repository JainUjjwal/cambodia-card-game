import React from 'react';
import { User } from 'lucide-react';
import Card from './Card';
import { type DocumentData } from 'firebase/firestore';

interface OpponentProps {
  player: DocumentData;
}

const Opponent = ({ player }: OpponentProps) => {
  if (!player) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-xs md:text-sm bg-slate-700 px-2 py-1 rounded-md">
        <User size={14} />
        <span>{player.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {player.hand?.map((_: any, index: number) => (
          <Card key={index} className="w-10 md:w-12" />
        ))}
      </div>
    </div>
  );
};

export default Opponent;
