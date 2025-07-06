import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { User, Swords, Shield } from 'lucide-react';
import Card from '../game/Card';

const GamePage = () => {
  const { gameId: shortId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !shortId) return;

    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where("shortId", "==", shortId.toUpperCase()));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        setError("Game not found!");
        return;
      }
      
      const gameDoc = querySnapshot.docs[0];
      const game = gameDoc.data();
      setGameData(game);

      if (game.status === 'waiting') {
        navigate(`/lobby/${shortId}`);
      }
    }, (err) => {
      console.error("Snapshot listener error:", err);
      setError("You do not have permission to view this game.");
    });

    return () => unsubscribe();
  }, [currentUser, shortId, navigate]);

  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!gameData) return <div className="text-center p-8">Loading Game...</div>;

  const { players, playOrder, currentPlayerId, discardPile } = gameData;
  const myPlayerId = currentUser?.uid || '';
  const myHand = players[myPlayerId]?.hand || [];
  const opponentOrder = playOrder.filter((pid: string) => pid !== myPlayerId);

  const opponentPositions = [
    { player: players[opponentOrder[0]], position: 'top-left' },
    { player: players[opponentOrder[1]], position: 'top-center' },
    { player: players[opponentOrder[2]], position: 'top-right' },
    { player: players[opponentOrder[3]], position: 'middle-left' },
    { player: players[opponentOrder[4]], position: 'middle-right' },
  ].filter(p => p.player); // Filter out undefined players for smaller games

  const topCard = discardPile && discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-2 md:p-4 text-white font-sans">
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-4xl flex-grow md:aspect-video">
        
        {opponentPositions.slice(0, 3).map((op, index) => (
          <div key={op.player.name} className="flex justify-center items-center">
            <Opponent player={op.player} />
          </div>
        ))}
        
        <div className="flex justify-center items-center">
          {opponentPositions[3] && <Opponent player={opponentPositions[3].player} />}
        </div>
        
        <div className="flex justify-center items-center gap-4">
          <Card />
          {topCard && <Card value={topCard.value} suit={topCard.suit} isFaceUp={true} />}
        </div>
        
        <div className="flex justify-center items-center">
          {opponentPositions[4] && <Opponent player={opponentPositions[4].player} />}
        </div>

        <div className="col-span-3 flex flex-col items-center justify-end">
          <div className="text-center mb-2">
            <p className={`text-lg font-bold ${currentPlayerId === myPlayerId ? 'text-cyan-400' : ''}`}>
              {currentPlayerId === myPlayerId ? "Your Turn!" : `${players[currentPlayerId]?.name}'s Turn`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {myHand.map((card: any, index: number) => (
              <Card key={index} value={card.value} suit={card.suit} />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-4 p-2 bg-slate-800 bg-opacity-50 rounded-lg flex justify-center gap-2 flex-wrap">
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Draw Card</button>
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg">Take {topCard?.value}{topCard?.suit}</button>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Swords size={16} /> Snap!</button>
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Shield size={16} /> Call Cambodia</button>
      </div>

      <div className="w-full max-w-4xl mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-400" style={{ width: '80%' }}></div>
      </div>
    </div>
  );
};

const Opponent = ({ player }: { player: any }) => {
  if (!player) return null;
  return (
    <div className="flex flex-col items-center gap-2">
       <div className="flex items-center gap-2 text-xs md:text-sm bg-slate-700 px-2 py-1 rounded-md">
        <User size={14} />
        <span>{player.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {player.hand?.map((card: any, index: number) => (
          <Card key={index} className="w-10 md:w-12" />
        ))}
      </div>
    </div>
  );
};

export default GamePage;
