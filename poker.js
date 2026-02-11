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

// Range parser
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

function rangeToHands(rangeNotations, deck) {
  const possibleHands = [];
  
  for (const notation of rangeNotations) {
    const suited = notation.endsWith('s');
    const offsuit = notation.endsWith('o');
    const pair = notation.length === 2 && notation[0] === notation[1];
    
    if (pair) {
      const rank = notation[0];
      const cards = deck.filter(c => c.rank === rank);
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          possibleHands.push([cards[i], cards[j]]);
        }
      }
    } else {
      const rank1 = notation[0];
      const rank2 = notation[1];
      const cards1 = deck.filter(c => c.rank === rank1);
      const cards2 = deck.filter(c => c.rank === rank2);
      
      for (const c1 of cards1) {
        for (const c2 of cards2) {
          if (suited && c1.suit === c2.suit) {
            possibleHands.push([c1, c2]);
          } else if (offsuit && c1.suit !== c2.suit) {
            possibleHands.push([c1, c2]);
          } else if (!suited && !offsuit) {
            possibleHands.push([c1, c2]);
          }
        }
      }
    }
  }
  
  return possibleHands;
}

// Hand evaluator
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
    if (!isStraight && uniqueValues.includes(12) && uniqueValues.includes(0) && 
        uniqueValues.includes(1) && uniqueValues.includes(2) && uniqueValues.includes(3)) {
      isStraight = true;
      straightHigh = 3;
    }
  }
  
  if (isStraight && isFlush) {
    if (values[0] === 12 && values.includes(8)) return { rank: 9, name: 'Royal Flush', strength: 900 };
    return { rank: 8, name: 'Straight Flush', strength: 800 + straightHigh };
  }
  if (counts[0] === 4) {
    const quadRank = Object.entries(rankCounts).find(([r, c]) => c === 4)[0];
    return { rank: 7, name: 'Four of a Kind', strength: 700 + RANK_VALUES[quadRank] };
  }
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: 'Full House', strength: 600 };
  if (isFlush) return { rank: 5, name: 'Flush', strength: 500 + values[0] };
  if (isStraight) return { rank: 4, name: 'Straight', strength: 400 + straightHigh };
  if (counts[0] === 3) {
    const tripRank = Object.entries(rankCounts).find(([r, c]) => c === 3)[0];
    return { rank: 3, name: 'Three of a Kind', strength: 300 + RANK_VALUES[tripRank] };
  }
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, name: 'Two Pair', strength: 200 };
  if (counts[0] === 2) {
    const pairRank = Object.entries(rankCounts).find(([r, c]) => c === 2)[0];
    return { rank: 1, name: 'Pair', strength: 100 + RANK_VALUES[pairRank] };
  }
  return { rank: 0, name: 'High Card', strength: values[0] };
}

// Drawing hands analysis
function analyzeDraws(heroCards, boardCards) {
  const allCards = [...heroCards, ...boardCards];
  const suits = allCards.map(c => c.suit);
  const values = allCards.map(c => c.value).sort((a, b) => b - a);
  
  const suitCounts = {};
  for (const suit of suits) {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  }
  
  const draws = {
    flushDraw: false,
    straightDraw: false,
    flushOuts: 0,
    straightOuts: 0,
    totalOuts: 0
  };
  
  const maxSuitCount = Math.max(...Object.values(suitCounts));
  if (maxSuitCount === 4) {
    draws.flushDraw = true;
    draws.flushOuts = 9;
  }
  
  const uniqueValues = [...new Set(values)];
  let hasOpenEnded = false;
  let hasGutshot = false;
  
  for (let i = 0; i < uniqueValues.length - 1; i++) {
    const gap = uniqueValues[i] - uniqueValues[i + 1];
    if (gap === 1) {
      hasOpenEnded = true;
    } else if (gap === 2 && i < uniqueValues.length - 2) {
      hasGutshot = true;
    }
  }
  
  if (hasOpenEnded && uniqueValues.length >= 4) {
    draws.straightDraw = true;
    draws.straightOuts = 8;
  } else if (hasGutshot) {
    draws.straightDraw = true;
    draws.straightOuts = 4;
  }
  
  draws.totalOuts = draws.flushOuts + draws.straightOuts;
  
  return draws;
}

function calculateOutsEquity(outs, street) {
  if (street === 'flop') {
    return Math.min(outs * 4, 100);
  } else if (street === 'turn') {
    return Math.min(outs * 2, 100);
  }
  return 0;
}

// Pot odds & EV calculator
function calculatePotOdds(potSize, betSize) {
  const totalPot = potSize + betSize;
  const oddsRatio = betSize / totalPot;
  const oddsPercent = oddsRatio * 100;
  const potOddsRatio = `${betSize}:${totalPot}`;
  
  return {
    oddsPercent,
    oddsRatio: potOddsRatio,
    breakEvenEquity: oddsPercent
  };
}

function calculateEV(equity, potSize, betSize, callAmount) {
  const winEV = (equity / 100) * (potSize + callAmount);
  const loseEV = ((100 - equity) / 100) * callAmount;
  const totalEV = winEV - loseEV;
  
  return {
    totalEV: totalEV.toFixed(2),
    winEV: winEV.toFixed(2),
    loseEV: loseEV.toFixed(2),
    profitable: totalEV > 0
  };
}

// Board texture analysis
function analyzeBoardTexture(boardCards) {
  if (!boardCards || boardCards.length < 3) {
    return { texture: 'No board', description: 'Pre-flop' };
  }
  
  const suits = boardCards.map(c => c.suit);
  const values = boardCards.map(c => c.value).sort((a, b) => b - a);
  
  const suitCounts = {};
  for (const suit of suits) {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  }
  
  const analysis = {
    paired: false,
    trips: false,
    monotone: false,
    twoTone: false,
    rainbow: false,
    connected: false,
    texture: '',
    favoredRange: '',
    description: ''
  };
  
  const valueCounts = {};
  for (const val of values) {
    valueCounts[val] = (valueCounts[val] || 0) + 1;
  }
  const maxValueCount = Math.max(...Object.values(valueCounts));
  
  if (maxValueCount === 3) {
    analysis.trips = true;
    analysis.texture = 'Trips';
    analysis.favoredRange = 'Defender';
    analysis.description = 'Paired board favors calling ranges';
  } else if (maxValueCount === 2) {
    analysis.paired = true;
    analysis.texture = 'Paired';
    analysis.favoredRange = 'Defender';
    analysis.description = 'Paired board reduces bluffing';
  }
  
  const maxSuitCount = Math.max(...Object.values(suitCounts));
  if (maxSuitCount === 3) {
    analysis.monotone = true;
    analysis.texture += analysis.texture ? ', Monotone' : 'Monotone';
    analysis.favoredRange = 'Aggressor';
    analysis.description += ' Flush draw possible';
  } else if (maxSuitCount === 2) {
    analysis.twoTone = true;
    analysis.texture += analysis.texture ? ', Two-Tone' : 'Two-Tone';
  } else {
    analysis.rainbow = true;
    analysis.texture += analysis.texture ? ', Rainbow' : 'Rainbow';
  }
  
  if (boardCards.length >= 3) {
    const gaps = [];
    for (let i = 0; i < values.length - 1; i++) {
      gaps.push(values[i] - values[i + 1]);
    }
    
    if (gaps.every(g => g <= 2)) {
      analysis.connected = true;
      analysis.texture += ', Connected';
      analysis.favoredRange = 'Aggressor';
      analysis.description += ' Connected board favors aggressor';
    } else if (gaps.every(g => g >= 4)) {
      analysis.texture += ', Dry';
      analysis.favoredRange = 'Defender';
      analysis.description += ' Dry board favors defender';
    }
  }
  
  if (!analysis.texture) {
    analysis.texture = 'Standard';
    analysis.description = 'Balanced board texture';
  }
  
  return analysis;
}

// Monte Carlo simulation
function runMonteCarloSimulation(heroHand, villainRange, boardCards, iterations = 10000) {
  const heroCards = parseHand(heroHand);
  if (!heroCards || heroCards.length !== 2) {
    return { equity: 0, error: 'Invalid hero hand (need exactly 2 cards like AhKh)' };
  }
  
  const board = boardCards ? parseHand(boardCards) : null;
  
  const rangeNotations = parseRange(villainRange);
  const baseDeck = createDeck();
  const availableDeck = removeCards(baseDeck, heroCards, board);
  
  const villainHands = rangeToHands(rangeNotations, availableDeck);
  if (villainHands.length === 0) {
    return { equity: 0, error: 'No valid villain hands in range' };
  }
  
  let heroWins = 0;
  let villainWins = 0;
  let ties = 0;
  const handTypeWins = {};
  const handTypeLosses = {};
  
  for (let i = 0; i < iterations; i++) {
    const villainHand = villainHands[Math.floor(Math.random() * villainHands.length)];
    const simDeck = removeCards(availableDeck, villainHand);
    const shuffled = shuffle(simDeck);
    
    const boardSize = board ? board.length : 0;
    const simBoard = board ? [...board] : [];
    
    for (let j = boardSize; j < 5; j++) {
      simBoard.push(shuffled[j - boardSize]);
    }
    
    const heroEval = evaluateHand([...heroCards, ...simBoard]);
    const villainEval = evaluateHand([...villainHand, ...simBoard]);
    
    if (heroEval.rank > villainEval.rank || 
        (heroEval.rank === villainEval.rank && heroEval.strength > villainEval.strength)) {
      heroWins++;
      handTypeWins[heroEval.name] = (handTypeWins[heroEval.name] || 0) + 1;
    } else if (heroEval.rank < villainEval.rank || 
               (heroEval.rank === villainEval.rank && heroEval.strength < villainEval.strength)) {
      villainWins++;
      handTypeLosses[heroEval.name] = (handTypeLosses[heroEval.name] || 0) + 1;
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
    totalSims: iterations,
    handTypeWins,
    handTypeLosses,
    winRate: (heroWins / iterations * 100).toFixed(1),
    tieRate: (ties / iterations * 100).toFixed(1)
  };
}

// GTO Ranges
const gtoRanges = {
  RFI: {
    UTG: ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","ATs","KQs","AKo","AQo"],
    MP: ["AA","KK","QQ","JJ","TT","99","88","77","AKs","AQs","AJs","ATs","A5s","A4s","KQs","KJs","QJs","JTs","AKo","AQo","AJo","KQo"],
    CO: ["AA","KK","QQ","JJ","TT","99","88","77","66","55","AKs","AQs","AJs","ATs","A9s","A8s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","QJs","QTs","JTs","T9s","98s","87s","76s","AKo","AQo","AJo","ATo","KQo","KJo","QJo"],
    BTN: ["AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22","AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","K8s","K7s","K6s","QJs","QTs","Q9s","Q8s","JTs","J9s","J8s","T9s","T8s","98s","97s","87s","86s","76s","75s","65s","54s","AKo","AQo","AJo","ATo","A9o","A8o","A7o","A6o","A5o","KQo","KJo","KTo","K9o","QJo","QTo","JTo"],
    SB: ["AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22","AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","K8s","K7s","K6s","K5s","QJs","QTs","Q9s","Q8s","JTs","J9s","J8s","T9s","T8s","T7s","98s","97s","87s","86s","76s","75s","65s","64s","54s","AKo","AQo","AJo","ATo","A9o","A8o","A7o","A6o","A5o","A4o","KQo","KJo","KTo","K9o","QJo","QTo","JTo"],
    BB: []
  },
  
  THREEBET: {
    "UTG_vs_MP": ["AA","KK","QQ","JJ","AKs","AQs","AKo"],
    "UTG_vs_CO": ["AA","KK","QQ","JJ","TT","AKs","AQs","AJs","AKo","AQo"],
    "UTG_vs_BTN": ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","A5s","AKo","AQo","AJo"],
    "UTG_vs_SB": ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","A5s","A4s","AKo","AQo"],
    "MP_vs_CO": ["AA","KK","QQ","JJ","TT","AKs","AQs","AJs","AKo","AQo"],
    "MP_vs_BTN": ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","A5s","A4s","KQs","AKo","AQo","AJo"],
    "MP_vs_SB": ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","A5s","A4s","AKo","AQo","AJo"],
    "CO_vs_BTN": ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","A5s","A4s","A3s","KQs","AKo","AQo","AJo"],
    "CO_vs_SB": ["AA","KK","QQ","JJ","TT","99","88","77","AKs","AQs","AJs","ATs","A9s","A5s","A4s","A3s","A2s","KQs","KJs","AKo","AQo","AJo","ATo"],
    "BTN_vs_SB": ["AA","KK","QQ","JJ","TT","99","88","77","66","AKs","AQs","AJs","ATs","A9s","A8s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","QJs","AKo","AQo","AJo","ATo","A9o"],
    "BTN_vs_BB": ["AA","KK","QQ","JJ","TT","99","88","77","AKs","AQs","AJs","ATs","A9s","A5s","A4s","A3s","KQs","KJs","QJs","AKo","AQo","AJo","ATo"],
    "SB_vs_BB": ["AA","KK","QQ","JJ","TT","99","88","77","66","55","44","AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","QJs","QTs","JTs","AKo","AQo","AJo","ATo","A9o","KQo","KJo"],
  },
  
  FOURBET: {
    "UTG_vs_3bet": ["AA","KK","QQ","AKs","AKo"],
    "MP_vs_3bet": ["AA","KK","QQ","JJ","AKs","AKo"],
    "CO_vs_3bet": ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo"],
    "BTN_vs_3bet": ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","A5s","AKo","AQo"],
    "SB_vs_3bet": ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo"],
  },
  
  CALL: {
    "BB_vs_BTN": ["99","88","77","66","55","44","33","22","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","K8s","K7s","K6s","K5s","K4s","K3s","K2s","QJs","QTs","Q9s","Q8s","Q7s","Q6s","JTs","J9s","J8s","J7s","T9s","T8s","T7s","98s","97s","96s","87s","86s","85s","76s","75s","74s","65s","64s","54s","53s","AJo","ATo","A9o","A8o","A7o","A6o","A5o","A4o","A3o","A2o","KQo","KJo","KTo","K9o","QJo","QTo","Q9o","JTo","J9o"],
    "BB_vs_SB": ["TT","99","88","77","66","55","44","33","22","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KJs","KTs","K9s","K8s","K7s","K6s","K5s","K4s","K3s","K2s","QJs","QTs","Q9s","Q8s","Q7s","Q6s","Q5s","JTs","J9s","J8s","J7s","J6s","T9s","T8s","T7s","T6s","98s","97s","96s","87s","86s","85s","76s","75s","65s","64s","54s","53s","43s","AJo","ATo","A9o","A8o","A7o","A6o","A5o","A4o","A3o","KJo","KTo","K9o","K8o","QJo","QTo","Q9o","JTo","J9o"],
    "BB_vs_CO": ["99","88","77","66","55","44","33","22","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","QJs","QTs","JTs","T9s","98s","87s","76s","AJo","ATo","A9o","KQo","KJo","QJo"],
    "BB_vs_MP": ["88","77","66","55","44","33","22","AJs","ATs","A9s","A8s","A5s","A4s","KQs","KJs","QJs","JTs","AJo","ATo","KQo"],
  }
};

// Pre-flop analysis
function analyzePreflop(position, handStr, action = 'RFI', vsPosition = null) {
  const hand = parseHand(handStr);
  if (!hand || hand.length !== 2) {
    return { error: 'Invalid hand format (use AhKh or 7c7d)' };
  }
  
  const notation = handToNotation(hand);
  let result = {
    position,
    hand: handStr,
    notation,
    action: null,
    range: null,
    inRange: false,
    rangePercent: 0
  };
  
  if (action === 'RFI') {
    const range = gtoRanges.RFI[position];
    if (!range) return { error: 'Invalid position' };
    
    result.range = range;
    result.inRange = range.includes(notation);
    result.rangePercent = ((range.length / 169) * 100).toFixed(1);
    result.action = result.inRange ? 'RAISE (Open)' : 'FOLD';
    
  } else if (action === 'THREEBET' && vsPosition) {
    const rangeKey = `${position}_vs_${vsPosition}`;
    const range = gtoRanges.THREEBET[rangeKey];
    if (!range) return { error: 'Invalid position combination' };
    
    result.range = range;
    result.inRange = range.includes(notation);
    result.rangePercent = ((range.length / 169) * 100).toFixed(1);
    result.action = result.inRange ? '3-BET' : 'FOLD or CALL';
    
  } else if (action === 'FOURBET') {
    const rangeKey = `${position}_vs_3bet`;
    const range = gtoRanges.FOURBET[rangeKey];
    if (!range) return { error: 'Invalid position' };
    
    result.range = range;
    result.inRange = range.includes(notation);
    result.rangePercent = ((range.length / 169) * 100).toFixed(1);
    result.action = result.inRange ? '4-BET' : 'FOLD or CALL';
    
  } else if (action === 'CALL' && vsPosition) {
    const rangeKey = `${position}_vs_${vsPosition}`;
    const range = gtoRanges.CALL[rangeKey];
    if (!range) return { error: 'Invalid position combination' };
    
    result.range = range;
    result.inRange = range.includes(notation);
    result.rangePercent = ((range.length / 169) * 100).toFixed(1);
    result.action = result.inRange ? 'CALL' : 'FOLD';
  }
  
  return result;
}

// Session tracking
let hands = [];
let sessionStats = {
  totalHands: 0,
  handsWon: 0,
  avgEquity: 0,
  bestHand: null,
  worstHand: null
};

// UI Functions
function showPreflop() {
  const pos = document.getElementById("heroPosition").value;
  const hand = document.getElementById("heroHand").value;
  const actionType = document.getElementById("actionType").value;
  const vsPos = document.getElementById("vsPosition").value;
  
  const result = analyzePreflop(pos, hand, actionType, vsPos || null);
  
  if (result.error) {
    document.getElementById("preflopResult").innerHTML = `<span style="color: red;">Error: ${result.error}</span>`;
    return;
  }
  
  const color = result.action.includes('FOLD') ? '#d9534f' : '#5cb85c';
  document.getElementById("preflopResult").innerHTML = `
    <div style="padding: 15px; background: #f0f0f0; border-radius: 5px; margin-top: 10px;">
      <div style="font-size: 1.3rem; color: ${color}; margin-bottom: 8px;">
        <strong>${result.action}</strong>
      </div>
      <div style="font-size: 1rem; line-height: 1.6;">
        Hand: <strong>${result.notation}</strong> | In Range: <strong>${result.inRange ? '✓' : '✗'}</strong><br>
        Range Size: ${result.range.length} hands (${result.rangePercent}%)
      </div>
    </div>
  `;
}

function runMonteCarlo() {
  const hero = document.getElementById("mcHeroHand").value;
  const villain = document.getElementById("villainRange").value;
  const board = document.getElementById("board").value;
  
  if (!hero) {
    document.getElementById("mcResult").innerHTML = '<span style="color: red;">Please enter hero hand</span>';
    return;
  }
  
  document.getElementById("mcResult").innerHTML = '<div style="color: #666;">Running 10,000 simulations...</div>';
  
  setTimeout(() => {
    const result = runMonteCarloSimulation(hero, villain, board, 10000);
    
    if (result.error) {
      document.getElementById("mcResult").innerHTML = `<span style="color: red;">Error: ${result.error}</span>`;
      return;
    }
    
    const color = result.equity >= 50 ? '#5cb85c' : result.equity >= 35 ? '#f0ad4e' : '#d9534f';
    
    const topWins = Object.entries(result.handTypeWins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name}: ${count}`)
      .join(', ');
    
    document.getElementById("mcResult").innerHTML = `
      <div style="padding: 15px; background: #f0f0f0; border-radius: 5px; margin-top: 10px;">
        <div style="font-size: 1.5rem; color: ${color}; margin-bottom: 10px;">
          <strong>Equity: ${result.equity.toFixed(1)}%</strong>
        </div>
        <div style="font-size: 1rem; line-height: 1.8;">
          Wins: ${result.heroWins} | Losses: ${result.villainWins} | Ties: ${result.ties}<br>
          Win Rate: ${result.winRate}% | Simulations: ${result.totalSims.toLocaleString()}<br>
          Top Hands: ${topWins || 'N/A'}
        </div>
      </div>
    `;
  }, 100);
}

function calculatePotOddsEV() {
  const potSize = parseFloat(document.getElementById("potSize").value) || 0;
  const betSize = parseFloat(document.getElementById("betSize").value) || 0;
  const equity = parseFloat(document.getElementById("equityForEV").value) || 0;
  
  const potOdds = calculatePotOdds(potSize, betSize);
  const ev = calculateEV(equity, potSize, betSize, betSize);
  
  const shouldCall = equity >= potOdds.breakEvenEquity;
  const color = shouldCall ? '#5cb85c' : '#d9534f';
  const decision = shouldCall ? 'CALL' : 'FOLD';
  
  document.getElementById("potOddsResult").innerHTML = `
    <div style="padding: 15px; background: #f0f0f0; border-radius: 5px; margin-top: 10px;">
      <div style="font-size: 1.3rem; color: ${color}; margin-bottom: 10px;">
        <strong>Decision: ${decision}</strong>
      </div>
      <div style="font-size: 1rem; line-height: 1.8;">
        Pot Odds: ${potOdds.oddsPercent.toFixed(1)}% | Break-even: ${potOdds.breakEvenEquity.toFixed(1)}%<br>
        Your Equity: ${equity}% | EV: $${ev.totalEV} ${ev.profitable ? '(+EV)' : '(-EV)'}
      </div>
    </div>
  `;
}

function analyzeBoardButton() {
  const board = document.getElementById("boardTexture").value;
  const boardCards = parseHand(board);
  
  if (!boardCards || boardCards.length < 3) {
    document.getElementById("boardResult").innerHTML = '<span style="color: red;">Enter at least 3 cards</span>';
    return;
  }
  
  const texture = analyzeBoardTexture(boardCards);
  
  document.getElementById("boardResult").innerHTML = `
    <div style="padding: 15px; background: #f0f0f0; border-radius: 5px; margin-top: 10px;">
      <div style="font-size: 1.2rem; margin-bottom: 10px;">
        <strong>${texture.texture}</strong>
      </div>
      <div style="font-size: 1rem; line-height: 1.8;">
        Favors: ${texture.favoredRange}<br>
        ${texture.description}
      </div>
    </div>
  `;
}

function analyzeDrawsButton() {
  const hero = document.getElementById("drawHero").value;
  const board = document.getElementById("drawBoard").value;
  const street = document.getElementById("street").value;
  
  const heroCards = parseHand(hero);
  const boardCards = parseHand(board);
  
  if (!heroCards || heroCards.length !== 2) {
    document.getElementById("drawResult").innerHTML = '<span style="color: red;">Invalid hero hand</span>';
    return;
  }
  
  if (!boardCards || boardCards.length < 3) {
    document.getElementById("drawResult").innerHTML = '<span style="color: red;">Need at least flop</span>';
    return;
  }
  
  const draws = analyzeDraws(heroCards, boardCards);
  const outsEquity = calculateOutsEquity(draws.totalOuts, street);
  
  document.getElementById("drawResult").innerHTML = `
    <div style="padding: 15px; background: #f0f0f0; border-radius: 5px; margin-top: 10px;">
      <div style="font-size: 1.2rem; margin-bottom: 10px;">
        <strong>Total Outs: ${draws.totalOuts}</strong>
      </div>
      <div style="font-size: 1rem; line-height: 1.8;">
        ${draws.flushDraw ? `Flush Draw: ${draws.flushOuts} outs<br>` : ''}
        ${draws.straightDraw ? `Straight Draw: ${draws.straightOuts} outs<br>` : ''}
        Estimated Equity: ~${outsEquity.toFixed(1)}%
      </div>
    </div>
  `;
}

function addHand() {
  const hero = document.getElementById("trackHero").value;
  const villain = document.getElementById("trackVillain").value;
  const board = document.getElementById("trackBoard").value;
  
  const result = runMonteCarloSimulation(hero, "AA,KK,QQ,JJ,TT,99,88,77,66,55,44,33,22,AKs,AKo", board, 5000);
  
  if (result.error) {
    alert('Error: ' + result.error);
    return;
  }
  
  hands.push({
    hero,
    villain,
    board,
    equity: result.equity,
    won: result.equity > 50
  });
  
  sessionStats.totalHands++;
  if (result.equity > 50) sessionStats.handsWon++;
  sessionStats.avgEquity = ((sessionStats.avgEquity * (sessionStats.totalHands - 1)) + result.equity) / sessionStats.totalHands;
  
  if (!sessionStats.bestHand || result.equity > sessionStats.bestHand.equity) {
    sessionStats.bestHand = { hero, equity: result.equity };
  }
  if (!sessionStats.worstHand || result.equity < sessionStats.worstHand.equity) {
    sessionStats.worstHand = { hero, equity: result.equity };
  }
  
  renderHandTable();
  updateSessionStats();
  
  document.getElementById("trackHero").value = '';
  document.getElementById("trackVillain").value = '';
  document.getElementById("trackBoard").value = '';
}

function renderHandTable() {
  const tbody = document.getElementById("handTable").querySelector("tbody");
  tbody.innerHTML = "";
  
  hands.forEach((hand, index) => {
    const tr = document.createElement("tr");
    const equityColor = hand.equity >= 50 ? '#5cb85c' : hand.equity >= 35 ? '#f0ad4e' : '#d9534f';
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${hand.hero}</td>
      <td>${hand.villain}</td>
      <td>${hand.board || 'Preflop'}</td>
      <td style="color: ${equityColor}; font-weight: bold;">${hand.equity.toFixed(1)}%</td>
      <td>${hand.won ? '✓' : '✗'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateSessionStats() {
  const winRate = sessionStats.totalHands > 0 ? 
    ((sessionStats.handsWon / sessionStats.totalHands) * 100).toFixed(1) : 0;
  
  document.getElementById("sessionStats").innerHTML = `
    <div style="padding: 15px; background: #f9f9f9; border-radius: 5px;">
      <h3 style="margin-top: 0;">Session Stats</h3>
      <div style="font-size: 1rem; line-height: 1.8;">
        Total Hands: ${sessionStats.totalHands}<br>
        Hands Won: ${sessionStats.handsWon} (${winRate}%)<br>
        Avg Equity: ${sessionStats.avgEquity.toFixed(1)}%<br>
        ${sessionStats.bestHand ? `Best: ${sessionStats.bestHand.hero} (${sessionStats.bestHand.equity.toFixed(1)}%)` : ''}<br>
        ${sessionStats.worstHand ? `Worst: ${sessionStats.worstHand.hero} (${sessionStats.worstHand.equity.toFixed(1)}%)` : ''}
      </div>
    </div>
  `;
}
