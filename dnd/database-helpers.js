"use strict";

// ===================================
// DND ROOM - DATABASE HELPERS
// ===================================
// Follows the same pattern as Survival Simulator's DB functions

/**
 * Create a new DnD session
 * @param {Object} params - Session parameters
 * @returns {Promise<Object>} Created session
 */
async function createDndSession(db, params) {
  const {
    roomId,
    createdByUserId,
    title,
    rngSeed,
    status = "lobby"
  } = params;
  
  const now = Date.now();
  const worldState = JSON.stringify({
    morale: 50,
    reputation: 0,
    allies: [],
    discoveries: []
  });
  
  try {
    // Try PostgreSQL first
    const result = await db.query(
      `INSERT INTO dnd_sessions 
       (room_id, created_by_user_id, title, status, world_state_json, round, rng_seed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [roomId, createdByUserId, title, status, worldState, 0, rngSeed, now, now]
    );
    return result.rows[0];
  } catch (pgErr) {
    // Fallback to SQLite
    console.log("[dnd-db] PostgreSQL not available, using SQLite");
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.createDndSession(params);
  }
}

/**
 * Get a DnD session by ID
 * @param {Object} db - Database client
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object|null>} Session object or null
 */
async function getDndSession(db, sessionId) {
  try {
    // Try PostgreSQL first
    const result = await db.query(
      "SELECT * FROM dnd_sessions WHERE id = $1",
      [sessionId]
    );
    return result.rows[0] || null;
  } catch (pgErr) {
    // Fallback to SQLite
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.getDndSession(sessionId);
  }
}

/**
 * Update a DnD session
 * @param {Object} db - Database client
 * @param {number} sessionId - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated session
 */
async function updateDndSession(db, sessionId, updates) {
  const now = Date.now();
  const fields = [];
  const values = [];
  let idx = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === "world_state") {
      fields.push(`world_state_json = $${idx++}`);
      values.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  
  fields.push(`updated_at = $${idx++}`);
  values.push(now);
  values.push(sessionId);
  
  try {
    const result = await db.query(
      `UPDATE dnd_sessions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.updateDndSession(sessionId, updates);
  }
}

/**
 * Get active session for a room
 * @param {Object} db - Database client
 * @param {number} roomId - Room ID
 * @returns {Promise<Object|null>} Active session or null
 */
async function getActiveDndSession(db, roomId) {
  try {
    const result = await db.query(
      "SELECT * FROM dnd_sessions WHERE room_id = $1 AND status IN ('lobby', 'active') ORDER BY created_at DESC LIMIT 1",
      [roomId]
    );
    return result.rows[0] || null;
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.getActiveDndSession(roomId);
  }
}

/**
 * Create a character for a session
 * @param {Object} db - Database client
 * @param {Object} params - Character parameters
 * @returns {Promise<Object>} Created character
 */
async function createDndCharacter(db, params) {
  const {
    sessionId,
    userId,
    displayName,
    avatarUrl,
    race,
    gender,
    age,
    background,
    traits,
    abilities,
    attributes,
    skills,
    perks,
    hp = 100,
    maxHp = 100
  } = params;
  
  const now = Date.now();
  
  try {
    const result = await db.query(
      `INSERT INTO dnd_characters 
       (session_id, user_id, display_name, avatar_url, race, gender, age, background, traits, abilities,
        might, finesse, wit, instinct, presence, resolve, chaos,
        skills_json, perks_json, hp, max_hp, alive, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *`,
      [
        sessionId, userId, displayName, avatarUrl, race, gender, age, background, traits, abilities,
        attributes.might, attributes.finesse, attributes.wit,
        attributes.instinct, attributes.presence, attributes.resolve, attributes.chaos,
        JSON.stringify(skills), JSON.stringify(perks),
        hp, maxHp, true, now, now
      ]
    );
    return result.rows[0];
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.createDndCharacter(params);
  }
}

/**
 * Update a character
 * @param {Object} db - Database client
 * @param {number} characterId - Character ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated character
 */
async function updateDndCharacter(db, characterId, updates) {
  const now = Date.now();
  const fields = [];
  const values = [];
  let idx = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === "skills") {
      fields.push(`skills_json = $${idx++}`);
      values.push(JSON.stringify(value));
    } else if (key === "perks") {
      fields.push(`perks_json = $${idx++}`);
      values.push(JSON.stringify(value));
    } else if (key === "attributes") {
      for (const [attr, val] of Object.entries(value)) {
        fields.push(`${attr} = $${idx++}`);
        values.push(val);
      }
    } else {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  
  fields.push(`updated_at = $${idx++}`);
  values.push(now);
  values.push(characterId);
  
  try {
    const result = await db.query(
      `UPDATE dnd_characters SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.updateDndCharacter(characterId, updates);
  }
}

/**
 * Get all characters for a session
 * @param {Object} db - Database client
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array<Object>>} Characters
 */
async function getDndCharacters(db, sessionId) {
  try {
    const result = await db.query(
      "SELECT * FROM dnd_characters WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    );
    return result.rows;
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.getDndCharacters(sessionId);
  }
}

/**
 * Get a character by user and session
 * @param {Object} db - Database client
 * @param {number} userId - User ID
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object|null>} Character or null
 */
async function getDndCharacterByUser(db, userId, sessionId) {
  try {
    const result = await db.query(
      "SELECT * FROM dnd_characters WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );
    return result.rows[0] || null;
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.getDndCharacterByUser(userId, sessionId);
  }
}

/**
 * Create an event record
 * @param {Object} db - Database client
 * @param {Object} params - Event parameters
 * @returns {Promise<Object>} Created event
 */
async function createDndEvent(db, params) {
  const {
    sessionId,
    round,
    eventType,
    text,
    involvedCharacterIds,
    outcome
  } = params;
  
  const now = Date.now();
  
  try {
    const result = await db.query(
      `INSERT INTO dnd_events 
       (session_id, round, event_type, text, involved_character_ids_json, outcome_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sessionId, round, eventType, text, JSON.stringify(involvedCharacterIds), JSON.stringify(outcome), now]
    );
    return result.rows[0];
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.createDndEvent(params);
  }
}

/**
 * Get events for a session
 * @param {Object} db - Database client
 * @param {number} sessionId - Session ID
 * @param {number} limit - Max number of events to return
 * @returns {Promise<Array<Object>>} Events
 */
async function getDndEvents(db, sessionId, limit = 50) {
  try {
    const result = await db.query(
      "SELECT * FROM dnd_events WHERE session_id = $1 ORDER BY round DESC, created_at DESC LIMIT $2",
      [sessionId, limit]
    );
    return result.rows;
  } catch (pgErr) {
    const sqlite = require("./database-sqlite-fallback");
    return await sqlite.getDndEvents(sessionId, limit);
  }
}

module.exports = {
  createDndSession,
  getDndSession,
  updateDndSession,
  getActiveDndSession,
  createDndCharacter,
  updateDndCharacter,
  getDndCharacters,
  getDndCharacterByUser,
  createDndEvent,
  getDndEvents
};
