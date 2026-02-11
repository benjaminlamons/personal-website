// ===== SIMPLE POKER SOLVER CORE =====

// Card utilities
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['h','d','c','s'];

function parseCard(cardStr) {
  if (cardStr.length !== 2) return null;
  const rank = cardStr[0].toUpperCase();
  const suit = cardStr[1].toLowerCase();
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return { rank, suit, value: RANKS.indexOf(rank) };
}

function parseHand(handStr) {
  if (!handStr) return null;
  handStr = handStr.replace(/\s/g, '');
  if (handStr.length < 4) return null;

  const cards = [];
  for (let i = 0; i < handStr.length; i += 2) {
    const card = parseCard(handStr.substring(i, i + 2));
    if (!card) return null;
    cards.push(card);
  }
  return cards;
}

// ===== PRE-FLOP SIMPLE LOGIC =====

function showPreflop() {
  const pos = document.getElementById("heroPosition").value;
  const hand = document.getElementById("heroHand").value;
  const cards = parseHand(hand);

  if (!cards || cards.length !== 2) {
    document.getElementById("preflopResult").innerHTML = "Invalid hand format.";
    return;
  }

  const rank1 = cards[0].rank;
  const rank2 = cards[1].rank;

  if (rank1 === rank2) {
    document.getElementById("preflopResult").innerHTML =
      "Pair detected. Strong open from most positions.";
  } else {
    document.getElementById("preflopResult").innerHTML =
      `Hand analyzed from ${pos}.`;
  }
}

// ===== MONTE CARLO (SIMPLIFIED) =====

function runMonteCarlo() {
  const hero = document.getElementById("mcHeroHand").value;

  const heroCards = parseHand(hero);

  if (!heroCards || heroCards.length !== 2) {
    document.getElementById("mcResult").innerHTML = "Invalid hero hand.";
    return;
  }

  // Fake equity for demo
  const equity = (Math.random() * 100).toFixed(1);

  document.getElementById("mcResult").innerHTML =
    `Estimated Equity: ${equity}%`;
}
