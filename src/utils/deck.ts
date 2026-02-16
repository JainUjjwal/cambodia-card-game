export type CardData = {
  value: string;
  suit: '♠' | '♥' | '♦' | '♣' | 'Joker';
  points: number; // Re-added the points property
  knownBy: string[];
};

const SUITS: ('♠' | '♥' | '♦' | '♣' )[] = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Helper function to get the correct point value for a card
const getPoints = (value: string, suit: '♠' | '♥' | '♦' | '♣'): number => {
  switch (value) {
    case 'A': return 1;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K':
      // Red Kings are 0 points, Black Kings are 13
      return (suit === '♥' || suit === '♦') ? 0 : 13;
    default:
      return parseInt(value, 10);
  }
};

export const PRESET_DECK: CardData[] = [
  // P1 Starting Hand (Indices 0-3)
  { value: '10', suit: '♠', points: 10, knownBy: [] },
  { value: 'J', suit: '♣', points: 11, knownBy: [] },
  { value: 'Q', suit: '♥', points: 12, knownBy: [] },
  { value: '9', suit: '♦', points: 9, knownBy: [] },
  // P2 Starting Hand (Indices 4-7)
  { value: '10', suit: '♣', points: 10, knownBy: [] },
  { value: 'J', suit: '♠', points: 11, knownBy: [] },
  { value: 'Q', suit: '♦', points: 12, knownBy: [] },
  { value: '9', suit: '♠', points: 9, knownBy: [] },
  // P3 Starting Hand (Indices 8-11)
  { value: 'Joker', suit: 'Joker', points: -1, knownBy: [] },
  { value: '10', suit: '♦', points: 10, knownBy: [] }, // For snapping
  { value: '8', suit: '♠', points: 8, knownBy: [] },
  { value: '7', suit: '♣', points: 7, knownBy: [] },
  
  // Discard Start (Index 12)
  { value: '2', suit: '♠', points: 2, knownBy: [] },

  // Draw Pile (Index 13 onwards)
  { value: '7', suit: '♠', points: 7, knownBy: [] }, // P1 Draw (Peek)
  { value: '9', suit: '♥', points: 9, knownBy: [] }, // P2 Draw (Spy)
  { value: 'J', suit: '♦', points: 11, knownBy: [] }, // P3 Draw (Blind Swap)
  { value: 'K', suit: '♣', points: 13, knownBy: [] }, // P1 Draw (Black King)
  { value: '5', suit: '♣', points: 5, knownBy: [] }, // P2 Draw (No Action -> Discard 10)
  { value: '2', suit: '♥', points: 2, knownBy: [] }, // P1 Draw
  { value: '8', suit: '♣', points: 8, knownBy: [] }, // P2 Draw
  { value: 'K', suit: '♥', points: 0, knownBy: [] }, // P3 Draw (Red King)
  { value: 'Joker', suit: 'Joker', points: -1, knownBy: [] }, 
  { value: '3', suit: '♦', points: 3, knownBy: [] },
  { value: '4', suit: '♣', points: 4, knownBy: [] },
  { value: '6', suit: '♥', points: 6, knownBy: [] },
  { value: '5', suit: '♠', points: 5, knownBy: [] },
];

export const createDeck = (): CardData[] => {
  // Check for deterministic deck flag (for testing)
  if (typeof window !== 'undefined' && (window as any).__DETERMINISTIC_DECK__) {
    return [...PRESET_DECK];
  }

  const deck: CardData[] = SUITS.flatMap((suit) =>
    VALUES.map((value) => ({
      value,
      suit,
      points: getPoints(value, suit),
      knownBy: [],
    }))
  );

  // Add two Jokers with -1 points
  deck.push({ value: 'Joker', suit: 'Joker', points: -1, knownBy: [] });
  deck.push({ value: 'Joker', suit: 'Joker', points: -1, knownBy: [] });

  return deck;
};

export const shuffleDeck = (deck: CardData[]): CardData[] => {
  // Check for deterministic deck flag (for testing)
  if (typeof window !== 'undefined' && (window as any).__DETERMINISTIC_DECK__) {
    return deck; // Skip shuffle
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
