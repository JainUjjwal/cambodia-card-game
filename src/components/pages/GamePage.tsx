import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { GameTable } from '../game/GameTable';
import { type CardData } from '../../utils/deck';
import { getNextPlayerId, calculateRoundScores } from '../../utils/gameLogic';

export const GamePage = () => {
  const { gameId: shortId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
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
  const [peekedCardIndex, setPeekedCardIndex] = useState<number | null>(null);
  const [showPeekResultModal, setShowPeekResultModal] = useState(false);

  // State for spying on a card
  const [isSpying, setIsSpying] = useState(false);
  const [spiedCardResult, setSpiedCardResult] = useState<{ card: CardData; playerName: string } | null>(null);
  const [spiedCardPlayerId, setSpiedCardPlayerId] = useState<string | null>(null);
  const [spiedCardIndex, setSpiedCardIndex] = useState<number | null>(null);
  const [showSpyResultModal, setShowSpyResultModal] = useState(false);

  // State for Blind Swap action (Jack/Queen)
  const [isBlindSwapping, setIsBlindSwapping] = useState(false);
  const [blindSwapOwnIndex, setBlindSwapOwnIndex] = useState<number | null>(null);

  // State for Spy and Swap action (Black King)
  const [isSpySwapping, setIsSpySwapping] = useState(false);
  const [spySwapStep, setSpySwapStep] = useState<'opponent' | 'own' | 'decision' | 'idle'>('opponent');
  const [spySwapOpponentInfo, setSpySwapOpponentId] = useState<{ playerId: string; cardIndex: number } | null>(null);
  const [spySwapOwnIndex, setSpySwapOwnIndex] = useState<number | null>(null);
  const [spySwapResult, setSpySwapResult] = useState<{ opponentCard: CardData; ownCard: CardData; opponentName: string } | null>(null);

  // State for scoreboard visibility
  const [showScoreboard, setShowScoreboard] = useState(false);


  useEffect(() => {
    if (!shortId || !currentUser) return;

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

        if (game.status === 'round-ended' || game.status === 'finished') {
          navigate(`/end?gameId=${shortId}`);
          return;
        }

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
  }, [gameDocId, currentUser, navigate, shortId]);

  const handleInitialPeekDone = async () => {
    if (gameDocId && currentUser) {
      const peekKey = `players.${currentUser.uid}.hasPeekedInitial`;
      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, { [peekKey]: true });
      setShowInitialPeek(false);
    }
  };

  const advanceTurn = async (extraUpdates: { [key: string]: any }) => {
    if (!gameData || !gameDocId || !currentUser) return;

    const nextPlayerId = getNextPlayerId(currentUser.uid, gameData.playOrder);
    
    // Check for Round End
    if (gameData.cambodiaCalledBy === nextPlayerId) {
      const roundScores = calculateRoundScores(gameData.players, gameData.cambodiaCalledBy);
      const updates: { [key: string]: any } = { ...extraUpdates };
      
      let isGameOver = false;
      // Update totals and round history
      Object.keys(roundScores).forEach(pid => {
        const newScore = (gameData.players[pid].score || 0) + roundScores[pid];
        updates[`players.${pid}.score`] = newScore;
        if (newScore >= 100) isGameOver = true;
      });
      
      const newRoundData = {
        scores: roundScores,
        callerId: gameData.cambodiaCalledBy,
        hands: Object.keys(gameData.players).reduce((acc: any, pid) => {
          acc[pid] = gameData.players[pid].hand;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
      
      updates.roundHistory = [...(gameData.roundHistory || []), newRoundData];
      updates.status = isGameOver ? 'finished' : 'round-ended';
      updates.currentPlayerId = null;

      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, updates);
    } else {
      // Normal turn advancement
      const updates = {
        ...extraUpdates,
        currentPlayerId: nextPlayerId,
        lastTurnStartTime: serverTimestamp(),
      };
      const gameRef = doc(db, 'games', gameDocId);
      await updateDoc(gameRef, updates);
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

    await advanceTurn({
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
    });

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
    
    const updatedCardToSwap = {
      ...cardToSwap,
      knownBy: Array.from(new Set([...cardToSwap.knownBy, currentUser.uid]))
    };
    myHand[cardIndex] = updatedCardToSwap;
  
    let newDiscardPile = [replacedCard, ...gameData.discardPile];
    let newDeck = gameData.deck;

    if (gameData.discardPile.length > 0 && cardToSwap === gameData.discardPile[0]) {
      newDiscardPile = [replacedCard, ...gameData.discardPile.slice(1)];
    } else if (drawnCard && cardToSwap === drawnCard) {
      newDeck = gameData.deck.slice(1);
    }
    
    await advanceTurn({
      [`players.${currentUser.uid}.hand`]: myHand,
      discardPile: newDiscardPile,
      deck: newDeck,
    });
  
    setIsSwapping(false);
    setCardToSwap(null);
    handleCloseDrawModal();
  };

  const handleUseAction = () => {
    if (!drawnCard) return;

    const value = drawnCard.value;
    if (['7', '8'].includes(value)) {
        setIsPeeking(true);
    } else if (['9', '10'].includes(value)) {
        setIsSpying(true);
    } else if (['J', 'Q'].includes(value)) {
        setIsBlindSwapping(true);
    } else if (value === 'K' && (drawnCard.suit === '♠' || drawnCard.suit === '♣')) {
        setIsSpySwapping(true);
        setSpySwapStep('opponent');
    }

    setShowDrawCardModal(false);
  };

  const handlePeekCardSelect = (cardIndex: number) => {
    if (!gameData || !currentUser) return;
    
    const me = gameData.players[currentUser.uid];
    const peekedCard = me.hand[cardIndex];

    setPeekedCardResult(peekedCard);
    setPeekedCardIndex(cardIndex);
    setShowPeekResultModal(true);
  };
  
  const handleClosePeekResultModal = async () => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard || peekedCardIndex === null) return;

    const me = gameData.players[currentUser.uid];
    const updatedHand = [...me.hand];
    const peekedCard = { ...updatedHand[peekedCardIndex] };

    if (!peekedCard.knownBy.includes(currentUser.uid)) {
      peekedCard.knownBy.push(currentUser.uid);
    }
    updatedHand[peekedCardIndex] = peekedCard;

    await advanceTurn({
      [`players.${currentUser.uid}.hand`]: updatedHand,
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
    });

    setShowPeekResultModal(false);
    setPeekedCardResult(null);
    setPeekedCardIndex(null);
    setIsPeeking(false);
    setDrawnCard(null);
  };

  const handleSpyCardSelect = (spiedPlayerId: string, spiedCardIndex: number) => {
    if (!gameData || !currentUser) return;

    const spiedPlayer = gameData.players[spiedPlayerId];
    const spiedCard = spiedPlayer.hand[spiedCardIndex];

    setSpiedCardResult({ card: spiedCard, playerName: spiedPlayer.name });
    setSpiedCardPlayerId(spiedPlayerId);
    setSpiedCardIndex(spiedCardIndex);
    setShowSpyResultModal(true);
  };

  const handleCloseSpyResultModal = async () => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard || spiedCardPlayerId === null || spiedCardIndex === null) return;

    const spiedPlayer = { ...gameData.players[spiedCardPlayerId] };
    const updatedHand = [...spiedPlayer.hand];
    const spiedCard = { ...updatedHand[spiedCardIndex] };

    if (!spiedCard.knownBy.includes(currentUser.uid)) {
      spiedCard.knownBy.push(currentUser.uid);
    }
    updatedHand[spiedCardIndex] = spiedCard;
    
    await advanceTurn({
      [`players.${spiedCardPlayerId}.hand`]: updatedHand,
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
    });

    setShowSpyResultModal(false);
    setSpiedCardResult(null);
    setSpiedCardPlayerId(null);
    setSpiedCardIndex(null);
    setIsSpying(false);
    setDrawnCard(null);
  };

  const handleBlindSwapCardSelect = async (playerId: string, cardIndex: number) => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard) return;

    if (playerId === currentUser.uid) {
      setBlindSwapOwnIndex(cardIndex);
    } else {
      if (blindSwapOwnIndex === null) return;

      const myId = currentUser.uid;
      const oppId = playerId;

      const myHand = [...gameData.players[myId].hand];
      const oppHand = [...gameData.players[oppId].hand];

      const myCard = myHand[blindSwapOwnIndex];
      const oppCard = oppHand[cardIndex];

      myHand[blindSwapOwnIndex] = oppCard;
      oppHand[cardIndex] = myCard;

      await advanceTurn({
        [`players.${myId}.hand`]: myHand,
        [`players.${oppId}.hand`]: oppHand,
        deck: gameData.deck.slice(1),
        discardPile: [drawnCard, ...gameData.discardPile],
      });

      setIsBlindSwapping(false);
      setBlindSwapOwnIndex(null);
      setDrawnCard(null);
    }
  };

  const handleSpySwapCardSelect = (playerId: string, cardIndex: number) => {
    if (!gameData || !currentUser) return;

    if (spySwapStep === 'opponent') {
      setSpySwapOpponentId({ playerId, cardIndex });
      setSpySwapStep('own');
    } else if (spySwapStep === 'own') {
      if (!spySwapOpponentInfo) return;

      const oppPlayer = gameData.players[spySwapOpponentInfo.playerId];
      const oppCard = oppPlayer.hand[spySwapOpponentInfo.cardIndex];
      const me = gameData.players[currentUser.uid];
      const myCard = me.hand[cardIndex];

      setSpySwapOwnIndex(cardIndex);
      setSpySwapResult({
        opponentCard: oppCard,
        ownCard: myCard,
        opponentName: oppPlayer.name,
      });
      setSpySwapStep('decision');
    }
  };

  const handleSpySwapComplete = async (shouldSwap: boolean) => {
    if (!gameData || !gameDocId || !currentUser || !drawnCard || !spySwapOpponentInfo || spySwapOwnIndex === null) return;

    const myId = currentUser.uid;
    const oppId = spySwapOpponentInfo.playerId;

    const handUpdates: { [key: string]: any } = {};

    if (shouldSwap) {
      const myHand = [...gameData.players[myId].hand];
      const oppHand = [...gameData.players[oppId].hand];

      const myCard = { ...myHand[spySwapOwnIndex] };
      const oppCard = { ...oppHand[spySwapOpponentInfo.cardIndex] };

      if (!myCard.knownBy.includes(myId)) myCard.knownBy.push(myId);
      if (!oppCard.knownBy.includes(myId)) oppCard.knownBy.push(myId);

      myHand[spySwapOwnIndex] = oppCard;
      oppHand[spySwapOpponentInfo.cardIndex] = myCard;

      handUpdates[`players.${myId}.hand`] = myHand;
      handUpdates[`players.${oppId}.hand`] = oppHand;
    } else {
      const myHand = [...gameData.players[myId].hand];
      const oppHand = [...gameData.players[oppId].hand];
      
      const myCard = { ...myHand[spySwapOwnIndex] };
      const oppCard = { ...oppHand[spySwapOpponentInfo.cardIndex] };

      if (!myCard.knownBy.includes(myId)) myCard.knownBy.push(myId);
      if (!oppCard.knownBy.includes(myId)) oppCard.knownBy.push(myId);

      myHand[spySwapOwnIndex] = myCard;
      oppHand[spySwapOpponentInfo.cardIndex] = oppCard;

      handUpdates[`players.${myId}.hand`] = myHand;
      handUpdates[`players.${oppId}.hand`] = oppHand;
    }

    await advanceTurn({
      ...handUpdates,
      deck: gameData.deck.slice(1),
      discardPile: [drawnCard, ...gameData.discardPile],
    });

    setIsSpySwapping(false);
    setSpySwapStep('idle');
    setSpySwapOpponentId(null);
    setSpySwapOwnIndex(null);
    setSpySwapResult(null);
    setDrawnCard(null);
  };

  const handleSnapCardSelect = async (cardIndex: number) => {
    if (!gameData || !gameDocId || !currentUser || drawnCard) return;

    const myId = currentUser.uid;
    const me = gameData.players[myId];
    const myHand = [...me.hand];
    const snappedCard = myHand[cardIndex];
    const topOfDiscard = gameData.discardPile[0];

    if (snappedCard.value === topOfDiscard.value) {
      myHand.splice(cardIndex, 1);
      const newDiscardPile = [snappedCard, ...gameData.discardPile];

      await advanceTurn({
        [`players.${myId}.hand`]: myHand,
        discardPile: newDiscardPile,
      });
    } else {
      console.log("Invalid Snap attempt");
    }
  };

  const handleCallCambodia = async () => {
    if (!gameData || !gameDocId || !currentUser || drawnCard || gameData.cambodiaCalledBy) return;

    await advanceTurn({
      cambodiaCalledBy: currentUser.uid,
    });
  };

  const handleTimerExpire = async () => {
    if (!gameData || !gameDocId || !currentUser || gameData.currentPlayerId !== currentUser.uid) return;

    // Auto-skip: Draw and Discard immediately
    const currentDeck = gameData.deck;
    if (currentDeck.length > 0) {
      const card = currentDeck[0];
      await advanceTurn({
        deck: gameData.deck.slice(1),
        discardPile: [card, ...gameData.discardPile],
      });
      handleCloseDrawModal();
    } else {
      // Deck empty, just advance turn
      await advanceTurn({});
    }
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
      isBlindSwapping={isBlindSwapping}
      blindSwapOwnIndex={blindSwapOwnIndex}
      onBlindSwapCardSelect={handleBlindSwapCardSelect}
      isSpySwapping={isSpySwapping}
      spySwapStep={spySwapStep}
      onSpySwapCardSelect={handleSpySwapCardSelect}
      spySwapResult={spySwapResult}
      onSpySwapComplete={handleSpySwapComplete}
      onSnapCardSelect={handleSnapCardSelect}
      onCallCambodia={handleCallCambodia}
      showScoreboard={showScoreboard}
      onToggleScoreboard={() => setShowScoreboard(!showScoreboard)}
      onTimerExpire={handleTimerExpire}
    />
  );
};
