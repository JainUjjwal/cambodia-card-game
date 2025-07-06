import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { createDeck, shuffleDeck } from '../../utils/deck';
import { Book, Copy, User, CheckCircle, Clock, Edit2 } from 'lucide-react';

const LobbyPage = () => {
  const { gameId: shortId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

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
      setGameDocId(gameDoc.id);
      const game = gameDoc.data();
      setGameData(game);
      
      if (game.status === 'in-progress') {
        navigate(`/game/${shortId}`);
      }

      const playerIds = Object.keys(game.players);
      const isPlayerInGame = playerIds.includes(currentUser.uid);

      if (!isPlayerInGame) {
        if (game.status !== 'waiting' || playerIds.length >= 6) {
          setError("This game is full or has already started.");
          return;
        }
        
        const newPlayerNumber = playerIds.length + 1;
        const newPlayerKey = `players.${currentUser.uid}`;
        
        updateDoc(gameDoc.ref, {
          [newPlayerKey]: {
            name: `Player ${newPlayerNumber}`,
            score: 0,
            isReady: false,
            hasPeekedInitial: false, // Add peek status for new players
          },
          playOrder: [...game.playOrder, currentUser.uid]
        });
      }
    }, (err) => {
      console.error("Snapshot listener error:", err);
      setError("You do not have permission to view this lobby.");
    });

    return () => unsubscribe();

  }, [currentUser, shortId, navigate]);

  const handleStartGame = async () => {
    if (!gameDocId || !gameData) return;

    const deck = shuffleDeck(createDeck());
    const playersUpdate: { [key: string]: any } = {};
    
    // Also reset peek status for all players at the start of a new game
    const updatedPlayers = { ...gameData.players };
    gameData.playOrder.forEach((playerId: string) => {
      playersUpdate[`players.${playerId}.hand`] = deck.splice(0, 4);
      playersUpdate[`players.${playerId}.hasPeekedInitial`] = false;
    });

    const discardPile = deck.splice(0, 1);

    await updateDoc(doc(db, 'games', gameDocId), {
      ...playersUpdate,
      deck: deck,
      discardPile: discardPile,
      status: 'in-progress',
      currentPlayerId: gameData.playOrder[0],
    });
  };

  // ... rest of the functions (handleCopy, handleNameChange, handleToggleReady) remain the same
  
  const handleCopy = () => {
    if (shortId) {
      navigator.clipboard.writeText(shortId.toUpperCase()).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handleNameChange = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameDocId && currentUser) {
      const newName = (e.target as HTMLInputElement).value.trim();
      if (newName && newName.length > 0 && newName.length <= 15) {
        const nameKey = `players.${currentUser.uid}.name`;
        const gameRef = doc(db, 'games', gameDocId);
        await updateDoc(gameRef, { [nameKey]: newName });
        setIsEditingName(false);
      } else {
        alert("Name must be between 1 and 15 characters.");
      }
    }
  };

  const handleToggleReady = async () => {
    if (gameDocId && currentUser && gameData) {
      const currentReadyStatus = gameData.players[currentUser.uid].isReady;
      const readyKey = `players.${currentUser.uid}.isReady`;
      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, { [readyKey]: !currentReadyStatus });
    }
  };

  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!gameData) return <div className="text-center p-8">Finding Lobby...</div>;

  const players = Object.entries(gameData.players).map(([id, data]: [string, any]) => ({ id, ...data }));
  const amIHost = currentUser?.uid === gameData.hostId;
  const allPlayersReady = players.every(p => p.isReady);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
      <div className="w-full max-w-md mx-auto bg-slate-700 bg-opacity-50 rounded-2xl shadow-2xl p-6 border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-cyan-300">Game Lobby</h1>
          <button className="text-slate-400 hover:text-cyan-300 transition-colors"><Book size={24} /></button>
        </div>

        <div className="mb-6 p-4 bg-slate-800 rounded-lg text-center">
          <p className="text-sm text-slate-400 mb-1">Share this code to invite players:</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-2xl font-mono tracking-widest text-white">{shortId?.toUpperCase()}</p>
            <button onClick={handleCopy} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors">
              {isCopied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="turn-timer" className="block text-sm font-medium text-slate-300 mb-2">Turn Timer</label>
          <select id="turn-timer" disabled={!amIHost} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800/50">
            <option>30 seconds</option>
            <option>45 seconds</option>
            <option>60 seconds</option>
            <option>No Timer</option>
          </select>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-2 text-slate-300">Players ({players.length}/6)</h2>
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="text-slate-400" size={20} />
                {isEditingName && currentUser?.uid === player.id ? (
                  <input
                    type="text"
                    defaultValue={player.name}
                    onKeyDown={handleNameChange}
                    onBlur={() => setIsEditingName(false)}
                    autoFocus
                    className="bg-slate-600 text-white p-1 rounded"
                  />
                ) : (
                  <span className="font-medium">{player.name}{currentUser?.uid === player.id && ' (You)'}{player.id === gameData.hostId && ' (Host)'}</span>
                )}
                {currentUser?.uid === player.id && !isEditingName && (
                  <button onClick={() => setIsEditingName(true)}><Edit2 size={14} className="text-slate-400 hover:text-white" /></button>
                )}
              </div>
              
              <button 
                onClick={currentUser?.uid === player.id ? handleToggleReady : undefined} 
                disabled={currentUser?.uid !== player.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${currentUser?.uid === player.id ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {player.isReady ? 
                  <><CheckCircle size={16} className="text-green-400" /><span>Ready</span></> : 
                  <><Clock size={16} className="text-yellow-400" /><span>Waiting...</span></>
                }
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button 
            onClick={handleStartGame}
            disabled={!amIHost || !allPlayersReady}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            Start Game
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">Only the host can start the game when all players are ready.</p>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
