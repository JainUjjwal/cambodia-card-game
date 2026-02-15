import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DrawCardModal from './DrawCardModal';
import InitialPeekModal from './InitialPeekModal';
import PeekResultModal from './PeekResultModal';
import SpyResultModal from './SpyResultModal';
import { CardData } from '../../utils/deck';

describe('Modals', () => {
  describe('DrawCardModal', () => {
    const mockCard: CardData = { value: '7', suit: '♠', points: 7, knownBy: [] };
    const mockNoActionCard: CardData = { value: '2', suit: '♥', points: 2, knownBy: [] };

    it('should call onSwap when Swap Card button is clicked', () => {
      const onSwap = vi.fn();
      render(<DrawCardModal card={mockCard} onDiscard={vi.fn()} onSwap={onSwap} onUseAction={vi.fn()} />);
      
      fireEvent.click(screen.getByText('Swap Card'));
      expect(onSwap).toHaveBeenCalled();
    });

    it('should call onDiscard when Discard button is clicked', () => {
      const onDiscard = vi.fn();
      render(<DrawCardModal card={mockCard} onDiscard={onDiscard} onSwap={vi.fn()} onUseAction={vi.fn()} />);
      
      fireEvent.click(screen.getByText('Discard'));
      expect(onDiscard).toHaveBeenCalled();
    });

    it('should enable Use Action button for action cards (e.g., 7)', () => {
      const onUseAction = vi.fn();
      render(<DrawCardModal card={mockCard} onDiscard={vi.fn()} onSwap={vi.fn()} onUseAction={onUseAction} />);
      
      const actionButton = screen.getByText('Use Action');
      expect(actionButton).not.toBeDisabled();
      fireEvent.click(actionButton);
      expect(onUseAction).toHaveBeenCalled();
    });

    it('should disable Use Action button for non-action cards (e.g., 2)', () => {
      render(<DrawCardModal card={mockNoActionCard} onDiscard={vi.fn()} onSwap={vi.fn()} onUseAction={vi.fn()} />);
      
      const actionButton = screen.getByText('Use Action');
      expect(actionButton).toBeDisabled();
    });
  });

  describe('InitialPeekModal', () => {
    const mockHand: CardData[] = [
      { value: 'A', suit: '♠', points: 1, knownBy: [] },
      { value: '2', suit: '♥', points: 2, knownBy: [] },
      { value: '3', suit: '♦', points: 3, knownBy: [] },
      { value: '4', suit: '♣', points: 4, knownBy: [] },
    ];

    it('should render the bottom two cards (index 2 and 3)', () => {
      render(<InitialPeekModal hand={mockHand} onDone={vi.fn()} />);
      
      // Bottom cards are 3♦ and 4♣
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('♦')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('♣')).toBeInTheDocument();
      
      // Top cards (A♠, 2♥) should not be visible
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should call onDone when Got it! button is clicked', () => {
      const onDone = vi.fn();
      render(<InitialPeekModal hand={mockHand} onDone={onDone} />);
      
      fireEvent.click(screen.getByText('Got it!'));
      expect(onDone).toHaveBeenCalled();
    });

    it('should return null if hand is invalid', () => {
      const { container } = render(<InitialPeekModal hand={[]} onDone={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('PeekResultModal', () => {
    const mockCard: CardData = { value: 'K', suit: '♠', points: 13, knownBy: [] };

    it('should display the card and call onClose when button clicked', () => {
      const onClose = vi.fn();
      render(<PeekResultModal card={mockCard} onClose={onClose} />);
      
      expect(screen.getByText('K')).toBeInTheDocument();
      expect(screen.getByText('♠')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Got it!'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('SpyResultModal', () => {
    const mockCard: CardData = { value: 'Q', suit: '♥', points: 12, knownBy: [] };

    it('should display the card and playerName, and call onClose when button clicked', () => {
      const onClose = vi.fn();
      render(<SpyResultModal card={mockCard} playerName="Opponent 1" onClose={onClose} />);
      
      expect(screen.getByText("You spied on Opponent 1's card.")).toBeInTheDocument();
      expect(screen.getByText('Q')).toBeInTheDocument();
      expect(screen.getByText('♥')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Excellent!'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
