import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, type DocumentData, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import GameTable from '../game/GameTable';

const GamePage = () => {
  const { gameId: shortId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [knownCards, setKnownCards] = useState([false, false, false, false]);
  const [showInitialPeek, setShowInitialPeek] = useState(false);

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

      if (game.status === 'waiting') {
        navigate(`/lobby/${shortId}`);
      }

      const myPlayerData = game.players[currentUser.uid];
      if (myPlayerData && myPlayerData.hasPeekedInitial === false) {
        setShowInitialPeek(true);
      }

    }, (err) => {
      console.error("Snapshot listener error:", err);
      setError("You do not have permission to view this game.");
    });

    return () => unsubscribe();
  }, [currentUser, shortId, navigate]);

  const handleAcknowledgePeek = async () => {
    if (!gameDocId || !currentUser) return;
    const peekedKey = `players.${currentUser.uid}.hasPeekedInitial`;
    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, { [peekedKey]: true });
    setKnownCards([false, false, true, true]);
    setShowInitialPeek(false);
  };

  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!gameData) return <div className="text-center p-8">Loading Game...</div>;

  return (
    <GameTable 
      gameData={gameData}
      myPlayerId={currentUser?.uid || ''}
      knownCards={knownCards}
      onAcknowledgePeek={handleAcknowledgePeek}
      showInitialPeek={showInitialPeek}
    />
  );
};

export default GamePage;
