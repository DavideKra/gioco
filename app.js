// ======= STEP references =======
const stepPlayers = document.getElementById('step-players');
const stepPawns   = document.getElementById('step-pawns');
const stepBoard   = document.getElementById('step-board');

// Step 1
const playerOptions = document.getElementById('player-options');
const toPawns = document.getElementById('to-pawns');

// Step 2
const playerLabel = document.getElementById('player-label');
const playerProgress = document.getElementById('player-progress');
const nameGrid = document.getElementById('name-grid');
const previewImg = document.getElementById('preview-img');
const previewStage = document.getElementById('preview-stage');

const summary = document.getElementById('summary');
const summaryList = document.getElementById('summary-list');

const back = document.getElementById('back');
const finish = document.getElementById('finish');
const finalConfirm = document.getElementById('final-confirm');
const done = document.getElementById('done');

// conferma pedina (inline)
const pickConfirm = document.getElementById('pick-confirm');
const pickFor = document.getElementById('pick-for');
const pickText = document.getElementById('pick-text');
const pickCancel = document.getElementById('pick-cancel');
const pickAccept = document.getElementById('pick-accept');

// Step 3 board
const boardEl = document.getElementById('board');
const goHomeBtn = document.getElementById('go-home');
const resetBoardBtn = document.getElementById('reset-board');
const turnPlayerLabel = document.getElementById('turn-player');
const turnPawnImg = document.getElementById('turn-pawn-img');
const diceStatus = document.getElementById('dice-status');
const die1El = document.getElementById('die-1');
const die2El = document.getElementById('die-2');
const rollDiceBtn = document.getElementById('roll-dice');
const questionBox = document.getElementById('question-box');
const questionTopline = document.getElementById('question-topline');
const questionText = document.getElementById('question-text');
const questionOptions = document.getElementById('question-options');
const questionFeedback = document.getElementById('question-feedback');
const rankingBox = document.getElementById('ranking-box');
const rankingTopline = document.getElementById('ranking-topline');
const rankingList = document.getElementById('ranking-list');
const rankingConfirm = document.getElementById('ranking-confirm');
const rankingFeedback = document.getElementById('ranking-feedback');
const matchBox = document.getElementById('match-box');
const matchTopline = document.getElementById('match-topline');
const matchKillers = document.getElementById('match-killers');
const matchObjects = document.getElementById('match-objects');
const matchConfirm = document.getElementById('match-confirm');
const matchFeedback = document.getElementById('match-feedback');

// ======= Data =======
const pawnFiles = [
  'JackTheRipper.png',
  'DonatoBilancia.png',
  'ErszebethBathory.png',
  'AileenWhornos.png',
  'JeffreyDahmer.png',
  'TedBundy.png',
  'RichardRamirez.png',
  'PietroPacciani.png',
  'TheodoreKaczynski.png',
];

function displayNameFromFile(fileName) {
  const base = fileName.replace(/\.[^/.]+$/, '');
  return base.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const pawns = pawnFiles.map((src) => ({
  id: src.toLowerCase().replace(/[^a-z0-9]/g, ''),
  name: displayNameFromFile(src),
  src
}));

// ======= State =======
let playerCount = 0;
let currentPlayer = 1;
let selections = {}; // {1: pawnId, 2: pawnId, ...}
let currentPreviewId = null;
let pendingPickId = null;
let playerPositions = {}; // {1: 0, 2: 0, ...}
let turnPlayer = 1;
let isRolling = false;

// ======= helpers =======
function showStep(step) {
  [stepPlayers, stepPawns, stepBoard].forEach(s => s.classList.remove('active'));
  step.classList.add('active');
}

function isTaken(pawnId) {
  return Object.values(selections).includes(pawnId);
}

function setPreview(pawn) {
  currentPreviewId = pawn.id;
  previewImg.src = pawn.src;
  previewImg.alt = pawn.name;
}

function updateHeader() {
  playerLabel.textContent = `Giocatore ${currentPlayer}`;
  playerProgress.textContent = `${currentPlayer} / ${playerCount}`;
}

function firstAvailablePawn() {
  return pawns.find(p => !isTaken(p.id)) || pawns[0];
}

function hidePendingUI() {
  pendingPickId = null;
  pickConfirm.hidden = true;
  renderNameGrid();
}

function showPendingUI(pawn) {
  pendingPickId = pawn.id;
  pickFor.textContent = `Per Giocatore ${currentPlayer}`;
  pickText.textContent = `Confermi ${pawn.name}?`;
  pickConfirm.hidden = false;
  renderNameGrid();
}

function updateSummary() {
  const totalSelected = Object.keys(selections).length;
  summary.hidden = totalSelected === 0;
  summaryList.innerHTML = '';

  Object.keys(selections)
    .sort((a,b) => Number(a) - Number(b))
    .forEach((player) => {
      const pawnId = selections[player];
      const pawn = pawns.find(p => p.id === pawnId);
      const li = document.createElement('li');
      li.textContent = `Giocatore ${player}: ${pawn ? pawn.name : ''}`;
      summaryList.appendChild(li);
    });

  finish.disabled = !finalConfirm.checked || totalSelected !== playerCount;
}

function advancePlayerIfNeeded() {
  if (currentPlayer < playerCount) {
    currentPlayer += 1;
    setPreview(firstAvailablePawn());
    updateHeader();
  }
}

function clampCell(value) {
  if (value < 0) return 0;
  if (value > 99) return 99;
  return value;
}

function setTurnPlayer(playerIndex) {
  turnPlayer = playerIndex;
  const pawnId = selections[playerIndex];
  const pawn = pawns.find(p => p.id === pawnId);
  const playerName = pawn ? pawn.name : `Giocatore ${playerIndex}`;
  if (turnPlayerLabel) {
    turnPlayerLabel.textContent = playerName;
  }

  if (turnPawnImg) {
    if (pawn) {
      turnPawnImg.src = pawn.src;
      turnPawnImg.alt = pawn.name;
    }
  }
}

function updateDiceStatus(text) {
  if (diceStatus) diceStatus.textContent = text;
}

function setDieFace(dieEl, value) {
  if (!dieEl) return;
  dieEl.classList.remove('face-1', 'face-2', 'face-3', 'face-4', 'face-5', 'face-6');
  dieEl.classList.add(`face-${value}`);
}

function animateDieToValue(dieEl, value) {
  return new Promise((resolve) => {
    if (!dieEl) return resolve();

    dieEl.classList.add('rolling');
    let ticks = 0;
    const interval = setInterval(() => {
      const temp = Math.floor(Math.random() * 6) + 1;
      setDieFace(dieEl, temp);
      ticks += 1;
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      setDieFace(dieEl, value);
      dieEl.classList.remove('rolling');
      resolve();
    }, 700);
  });
}

function rollDieValue() {
  return Math.floor(Math.random() * 6) + 1;
}

function movePlayerBy(playerIndex, delta) {
  const current = playerPositions[playerIndex] ?? 0;
  const target = clampCell(current + delta);
  playerPositions[playerIndex] = target;

  const token = boardEl.querySelector(`.pawn-token[data-player="${playerIndex}"]`);
  const targetCell = boardEl.querySelector(`[data-tokens-for="${target}"]`);
  if (token && targetCell) {
    targetCell.appendChild(token);
  }

  return { from: current, to: target };
}

function nextTurnPlayer() {
  return turnPlayer >= playerCount ? 1 : turnPlayer + 1;
}

function shuffleArray(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function difficultyForMove(steps) {
  if (steps >= 2 && steps <= 5) return 'easy';
  if (steps >= 6 && steps <= 9) return 'medium';
  return 'hard';
}

function difficultyLabel(level) {
  if (level === 'easy') return 'Facile';
  if (level === 'medium') return 'Media';
  return 'Difficile';
}

function optionsCountForDifficulty(level) {
  if (level === 'easy') return 4;
  if (level === 'medium') return 5;
  return 6;
}

function getQuestionsPool() {
  return Array.isArray(window.QUESTIONS) ? window.QUESTIONS : [];
}

function getKillersPool() {
  return Array.isArray(window.KILLERS) ? window.KILLERS : [];
}

function getObjectsPool() {
  return Array.isArray(window.OBJECT_MATCHES) ? window.OBJECT_MATCHES : [];
}

function isRankCell(index) {
  return index >= 4 && (index - 4) % 8 === 0;
}

function isMatchCell(index) {
  return index >= 8 && (index - 8) % 8 === 0;
}

function getSpecialTypeForCell(index) {
  if (isRankCell(index)) return 'rank';
  if (isMatchCell(index)) return 'match';
  return null;
}

function pickRandomQuestion() {
  const pool = getQuestionsPool();
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

function openQuestionBox(question, options, level, steps) {
  if (!questionBox) return Promise.resolve(true);

  const levelLabel = difficultyLabel(level);
  questionTopline.textContent = `Hai fatto ${steps}, quindi ti verra posta la domanda ${levelLabel}.`;
  questionText.textContent = question.question;
  questionOptions.innerHTML = '';
  questionFeedback.textContent = '';
  questionBox.hidden = false;

  return new Promise((resolve) => {
    const correctValue = question.correct;
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        const isCorrect = opt === correctValue;
        questionFeedback.textContent = isCorrect ? 'Risposta corretta.' : 'Risposta sbagliata.';
        const buttons = questionOptions.querySelectorAll('button');
        buttons.forEach(b => b.disabled = true);
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        setTimeout(() => {
          questionBox.hidden = true;
          resolve(isCorrect);
        }, 650);
      });
      questionOptions.appendChild(btn);
    });
  });
}

async function askQuestionForMove(steps) {
  const level = difficultyForMove(steps);
  const question = pickRandomQuestion();
  if (!question) {
    updateDiceStatus('Nessuna domanda disponibile: movimento automatico.');
    return { isCorrect: true, level };
  }

  const optionCount = optionsCountForDifficulty(level);
  const wrongPool = Array.isArray(question.wrong) ? question.wrong : [];
  let wrongs = shuffleArray(wrongPool);
  const neededWrongs = Math.max(0, optionCount - 1);
  if (wrongs.length < neededWrongs) {
    const extraWrongs = getQuestionsPool()
      .flatMap(q => Array.isArray(q.wrong) ? q.wrong : [])
      .filter(w => w !== question.correct && !wrongs.includes(w));
    wrongs = wrongs.concat(shuffleArray(extraWrongs));
  }
  wrongs = wrongs.slice(0, neededWrongs);
  const options = shuffleArray([question.correct, ...wrongs]);
  const isCorrect = await openQuestionBox(question, options, level, steps);
  return { isCorrect, level };
}

let rankingItems = [];
let rankingActive = false;
let rankDragIndex = null;

function pickRandomKillers(count) {
  const pool = getKillersPool();
  if (pool.length < count) return pool.slice();
  return shuffleArray(pool).slice(0, count);
}

function renderRankingList() {
  if (!rankingList) return;
  rankingList.innerHTML = '';
  rankingItems.forEach((killer, index) => {
    const item = document.createElement('div');
    item.className = 'ranking-item';
    item.draggable = true;
    item.dataset.index = String(index);
    item.textContent = killer.name;

    item.addEventListener('dragstart', () => {
      rankDragIndex = index;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      rankDragIndex = null;
      item.classList.remove('dragging');
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (rankDragIndex === null) return;
      const targetIndex = Number(item.dataset.index);
      if (Number.isNaN(targetIndex)) return;
      const [moved] = rankingItems.splice(rankDragIndex, 1);
      rankingItems.splice(targetIndex, 0, moved);
      renderRankingList();
    });

    rankingList.appendChild(item);
  });
}

function isRankingCorrect() {
  for (let i = 1; i < rankingItems.length; i++) {
    const prev = rankingItems[i - 1].kills;
    const curr = rankingItems[i].kills;
    if (curr < prev) return false;
  }
  return true;
}

function openRankingGame(steps) {
  if (!rankingBox) return Promise.resolve(true);
  rankingItems = pickRandomKillers(4);
  rankingActive = true;
  rankingTopline.textContent = `Casella speciale: metti in classifica. In gioco ${steps} caselle.`;
  rankingFeedback.textContent = '';
  renderRankingList();
  rankingBox.hidden = false;

  return new Promise((resolve) => {
    const handler = () => {
      if (!rankingActive) return;
      const ok = isRankingCorrect();
      rankingFeedback.textContent = ok ? 'Ordine corretto.' : 'Ordine sbagliato.';
      rankingActive = false;
      if (rankingConfirm) rankingConfirm.disabled = true;
      setTimeout(() => {
        rankingBox.hidden = true;
        if (rankingConfirm) rankingConfirm.disabled = false;
        resolve(ok);
      }, 650);
    };
    if (rankingConfirm) {
      rankingConfirm.onclick = handler;
    } else {
      resolve(true);
    }
  });
}

let matchPairs = [];
let matchObjectsOrder = [];
let matchActive = false;
let dragIndex = null;

function pickRandomMatches(count) {
  const pool = getObjectsPool();
  if (pool.length < count) return pool.slice();
  return shuffleArray(pool).slice(0, count);
}

function getPlayerPawnName(playerIndex) {
  const pawnId = selections[playerIndex];
  const pawn = pawns.find(p => p.id === pawnId);
  return pawn ? pawn.name : '';
}

function renderMatchLists() {
  if (!matchKillers || !matchObjects) return;
  matchKillers.innerHTML = '';
  matchObjects.innerHTML = '';

  matchPairs.forEach((pair) => {
    const item = document.createElement('div');
    item.className = 'match-item';
    item.textContent = pair.name;
    matchKillers.appendChild(item);
  });

  matchObjectsOrder.forEach((pair, index) => {
    const item = document.createElement('div');
    item.className = 'match-item draggable';
    item.draggable = true;
    item.dataset.index = String(index);
    item.textContent = pair.object;

    item.addEventListener('dragstart', () => {
      dragIndex = index;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      dragIndex = null;
      item.classList.remove('dragging');
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragIndex === null) return;
      const targetIndex = Number(item.dataset.index);
      if (Number.isNaN(targetIndex)) return;
      const [moved] = matchObjectsOrder.splice(dragIndex, 1);
      matchObjectsOrder.splice(targetIndex, 0, moved);
      renderMatchLists();
    });

    matchObjects.appendChild(item);
  });
}

function isMatchCorrect() {
  for (let i = 0; i < matchPairs.length; i++) {
    if (matchObjectsOrder[i].name !== matchPairs[i].name) return false;
  }
  return true;
}

function getSpecialMultiplier(playerIndex) {
  const playerName = getPlayerPawnName(playerIndex);
  if (!playerName) return 1;
  const idx = matchPairs.findIndex(p => p.name === playerName);
  if (idx === -1) return 1;
  if (!matchPairs[idx].special) return 1;
  const isCorrectForPlayer = matchObjectsOrder[idx] && matchObjectsOrder[idx].name === playerName;
  return isCorrectForPlayer ? 2 : 1;
}

function openMatchGame(steps, playerIndex) {
  if (!matchBox) return Promise.resolve({ ok: true, multiplier: 1 });

  matchPairs = shuffleArray(pickRandomMatches(4));
  matchObjectsOrder = shuffleArray(matchPairs);
  matchActive = true;
  matchTopline.textContent = `Casella speciale: abbina l'oggetto. In gioco ${steps} caselle.`;
  matchFeedback.textContent = '';
  renderMatchLists();
  matchBox.hidden = false;

  return new Promise((resolve) => {
    const handler = () => {
      if (!matchActive) return;
      const ok = isMatchCorrect();
      const multiplier = getSpecialMultiplier(playerIndex);
      matchFeedback.textContent = ok ? 'Abbinamenti corretti.' : 'Abbinamenti sbagliati.';
      matchActive = false;
      if (matchConfirm) matchConfirm.disabled = true;
      setTimeout(() => {
        matchBox.hidden = true;
        if (matchConfirm) matchConfirm.disabled = false;
        resolve({ ok, multiplier });
      }, 650);
    };
    if (matchConfirm) {
      matchConfirm.onclick = handler;
    } else {
      resolve({ ok: true, multiplier: 1 });
    }
  });
}

async function handleSpecialGame(type, steps) {
  if (questionBox) questionBox.hidden = true;

  if (type === 'rank') {
    if (matchBox) matchBox.hidden = true;
    const ok = await openRankingGame(steps);
    const delta = ok ? steps : -steps;
    const moved = movePlayerBy(turnPlayer, delta);
    updateDiceStatus(`Casella stella: ${ok ? 'corretto' : 'sbagliato'}, ${ok ? 'avanti' : 'indietro'} di ${Math.abs(delta)} (da ${moved.from} a ${moved.to}).`);
    return;
  }

  if (type === 'match') {
    if (rankingBox) rankingBox.hidden = true;
    const result = await openMatchGame(steps, turnPlayer);
    const delta = result.ok ? steps * result.multiplier : -steps * result.multiplier;
    const moved = movePlayerBy(turnPlayer, delta);
    const multiplierText = result.multiplier === 2 ? ' (x2)' : '';
    updateDiceStatus(`Casella oggetto: ${result.ok ? 'corretto' : 'sbagliato'}${multiplierText}, ${result.ok ? 'avanti' : 'indietro'} di ${Math.abs(delta)} (da ${moved.from} a ${moved.to}).`);
  }
}

// ======= STEP 1 logic =======
function selectPlayerOption(option) {
  document.querySelectorAll('.option').forEach((el) => {
    const isSelected = el === option;
    el.classList.toggle('selected', isSelected);
    el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
  playerCount = Number(option.dataset.value);
  toPawns.disabled = false;
}

playerOptions.addEventListener('click', (e) => {
  const option = e.target.closest('.option');
  if (option) selectPlayerOption(option);
});

toPawns.addEventListener('click', () => {
  showStep(stepPawns);

  currentPlayer = 1;
  selections = {};
  pendingPickId = null;

  finalConfirm.checked = false;
  finish.disabled = true;
  done.classList.remove('active');
  pickConfirm.hidden = true;

  setPreview(pawns[0]);
  renderNameGrid();
  updateHeader();
  updateSummary();
});

back.addEventListener('click', () => {
  showStep(stepPlayers);
});

// ======= STEP 2 rendering =======
function renderNameGrid() {
  nameGrid.innerHTML = '';

  pawns.forEach((pawn) => {
    const btn = document.createElement('div');
    btn.className = 'name-btn';
    btn.setAttribute('role', 'option');
    btn.dataset.id = pawn.id;
    btn.textContent = pawn.name;

    const taken = isTaken(pawn.id);
    const selectedThisPlayer = selections[currentPlayer] === pawn.id;
    const isPending = pendingPickId === pawn.id;

    if (taken && !selectedThisPlayer) btn.classList.add('disabled');
    if (selectedThisPlayer || isPending) btn.classList.add('selected');

    btn.addEventListener('mouseenter', () => {
      if (btn.classList.contains('disabled')) return;
      setPreview(pawn);
    });

    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      setPreview(pawn);
      showPendingUI(pawn);
    });

    nameGrid.appendChild(btn);
  });
}

previewStage.addEventListener('click', () => {
  const pawn = pawns.find(p => p.id === currentPreviewId);
  if (!pawn) return;

  const taken = isTaken(pawn.id);
  const selectedThisPlayer = selections[currentPlayer] === pawn.id;
  if (taken && !selectedThisPlayer) return;

  showPendingUI(pawn);
});

pickCancel.addEventListener('click', () => hidePendingUI());

pickAccept.addEventListener('click', () => {
  if (!pendingPickId) return;

  const pawn = pawns.find(p => p.id === pendingPickId);
  if (!pawn) return;

  const taken = isTaken(pawn.id);
  const selectedThisPlayer = selections[currentPlayer] === pawn.id;
  if (taken && !selectedThisPlayer) return;

  selections[currentPlayer] = pawn.id;
  hidePendingUI();

  advancePlayerIfNeeded();
  renderNameGrid();
  updateHeader();
  updateSummary();
});

finalConfirm.addEventListener('change', () => {
  finish.disabled = !finalConfirm.checked || Object.keys(selections).length !== playerCount;
});

// ======= STEP 3: Board =======
function buildBoard() {
  boardEl.innerHTML = '';

  // 0..99 partendo dall'alto (riga 0: 0-9)
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.cell = String(i);
    if (isRankCell(i)) {
      cell.classList.add('special-rank');
      cell.dataset.special = 'rank';
    } else if (isMatchCell(i)) {
      cell.classList.add('special-match');
      cell.dataset.special = 'match';
    }

    const label = document.createElement('div');
    label.className = 'cell-number';
    label.textContent = String(i);

    const tokens = document.createElement('div');
    tokens.className = 'cell-tokens';
    tokens.dataset.tokensFor = String(i);

    cell.appendChild(label);
    cell.appendChild(tokens);
    boardEl.appendChild(cell);
  }
}

function createPawnToken(playerIndex, pawn) {
  const token = document.createElement('div');
  token.className = 'pawn-token';
  token.dataset.player = String(playerIndex);
  token.dataset.pawnId = pawn.id;

  const img = document.createElement('img');
  img.src = pawn.src;
  img.alt = pawn.name;

  const badge = document.createElement('div');
  badge.className = 'pawn-badge';
  badge.textContent = String(playerIndex);

  token.appendChild(img);
  token.appendChild(badge);
  return token;
}

function placeAllPawnsAtCell0() {
  const cell0 = boardEl.querySelector('[data-tokens-for="0"]');
  if (!cell0) return;

  cell0.innerHTML = '';

  const players = Object.keys(selections)
    .sort((a,b) => Number(a) - Number(b))
    .map(k => Number(k));

  players.forEach((p) => {
    const pawnId = selections[p];
    const pawn = pawns.find(x => x.id === pawnId);
    if (!pawn) return;
    cell0.appendChild(createPawnToken(p, pawn));
  });
}

function initBoardState() {
  playerPositions = {};
  for (let i = 1; i <= playerCount; i++) {
    playerPositions[i] = 0;
  }

  setTurnPlayer(1);
  updateDiceStatus('Pronto a lanciare.');
  setDieFace(die1El, 1);
  setDieFace(die2El, 1);
  if (questionBox) questionBox.hidden = true;
  if (rankingBox) rankingBox.hidden = true;
  if (matchBox) matchBox.hidden = true;
  if (rollDiceBtn) rollDiceBtn.disabled = false;
}

function saveSetupToStorage() {
  const payload = { playerCount, selections };
  localStorage.setItem('gameSetup', JSON.stringify(payload));
}

function goToBoard() {
  saveSetupToStorage();
  buildBoard();
  placeAllPawnsAtCell0();
  initBoardState();
  showStep(stepBoard);
}

finish.addEventListener('click', () => {
  if (!finalConfirm.checked) return;
  if (Object.keys(selections).length !== playerCount) return;
  goToBoard();
});

// board controls
function resetAllToHome() {
  localStorage.removeItem('gameSetup');

  toPawns.disabled = true;
  document.querySelectorAll('.option').forEach(o => {
    o.classList.remove('selected');
    o.setAttribute('aria-checked', 'false');
  });

  showStep(stepPlayers);
}

function resetBoardPositions() {
  placeAllPawnsAtCell0();
  initBoardState();
}

if (goHomeBtn) {
  goHomeBtn.addEventListener('click', () => {
    const ok = window.confirm('Tornare alla home e perdere le selezioni attuali?');
    if (!ok) return;
    resetAllToHome();
  });
}

if (resetBoardBtn) {
  resetBoardBtn.addEventListener('click', () => {
    const ok = window.confirm('Reset delle pedine alla casella 0?');
    if (!ok) return;
    resetBoardPositions();
  });
}

async function handleRollDice() {
  if (isRolling || playerCount === 0) return;
  isRolling = true;
  if (rollDiceBtn) rollDiceBtn.disabled = true;
  if (questionBox) questionBox.hidden = true;
  if (rankingBox) rankingBox.hidden = true;
  if (matchBox) matchBox.hidden = true;

  let consecutiveDoubles = 0;
  let rollCount = 0;
  let finished = false;

  while (!finished) {
    rollCount += 1;
    const d1 = rollDieValue();
    const d2 = rollDieValue();
    const sum = d1 + d2;
    const isDouble = d1 === d2;

    updateDiceStatus(`Lancio ${rollCount}: ${d1} + ${d2} = ${sum}${isDouble ? ' (Doppio!)' : ''}`);

    await Promise.all([
      animateDieToValue(die1El, d1),
      animateDieToValue(die2El, d2)
    ]);

    if (isDouble) {
      consecutiveDoubles += 1;
      if (consecutiveDoubles === 3) {
        const moved = movePlayerBy(turnPlayer, -sum);
        updateDiceStatus(`Terzo doppio! Torni indietro di ${sum} (da ${moved.from} a ${moved.to}).`);
        finished = true;
      } else {
        updateDiceStatus(`Doppio! Ritira. Ultimo risultato: ${sum}.`);
      }
    } else {
      const currentPos = playerPositions[turnPlayer] ?? 0;
      const targetForward = clampCell(currentPos + sum);
      const specialType = getSpecialTypeForCell(targetForward);

      if (specialType) {
        await handleSpecialGame(specialType, sum);
      } else {
        const { isCorrect, level } = await askQuestionForMove(sum);
        const delta = isCorrect ? sum : -sum;
        const moved = movePlayerBy(turnPlayer, delta);
        const outcome = isCorrect ? 'corretta' : 'sbagliata';
        if (!isCorrect && moved.from === 0 && moved.to === 0) {
          updateDiceStatus(`Domanda ${difficultyLabel(level)} sbagliata: resti alla casella 0. Turno successivo.`);
        } else {
          updateDiceStatus(`Domanda ${difficultyLabel(level)} ${outcome}: ${isCorrect ? 'avanti' : 'indietro'} di ${sum} (da ${moved.from} a ${moved.to}).`);
        }
      }
      finished = true;
    }
  }

  setTurnPlayer(nextTurnPlayer());
  if (rollDiceBtn) rollDiceBtn.disabled = false;
  isRolling = false;
}

if (rollDiceBtn) {
  rollDiceBtn.addEventListener('click', handleRollDice);
}

// opzionale: se in futuro vuoi ripristinare al refresh, qui c'è lo spazio
window.addEventListener('load', () => {
  // niente al momento
});
