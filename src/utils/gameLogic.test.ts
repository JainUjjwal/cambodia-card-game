import { describe, it, expect } from 'vitest';
import { getNextPlayerId } from './gameLogic';

describe('gameLogic utility', () => {
  describe('getNextPlayerId', () => {
    const playOrder = ['user1', 'user2', 'user3'];

    it('should return the next player in the order', () => {
      expect(getNextPlayerId('user1', playOrder)).toBe('user2');
      expect(getNextPlayerId('user2', playOrder)).toBe('user3');
    });

    it('should wrap around to the first player after the last player', () => {
      expect(getNextPlayerId('user3', playOrder)).toBe('user1');
    });

    it('should return the first player if currentId is not found', () => {
      expect(getNextPlayerId('unknown', playOrder)).toBe('user1');
    });

    it('should return an empty string if playOrder is empty', () => {
      expect(getNextPlayerId('user1', [])).toBe('');
    });

    it('should work with a single player', () => {
      expect(getNextPlayerId('user1', ['user1'])).toBe('user1');
    });
  });
});
