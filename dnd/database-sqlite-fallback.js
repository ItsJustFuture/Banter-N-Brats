"use strict";

// ===================================
// DND ROOM - SQLITE FALLBACK
// ===================================
// SQLite fallback for when PostgreSQL is unavailable

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_FILE = process.env.SQLITE_PATH || process.env.DB_FILE || path.join(__dirname, "..", "data", "dev.sqlite");
const db = new sqlite3.Database(DB_FILE);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Ensure tables exist
async function ensureTables() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS dnd_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        created_by_user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'lobby',
        world_state_json TEXT,
        round INTEGER NOT NULL DEFAULT 0,
        rng_seed INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    
    await run(`
      CREATE TABLE IF NOT EXISTS dnd_characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        race TEXT,
        gender TEXT,
        background TEXT,
        might INTEGER NOT NULL DEFAULT 3,
        finesse INTEGER NOT NULL DEFAULT 3,
        wit INTEGER NOT NULL DEFAULT 3,
        instinct INTEGER NOT NULL DEFAULT 3,
        presence INTEGER NOT NULL DEFAULT 3,
        resolve INTEGER NOT NULL DEFAULT 3,
        chaos INTEGER NOT NULL DEFAULT 3,
        skills_json TEXT,
        perks_json TEXT,
        hp INTEGER NOT NULL DEFAULT 100,
        max_hp INTEGER NOT NULL DEFAULT 100,
        alive INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(session_id, user_id)
      )
    `);

    await run("ALTER TABLE dnd_characters ADD COLUMN race TEXT").catch(() => {});
    await run("ALTER TABLE dnd_characters ADD COLUMN gender TEXT").catch(() => {});
    await run("ALTER TABLE dnd_characters ADD COLUMN background TEXT").catch(() => {});
    
    await run(`
      CREATE TABLE IF NOT EXISTS dnd_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        round INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        text TEXT NOT NULL,
        involved_character_ids_json TEXT,
        outcome_json TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    
    // Create indexes if they don't exist
    await run("CREATE INDEX IF NOT EXISTS idx_dnd_sessions_room ON dnd_sessions(room_id)");
    await run("CREATE INDEX IF NOT EXISTS idx_dnd_characters_session ON dnd_characters(session_id)");
    await run("CREATE INDEX IF NOT EXISTS idx_dnd_events_session ON dnd_events(session_id)");
  } catch (err) {
    console.error("[dnd-sqlite] ensureTables error:", err.message);
  }
}

// Initialize tables on module load
ensureTables().catch(err => console.error("[dnd-sqlite] init error:", err));

async function createDndSession(params) {
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
  
  const result = await run(
    `INSERT INTO dnd_sessions 
     (room_id, created_by_user_id, title, status, world_state_json, round, rng_seed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [roomId, createdByUserId, title, status, worldState, 0, rngSeed, now, now]
  );
  
  return await get("SELECT * FROM dnd_sessions WHERE id = ?", [result.lastID]);
}

async function getDndSession(sessionId) {
  return await get("SELECT * FROM dnd_sessions WHERE id = ?", [sessionId]);
}

async function updateDndSession(sessionId, updates) {
  const now = Date.now();
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === "world_state") {
      fields.push("world_state_json = ?");
      values.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  fields.push("updated_at = ?");
  values.push(now);
  values.push(sessionId);
  
  await run(
    `UPDATE dnd_sessions SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  
  return await get("SELECT * FROM dnd_sessions WHERE id = ?", [sessionId]);
}

async function getActiveDndSession(roomId) {
  return await get(
    "SELECT * FROM dnd_sessions WHERE room_id = ? AND status IN ('lobby', 'active') ORDER BY created_at DESC LIMIT 1",
    [roomId]
  );
}

async function createDndCharacter(params) {
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
  
  const result = await run(
    `INSERT INTO dnd_characters 
     (session_id, user_id, display_name, avatar_url, race, gender, age, background, traits, abilities,
      might, finesse, wit, instinct, presence, resolve, chaos,
      skills_json, perks_json, hp, max_hp, alive, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId, userId, displayName, avatarUrl, race, gender, age, background, traits, abilities,
      attributes.might, attributes.finesse, attributes.wit,
      attributes.instinct, attributes.presence, attributes.resolve, attributes.chaos,
      JSON.stringify(skills), JSON.stringify(perks),
      hp, maxHp, 1, now, now
    ]
  );
  
  return await get("SELECT * FROM dnd_characters WHERE id = ?", [result.lastID]);
}

async function updateDndCharacter(characterId, updates) {
  const now = Date.now();
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === "skills") {
      fields.push("skills_json = ?");
      values.push(JSON.stringify(value));
    } else if (key === "perks") {
      fields.push("perks_json = ?");
      values.push(JSON.stringify(value));
    } else if (key === "attributes") {
      for (const [attr, val] of Object.entries(value)) {
        fields.push(`${attr} = ?`);
        values.push(val);
      }
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  fields.push("updated_at = ?");
  values.push(now);
  values.push(characterId);
  
  await run(
    `UPDATE dnd_characters SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  
  return await get("SELECT * FROM dnd_characters WHERE id = ?", [characterId]);
}

async function getDndCharacters(sessionId) {
  return await all(
    "SELECT * FROM dnd_characters WHERE session_id = ? ORDER BY created_at ASC",
    [sessionId]
  );
}

async function getDndCharacterByUser(userId, sessionId) {
  return await get(
    "SELECT * FROM dnd_characters WHERE user_id = ? AND session_id = ?",
    [userId, sessionId]
  );
}

async function createDndEvent(params) {
  const {
    sessionId,
    round,
    eventType,
    text,
    involvedCharacterIds,
    outcome
  } = params;
  
  const now = Date.now();
  
  const result = await run(
    `INSERT INTO dnd_events 
     (session_id, round, event_type, text, involved_character_ids_json, outcome_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, round, eventType, text, JSON.stringify(involvedCharacterIds), JSON.stringify(outcome), now]
  );
  
  return await get("SELECT * FROM dnd_events WHERE id = ?", [result.lastID]);
}

async function getDndEvents(sessionId, limit = 50) {
  return await all(
    "SELECT * FROM dnd_events WHERE session_id = ? ORDER BY round DESC, created_at DESC LIMIT ?",
    [sessionId, limit]
  );
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
