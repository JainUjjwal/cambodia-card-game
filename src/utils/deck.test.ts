import { describe, it, expect } from 'vitest';
import { createDeck, shuffleDeck } from './deck';

describe('deck utility', () => {
  describe('createDeck', () => {
    it('should create a deck with 54 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(54);
    });

    it('should contain 2 Jokers with -1 points', () => {
      const deck = createDeck();
      const jokers = deck.filter(c => c.value === 'Joker');
      expect(jokers).toHaveLength(2);
      jokers.forEach(j => {
        expect(j.points).toBe(-1);
        expect(j.suit).toBe('Joker');
      });
    });

    it('should assign correct points to numbered cards', () => {
      const deck = createDeck();
      const fiveOfHearts = deck.find(c => c.value === '5' && c.suit === '♥');
      expect(fiveOfHearts?.points).toBe(5);
    });

    it('should assign 1 point to Aces', () => {
      const deck = createDeck();
      const aces = deck.filter(c => c.value === 'A');
      aces.forEach(a => expect(a.points).toBe(1));
    });

    it('should assign correct points to face cards', () => {
      const deck = createDeck();
      const jacks = deck.filter(c => c.value === 'J');
      jacks.forEach(j => expect(j.points).toBe(11));
      
      const queens = deck.filter(c => c.value === 'Q');
      queens.forEach(q => expect(q.points).toBe(12));
    });

    it('should assign 0 points to Red Kings and 13 to Black Kings', () => {
      const deck = createDeck();
      const redKings = deck.filter(c => c.value === 'K' && (c.suit === '♥' || c.suit === '♦'));
      const blackKings = deck.filter(c => c.value === 'K' && (c.suit === '♠' || c.suit === '♣'));
      
      expect(redKings).toHaveLength(2);
      redKings.forEach(k => expect(k.points).toBe(0));
      
      expect(blackKings).toHaveLength(2);
      blackKings.forEach(k => expect(k.points).toBe(13));
    });
  });

  describe('shuffleDeck', () => {
    it('should not lose or duplicate cards after shuffling', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck([...deck]);
      expect(shuffled).toHaveLength(54);
      
      // Check if all cards from original deck are present in shuffled deck
      deck.forEach(originalCard => {
        const found = shuffled.some(c => 
          c.value === originalCard.value && 
          c.suit === originalCard.suit && 
          c.points === originalCard.points
        );
        expect(found).toBe(true);
      });
    });

    it('should significantly change the order of cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck([...deck]);
      
      // Note: There is a tiny chance a shuffle results in the same order, 
      // but for 54 cards, it's virtually zero.
      expect(shuffled).not.toEqual(deck);
    });
  });
});
