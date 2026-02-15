import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameTable, GameTableProps } from './GameTable';
import { CardData } from '../../utils/deck';

// Mock the Card component to simplify testing
vi.mock('./Card', () => ({
  default: ({ value, suit, isFaceUp, isKnown }: any) => (
    <div data-testid="card">
      {isFaceUp ? `${value}${suit}` : 'hidden'}
      {isKnown && '(known)'}
    </div>
  )
}));

describe('GameTable Component', () => {
  const mockUser = { uid: 'me' };
  const mockOpponent = {
    id: 'opp-1',
    name: 'Player 2',
    hand: [{ value: 'A', suit: '♠', points: 1, knownBy: [] }]
  };
  
  const defaultGameData = {
    playOrder: ['me', 'opp-1'],
    players: {
      'me': { 
        name: 'Me', 
        hand: [
          { value: '10', suit: '♦', points: 10, knownBy: [] },
          { value: '2', suit: '♠', points: 2, knownBy: [] },
          { value: '3', suit: '♥', points: 3, knownBy: [] },
          { value: '4', suit: '♣', points: 4, knownBy: [] }
        ], 
        isReady: true 
      },
      'opp-1': mockOpponent
    },
    currentPlayerId: 'me',
    discardPile: [{ value: '5', suit: '♣', points: 5, knownBy: [] }],
    deck: []
  };

  const defaultProps: GameTableProps = {
    gameData: defaultGameData as any,
    currentUser: mockUser as any,
    me: defaultGameData.players['me'],
    showInitialPeek: false,
    onInitialPeekDone: vi.fn(),
    onDrawCard: vi.fn(),
    drawnCard: null,
    showDrawCardModal: false,
    onDiscard: vi.fn(),
    onUseAction: vi.fn(),
    isSwapping: false,
    onTakeFromDiscard: vi.fn(),
    onSwapCardSelect: vi.fn(),
    onSwapStart: vi.fn(),
    isPeeking: false,
    onPeekCardSelect: vi.fn(),
    showPeekResultModal: false,
    peekedCardResult: null,
    onClosePeekResultModal: vi.fn(),
    isSpying: false,
    onSpyCardSelect: vi.fn(),
    showSpyResultModal: false,
    spiedCardResult: null,
    onCloseSpyResultModal: vi.fn(),
  };

  it('should display correct instruction when it is my turn', () => {
    render(<GameTable {...defaultProps} />);
    expect(screen.getByText('Your turn. Draw a card or take from the discard pile.')).toBeInTheDocument();
  });

  it('should display correct instruction when it is not my turn', () => {
    const props = {
      ...defaultProps,
      gameData: { ...defaultGameData, currentPlayerId: 'opp-1' }
    };
    render(<GameTable {...props} />);
    expect(screen.getByText("Waiting for Player 2's turn...")).toBeInTheDocument();
  });

  it('should display swapping instruction', () => {
    render(<GameTable {...defaultProps} isSwapping={true} />);
    expect(screen.getByText('Select one of your cards to swap...')).toBeInTheDocument();
  });

  it('should display peeking instruction', () => {
    render(<GameTable {...defaultProps} isPeeking={true} />);
    expect(screen.getByText('Select one of your cards to peek at...')).toBeInTheDocument();
  });

  it('should display spying instruction', () => {
    render(<GameTable {...defaultProps} isSpying={true} />);
    expect(screen.getByText("Select an opponent's card to spy on...")).toBeInTheDocument();
  });

  it('should render opponent names and their cards', () => {
    render(<GameTable {...defaultProps} />);
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    // 1 for center deck back, 1 for discard, 1 for me, 1 for opponent
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('should call onDrawCard when Draw Card button is clicked', () => {
    render(<GameTable {...defaultProps} />);
    const drawButton = screen.getByText('Draw Card');
    fireEvent.click(drawButton);
    expect(defaultProps.onDrawCard).toHaveBeenCalled();
  });

  it('should call onTakeFromDiscard when Take button is clicked', () => {
    render(<GameTable {...defaultProps} />);
    const takeButton = screen.getByText('Take 5♣');
    fireEvent.click(takeButton);
    expect(defaultProps.onTakeFromDiscard).toHaveBeenCalled();
  });

  it('should call onSwapCardSelect when a hand card is clicked while swapping', () => {
    render(<GameTable {...defaultProps} isSwapping={true} />);
    const handCardButtons = screen.getAllByRole('button').filter(b => 
      !b.hasAttribute('disabled') && b.textContent === 'hidden'
    );
    if (handCardButtons.length > 0) {
      fireEvent.click(handCardButtons[0]);
      expect(defaultProps.onSwapCardSelect).toHaveBeenCalledWith(0);
    } else {
      throw new Error('Hand card button not found');
    }
  });

  it('should call onPeekCardSelect when a hand card is clicked while peeking', () => {
    render(<GameTable {...defaultProps} isPeeking={true} />);
    const handCardButtons = screen.getAllByRole('button').filter(b => 
      !b.hasAttribute('disabled') && b.textContent === 'hidden'
    );
    if (handCardButtons.length > 0) {
      fireEvent.click(handCardButtons[0]);
      expect(defaultProps.onPeekCardSelect).toHaveBeenCalledWith(0);
    } else {
      throw new Error('Hand card button not found');
    }
  });

  it('should disable draw/take buttons when not my turn', () => {
    const props = {
      ...defaultProps,
      gameData: { ...defaultGameData, currentPlayerId: 'opp-1' }
    };
    render(<GameTable {...props} />);
    expect(screen.getByText('Draw Card')).toBeDisabled();
    expect(screen.getByText('Take 5♣')).toBeDisabled();
  });

  it('should render multiple opponents', () => {
    const props = {
      ...defaultProps,
      gameData: {
        ...defaultGameData,
        playOrder: ['me', 'opp-1', 'opp-2', 'opp-3'],
        players: {
          ...defaultGameData.players,
          'opp-2': { name: 'Player 3', hand: [] },
          'opp-3': { name: 'Player 4', hand: [] }
        }
      }
    };
    render(<GameTable {...props} />);
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
    expect(screen.getByText('Player 4')).toBeInTheDocument();
  });

  it('should render InitialPeekModal when showInitialPeek is true', () => {
    render(<GameTable {...defaultProps} showInitialPeek={true} />);
    expect(screen.getByText('Your Bottom Cards')).toBeInTheDocument();
  });

  it('should render DrawCardModal when showDrawCardModal is true', () => {
    const card: CardData = { value: '7', suit: '♠', points: 7, knownBy: [] };
    render(<GameTable {...defaultProps} showDrawCardModal={true} drawnCard={card} />);
    expect(screen.getByText('You Drew a Card')).toBeInTheDocument();
  });

  it('should render PeekResultModal when showPeekResultModal is true', () => {
    const card: CardData = { value: '7', suit: '♠', points: 7, knownBy: [] };
    render(<GameTable {...defaultProps} showPeekResultModal={true} peekedCardResult={card} />);
    expect(screen.getByText('You Peeked')).toBeInTheDocument();
  });

  it('should render SpyResultModal when showSpyResultModal is true', () => {
    const card: CardData = { value: '7', suit: '♠', points: 7, knownBy: [] };
    const spiedResult = { card, playerName: 'Opponent 1' };
    render(<GameTable {...defaultProps} showSpyResultModal={true} spiedCardResult={spiedResult} />);
    expect(screen.getByText('Spy Result')).toBeInTheDocument();
  });
});
