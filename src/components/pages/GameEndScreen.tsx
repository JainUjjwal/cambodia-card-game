import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Crown, Home, RotateCw, Loader2, Trophy, Zap, Star } from 'lucide-react';
import { createDeck, shuffleDeck } from '../../utils/deck';

const GameEndScreen = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    // We need to find the document by shortId first
    const findAndListen = async () => {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, where("shortId", "==", gameId.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        setGameDocId(docId);
        const unsubscribe = onSnapshot(doc(db, 'games', docId), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setGameData(data);
            
            // If host restarted, redirect back to game
            if (data.status === 'in-progress') {
              navigate(`/game/${gameId}`);
            }
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    };
    findAndListen();
  }, [gameId, navigate]);

  const handleRestart = async (resetScores: boolean) => {
    if (!gameDocId || !gameData || !currentUser || currentUser.uid !== gameData.hostId) return;

    setIsRestarting(true);
    try {
      const playerIds = gameData.playOrder;
      const fullDeck = createDeck();
      const shuffledDeck = shuffleDeck(fullDeck);

      const updates: { [key: string]: any } = {};
      
      playerIds.forEach((playerId: string) => {
        const dealtCards = shuffledDeck.splice(0, 4);
        
        // Mark the bottom two cards as known by this specific player
        dealtCards[2].knownBy = [playerId];
        dealtCards[3].knownBy = [playerId];

        updates[`players.${playerId}.hand`] = dealtCards;
        updates[`players.${playerId}.hasPeekedInitial`] = false;
        
        if (resetScores) {
          updates[`players.${playerId}.score`] = 0;
        }
      });

      updates['deck'] = shuffledDeck.slice(1);
      updates['discardPile'] = [shuffledDeck[0]];
      updates['status'] = 'in-progress';
      updates['currentPlayerId'] = gameData.playOrder[0];
      updates['cambodiaCalledBy'] = null;

      if (resetScores) {
        updates['roundHistory'] = [];
      }

      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, updates);
      // Navigation is handled by the onSnapshot listener
    } catch (error) {
      console.error("Error restarting game:", error);
      alert("Failed to restart game.");
    } finally {
      setIsRestarting(false);
    }
  };

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
  const isGameOver = gameData.status === 'finished';
  const amIHost = currentUser?.uid === gameData.hostId;

  // Stats Calculations
  const bestRound = gameData.roundHistory?.reduce((best: any, round: any) => {
    const roundMin = Math.min(...Object.values(round.scores) as number[]);
    return (!best || roundMin < best.score) ? { score: roundMin, roundIdx: gameData.roundHistory.indexOf(round) } : best;
  }, null);

  const callStats = players.map(p => ({
    name: p.name,
    successfulCalls: gameData.roundHistory?.filter((r: any) => r.callerId === p.id && r.scores[p.id] === 0).length || 0
  })).sort((a, b) => b.successfulCalls - a.successfulCalls);

  const topCaller = callStats[0]?.successfulCalls > 0 ? callStats[0] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
      <div className="w-full max-w-2xl mx-auto bg-slate-700 bg-opacity-50 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-600 text-center">
        
        <h1 className="text-4xl font-bold text-slate-300 mb-2">
          {isGameOver ? 'GAME OVER' : 'ROUND ENDED'}
        </h1>
        
        <div className="flex items-center justify-center gap-3 my-4">
          <Crown className="text-yellow-400" size={32} />
          <p className="text-2xl font-bold text-yellow-300">
            {winner.name} {isGameOver ? 'Wins!' : 'is leading!'}
          </p>
          <Crown className="text-yellow-400" size={32} />
        </div>

        {/* Podium/Rankings */}
        <div className="my-6 space-y-2">
          {sortedByScore.slice(1, 3).map((p, i) => (
            <div key={p.id} className="flex items-center justify-center gap-3 text-lg">
              <span className="text-xl">{i === 0 ? '🥈' : '🥉'}</span>
              <span className="font-semibold text-slate-200">{i + 2}nd: {p.name}</span>
              <span className="text-slate-400">({p.score} pts)</span>
            </div>
          ))}
        </div>

        {/* Game Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {bestRound && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-cyan-500/30 flex items-center gap-4">
              <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400">
                <Zap size={24} />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Best Round</p>
                <p className="text-lg font-bold">{bestRound.score} Points</p>
              </div>
            </div>
          )}
          {topCaller && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-amber-500/30 flex items-center gap-4">
              <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
                <Star size={24} />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Master Deceiver</p>
                <p className="text-lg font-bold">{topCaller.name}</p>
                <p className="text-[10px] text-slate-500">{topCaller.successfulCalls} successful calls</p>
              </div>
            </div>
          )}
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
                  {players.map(p => {
                    const isCaller = round.callerId === p.id;
                    const score = round.scores[p.id];
                    const isSuccess = isCaller && score === 0;
                    
                    return (
                      <td key={p.id} className={`px-4 py-3 whitespace-nowrap text-center text-slate-200 ${isCaller ? 'bg-white/5' : ''}`}>
                        <div className="flex flex-col items-center">
                          <span className={`${isCaller ? (isSuccess ? 'text-green-400 font-bold' : 'text-red-400 font-bold') : ''}`}>
                            {score}
                          </span>
                          {isCaller && (
                            <span className="text-[10px] uppercase opacity-75">
                              {isSuccess ? '✓ Call' : '✗ Call'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
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
          {!isGameOver ? (
            <button 
              onClick={() => handleRestart(false)}
              disabled={!amIHost || isRestarting}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
            >
              <RotateCw size={20} className={isRestarting ? "animate-spin" : ""} />
              <span>{isRestarting ? 'Starting...' : 'Next Round (Host only)'}</span>
            </button>
          ) : (
            <button 
              onClick={() => handleRestart(true)}
              disabled={!amIHost || isRestarting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
            >
              <RotateCw size={20} className={isRestarting ? "animate-spin" : ""} />
              <span>{isRestarting ? 'Restarting...' : 'Restart New Game (Host only)'}</span>
            </button>
          )}
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
