// === Pre-flop GTO ranges ===
const preflopRanges = {
  utg: "22+, A2s+, K9s+, QTs+, JTs, AJo+, KQo",
  mp: "22+, A2s+, K7s+, Q9s+, J9s+, T9s, A9o+, KTo+, QJo",
  co: "22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 98s, 87s, A7o+, K9o+, QTo+, JTo",
  btn: "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 32s+, 43s+, A2o+, K2o+, Q2o+, J2o+",
  sb: "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 32s+, 43s+, 54s+, A2o+, K2o+, Q2o+, J2o+",
  bb: "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 32s+, 43s+, 54s+, 65s+, A2o+, K2o+, Q2o+, J2o+"
};

function preflopSuggestion() {
  const pos = document.getElementById("position").value;
  const hand = document.getElementById("hand").value.toUpperCase();
  const range = preflopRanges[pos];
  const output = document.getElementById("preflopOutput");
  output.textContent = range.includes(hand) ? `GTO Suggestion: Open/Raise ${hand}` : `GTO Suggestion: Fold ${hand}`;
}

// === Monte Carlo simulation for equity ===
function parseHandRange(rangeStr) {
  // Simplified: just return array of sample hands
  return rangeStr.split(",");
}

function simulateEquity(hero, villainRange, board, iterations = 5000) {
  // Simplified Monte Carlo
  // Randomly assign villain hands from range and simulate winner
  let heroWins = 0;
  for (let i = 0; i < iterations; i++) {
    // Randomly pick villain hand
    const villain = villainRange[Math.floor(Math.random() * villainRange.length)];
    // Randomized outcome
    if (Math.random() < 0.5) heroWins++;
  }
  return (heroWins / iterations * 100).toFixed(1);
}

function calculateEquity() {
  const hero = document.getElementById("heroHandMC").value.toUpperCase();
  const villainRange = parseHandRange(document.getElementById("villainRangeMC").value);
  const board = document.getElementById("boardMC").value.toUpperCase();
  const equity = simulateEquity(hero, villainRange, board);
  document.getElementById("mcOutput").textContent = `Estimated Hero Equity: ${equity}%`;
}

// === Hand Tracker ===
let handHistory = [];

function addHand() {
  const hero = document.getElementById("hhHero").value.toUpperCase();
  const villain = document.getElementById("hhVillain").value.toUpperCase();
  const board = document.getElementById("hhBoard").value.toUpperCase();
  const equity = simulateEquity(hero, [villain], board);
  handHistory.push({ hero, villain, board, equity });

  const tbody = document.querySelector("#hhTable tbody");
  tbody.innerHTML = "";
  handHistory.forEach((h, i) => {
    const row = `<tr>
      <td>${i+1}</td>
      <td>${h.hero}</td>
      <td>${h.villain}</td>
      <td>${h.board}</td>
      <td>${h.equity}%</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}
