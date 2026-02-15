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

export const createDeck = (): CardData[] => {
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
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
