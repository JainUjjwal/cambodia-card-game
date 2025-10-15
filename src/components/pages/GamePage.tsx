import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, type DocumentData, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import GameTable from '../game/GameTable';
import { type CardData } from '../../utils/deck';

const GamePage = () => {
  const { gameId: shortId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [knownCards, setKnownCards] = useState([false, false, false, false]);
  const [showInitialPeek, setShowInitialPeek] = useState(false);
  const [drawnCard, setDrawnCard] = useState<CardData | null>(null);
  const [showDrawCardModal, setShowDrawCardModal] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [cardToSwap, setCardToSwap] = useState<CardData | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);
  const [peekedCard, setPeekedCard] = useState<CardData | null>(null);
  const [showPeekResultModal, setShowPeekResultModal] = useState(false);

  // New state for the Spy action
  const [isSpying, setIsSpying] = useState(false);
  const [spiedCard, setSpiedCard] = useState<CardData | null>(null);
  const [spiedPlayerName, setSpiedPlayerName] = useState<string>('');
  const [showSpyResultModal, setShowSpyResultModal] = useState(false);

  useEffect(() => {
    if (!currentUser || !shortId) return;
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where("shortId", "==", shortId.toUpperCase()));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) { setError("Game not found!"); return; }
      const gameDoc = querySnapshot.docs[0];
      setGameDocId(gameDoc.id);
      const game = gameDoc.data();
      setGameData(game);
      if (game.status === 'waiting') { navigate(`/lobby/${shortId}`); }
      const myPlayerData = game.players[currentUser.uid];
      if (myPlayerData && myPlayerData.hasPeekedInitial === false) { setShowInitialPeek(true); }
    }, (err) => {
      console.error("Snapshot listener error:", err);
      setError("You do not have permission to view this game.");
    });
    return () => unsubscribe();
  }, [currentUser, shortId, navigate]);

  const handleAcknowledgePeek = async () => {
    if (!gameDocId || !currentUser) return;
    const peekedKey = `players.${currentUser.uid}.hasPeekedInitial`;
    await updateDoc(doc(db, 'games', gameDocId), { [peekedKey]: true });
    setKnownCards([false, false, true, true]);
    setShowInitialPeek(false);
  };

  const advanceTurn = () => {
    if (!gameData) return null;
    const { playOrder, currentPlayerId } = gameData;
    const currentIndex = playOrder.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playOrder.length;
    return playOrder[nextIndex];
  };

  const handleDrawCard = () => {
    if (!gameData || gameData.deck.length === 0) return;
    const topCard = gameData.deck[0];
    setDrawnCard(topCard);
    setShowDrawCardModal(true);
  };

  const handleTakeFromDiscard = () => {
    if (!gameData || gameData.discardPile.length === 0) return;
    const topCard = gameData.discardPile[gameData.discardPile.length - 1];
    setCardToSwap(topCard);
    setIsSwapping(true);
  };

  const handleInitiateSwap = () => {
    if (!drawnCard) return;
    setCardToSwap(drawnCard);
    setIsSwapping(true);
    setShowDrawCardModal(false);
  };

  const handleSelectCardToSwap = async (cardIndex: number) => {
    if (!gameDocId || !currentUser || !cardToSwap || !gameData) return;
    const gameRef = doc(db, 'games', gameDocId);
    const myPlayer = gameData.players[currentUser.uid];
    const newHand = [...myPlayer.hand];
    const discardedCard = newHand[cardIndex];
    newHand[cardIndex] = cardToSwap;
    const newKnownCards = [...knownCards];
    newKnownCards[cardIndex] = true;
    const fromDeck = gameData.deck.some((c: CardData) => c.value === cardToSwap.value && c.suit === cardToSwap.suit);
    let deckUpdate = fromDeck ? { deck: gameData.deck.slice(1) } : { discardPile: gameData.discardPile.slice(0, -1) };
    await updateDoc(gameRef, { ...deckUpdate, discardPile: arrayUnion(discardedCard), [`players.${currentUser.uid}.hand`]: newHand, currentPlayerId: advanceTurn() });
    setKnownCards(newKnownCards);
    setIsSwapping(false);
    setCardToSwap(null);
    setDrawnCard(null);
  };

  const handleDiscardDrawnCard = async () => {
    if (!gameDocId || !drawnCard || !gameData) return;
    await updateDoc(doc(db, 'games', gameDocId), { deck: gameData.deck.slice(1), discardPile: arrayUnion(drawnCard), currentPlayerId: advanceTurn() });
    setShowDrawCardModal(false);
    setDrawnCard(null);
  };
  
  const handleUseAction = () => {
    if (!drawnCard) return;
    const value = drawnCard.value;
    if (value === '7' || value === '8') {
      setIsPeeking(true);
    } else if (value === '9' || value === '10') {
      setIsSpying(true);
    }
    setShowDrawCardModal(false);
  };

  const handleSelectCardToPeek = (cardIndex: number) => {
    if (!gameData || !currentUser) return;
    const myHand = gameData.players[currentUser.uid].hand;
    setPeekedCard(myHand[cardIndex]);
    setShowPeekResultModal(true);
    const newKnownCards = [...knownCards];
    newKnownCards[cardIndex] = true;
    setKnownCards(newKnownCards);
  };
  
  const handleSelectOpponentCardToSpy = (playerId: string, cardIndex: number) => {
    if (!gameData) return;
    const opponentHand = gameData.players[playerId].hand;
    setSpiedCard(opponentHand[cardIndex]);
    setSpiedPlayerName(gameData.players[playerId].name);
    setShowSpyResultModal(true);
  };

  const handleAcknowledgeAction = async () => {
    if (!gameDocId || !drawnCard || !gameData) return;
    await updateDoc(doc(db, 'games', gameDocId), { deck: gameData.deck.slice(1), discardPile: arrayUnion(drawnCard), currentPlayerId: advanceTurn() });
    // Reset all action states
    setShowPeekResultModal(false);
    setShowSpyResultModal(false);
    setPeekedCard(null);
    setSpiedCard(null);
    setDrawnCard(null);
    setIsPeeking(false);
    setIsSpying(false);
  };

  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!gameData) return <div className="text-center p-8">Loading Game...</div>;

  return (
    <GameTable 
      gameData={gameData}
      myPlayerId={currentUser?.uid || ''}
      knownCards={knownCards}
      isSwapping={isSwapping}
      isPeeking={isPeeking}
      isSpying={isSpying}
      onAcknowledgePeek={handleAcknowledgePeek}
      showInitialPeek={showInitialPeek}
      onDrawCard={handleDrawCard}
      drawnCard={drawnCard}
      showDrawCardModal={showDrawCardModal}
      onSwap={handleInitiateSwap}
      onUseAction={handleUseAction}
      onDiscard={handleDiscardDrawnCard}
      onSelectCardToSwap={handleSelectCardToSwap}
      onTakeFromDiscard={handleTakeFromDiscard}
      onSelectCardToPeek={handleSelectCardToPeek}
      peekedCard={peekedCard}
      showPeekResultModal={showPeekResultModal}
      onAcknowledgePeekResult={handleAcknowledgeAction}
      onSelectOpponentCardToSpy={handleSelectOpponentCardToSpy}
      spiedCard={spiedCard}
      spiedPlayerName={spiedPlayerName}
      showSpyResultModal={showSpyResultModal}
      onAcknowledgeSpyResult={handleAcknowledgeAction}
    />
  );
};

export default GamePage;