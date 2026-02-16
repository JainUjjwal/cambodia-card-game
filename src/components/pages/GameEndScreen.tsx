import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { Crown, Home, RotateCw, Loader2 } from 'lucide-react';

const GameEndScreen = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const navigate = useNavigate();
  
  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    // We need to find the document by shortId first
    const findAndListen = async () => {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, where("shortId", "==", gameId.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const gameDocId = querySnapshot.docs[0].id;
        const unsubscribe = onSnapshot(doc(db, 'games', gameDocId), (doc) => {
          if (doc.exists()) {
            setGameData(doc.data());
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    };
    findAndListen();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-xl font-semibold">Calculating Results...</p>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
        <button onClick={() => navigate('/')} className="bg-cyan-600 px-6 py-2 rounded-lg font-bold">Return Home</button>
      </div>
    );
  }

  const players = gameData.playOrder.map((id: string) => ({
    id,
    ...gameData.players[id]
  }));

  const sortedByScore = [...players].sort((a, b) => a.score - b.score);
  const winner = sortedByScore[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
      <div className="w-full max-w-2xl mx-auto bg-slate-700 bg-opacity-50 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-600 text-center">
        
        <h1 className="text-4xl font-bold text-slate-300 mb-2">ROUND ENDED</h1>
        
        <div className="flex items-center justify-center gap-3 my-4">
          <Crown className="text-yellow-400" size={32} />
          <p className="text-2xl font-bold text-yellow-300">{winner.name} is leading!</p>
          <Crown className="text-yellow-400" size={32} />
        </div>

        {/* Podium/Rankings */}
        <div className="my-6 space-y-2">
          {sortedByScore.slice(1, 3).map((p, i) => (
            <div key={p.id} className="flex items-center justify-center gap-3 text-lg">
              <span className="text-xl">{i === 0 ? '🥈' : '🥉'}</span>
              <span className="font-semibold text-slate-200">{i + 1 + 1}st: {p.name}</span>
              <span className="text-slate-400">({p.score} pts)</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-600 mb-8">
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-800 bg-opacity-70">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Round
                </th>
                {players.map(p => (
                  <th key={p.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-700 bg-opacity-50 divide-y divide-slate-600">
              {gameData.roundHistory?.map((round: any, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-300 text-left">
                    {index + 1}
                  </td>
                  {players.map(p => (
                    <td key={p.id} className="px-4 py-3 whitespace-nowrap text-center text-slate-200">
                      {round.scores[p.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-800 bg-opacity-70">
              <tr>
                <th scope="row" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Total
                </th>
                {players.map(p => (
                  <td key={p.id} className="px-4 py-3 text-center font-bold text-white">
                    {p.score}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 space-y-4">
          <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none">
            <RotateCw size={20} />
            <span>Next Round (Host only)</span>
          </button>
          <button onClick={() => navigate('/')} className="w-full border-2 border-cyan-200 text-cyan-100 font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-transform duration-200 ease-in-out">
            <Home size={20} />
            <span>Leave to Main Menu</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GameEndScreen;
