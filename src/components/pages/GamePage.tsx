import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { GameTable } from '../game/GameTable';
import { type CardData } from '../../utils/deck';

export const GamePage = () => {
  const { gameId: shortId } = useParams<{ gameId: string }>();
  const { currentUser } = useAuth();

  const [gameData, setGameData] = useState<DocumentData | null>(null);
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for the initial peek modal
  const [showInitialPeek, setShowInitialPeek] = useState(false);
  
  // State for drawing a card
  const [drawnCard, setDrawnCard] = useState<CardData | null>(null);
  const [showDrawCardModal, setShowDrawCardModal] = useState(false);

  // State for swapping a card
  const [isSwapping, setIsSwapping] = useState(false);
  const [cardToSwap, setCardToSwap] = useState<CardData | null>(null);

  // State for peeking a card
  const [isPeeking, setIsPeeking] = useState(false);
  const [peekedCardResult, setPeekedCardResult] = useState<CardData | null>(null);
  const [showPeekResultModal, setShowPeekResultModal] = useState(false);

  // State for spying on a card
  const [isSpying, setIsSpying] = useState(false);
  const [spiedCardResult, setSpiedCardResult] = useState<CardData | null>(null);
  const [showSpyResultModal, setShowSpyResultModal] = useState(false);


  useEffect(() => {
    if (!shortId || !currentUser) return;

    // We can't query by shortId directly in a doc listener, so we'll keep the lobby logic for finding the doc ID
    // For a real app, you might have a "games" collection and a "gameLobbies" collection
    // but for simplicity, we find it once and then listen to the doc.
    const findGame = async () => {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, where("shortId", "==", shortId.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("Game not found!");
        return;
      }
      
      const gameDoc = querySnapshot.docs[0];
      setGameDocId(gameDoc.id);
    };
    findGame();
  }, [shortId, currentUser]);


  useEffect(() => {
    if (!gameDocId || !currentUser) return;

    const gameRef = doc(db, 'games', gameDocId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const game = doc.data();
        setGameData(game);

        const me = game.players[currentUser.uid];
        if (game.status === 'in-progress' && !me.hasPeekedInitial) {
          setShowInitialPeek(true);
        } else {
          setShowInitialPeek(false);
        }
      } else {
        setError("Game not found!");
      }
    });

    return () => unsubscribe();
  }, [gameDocId, currentUser]);

  const handleInitialPeekDone = async () => {
    if (gameDocId && currentUser) {
      const peekKey = `players.${currentUser.uid}.hasPeekedInitial`;
      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, { [peekKey]: true });
      setShowInitialPeek(false);
    }
  };

  const handleDrawCard = async () => {
    if (!gameData || !gameDocId) return;
    const currentDeck = gameData.deck;
    if (currentDeck.length > 0) {
      const card = currentDeck[0];
      setDrawnCard(card);
      setShowDrawCardModal(true);
    }
  };

  const handleCloseDrawModal = () => {
    setShowDrawCardModal(false);
    setDrawnCard(null);
  };

  const handleDiscard = async () => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard) return;

    const nextPlayerIndex = (gameData.playOrder.indexOf(currentUser.uid) + 1) % gameData.playOrder.length;
    const nextPlayerId = gameData.playOrder[nextPlayerIndex];

    const updates = {
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
      currentPlayerId: nextPlayerId,
    };

    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, updates);

    handleCloseDrawModal();
  };

  const handleTakeFromDiscard = () => {
    if(!gameData) return;
    const topCard = gameData.discardPile[0];
    setCardToSwap(topCard);
    setIsSwapping(true);
  };
  
  const handleSwapCardSelect = async (cardIndex: number) => {
    if (!gameData || !gameDocId || !currentUser || !cardToSwap) return;
  
    const players = gameData.players;
    const me = players[currentUser.uid];
    const myHand = [...me.hand];
  
    const replacedCard = myHand[cardIndex];
    
    // Add memory: Player now knows the card they just put in their hand
    const updatedCardToSwap = {
      ...cardToSwap,
      knownBy: Array.from(new Set([...cardToSwap.knownBy, currentUser.uid]))
    };
    myHand[cardIndex] = updatedCardToSwap;
  
    let newDiscardPile = [replacedCard, ...gameData.discardPile];
    let newDeck = gameData.deck;

    // Check where the card came from to update that pile correctly
    if (gameData.discardPile.length > 0 && cardToSwap === gameData.discardPile[0]) {
      // If we took from discard, remove it from the old position
      newDiscardPile = [replacedCard, ...gameData.discardPile.slice(1)];
    } else if (drawnCard && cardToSwap === drawnCard) {
      // If we took from deck, remove it from the deck
      newDeck = gameData.deck.slice(1);
    }
    
    const nextPlayerIndex = (gameData.playOrder.indexOf(currentUser.uid) + 1) % gameData.playOrder.length;
    const nextPlayerId = gameData.playOrder[nextPlayerIndex];

    const updates: { [key: string]: any } = {
      [`players.${currentUser.uid}.hand`]: myHand,
      discardPile: newDiscardPile,
      deck: newDeck,
      currentPlayerId: nextPlayerId,
    };
  
    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, updates);
  
    setIsSwapping(false);
    setCardToSwap(null);
    handleCloseDrawModal(); // Also close draw modal if it was open
  };

  const handleUseAction = () => {
    if (!drawnCard) return;

    // Action dispatcher
    const value = drawnCard.value;
    if (['7', '8'].includes(value)) {
        setIsPeeking(true);
    } else if (['9', '10'].includes(value)) {
        setIsSpying(true);
    }
    // Future actions will go here...

    setShowDrawCardModal(false);
  };

  const handlePeekCardSelect = async (cardIndex: number) => {
    if (!gameData || !currentUser || !gameDocId) return;
    
    const me = gameData.players[currentUser.uid];
    const peekedCard = { ...me.hand[cardIndex] };

    // Add current user to the knownBy array if not already there
    if (!peekedCard.knownBy.includes(currentUser.uid)) {
      peekedCard.knownBy.push(currentUser.uid);
    }
    
    const myHand = [...me.hand];
    myHand[cardIndex] = peekedCard;
    
    const handKey = `players.${currentUser.uid}.hand`;
    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, { [handKey]: myHand });

    setPeekedCardResult(peekedCard);
    setShowPeekResultModal(true);
  };
  
  const handleClosePeekResultModal = async () => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard) return;

    const nextPlayerIndex = (gameData.playOrder.indexOf(currentUser.uid) + 1) % gameData.playOrder.length;
    const nextPlayerId = gameData.playOrder[nextPlayerIndex];

    const updates = {
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
      currentPlayerId: nextPlayerId,
    };

    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, updates);

    setShowPeekResultModal(false);
    setPeekedCardResult(null);
    setIsPeeking(false);
    setDrawnCard(null);
  };

  const handleSpyCardSelect = async (spiedPlayerId: string, spiedCardIndex: number) => {
    if (!gameData || !currentUser || !gameDocId) return;

    // ** THE FIX IS HERE **
    const gameDataCopy = JSON.parse(JSON.stringify(gameData));
    const spiedPlayer = gameDataCopy.players[spiedPlayerId];
    const spiedCard = spiedPlayer.hand[spiedCardIndex];

    // Add current user to the knownBy array if not already there
    if (!spiedCard.knownBy.includes(currentUser.uid)) {
      spiedCard.knownBy.push(currentUser.uid);
    }
    
    const handKey = `players.${spiedPlayerId}.hand`;
    const updates = { [handKey]: spiedPlayer.hand };
    
    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, updates);

    setSpiedCardResult(spiedCard);
    setShowSpyResultModal(true);
  };

  const handleCloseSpyResultModal = async () => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard) return;

    const nextPlayerIndex = (gameData.playOrder.indexOf(currentUser.uid) + 1) % gameData.playOrder.length;
    const nextPlayerId = gameData.playOrder[nextPlayerIndex];

    const updates = {
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
      currentPlayerId: nextPlayerId,
    };
    
    const gameRef = doc(db, 'games', gameDocId);
    await updateDoc(gameRef, updates);

    setShowSpyResultModal(false);
    setSpiedCardResult(null);
    setIsSpying(false);
    setDrawnCard(null);
  };


  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!gameData || !currentUser) return <div className="text-center p-8">Loading Game...</div>;

  const me = gameData.players[currentUser.uid];
  
  return (
    <GameTable
      gameData={gameData}
      currentUser={currentUser}
      me={me}
      showInitialPeek={showInitialPeek}
      onInitialPeekDone={handleInitialPeekDone}
      onDrawCard={handleDrawCard}
      drawnCard={drawnCard}
      showDrawCardModal={showDrawCardModal}
      onDiscard={handleDiscard}
      onUseAction={handleUseAction}
      isSwapping={isSwapping}
      onTakeFromDiscard={handleTakeFromDiscard}
      onSwapCardSelect={handleSwapCardSelect}
      onSwapStart={() => {
        if (drawnCard) {
          setCardToSwap(drawnCard);
          setIsSwapping(true);
          setShowDrawCardModal(false);
        }
      }}
      isPeeking={isPeeking}
      onPeekCardSelect={handlePeekCardSelect}
      showPeekResultModal={showPeekResultModal}
      peekedCardResult={peekedCardResult}
      onClosePeekResultModal={handleClosePeekResultModal}
      isSpying={isSpying}
      onSpyCardSelect={handleSpyCardSelect}
      showSpyResultModal={showSpyResultModal}
      spiedCardResult={spiedCardResult}
      onCloseSpyResultModal={handleCloseSpyResultModal}
    />
  );
};
