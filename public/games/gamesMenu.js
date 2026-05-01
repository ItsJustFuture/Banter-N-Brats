(function () {
  const availableGames = [
    { gameType: "tic-tac-toe", label: "Tic Tac Toe" },
    { gameType: "chess", label: "Chess" },
    { gameType: "survival", label: "Survival" },
    { gameType: "dnd", label: "DND" }
  ];

  function open() {
    const modal = document.getElementById("gamesModal");
    if (!modal) return;
    modal.hidden = false;
    render();
  }

  function close() {
    const modal = document.getElementById("gamesModal");
    if (modal) modal.hidden = true;
  }

  function render() {
    const root = document.querySelector("#gamesModal .modalBody");
    if (!root) return;
    const active = Array.isArray(window.activeGames) ? window.activeGames : [];
    root.innerHTML = `
      <section class="gamesModalSection">
        <div class="small muted">Start a game</div>
        <div class="gamesStartList">
          ${availableGames.map((g) => `<div class="gamesStartItem"><span>${g.label}</span><button class="btn secondary small" data-start-game="${g.gameType}" type="button">Start Game</button></div>`).join("")}
        </div>
      </section>
      <section class="gamesModalSection">
        <div class="small muted">Active Games</div>
        <div class="gamesActiveActions">
          ${active.length ? active.map((g) => `<div class="gamesStartItem"><span>${g.gameType} • ${g.gameId}</span><button class="btn secondary small" data-join-game="${g.gameId}" type="button">Join</button></div>`).join("") : '<div class="small muted">No active games.</div>'}
        </div>
      </section>
    `;

    root.querySelectorAll("[data-start-game]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const gameType = btn.dataset.startGame;
        if (!window.socket || !gameType) return;
        window.socket.emit("game:start", { gameType, config: {} }, (res = {}) => {
          const gameId = res?.gameId || res?.state?.gameId;
          if (gameId) {
            window.currentGameId = gameId;
            window.GameSession?.open({ socket: window.socket, gameId, gameType });
          }
        });
      });
    });

    root.querySelectorAll("[data-join-game]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const gameId = btn.dataset.joinGame;
        const game = active.find((x) => String(x.gameId) === String(gameId));
        if (!window.socket || !gameId) return;
        window.currentGameId = gameId;
        window.GameSession?.open({ socket: window.socket, gameId, gameType: game?.gameType || "game" });
      });
    });
  }

  window.GamesMenu = { open, close, render, availableGames };
})();
