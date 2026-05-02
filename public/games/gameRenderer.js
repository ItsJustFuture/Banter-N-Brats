(function () {
  function safeJson(value) {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch (_err) {
      return "{}";
    }
  }

  function emitAction(socket, gameId, action, payload = {}) {
    if (!socket || typeof gameId !== "string" || gameId.length === 0 || !action) return;
    socket.emit("game:action", { gameId, action, payload });
  }

  function renderTicTacToe(state = {}, ctx = {}) {
    const board = Array.isArray(state?.state?.board) ? state.state.board : Array(9).fill(null);
    return `<div class="gameTttBoard">${board.map((cell, i) => `<button class="btn secondary small gameTttCell" data-game-action="move" data-index="${i}">${cell || ""}</button>`).join("")}</div>`;
  }

  function renderChess(state = {}, ctx = {}) {
    const fen = String(state?.state?.fen || "");
    return `<div class="card"><div class="small muted">Chess position (FEN)</div><pre>${fen || "No board yet"}</pre></div>`;
  }

  function renderGeneric(state = {}, ctx = {}) {
    return `
      <div class="card">
        <div class="small muted">No custom renderer available. Using generic action panel.</div>
        <pre>${safeJson(state)}</pre>
      </div>
      <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap;">
        <input id="genericGameAction" class="small" placeholder="action (e.g. move)" style="min-width:180px;" />
        <input id="genericGamePayload" class="small" placeholder='payload JSON (optional)' style="min-width:220px;" />
        <button class="btn small" data-game-generic-send="1">Send Action</button>
      </div>
    `;
  }

  function renderGame(gameType, state, ctx = {}) {
    switch (gameType) {
      case "chess":
        return renderChess(state, ctx);
      case "tic-tac-toe":
        return renderTicTacToe(state, ctx);
      default:
        return renderGeneric(state, ctx);
    }
  }

  window.GameRenderer = { renderGame, renderGeneric, emitAction };
})();
