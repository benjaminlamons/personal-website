// Helper functions
function parseCard(card) {
  const rank = card[0].toUpperCase();
  const suit = card[1].toLowerCase();
  return {rank,suit};
}

function generateDeck(exclude=[]) {
  const suits = ['h','d','c','s'];
  const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
  let deck = [];
  for (let r of ranks) {
    for (let s of suits) {
      const c = r+s;
      if (!exclude.includes(c)) deck.push(c);
    }
  }
  return deck;
}

function randomChoice(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

// Very simple evaluator (placeholder for full evaluator)
function handStrength(hero, villain, board, iterations=5000) {
  // Use Monte Carlo simulation
  let wins = 0, ties=0;
  const used = [...hero,...villain,...board];
  const deck = generateDeck(used);
  for (let i=0;i<iterations;i++){
    let remaining = [...deck];
    let fullBoard = [...board];
    while (fullBoard.length<5){
      const c = randomChoice(remaining);
      fullBoard.push(c);
      remaining.splice(remaining.indexOf(c),1);
    }
    const heroScore = Math.random(); // placeholder for real hand evaluation
    const villainScore = Math.random();
    if (heroScore>villainScore) wins++;
    else if(heroScore==villainScore) ties++;
  }
  const equity = (wins + ties/2)/iterations*100;
  return equity.toFixed(2);
}

// Range advice (placeholder, simple rules)
function gtoAction(heroAction, equity) {
  if(equity>70) return "Aggressive Bet/Raise";
  if(equity>50) return "Standard Bet/Call";
  if(equity>30) return "Cautious Call/Fold";
  return "Fold";
}

// Main function
function analyzeHand() {
  const hero = [document.getElementById("hero1").value, document.getElementById("hero2").value];
  const villain = [document.getElementById("villain1").value, document.getElementById("villain2").value];
  const board = [
    document.getElementById("flop1").value,
    document.getElementById("flop2").value,
    document.getElementById("flop3").value,
    document.getElementById("turn").value,
    document.getElementById("river").value
  ].filter(c => c !== "");

  const heroAction = document.getElementById("hero-action").value;
  const villainAction = document.getElementById("villain-action").value;

  // Equity simulation
  const equity = handStrength(hero,villain,board,2000); // Monte Carlo iterations

  // Recommended GTO action
  const recommendedAction = gtoAction(heroAction, equity);

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `
    Hero Equity: ${equity}%<br>
    Recommended Hero Action: ${recommendedAction}<br>
    Your action: ${heroAction}, Villain action: ${villainAction}<br>
    <strong>Next Steps:</strong> Enter new actions or change board to simulate all possibilities.<br>
    <em>Future upgrades: full hand-by-hand EV, multi-street analysis, villain ranges visualization.</em>
  `;
}
