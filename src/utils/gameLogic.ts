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
