(function () {
  const DEV_LOGS_ENABLED = Boolean(window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1");

  const availableGames = [
    { gameType: "tic-tac-toe", label: "Tic Tac Toe", icon: "❌⭕" },
    { gameType: "chess", label: "Chess", icon: "♟️" },
    { gameType: "survival", label: "Survival", icon: "🧭" },
    { gameType: "dnd", label: "DND", icon: "🎲" }
  ];

  const state = { isOpen: false, isOpening: false, isStarting: false };

  function log(...args) {
    if (DEV_LOGS_ENABLED) console.log(...args);
  }

  function notify() {
    render();
  }

  function openGamesMenu() {
    if (state.isOpen || state.isOpening) return;
    state.isOpening = true;
    state.isOpen = true;
    log("Games menu opened");
    notify();
    window.requestAnimationFrame(() => { state.isOpening = false; notify(); });
  }

  function closeGamesMenu() {
    if (!state.isOpen) return;
    state.isOpen = false;
    notify();
  }

  function toggleGamesMenu() {
    if (state.isOpen) closeGamesMenu();
    else openGamesMenu();
  }

  function startGame(gameType, options = {}) {
    if (!window.socket || !gameType || state.isStarting) return;
    state.isStarting = true;
    notify();
    log("Starting game:", gameType);
    window.socket.emit("game:start", { gameType, ...options }, (res = {}) => {
      state.isStarting = false;
      notify();
      const gameId = res?.gameId || res?.state?.gameId;
      if (gameId) {
        window.currentGameId = gameId;
        window.GameSession?.open({ socket: window.socket, gameId, gameType });
        closeGamesMenu();
      }
    });
  }

  function render() {
    const modal = document.getElementById("gamesModal");
    const root = document.querySelector("#gamesModal .modalBody");
    if (!modal || !root) return;
    modal.hidden = !state.isOpen;
    modal.classList.toggle("modal-visible", state.isOpen);
    document.body.classList.toggle("modal-open", state.isOpen);
    if (!state.isOpen) return;

    root.innerHTML = `
      <section class="gamesModalSection">
        <h4>Start a Game</h4>
        <div class="gamesStartList" role="list">
          ${availableGames.map((g) => `
            <button class="gamesStartItem" data-start-game="${g.gameType}" type="button" role="listitem" ${state.isStarting ? "disabled" : ""}>
              <span class="gamesStartLabel">${g.icon} ${g.label}</span>
              <span class="gamesStartCta">${state.isStarting ? "Starting…" : "Start"}</span>
            </button>
          `).join("")}
        </div>
      </section>
      <section class="gamesModalSection">
        <h4>Active Game</h4>
        <div class="small muted" id="gamesActiveSummary">No active game in this room.</div>
        <div class="gamesActiveActions" id="gamesActiveActions"></div>
      </section>
    `;

    root.querySelectorAll("[data-start-game]").forEach((btn) => {
      btn.addEventListener("click", () => startGame(btn.dataset.startGame, { config: {} }));
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isOpen) closeGamesMenu();
  });

  window.GamesUI = { get isOpen() { return state.isOpen; }, openGamesMenu, closeGamesMenu, toggleGamesMenu, renderGamesMenu: render };
  window.openGamesMenu = openGamesMenu;
  window.closeGamesMenu = closeGamesMenu;
  window.toggleGamesMenu = toggleGamesMenu;
  window.GameManager = { startGame, availableGames };
  render();
})();
