/**
 * Calculates the ID of the next player in the turn order.
 * 
 * @param currentId The UID of the player who just finished their turn.
 * @param playOrder An array of player UIDs in their turn order.
 * @returns The UID of the next player.
 */
export const getNextPlayerId = (currentId: string, playOrder: string[]): string => {
  if (playOrder.length === 0) return '';
  const currentIndex = playOrder.indexOf(currentId);
  if (currentIndex === -1) return playOrder[0];
  const nextIndex = (currentIndex + 1) % playOrder.length;
  return playOrder[nextIndex];
};

/**
 * Calculates the scores for a finished round.
 * 
 * @param players Map of player data from Firestore
 * @param callerId UID of the player who called Cambodia
 * @returns Map of UIDs to the points earned this round
 */
export const calculateRoundScores = (players: { [key: string]: any }, callerId: string): { [key: string]: number } => {
  const playerIds = Object.keys(players);
  const roundScores: { [key: string]: number } = {};
  const handTotals: { [key: string]: number } = {};

  // 1. Calculate raw hand totals
  playerIds.forEach(id => {
    handTotals[id] = players[id].hand.reduce((sum: number, card: any) => sum + (card.points || 0), 0);
  });

  // 2. Determine who had the lowest hand
  const minHandValue = Math.min(...Object.values(handTotals));
  const isCallerSuccessful = handTotals[callerId] === minHandValue;

  // 3. Apply Cambodia rules
  playerIds.forEach(id => {
    if (id === callerId) {
      // Caller gets 0 if they won, otherwise hand + 10 penalty
      roundScores[id] = isCallerSuccessful ? 0 : handTotals[id] + 10;
    } else {
      // Everyone else just gets their hand value
      roundScores[id] = handTotals[id];
    }
  });

  return roundScores;
};
