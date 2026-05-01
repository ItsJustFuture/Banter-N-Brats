(function () {
  let socketRef = null;
  let stateRef = null;

  function ensureOverlay() {
    let overlay = document.getElementById("gameSessionOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "gameSessionOverlay";
    overlay.className = "modal";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="modalCard" style="width:min(980px,96vw);height:min(90vh,880px);display:flex;flex-direction:column;">
        <div class="modalTop">
          <strong id="gameSessionTitle">Game Session</strong>
          <div class="row" style="gap:8px;">
            <button class="btn secondary small" id="gameSessionLeave" type="button">Leave Game</button>
            <button class="iconBtn" id="gameSessionClose" type="button">✕</button>
          </div>
        </div>
        <div class="modalBody" id="gameSessionBody"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector("#gameSessionClose")?.addEventListener("click", close);
    overlay.querySelector("#gameSessionLeave")?.addEventListener("click", leave);
    return overlay;
  }

  function open({ socket, gameId, gameType }) {
    socketRef = socketRef || socket;
    if (!socketRef || !gameId) return;
    window.currentGameId = gameId;
    const overlay = ensureOverlay();
    overlay.hidden = false;
    const title = overlay.querySelector("#gameSessionTitle");
    if (title) title.textContent = `🎮 ${gameType || "Game"} • ${gameId}`;
    socketRef.emit("game:join", { gameId });
  }

  function update(nextState) {
    stateRef = nextState || {};
    const overlay = ensureOverlay();
    const body = overlay.querySelector("#gameSessionBody");
    if (!body) return;
    const gameType = stateRef?.gameType || "generic";
    body.innerHTML = window.GameRenderer?.renderGame(gameType, stateRef, { socket: socketRef }) || "";
    bindActions(body);
  }

  function bindActions(body) {
    body.querySelectorAll("[data-game-action='move']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        window.GameRenderer.emitAction(socketRef, window.currentGameId, "move", { index });
      });
    });
    body.querySelector("[data-game-generic-send='1']")?.addEventListener("click", () => {
      const action = body.querySelector("#genericGameAction")?.value?.trim();
      const payloadRaw = body.querySelector("#genericGamePayload")?.value?.trim();
      let payload = {};
      if (payloadRaw) {
        try { payload = JSON.parse(payloadRaw); } catch (_e) { payload = { value: payloadRaw }; }
      }
      window.GameRenderer.emitAction(socketRef, window.currentGameId, action, payload);
    });
  }

  function leave() {
    if (socketRef && window.currentGameId) socketRef.emit("game:leave", { gameId: window.currentGameId });
    window.currentGameId = null;
    close();
  }

  function close() {
    const overlay = document.getElementById("gameSessionOverlay");
    if (overlay) overlay.hidden = true;
  }

  window.GameSession = { open, update, leave, close };
})();
