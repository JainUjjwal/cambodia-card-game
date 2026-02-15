import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Book, Copy, User, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { createDeck, shuffleDeck } from '../../utils/deck';

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
        setGameData(null);
        return;
      }

      const gameDoc = querySnapshot.docs[0];
      const game = gameDoc.data();

      setGameDocId(gameDoc.id);
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
            hand: [],
            hasPeekedInitial: false,
          },
          playOrder: [...game.playOrder, currentUser.uid]
        }).catch(err => {
          console.error("Error joining game:", err);
          setError("Failed to join game due to permissions.");
        });
      }
    }, (err) => {
      console.error("Snapshot listener error:", err);
      setError("You do not have permission to view this lobby.");
    });

    return () => unsubscribe();

  }, [currentUser, shortId, navigate]);

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
        try {
          await updateDoc(gameRef, { [nameKey]: newName });
        } catch (error) {
          console.error("Error updating name: ", error);
        } finally {
          setIsEditingName(false);
        }
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

  const handleStartGame = async () => {
    if (gameDocId && currentUser && gameData && currentUser.uid === gameData.hostId) {
      const playerIds = gameData.playOrder;
      const fullDeck = createDeck();
      const shuffledDeck = shuffleDeck(fullDeck);

      const updates: { [key: string]: any } = {};
      
      playerIds.forEach((playerId: string) => {
        const dealtCards = shuffledDeck.splice(0, 4);
        
        // ** CORRECTED LOGIC **
        // Mark the bottom two cards as known by this specific player
        dealtCards[2].knownBy.push(playerId);
        dealtCards[3].knownBy.push(playerId);

        updates[`players.${playerId}.hand`] = dealtCards;
        // ** THE FIX **
        // Ensure EVERYONE needs to perform the initial peek
        updates[`players.${playerId}.hasPeekedInitial`] = false;
      });

      updates['deck'] = shuffledDeck.slice(1);
      updates['discardPile'] = [shuffledDeck[0]];
      updates['status'] = 'in-progress';
      updates['currentPlayerId'] = gameData.playOrder[0];

      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, updates);
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
              <button onClick={() => player.id === currentUser?.uid && handleToggleReady()} disabled={player.id !== currentUser?.uid} className="disabled:cursor-not-allowed">
                 {player.isReady ? <div className="flex items-center gap-2 text-green-400"><CheckCircle size={20} /><span>Ready</span></div> : <div className="flex items-center gap-2 text-yellow-400"><Clock size={20} /><span>Waiting...</span></div>}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button onClick={handleStartGame} disabled={!amIHost || !allPlayersReady} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none">
            Start Game
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">Only the host can start the game when all players are ready.</p>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;

