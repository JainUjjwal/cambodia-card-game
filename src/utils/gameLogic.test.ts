import { describe, it, expect } from 'vitest';
import { getNextPlayerId, calculateRoundScores } from './gameLogic';

describe('gameLogic utility', () => {
  describe('calculateRoundScores', () => {
    const players = {
      'p1': { hand: [{ points: 5 }, { points: 2 }] }, // Total 7
      'p2': { hand: [{ points: 10 }, { points: 1 }] }, // Total 11
      'p3': { hand: [{ points: 0 }, { points: 5 }] }, // Total 5
    };

    it('should award 0 points to caller if they have the lowest score', () => {
      const scores = calculateRoundScores(players, 'p3');
      expect(scores['p3']).toBe(0);
      expect(scores['p1']).toBe(7);
      expect(scores['p2']).toBe(11);
    });

    it('should award hand + 10 penalty to caller if they do not have the lowest score', () => {
      const scores = calculateRoundScores(players, 'p1');
      expect(scores['p1']).toBe(17); // 7 + 10 penalty
      expect(scores['p2']).toBe(11);
      expect(scores['p3']).toBe(5);
    });

    it('should award 0 points to caller if they are tied for the lowest score', () => {
      const tiedPlayers = {
        'p1': { hand: [{ points: 5 }] },
        'p2': { hand: [{ points: 5 }] },
      };
      const scores = calculateRoundScores(tiedPlayers, 'p1');
      expect(scores['p1']).toBe(0);
      expect(scores['p2']).toBe(5);
    });
  });

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
