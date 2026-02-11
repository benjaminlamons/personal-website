// ===== POKER SOLVER - COMPLETE IMPLEMENTATION =====

// Card utilities
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['h','d','c','s'];
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

function parseCard(cardStr) {
  if (cardStr.length !== 2) return null;
  const rank = cardStr[0].toUpperCase();
  const suit = cardStr[1].toLowerCase();
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return { rank, suit, value: RANKS.indexOf(rank) };
}

function parseHand(handStr) {
  handStr = handStr.replace(/\s/g, '').toUpperCase();
  if (handStr.length < 4) return null;

  const cards = [];
  for (let i = 0; i < handStr.length; i += 2) {
    if (i + 1 >= handStr.length) break;
    const card = parseCard(handStr.substring(i, i + 2));
    if (!card) return null;
    cards.push(card);
  }
  return cards;
}

function handToNotation(hand) {
  const [c1, c2] = hand;
  const suited = c1.suit === c2.suit;
  const rank1 = c1.rank;
  const rank2 = c2.rank;

  const [high, low] = c1.value >= c2.value ? [rank1, rank2] : [rank2, rank1];

  if (high === low) return high + low;
  return suited ? high + low + 's' : high + low + 'o';
}

function createDeck() {
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit, value: RANKS.indexOf(rank) });
    }
  }
  return deck;
}

function removeCards(deck, ...cardSets) {
  const used = new Set();
  for (const cards of cardSets) {
    if (cards) {
      for (const card of cards) {
        used.add(card.rank + card.suit);
      }
    }
  }
  return deck.filter(c => !used.has(c.rank + c.suit));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- RANGE PARSER ----------

function parseRange(rangeStr) {
  const hands = [];
  const parts = rangeStr.toUpperCase().replace(/\s/g, '').split(',');

  for (const part of parts) {
    if (part.includes('+')) {
      hands.push(...expandRange(part));
    } else if (part.includes('-')) {
      hands.push(...expandRangeSpan(part));
    } else {
      hands.push(part);
    }
  }

  return [...new Set(hands)];
}

function expandRange(notation) {
  const hands = [];

  if (notation.match(/^\d\d\+$/)) {
    const startPair = notation[0];
    const startIdx = RANKS.indexOf(startPair);
    for (let i = startIdx; i < RANKS.length; i++) {
      hands.push(RANKS[i] + RANKS[i]);
    }
  } else if (notation.match(/^[AKQJT]\ds\+$/)) {
    const highCard = notation[0];
    const lowCard = notation[1];
    const lowIdx = RANKS.indexOf(lowCard);
    const highIdx = RANKS.indexOf(highCard);
    for (let i = lowIdx; i < highIdx; i++) {
      hands.push(highCard + RANKS[i] + 's');
    }
  } else if (notation.match(/^[AKQJT]\do\+$/)) {
    const highCard = notation[0];
    const lowCard = notation[1];
    const lowIdx = RANKS.indexOf(lowCard);
    const highIdx = RANKS.indexOf(highCard);
    for (let i = lowIdx; i < highIdx; i++) {
      hands.push(highCard + RANKS[i] + 'o');
    }
  }

  return hands;
}

function expandRangeSpan(notation) {
  const hands = [];
  const [start, end] = notation.split('-');

  if (start.length === 2 && end.length === 2) {
    const startIdx = RANKS.indexOf(start[0]);
    const endIdx = RANKS.indexOf(end[0]);
    for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
      hands.push(RANKS[i] + RANKS[i]);
    }
  }

  return hands;
}

// ---------- HAND EVALUATOR ----------

function evaluateHand(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);
  const values = sorted.map(c => c.value);

  const rankCounts = {};
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isFlush = suits.length >= 5 && suits.slice(0,5).every(s => s === suits[0]);

  let isStraight = false;
  let straightHigh = 0;

  if (values.length >= 5) {
    const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true;
        straightHigh = uniqueValues[i];
        break;
      }
    }
  }

  if (isStraight && isFlush) return { rank: 8, strength: 800 + straightHigh };
  if (counts[0] === 4) return { rank: 7, strength: 700 };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, strength: 600 };
  if (isFlush) return { rank: 5, strength: 500 };
  if (isStraight) return { rank: 4, strength: 400 };
  if (counts[0] === 3) return { rank: 3, strength: 300 };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, strength: 200 };
  if (counts[0] === 2) return { rank: 1, strength: 100 };
  return { rank: 0, strength: values[0] };
}

// ---------- MONTE CARLO ----------

function runMonteCarloSimulation(heroHand, villainRange, boardCards, iterations = 10000) {
  const heroCards = parseHand(heroHand);
  if (!heroCards || heroCards.length !== 2) {
    return { equity: 0, error: 'Invalid hero hand' };
  }

  const board = boardCards ? parseHand(boardCards) : null;

  const rangeNotations = parseRange(villainRange);
  const baseDeck = createDeck();
  const availableDeck = removeCards(baseDeck, heroCards, board);

  let heroWins = 0;
  let villainWins = 0;
  let ties = 0;

  for (let i = 0; i < iterations; i++) {
    const simDeck = shuffle(availableDeck);
    const villainHand = [simDeck[0], simDeck[1]];

    const simBoard = board ? [...board] : [];
    let index = 2;
    while (simBoard.length < 5) {
      simBoard.push(simDeck[index++]);
    }

    const heroEval = evaluateHand([...heroCards, ...simBoard]);
    const villainEval = evaluateHand([...villainHand, ...simBoard]);

    if (heroEval.rank > villainEval.rank ||
      (heroEval.rank === villainEval.rank && heroEval.strength > villainEval.strength)) {
      heroWins++;
    } else if (heroEval.rank < villainEval.rank ||
      (heroEval.rank === villainEval.rank && heroEval.strength < villainEval.strength)) {
      villainWins++;
    } else {
      ties++;
    }
  }

  const equity = ((heroWins + ties * 0.5) / iterations) * 100;

  return {
    equity,
    heroWins,
    villainWins,
    ties,
    totalSims: iterations
  };
}
