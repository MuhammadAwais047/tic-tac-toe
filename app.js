(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const statusEl = $("status");
  const scoreEls = { X: $("score-x"), O: $("score-o"), D: $("score-d") };
  const labelX = $("label-x");
  const labelO = $("label-o");

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const state = {
    board: Array(9).fill(null),
    mode: "ai",            // "ai" | "2p"
    diff: "tricky",        // "easy" | "tricky" | "minimax"
    current: "X",
    starter: "X",
    locked: false,
    over: false,
    scores: { X: 0, O: 0, D: 0 },
  };

  /* ---------- Persistence ---------- */
  const loadScores = () => {
    try {
      const raw = localStorage.getItem("ttt-scores-v1");
      if (raw) {
        const s = JSON.parse(raw);
        if (Number.isFinite(s.X)) state.scores = { X: s.X | 0, O: s.O | 0, D: s.D | 0 };
      }
    } catch { /* storage unavailable */ }
  };
  const saveScores = () => {
    try { localStorage.setItem("ttt-scores-v1", JSON.stringify(state.scores)); } catch { /* ignore */ }
  };

  /* ---------- Rendering ---------- */
  const X_SVG = `<svg class="mark-x" viewBox="0 0 100 100" aria-hidden="true"><line x1="16" y1="16" x2="84" y2="84"/><line x1="84" y1="16" x2="16" y2="84"/></svg>`;
  const O_SVG = `<svg class="mark-o" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="33"/></svg>`;
  const ghostFor = (p) =>
    p === "X"
      ? `<svg class="ghost" viewBox="0 0 100 100" aria-hidden="true"><line x1="16" y1="16" x2="84" y2="84"/><line x1="84" y1="16" x2="16" y2="84"/></svg>`
      : `<svg class="ghost" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="33"/></svg>`;

  const buildBoard = () => {
    boardEl.replaceChildren(
      ...state.board.map((_, i) => {
        const btn = document.createElement("button");
        btn.className = "cell";
        btn.type = "button";
        btn.dataset.i = i;
        const r = Math.floor(i / 3) + 1;
        const c = (i % 3) + 1;
        btn.setAttribute("role", "gridcell");
        btn.setAttribute("aria-label", `Row ${r}, column ${c}, empty`);
        return btn;
      })
    );
  };

  const renderScores = () => {
    scoreEls.X.textContent = state.scores.X;
    scoreEls.O.textContent = state.scores.O;
    scoreEls.D.textContent = state.scores.D;
  };

  const renderLabels = () => {
    if (state.mode === "ai") {
      labelX.textContent = "You (X)";
      labelO.textContent = "AI (O)";
    } else {
      labelX.textContent = "Player X";
      labelO.textContent = "Player O";
    }
  };

  const setTurnGlow = () => {
    $(".s-x").classList.toggle("is-turn", !state.over && state.current === "X");
    $(".s-o").classList.toggle("is-turn", !state.over && state.current === "O");
  };

  const setStatus = (text, cls = "", thinking = false) => {
    statusEl.className = `status ${cls}`;
    statusEl.innerHTML = thinking
      ? `${text}<span class="thinking-dots"></span>`
      : text;
  };

  const humanName = (p) => (state.mode === "ai" ? (p === "X" ? "You" : "AI") : `Player ${p}`);

  const updateStatus = () => {
    if (state.over) return;
    if (state.mode === "ai" && state.current === "O") {
      setStatus("AI is thinking", "st-o", true);
    } else {
      setStatus(`${humanName(state.current)} — place ${state.current}`, `st-${state.current.toLowerCase()}`);
    }
  };

  const setLocked = (locked) => {
    state.locked = locked;
    boardEl.querySelectorAll(".cell").forEach((c) => (c.disabled = locked));
  };

  /* ---------- Game logic ---------- */
  const winnerOf = (board) => {
    for (const line of WINS) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], line };
      }
    }
    return board.every(Boolean) ? { player: null, line: null } : null;
  };

  const place = (i, player) => {
    state.board[i] = player;
    const cell = boardEl.querySelector(`[data-i="${i}"]`);
    cell.innerHTML = player === "X" ? X_SVG : O_SVG;
    cell.classList.add("filled");
    cell.setAttribute(
      "aria-label",
      `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, ${player}`
    );
  };

  const endRound = (result) => {
    state.over = true;
    setLocked(true);
    if (result.player) {
      result.line.forEach((i) => {
        const cell = boardEl.querySelector(`[data-i="${i}"]`);
        cell.classList.add("win");
        if (result.player === "O") cell.classList.add("o-win");
      });
      state.scores[result.player]++;
      const name = humanName(result.player);
      setStatus(
        state.mode === "ai"
          ? (result.player === "X" ? `${name} win! 🎉` : `${name} wins — better luck next time.`)
          : `${name} wins! 🎉`,
        `st-${result.player.toLowerCase()}`
      );
    } else {
      state.scores.D++;
      setStatus("It's a draw — well played.", "st-d");
    }
    renderScores();
    saveScores();
    setTurnGlow();
  };

  const afterMove = () => {
    const result = winnerOf(state.board);
    if (result) {
      endRound(result);
      return;
    }
    state.current = state.current === "X" ? "O" : "X";
    updateStatus();
    setTurnGlow();
    if (state.mode === "ai" && state.current === "O") {
      setLocked(true);
      setTimeout(aiMove, 420 + Math.random() * 380);
    }
  };

  const emptyCells = (board) =>
    board.reduce((acc, v, i) => (v === null ? (acc.push(i), acc) : acc), []);

  const randOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const findWinning = (board, player) => {
    for (const i of emptyCells(board)) {
      board[i] = player;
      const won = WINS.some(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
      board[i] = null;
      if (won) return i;
    }
    return -1;
  };

  /* Minimax — O maximizes, X minimizes; depth-biased so it prefers fast wins / slow losses */
  const minimax = (board, player, depth) => {
    const result = winnerOf(board);
    if (result) {
      if (result.player === "O") return 10 - depth;
      if (result.player === "X") return depth - 10;
      return 0;
    }
    const empties = emptyCells(board);
    if (player === "O") {
      let best = -Infinity;
      for (const i of empties) {
        board[i] = "O";
        best = Math.max(best, minimax(board, "X", depth + 1));
        board[i] = null;
      }
      return best;
    }
    let best = Infinity;
    for (const i of empties) {
      board[i] = "X";
      best = Math.min(best, minimax(board, "O", depth + 1));
      board[i] = null;
    }
    return best;
  };

  const bestMove = (board) => {
    let best = -Infinity;
    let move = -1;
    for (const i of emptyCells(board)) {
      board[i] = "O";
      const score = minimax(board, "X", 0);
      board[i] = null;
      if (score > best) {
        best = score;
        move = i;
      }
    }
    return move;
  };

  const aiMove = () => {
    if (state.over) return;
    const board = state.board;
    let move;

    if (state.diff === "easy") {
      move = randOf(emptyCells(board));
    } else if (state.diff === "tricky") {
      move = findWinning(board, "O");
      if (move < 0) move = findWinning(board, "X");
      if (move < 0 && board[4] === null) move = 4;
      if (move < 0) {
        const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
        move = corners.length ? randOf(corners) : randOf(emptyCells(board));
      }
    } else {
      move = bestMove(board);
    }

    place(move, "O");
    setLocked(false);
    // keep occupied cells unclickable via filled check on click
    afterMove();
  };

  /* ---------- Interaction ---------- */
  boardEl.addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell || state.locked || state.over) return;
    const i = Number(cell.dataset.i);
    if (state.board[i] !== null) return;
    place(i, state.current);
    afterMove();
  });

  // Ghost preview on hover
  boardEl.addEventListener("mouseover", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell || state.locked || state.over) return;
    const i = Number(cell.dataset.i);
    if (state.board[i] !== null || cell.querySelector(".ghost")) return;
    cell.insertAdjacentHTML("beforeend", ghostFor(state.current));
  });
  boardEl.addEventListener("mouseout", (e) => {
    const cell = e.target.closest(".cell");
    if (cell) cell.querySelector(".ghost")?.remove();
  });

  const newRound = () => {
    // loser starts next round; alternate on draw
    state.starter = state.starter === "X" ? "O" : "X";
    startRound();
  };

  const startRound = () => {
    state.board = Array(9).fill(null);
    state.over = false;
    state.current = state.starter;
    buildBoard();
    setLocked(false);
    updateStatus();
    setTurnGlow();
    if (state.mode === "ai" && state.current === "O") {
      setLocked(true);
      setTimeout(aiMove, 500);
    }
  };

  /* ---------- Controls ---------- */
  const segBtns = (group) => [...group.querySelectorAll(".seg-btn")];

  const bindGroup = (group, onPick) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn || btn.classList.contains("is-active")) return;
      segBtns(group).forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      onPick(btn);
    });
  };

  bindGroup(document.querySelector('.controls .seg[aria-label="Opponent"]'), (btn) => {
    state.mode = btn.id === "mode-ai" ? "ai" : "2p";
    $("diff-wrap").hidden = state.mode !== "ai";
    renderLabels();
    state.starter = "X";
    startRound();
  });

  bindGroup(document.querySelector('.controls .seg[aria-label="AI difficulty"]'), (btn) => {
    state.diff = btn.dataset.diff;
    state.starter = "X";
    startRound();
  });

  $("new-round").addEventListener("click", newRound);
  $("reset-scores").addEventListener("click", () => {
    state.scores = { X: 0, O: 0, D: 0 };
    renderScores();
    saveScores();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "n") newRound();
  });

  $("year").textContent = new Date().getFullYear();

  /* ---------- Boot ---------- */
  loadScores();
  renderScores();
  renderLabels();
  state.starter = "X";
  startRound();
})();
