// ===== Pre-Flop Ranges =====
const openingRanges = {
  UTG: ["AA","KK","QQ","JJ","AKs","AQs","AKo"],
  MP: ["AA","KK","QQ","JJ","TT","AKs","AQs","AJs","KQs","AKo","AQo"],
  CO: ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","KQs","AKo","AQo","KQo"],
  BTN: ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","KQs","KJs","QJs","AKo","AQo","KQo"],
  SB: ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo","AQo"],
  BB: ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo","AQo"]
};

function showPreflop() {
  const pos = document.getElementById("heroPosition").value;
  const hand = document.getElementById("heroHand").value.toUpperCase();
  const range = openingRanges[pos];
  let suggestion = range.includes(hand) ? "Open/Raise" : "Fold or Call depending on table";
  document.getElementById("preflopResult").innerText = `GTO Suggestion: ${suggestion}`;
}

// ===== Monte Carlo Equity =====
function runMonteCarlo() {
  const hero = document.getElementById("mcHeroHand").value.toUpperCase();
  const villain = document.getElementById("villainRange").value.toUpperCase();
  const board = document.getElementById("board").value.toUpperCase();

  const equity = monteCarlo(hero, villain, board, 5000); // 5k iterations
  document.getElementById("mcResult").innerText = `Estimated Hero Equity: ${equity.toFixed(1)}%`;
}

function monteCarlo(hero, villainRange, board, iterations=1000) {
  // Placeholder: real Monte Carlo simulation would randomly deal remaining cards
  // For now: simple approximate equity based on hand strength
  // This is a GTO-lite simulation, NOT exact solver
  let equity = 0;
  const handStrength = {"AA":85,"KK":82,"QQ":80,"AKs":65,"AQs":63,"AKo":62,"AJ":60,"KQ":58,"others":50};
  equity = handStrength[hero] || 50;
  return equity;
}

// ===== Hand Tracker =====
let hands = [];

function addHand() {
  const hero = document.getElementById("trackHero").value.toUpperCase();
  const villain = document.getElementById("trackVillain").value.toUpperCase();
  const board = document.getElementById("trackBoard").value.toUpperCase();

  const equity = monteCarlo(hero, villain, board, 5000);
  hands.push({hero, villain, board, equity});
  renderHandTable();
}

function renderHandTable() {
  const tbody = document.getElementById("handTable").querySelector("tbody");
  tbody.innerHTML = "";
  hands.forEach((hand, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${index+1}</td>
                    <td>${hand.hero}</td>
                    <td>${hand.villain}</td>
                    <td>${hand.board}</td>
                    <td>${hand.equity.toFixed(1)}</td>`;
    tbody.appendChild(tr);
  });
}
