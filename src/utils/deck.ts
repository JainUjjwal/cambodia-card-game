export interface CardData {
  value: string;
  suit: '♠' | '♥' | '♦' | '♣' | 'Joker';
  points: number;
}

export const createDeck = (): CardData[] => {
  const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck: CardData[] = [];

  for (const suit of suits) {
    for (const value of values) {
      let points = 0;
      if (value === 'A') points = 1;
      else if (value === 'K') {
        points = (suit === '♥' || suit === '♦') ? 0 : 13;
      }
      else if (value === 'Q') points = 12;
      else if (value === 'J') points = 11;
      else points = parseInt(value);
      
      deck.push({ value, suit, points });
    }
  }

  // Add two Jokers
  deck.push({ value: 'Joker', suit: 'Joker', points: -1 });
  deck.push({ value: 'Joker', suit: 'Joker', points: -1 });

  return deck;
};

export const shuffleDeck = (deck: CardData[]): CardData[] => {
  let shuffledDeck = [...deck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }
  return shuffledDeck;
};
