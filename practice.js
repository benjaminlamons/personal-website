// practice.js
// 6-max, $1/$2, 100bb (200 chips). Simple bots. No timer.
// Hero is seat 0 (UTG) for now.

const POS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const START_STACK = 200;
const SB = 1;
const BB = 2;

let state = null;
let undoStack = [];

// ---------- Utilities ----------
function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

function setError(msg) {
  const el = document.getElementById("cmdError");
  el.textContent = msg || "";
}

function freshDeckShuffled() {
  const ranks = "23456789TJQKA";
  const suits = "cdhs";
  const deck = [];
  for (const r of ranks) for (const s of suits) deck.push(r + s);

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function nextActiveSeat(fromSeat) {
  for (let i = 1; i <= 6; i++) {
    const s = (fromSeat + i) % 6;
    if (state.players[s].inHand) return s;
  }
  return fromSeat;
}

function activePlayers() {
  return state.players.filter(p => p.inHand);
}

function handOver() {
  return state.phase === "complete";
}

function pushUndo() {
  undoStack.push(deepClone(state));
  if (undoStack.length > 200) undoStack.shift();
}

function logLine(line) {
  state.log.push(line);
}

function potCommittedThisStreet() {
  return state.players.reduce((sum, p) => sum + (p.inHand ? p.bet : 0), 0);
}

// ---------- Game State ----------
function newTableState() {
  return {
    handId: 0,
    phase: "idle",         // idle | playing | complete
    street: "preflop",     // preflop | flop | turn | river
    pot: 0,
    board: [],
    deck: [],
    currentBet: 0,         // highest bet this street
    minRaiseTo: 0,
    toAct: 0,              // seat index
    lastAggressor: null,   // seat index
    dealerSeat: 3,         // starting dealer, rotates each deal
    players: POS.map((pos, seat) => ({
      seat,
      pos,
      name: seat === 0 ? "You" : `Bot ${pos}`,
      isHero: seat === 0,
      stack: START_STACK,
      inHand: true,
      bet: 0,
      acted: false,
      cards: []
    })),
    log: []
  };
}

function resetStreetBetsAndFlags() {
  state.players.forEach(p => {
    p.bet = 0;
    p.acted = false;
  });
  state.currentBet = 0;
  state.minRaiseTo = 0;
  state.lastAggressor = null;
}

function dealBoardCards(n) {
  for (let i = 0; i < n; i++) state.board.push(state.deck.pop());
}

function startNewHand() {
  pushUndo();
  setError("");

  const prevDealer = state.dealerSeat;
  state = newTableState();
  state.dealerSeat = (prevDealer + 1) % 6;

  state.handId += 1;
  state.phase = "playing";
  state.street = "preflop";
  state.deck = freshDeckShuffled();
  state.board = [];
  state.pot = 0;
  state.log = [];

  // reset players
  state.players.forEach(p => {
    p.stack = START_STACK;
    p.inHand = true;
    p.bet = 0;
    p.acted = false;
    p.cards = [state.deck.pop(), state.deck.pop()];
  });

  // blinds based on dealer
  const sbSeat = (state.dealerSeat + 1) % 6;
  const bbSeat = (state.dealerSeat + 2) % 6;

  postBlind(sbSeat, SB);
  postBlind(bbSeat, BB);

  state.currentBet = BB;
  state.minRaiseTo = BB * 2;
  state.lastAggressor = bbSeat;

  // first to act preflop is seat after BB
  state.toAct = nextActiveSeat(bbSeat);

  logLine(`Hand #${state.handId} | Dealer: ${POS[state.dealerSeat]}`);
  logLine(`Blinds: SB ${SB}, BB ${BB}`);

  render();
  runBotsUntilHero();
}

function postBlind(seat, amount) {
  const p = state.players[seat];
  const blind = Math.min(amount, p.stack);
  p.stack -= blind;
  p.bet += blind;
  state.pot += blind;
}

// ---------- Round/Street Progression ----------
function bettingRoundComplete() {
  const actives = activePlayers();
  if (actives.length <= 1) return true;
  return actives.every(p => p.acted && p.bet === state.currentBet);
}

function awardPotToWinnerByFolds() {
  const winner = state.players.find(p => p.inHand);
  if (!winner) return;
  winner.stack += state.pot;
  logLine(`${winner.pos} wins ${state.pot} (everyone folded)`);
  state.phase = "complete";
}

function advanceStreetIfReady() {
  if (handOver()) return;

  const actives = activePlayers();
  if (actives.length <= 1) {
    awardPotToWinnerByFolds();
    return;
  }

  if (!bettingRoundComplete()) return;

  // Move to next street
  if (state.street === "preflop") {
    state.street = "flop";
    resetStreetBetsAndFlags();
    dealBoardCards(3);
    logLine(`FLOP: ${state.board.join(" ")}`);
  } else if (state.street === "flop") {
    state.street = "turn";
    resetStreetBetsAndFlags();
    dealBoardCards(1);
    logLine(`TURN: ${state.board.join(" ")}`);
  } else if (state.street === "turn") {
    state.street = "river";
    resetStreetBetsAndFlags();
    dealBoardCards(1);
    logLine(`RIVER: ${state.board.join(" ")}`);
  } else if (state.street === "river") {
    // MVP: no evaluator, just stop
    logLine("SHOWDOWN (MVP: no hand evaluation yet)");
    state.phase = "complete";
    return;
  }

  // Postflop first to act is SB (seat after dealer)
  const sbSeat = (state.dealerSeat + 1) % 6;
  state.toAct = state.players[sbSeat].inHand ? sbSeat : nextActiveSeat(sbSeat);
}

// ---------- Actions (with legality) ----------
function currentPlayer() {
  return state.players[state.toAct];
}

function toCallFor(p) {
  return Math.max(0, state.currentBet - p.bet);
}

function canCheck(p) {
  return toCallFor(p) === 0;
}

function canCall(p) {
  return toCallFor(p) > 0 && p.stack > 0;
}

function applyFold(p) {
  p.inHand = false;
  p.acted = true;
  logLine(`${p.pos} folds`);
}

function applyCheck(p) {
  if (!canCheck(p)) return { ok: false, msg: "Illegal check (you are facing a bet)." };
  p.acted = true;
  logLine(`${p.pos} checks`);
  return { ok: true };
}

function applyCall(p) {
  const tc = toCallFor(p);
  if (tc <= 0) return { ok: false, msg: "Nothing to call." };
  const amt = Math.min(tc, p.stack);
  p.stack -= amt;
  p.bet += amt;
  state.pot += amt;
  p.acted = true;
  logLine(`${p.pos} calls ${amt}`);
  return { ok: true };
}

function applyBetOrRaiseTo(p, target) {
  if (!Number.isFinite(target) || target <= 0) return { ok: false, msg: "Bad size." };

  const isBet = state.currentBet === 0;
  if (isBet) {
    // bet size must be >= 1
    if (target < 1) return { ok: false, msg: "Bet too small." };
  } else {
    // raise-to must be >= minRaiseTo
    if (target < state.minRaiseTo) return { ok: false, msg: `Raise too small. Min raise-to is ${state.minRaiseTo}.` };
  }

  if (target <= state.currentBet) return { ok: false, msg: "Size must be above current bet." };

  const diff = target - p.bet;
  if (diff > p.stack) return { ok: false, msg: "Not enough chips." };

  p.stack -= diff;
  p.bet = target;
  state.pot += diff;

  // update min raise
  const prevBet = state.currentBet;
  state.currentBet = target;
  const raiseSize = target - prevBet;
  state.minRaiseTo = target + raiseSize;
  state.lastAggressor = p.seat;

  // everyone else must act again
  state.players.forEach(x => {
    if (x.inHand && x.seat !== p.seat) x.acted = false;
  });

  p.acted = true;
  logLine(`${p.pos} ${isBet ? "bets" : "raises"} to ${target}`);
  return { ok: true };
}

function stepToNextTurn() {
  if (handOver()) return;

  // If betting round complete, advance street (and set toAct accordingly)
  advanceStreetIfReady();
  if (handOver()) return;

  // Otherwise move to next active player
  state.toAct = nextActiveSeat(state.toAct);
}

// ---------- Bots ----------
function botDelayOn() {
  return !!document.getElementById("botDelayToggle")?.checked;
}

// Simple preflop open frequencies by position, just enough to feel alive
function preflopOpenProb(pos) {
  if (pos === "UTG") return 0.18;
  if (pos === "HJ") return 0.22;
  if (pos === "CO") return 0.28;
  if (pos === "BTN") return 0.42;
  if (pos === "SB") return 0.38;
  return 0.0;
}

// Crude hole-card strength score
function holeStrength(cards) {
  const order = "23456789TJQKA";
  const r1 = cards[0][0], r2 = cards[1][0];
  const s1 = cards[0][1], s2 = cards[1][1];
  const v1 = order.indexOf(r1) + 2;
  const v2 = order.indexOf(r2) + 2;
  const hi = Math.max(v1, v2);
  const lo = Math.min(v1, v2);
  const suited = s1 === s2;
  const pair = v1 === v2;

  let score = hi * 2 + lo;
  if (pair) score += 20;
  if (suited) score += 3;
  if (hi - lo === 1) score += 2;
  if (hi >= 12) score += 2;
  return score;
}

function botDecideAction(p) {
  const tc = toCallFor(p);

  // Preflop logic
  if (state.street === "preflop") {
    const unopenedBeyondBlinds = state.currentBet === BB && tc === BB; // their bet is 0 usually, currentBet is BB
    const score = holeStrength(p.cards);

    // If unopened and they can open
    if (unopenedBeyondBlinds) {
      const prob = preflopOpenProb(p.pos);
      if (Math.random() < prob) {
        // open to 5 (2.5bb), vary slightly
        const openTo = 5 + (Math.random() < 0.2 ? 1 : 0);
        return { type: "raiseTo", target: openTo };
      }
      return { type: "fold" };
    }

    // Facing a raise
    if (tc > 0) {
      // strong hands: 3bet sometimes
      if (score >= 78 && Math.random() < 0.55) {
        const raiseTo = Math.min(state.currentBet + 8, p.bet + p.stack);
        return { type: "raiseTo", target: raiseTo };
      }
      // medium: call sometimes
      if (score >= 66 && Math.random() < 0.7) return { type: "call" };
      return { type: "fold" };
    }

    return { type: "check" };
  }

  // Postflop MVP logic: check, small bet sometimes when checked to, call some bets
  if (state.currentBet === 0) {
    // checked to bot
    const betNow = Math.random() < 0.25;
    if (betNow) {
      const target = Math.max(2, Math.floor(state.pot * 0.33));
      return { type: "raiseTo", target: Math.min(target, p.bet + p.stack) };
    }
    return { type: "check" };
  }

  // facing a bet
  if (tc > 0) {
    const callProb = 0.55;
    if (Math.random() < callProb) return { type: "call" };
    return { type: "fold" };
  }

  return { type: "check" };
}

function runBotsUntilHero() {
  if (handOver() || state.phase !== "playing") return;

  const loop = () => {
    if (handOver()) { render(); return; }

    const p = currentPlayer();

    // skip folded seats
    if (!p.inHand) {
      stepToNextTurn();
      render();
      return loop();
    }

    // stop at hero turn
    if (p.isHero) { render(); return; }

    const decision = botDecideAction(p);

    if (decision.type === "fold") applyFold(p);
    else if (decision.type === "call") applyCall(p);
    else if (decision.type === "check") applyCheck(p);
    else if (decision.type === "raiseTo") applyBetOrRaiseTo(p, decision.target);

    stepToNextTurn();
    render();

    if (botDelayOn()) setTimeout(loop, 500);
    else loop();
  };

  loop();
}

// ---------- Hero terminal ----------
function parseCommand(raw) {
  const parts = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const cmd = parts[0];
  const arg = parts[1] !== undefined ? Number(parts[1]) : undefined;
  return { cmd, arg };
}

function runHeroCommand(raw) {
  if (state.phase !== "playing") return;

  const hero = currentPlayer();
  if (!hero.isHero) return;

  const parsed = parseCommand(raw);
  if (!parsed) return;

  pushUndo();
  setError("");

  const { cmd, arg } = parsed;

  if (cmd === "fold") {
    applyFold(hero);
  } else if (cmd === "check") {
    const r = applyCheck(hero);
    if (!r.ok) { state = undoStack.pop(); setError(r.msg); render(); return; }
  } else if (cmd === "call") {
    const r = applyCall(hero);
    if (!r.ok) { state = undoStack.pop(); setError(r.msg); render(); return; }
  } else if (cmd === "bet" || cmd === "raise") {
    const target = Math.floor(Number(arg));
    const r = applyBetOrRaiseTo(hero, target);
    if (!r.ok) { state = undoStack.pop(); setError(r.msg); render(); return; }
  } else {
    state = undoStack.pop();
    setError("Unknown command.");
    render();
    return;
  }

  stepToNextTurn();
  runBotsUntilHero();
  render();
}

// ---------- Controls ----------
function nextStreetButton() {
  if (state.phase !== "playing") return;

  pushUndo();
  setError("");

  if (!bettingRoundComplete()) {
    state = undoStack.pop();
    setError("Betting round is not complete yet. Finish action first.");
    render();
    return;
  }

  advanceStreetIfReady();
  runBotsUntilHero();
  render();
}

function undo() {
  if (undoStack.length === 0) return;
  state = undoStack.pop();
  setError("");
  render();
}

function reset() {
  state = newTableState();
  undoStack = [];
  setError("");
  render();
}

function loadScenario() {
  // Placeholder: later you can implement real scenario objects.
  // For now it just deals a new hand.
  startNewHand();
}

function copyHistory() {
  navigator.clipboard.writeText(state.log.join("\n"));
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "practice-hand.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Render ----------
function render() {
  const meta = document.getElementById("meta");
  const heroHand = document.getElementById("heroHand");
  const board = document.getElementById("board");
  const seats = document.getElementById("seats");
  const logEl = document.getElementById("log");
  const handIdEl = document.getElementById("handId");

  handIdEl.textContent = state.phase === "idle" ? "" : `Hand #${state.handId}`;

  const toAct = state.players[state.toAct];
  meta.innerHTML = `
    <div class="kv">Pot: <b>${state.pot}</b></div>
    <div class="kv">Street: <b>${state.street}</b></div>
    <div class="kv">To act: <b>${handOver() ? "none" : toAct.pos}</b></div>
    <div class="kv">Current bet: <b>${state.currentBet}</b></div>
  `;

  const hero = state.players.find(p => p.isHero);
  heroHand.textContent = hero.cards && hero.cards.length ? hero.cards.join(" ") : "(click Deal)";

  board.textContent = state.board.length ? state.board.join(" ") : "(no board yet)";

  seats.innerHTML = state.players.map(p => {
    const isToAct = p.seat === state.toAct && p.inHand && state.phase === "playing";
    const cls = `seat ${isToAct ? "toact" : ""}`;
    const status = p.inHand ? "" : " (folded)";
    const heroCardsInline = p.isHero ? ` | Cards: ${p.cards.join(" ")}` : "";
    return `
      <div class="${cls}">
        <div><b>${p.name}</b> <span class="pill">${p.pos}</span></div>
        <div class="muted">Stack: ${p.stack} | Bet: ${p.bet}${status}${heroCardsInline}</div>
      </div>
    `;
  }).join("");

  logEl.textContent = state.log.join("\n");
  logEl.scrollTop = logEl.scrollHeight;

  // Disable Next street if idle
  document.getElementById("btnNextStreet").disabled = (state.phase !== "playing");
}

// ---------- Wire up ----------
document.getElementById("btnDeal").addEventListener("click", startNewHand);
document.getElementById("btnNextStreet").addEventListener("click", nextStreetButton);
document.getElementById("btnUndo").addEventListener("click", undo);
document.getElementById("btnReset").addEventListener("click", reset);
document.getElementById("btnLoad").addEventListener("click", loadScenario);
document.getElementById("btnCopy").addEventListener("click", copyHistory);
document.getElementById("btnExport").addEventListener("click", exportJson);

document.getElementById("cmd").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const v = e.target.value;
    e.target.value = "";
    runHeroCommand(v);
  }
});

// Init
state = newTableState();
render();
