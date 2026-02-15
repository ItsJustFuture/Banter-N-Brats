(function initStatusColors(globalObj) {
  const STATUS_COLOR_MAP = Object.freeze({
    online: "#22c55e",
    away: "#facc15",
    busy: "#c2410c",
    dnd: "#ef4444",
    idle: "#808080",
    gaming: "#1e3a8a",
    music: "#38bdf8",
    working: "#7c3aed",
    chatting: "#ffffff",
    lurking: "#3f0000",
    offline: "#000000",
  });

  const STATUS_LABEL_ALIASES = Object.freeze({
    "do not disturb": "dnd",
    dnd: "dnd",
    invisible: "lurking",
    listening to music: "music",
    looking to chat: "chatting",
  });

  function normalizeStatusKey(input, fallback = "offline") {
    const raw = String(input || "").trim().toLowerCase();
    if (!raw) return fallback;
    const key = STATUS_LABEL_ALIASES[raw] || raw;
    return STATUS_COLOR_MAP[key] ? key : fallback;
  }

  function getStatusColor(input, fallback = STATUS_COLOR_MAP.offline) {
    const key = normalizeStatusKey(input, "offline");
    return STATUS_COLOR_MAP[key] || fallback;
  }

  globalObj.StatusColors = Object.freeze({
    STATUS_COLOR_MAP,
    normalizeStatusKey,
    getStatusColor,
    selectableStatuses: Object.freeze(["online", "away", "busy", "dnd", "gaming", "music", "working", "chatting", "lurking"]),
  });
})(window);
