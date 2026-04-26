"use strict";

const crypto = require("crypto");
const { getGameClass } = require("./GameRegistry");

function normalizeStatus(status) {
  if (status === "lobby" || status === "active" || status === "finished") return status;
  return "lobby";
}

class GameSessionService {
  constructor({ dbAllAsync, dbRunAsync } = {}) {
    this.dbAllAsync = dbAllAsync;
    this.dbRunAsync = dbRunAsync;
    this.sessionsById = new Map();
    this.sessionIdByRoom = new Map();
  }

  instantiateGame({ gameType, state, players, currentTurnIndex }) {
    const GameClass = getGameClass(gameType);
    if (!GameClass) throw new Error(`Unsupported game type: ${gameType}`);
    return new GameClass({ state, players, currentTurnIndex });
  }

  async loadPersistedSessions() {
    const sessions = await this.dbAllAsync(
      `SELECT id, room_id, game_type, state, status FROM game_sessions WHERE status IN ('lobby', 'active', 'finished')`
    );

    for (const row of sessions) {
      const players = await this.dbAllAsync(
        `SELECT user_id, username, connection_id, metadata
         FROM game_players
         WHERE session_id = ?
         ORDER BY joined_at ASC`,
        [row.id]
      );

      const parsedState = this.safeJson(row.state, {});
      const normalizedPlayers = players.map((p) => ({
        id: p.user_id,
        username: p.username,
        connectionId: p.connection_id || null,
        metadata: this.safeJson(p.metadata, {}),
      }));

      const game = this.instantiateGame({
        gameType: row.game_type,
        state: parsedState,
        players: normalizedPlayers,
        currentTurnIndex: Number(parsedState?.currentTurnIndex || 0),
      });

      const session = {
        id: row.id,
        roomId: row.room_id,
        gameType: row.game_type,
        state: parsedState,
        status: normalizeStatus(row.status),
        players: normalizedPlayers,
        game,
      };

      this.sessionsById.set(session.id, session);
      this.sessionIdByRoom.set(session.roomId, session.id);
    }
  }

  safeJson(value, fallback) {
    try {
      if (value == null || value === "") return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  async createSession({ roomId, gameType, creator }) {
    if (!roomId) throw new Error("Missing roomId");
    if (!creator?.id) throw new Error("Unauthorized");
    const existing = this.getSessionByRoom(roomId);
    if (existing && existing.status !== "finished") {
      throw new Error("Room already has an active game session");
    }

    const id = crypto.randomUUID();
    const game = this.instantiateGame({ gameType, state: {}, players: [] });

    const session = {
      id,
      roomId,
      gameType,
      state: {},
      status: "lobby",
      players: [],
      game,
    };

    this.sessionsById.set(id, session);
    this.sessionIdByRoom.set(roomId, id);

    await this.dbRunAsync(
      `INSERT INTO game_sessions (id, room_id, game_type, state, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'lobby', ?, ?)`,
      [id, roomId, gameType, JSON.stringify({}), Date.now(), Date.now()]
    );

    await this.joinSession({ roomId, player: creator });
    return this.getSessionById(id);
  }

  getSessionById(sessionId) {
    return this.sessionsById.get(sessionId) || null;
  }

  getSessionByRoom(roomId) {
    const sessionId = this.sessionIdByRoom.get(roomId);
    if (!sessionId) return null;
    return this.getSessionById(sessionId);
  }

  async joinSession({ roomId, player }) {
    const session = this.getSessionByRoom(roomId);
    if (!session) throw new Error("Game session not found");
    if (session.status !== "lobby") throw new Error("Game already started");
    if (!player?.id || !player?.username) throw new Error("Invalid player");

    const existing = session.players.find((p) => String(p.id) === String(player.id));
    if (existing) {
      existing.connectionId = player.connectionId || existing.connectionId;
      existing.metadata = player.metadata || existing.metadata || {};
    } else {
      session.players.push({
        id: player.id,
        username: player.username,
        connectionId: player.connectionId || null,
        metadata: player.metadata || {},
      });
    }

    session.game.setPlayers(session.players);
    await this.persistPlayers(session);
    await this.persistSession(session);
    return session;
  }

  async startSession({ roomId, playerId }) {
    const session = this.getSessionByRoom(roomId);
    if (!session) throw new Error("Game session not found");
    if (session.status !== "lobby") throw new Error("Game already started");
    const isInSession = session.players.some((p) => String(p.id) === String(playerId));
    if (!isInSession) throw new Error("Only joined players can start");
    const minPlayers = session.gameType === "tic-tac-toe" || session.gameType === "chess" ? 2 : 1;
    if (session.players.length < minPlayers) throw new Error(`Need at least ${minPlayers} players`);

    session.game.setPlayers(session.players);
    session.game.init();
    session.state = {
      ...session.game.state,
      currentTurnIndex: session.game.currentTurnIndex,
    };
    session.status = "active";

    await this.persistSession(session);
    return session;
  }

  async handleAction({ roomId, playerId, action }) {
    const session = this.getSessionByRoom(roomId);
    if (!session) throw new Error("Game session not found");
    if (session.status !== "active") throw new Error("Game is not active");
    const isInSession = session.players.some((p) => String(p.id) === String(playerId));
    if (!isInSession) throw new Error("You are not a game player");

    const result = session.game.handleAction(playerId, action);
    session.state = {
      ...session.game.state,
      currentTurnIndex: session.game.currentTurnIndex,
    };

    if (session.game.isFinished()) {
      session.status = "finished";
    }

    await this.persistSession(session);
    return { session, result };
  }

  async reconnectPlayer({ roomId, playerId, connectionId }) {
    const session = this.getSessionByRoom(roomId);
    if (!session) return null;
    const player = session.players.find((p) => String(p.id) === String(playerId));
    if (!player) return session;
    player.connectionId = connectionId;
    await this.persistPlayers(session);
    return session;
  }

  async persistPlayers(session) {
    await this.dbRunAsync(`DELETE FROM game_players WHERE session_id = ?`, [session.id]);
    for (const player of session.players) {
      await this.dbRunAsync(
        `INSERT INTO game_players (session_id, user_id, username, connection_id, metadata, joined_at)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          session.id,
          player.id,
          player.username,
          player.connectionId || null,
          JSON.stringify(player.metadata || {}),
          Date.now(),
        ]
      );
    }
  }

  async persistSession(session) {
    await this.dbRunAsync(
      `UPDATE game_sessions
       SET state = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(session.state || {}), session.status, Date.now(), session.id]
    );
  }

  buildPayloadForPlayer(session, playerId) {
    return {
      sessionId: session.id,
      roomId: session.roomId,
      gameType: session.gameType,
      status: session.status,
      currentTurnIndex: session.game.currentTurnIndex,
      players: session.players.map((p) => ({
        id: p.id,
        username: p.username,
        connectionId: p.connectionId,
        metadata: p.metadata || {},
      })),
      state: session.game.getVisibleState(playerId),
    };
  }
}

module.exports = GameSessionService;
