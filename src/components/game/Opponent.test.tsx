import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Opponent from './Opponent';
import { CardData } from '../../utils/deck';

describe('Opponent Component', () => {
  const mockPlayer = {
    id: 'opponent-1',
    name: 'Player 2',
    hand: [
      { value: 'A', suit: '♠', points: 1, knownBy: [] },
      { value: 'K', suit: '♥', points: 0, knownBy: [] },
    ] as CardData[],
  };

  it('should render the player name', () => {
    render(
      <Opponent 
        player={mockPlayer} 
        position="top-center" 
        isCurrentPlayer={false} 
        onCardSelect={vi.fn()} 
        isSpying={false} 
      />
    );
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('should render the correct number of cards', () => {
    const { container } = render(
      <Opponent 
        player={mockPlayer} 
        position="top-center" 
        isCurrentPlayer={false} 
        onCardSelect={vi.fn()} 
        isSpying={false} 
      />
    );
    // Each card is rendered inside a button in Opponent
    const cardButtons = container.querySelectorAll('button');
    expect(cardButtons).toHaveLength(2);
  });

  it("should highlight the name when it is the opponent's turn", () => {
    render(
      <Opponent 
        player={mockPlayer} 
        position="top-center" 
        isCurrentPlayer={true} 
        onCardSelect={vi.fn()} 
        isSpying={false} 
      />
    );
    const nameTag = screen.getByText('Player 2');
    expect(nameTag).toHaveClass('bg-yellow-400');
    expect(nameTag).toHaveClass('text-slate-900');
  });

  it('should disable card buttons when not spying', () => {
    const { container } = render(
      <Opponent 
        player={mockPlayer} 
        position="top-center" 
        isCurrentPlayer={false} 
        onCardSelect={vi.fn()} 
        isSpying={false} 
      />
    );
    const cardButtons = container.querySelectorAll('button');
    cardButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should enable card buttons and trigger onCardSelect when spying', () => {
    const onCardSelect = vi.fn();
    const { container } = render(
      <Opponent 
        player={mockPlayer} 
        position="top-center" 
        isCurrentPlayer={false} 
        onCardSelect={onCardSelect} 
        isSpying={true} 
      />
    );
    
    const cardButtons = container.querySelectorAll('button');
    expect(cardButtons[0]).not.toBeDisabled();
    
    fireEvent.click(cardButtons[0]);
    expect(onCardSelect).toHaveBeenCalledWith('opponent-1', 0);
  });

  it('should show known cards with an eye icon', () => {
    const knownPlayer = {
      ...mockPlayer,
      hand: [
        { value: 'A', suit: '♠', points: 1, knownBy: ['me'] },
        { value: 'K', suit: '♥', points: 0, knownBy: [] },
      ] as CardData[],
    };

    const { container } = render(
      <Opponent 
        player={knownPlayer} 
        position="top-center" 
        isCurrentPlayer={false} 
        currentUserId="me"
        onCardSelect={vi.fn()} 
        isSpying={false} 
      />
    );

    const svgs = container.querySelectorAll('svg');
    // Card index 0 is known by "me", so it should have the Eye icon
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveClass('lucide-eye');
  });
});
