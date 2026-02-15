import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from './Card';

describe('Card Component', () => {
  it('should render the back of the card by default (face-down)', () => {
    const { container } = render(<Card value="A" suit="♠" />);
    
    // The back of the card uses a specific gradient class
    const backElement = container.querySelector('.bg-gradient-to-br');
    expect(backElement).toBeInTheDocument();
    
    // Value and suit should not be visible
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('♠')).not.toBeInTheDocument();
  });

  it('should show the eye icon when face-down but known', () => {
    const { container } = render(<Card value="A" suit="♠" isKnown={true} />);
    
    // Lucide icons render as SVGs with specific classes or data attributes
    // In this case, we're looking for the Eye icon
    const eyeIcon = container.querySelector('svg');
    expect(eyeIcon).toBeInTheDocument();
    expect(eyeIcon).toHaveClass('lucide-eye');
  });

  it('should not show the eye icon when face-down and unknown', () => {
    const { container } = render(<Card value="A" suit="♠" isKnown={false} />);
    const eyeIcon = container.querySelector('svg');
    expect(eyeIcon).not.toBeInTheDocument();
  });

  it('should render value and suit correctly when face-up', () => {
    render(<Card value="10" suit="♦" isFaceUp={true} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('♦')).toBeInTheDocument();
  });

  it('should use red color for Hearts and Diamonds', () => {
    const { rerender } = render(<Card value="A" suit="♥" isFaceUp={true} />);
    expect(screen.getByText('A')).toHaveClass('text-red-500');
    expect(screen.getByText('♥')).toHaveClass('text-red-500');

    rerender(<Card value="A" suit="♦" isFaceUp={true} />);
    expect(screen.getByText('A')).toHaveClass('text-red-500');
    expect(screen.getByText('♦')).toHaveClass('text-red-500');
  });

  it('should use dark color for Spades and Clubs', () => {
    const { rerender } = render(<Card value="A" suit="♠" isFaceUp={true} />);
    expect(screen.getByText('A')).toHaveClass('text-slate-800');
    expect(screen.getByText('♠')).toHaveClass('text-slate-800');

    rerender(<Card value="A" suit="♣" isFaceUp={true} />);
    expect(screen.getByText('A')).toHaveClass('text-slate-800');
    expect(screen.getByText('♣')).toHaveClass('text-slate-800');
  });

  it('should render Joker correctly when face-up', () => {
    render(<Card value="Joker" suit="Joker" isFaceUp={true} />);
    
    // Joker rendering uses the emoji
    expect(screen.getByText('🃏')).toBeInTheDocument();
    
    // Standard value/suit text should not be present
    expect(screen.queryByText('Joker')).not.toBeInTheDocument();
  });
});
