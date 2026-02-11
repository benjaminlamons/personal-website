// Core Data
let hands = [];
let currentHand = null;

// DOM elements
const preflopInput = document.getElementById("preflop");
const flopInput = document.getElementById("flop");
const turnInput = document.getElementById("turn");
const riverInput = document.getElementById("river");
const addHandBtn = document.getElementById("add-hand");

const playerInput = document.getElementById("player");
const actionInput = document.getElementById("action");
const sizeInput = document.getElementById("size");
const addActionBtn = document.getElementById("add-action");

const historyTableBody = document.querySelector("#history-table tbody");
const statsOutput = document.getElementById("stats-output");
const strategyOutput = document.getElementById("strategy-output");

// Add hand
addHandBtn.addEventListener("click", () => {
  const hand = {
    preflop: preflopInput.value.toUpperCase(),
    flop: flopInput.value.toUpperCase(),
    turn: turnInput.value.toUpperCase(),
    river: riverInput.value.toUpperCase(),
    actions: []
  };
  hands.push(hand);
  currentHand = hand;
  updateTable();
  updateStats();
  updateStrategy();
  // Clear inputs
  preflopInput.value = flopInput.value = turnInput.value = riverInput.value = "";
});

// Add action
addActionBtn.addEventListener("click", () => {
  if (!currentHand) return alert("Add a hand first!");
  const action = {
    player: playerInput.value || "Hero",
    type: actionInput.value,
    size: parseFloat(sizeInput.value) || 0
  };
  currentHand.actions.push(action);
  updateTable();
  updateStats();
  updateStrategy();
  playerInput.value = sizeInput.value = "";
});

// Update table
function updateTable() {
  historyTableBody.innerHTML = "";
  hands.forEach((hand, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${hand.preflop}</td>
      <td>${hand.flop}</td>
      <td>${hand.turn}</td>
      <td>${hand.river}</td>
      <td>${hand.actions.map(a => `${a.player}:${a.type}(${a.size})`).join(", ")}</td>
    `;
    historyTableBody.appendChild(tr);
  });
}

// Update stats (placeholder for advanced analysis)
function updateStats() {
  if (hands.length === 0) {
    statsOutput.innerText = "No hands added yet.";
    return;
  }
  // Example: count hands added
  statsOutput.innerText = `Total hands tracked: ${hands.length}`;
}

// Update strategy (placeholder for GTO/EV logic)
function updateStrategy() {
  if (!currentHand) {
    strategyOutput.innerText = "No hands added yet.";
    return;
  }
  strategyOutput.innerText = "Strategy advice: TBD - advanced logic coming next.";
}
