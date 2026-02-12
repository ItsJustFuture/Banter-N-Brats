"use strict";

const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const DEFAULT_SQLITE_PATH = path.join(__dirname, "data", "dev.sqlite");
const DB_FILE = process.env.SQLITE_PATH || process.env.DB_FILE || DEFAULT_SQLITE_PATH;
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3.Database(DB_FILE);

const DEFAULT_ROLE_SYMBOL_PREFS = {
  vip_gemstone: "diamond",
  vip_color_variant: "blue",
  moderator_gemstone: "onyx",
  moderator_color_variant: "blue",
  enable_animations: 1,
};

function normalizeRoleSymbolUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
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

async function columnExists(table, column) {
  try {
    const rows = await all(`PRAGMA table_info(${table})`);
    return rows.some((r) => r.name === column);
  } catch (err) {
    console.error(`[database] columnExists error for ${table}.${column}:`, err.message);
    return false;
  }
}

async function addColumnIfMissing(table, column, definition) {
  try {
    const exists = await columnExists(table, column);
    if (exists) return false;
    await run(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    return true;
  } catch (err) {
    console.error(`[database] addColumnIfMissing error for ${table}.${column}:`, err.message);
    return false;
  }
}

async function ensureColumns(table, cols) {
  for (const [colName, ddl] of cols) {
    try {
      await addColumnIfMissing(table, colName, ddl);
    } catch (err) {
      console.error(`[database] ensureColumns error for ${table}.${colName}:`, err.message);
    }
  }
}

async function migrateLegacyPasswords() {
  try {
    const rows = await all("PRAGMA table_info(users)");
    const hasPasswordHash = rows.some((r) => r.name === "password_hash");
    const hasLegacyPassword = rows.some((r) => r.name === "password");
    if (!hasPasswordHash || !hasLegacyPassword) return;

    const legacyRows = await all(
      `SELECT id, password, password_hash FROM users
         WHERE (password_hash IS NULL OR password_hash = '') AND password IS NOT NULL`
    );

    if (!legacyRows?.length) return;

    for (const row of legacyRows) {
      try {
        const legacy = String(row.password || "");
        if (!legacy) continue;
        const hash = legacy.startsWith("$2") ? legacy : await bcrypt.hash(legacy, 10);
        await run("UPDATE users SET password_hash = ?, password = NULL WHERE id = ?", [hash, row.id]);
      } catch (err) {
        console.error(`[database] migrateLegacyPasswords error for user ${row.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[database] migrateLegacyPasswords error:', err.message);
  }
}

async function seedDefaultRooms() {
  const now = Date.now();
  const seedRooms = [
    { name: "main", roomId: "R1" },
    { name: "nsfw", roomId: "R3" },
    { name: "music", roomId: "R2" },
    { name: "diceroom", roomId: "R4" },
    { name: "survivalsimulator", roomId: "R5" },
    { name: "dnd", roomId: "R6", description: "DnD room" },
  ];
  // Discovery: core room seeding runs in SQLite during migrations for room structure persistence.
  const existing = await all(`SELECT name FROM rooms LIMIT 1`);
  if (existing && existing.length) return;
  for (const r of seedRooms) {
    await run(
      `INSERT OR IGNORE INTO rooms (name, created_by, created_at, room_id, description) VALUES (?, NULL, ?, ?, ?)`,
      [r.name, now, r.roomId ?? null, r.description ?? null]
    );
  }
}

async function ensureRoomHierarchySqlite() {
  const now = Date.now();
  await run(`
    CREATE TABLE IF NOT EXISTS room_master_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS room_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      master_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      UNIQUE(master_id, name)
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_room_categories_master ON room_categories(master_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_room_categories_master_sort ON room_categories(master_id, sort_order)`);

  await ensureColumns("rooms", [
    ["category_id", "category_id INTEGER"],
    ["room_sort_order", "room_sort_order INTEGER NOT NULL DEFAULT 0"],
    ["created_by_user_id", "created_by_user_id INTEGER"],
    ["is_user_room", "is_user_room INTEGER NOT NULL DEFAULT 0"],
    ["is_system", "is_system INTEGER NOT NULL DEFAULT 0"],
  ]);
  await run(`CREATE INDEX IF NOT EXISTS idx_rooms_category_sort ON rooms(category_id, room_sort_order)`);

  await ensureColumns("users", [
    ["room_master_collapsed", "room_master_collapsed TEXT NOT NULL DEFAULT '{}'"],
    ["room_category_collapsed", "room_category_collapsed TEXT NOT NULL DEFAULT '{}'"],
  ]);

  const masterSeed = [
    { name: "Site Rooms", sort_order: 0 },
    { name: "User Rooms", sort_order: 1 },
  ];

  for (const m of masterSeed) {
    await run(
      `INSERT OR IGNORE INTO room_master_categories (name, sort_order, created_at) VALUES (?, ?, ?)`,
      [m.name, m.sort_order, now]
    );
  }

  const masters = await all(`SELECT id, name FROM room_master_categories`);
  const masterByName = new Map(masters.map((m) => [m.name, m.id]));

  for (const master of masters) {
    await run(
      `INSERT OR IGNORE INTO room_categories (master_id, name, sort_order, created_at) VALUES (?, 'Uncategorized', 0, ?)`,
      [master.id, now]
    );
  }

  const categories = await all(
    `SELECT id, master_id, name FROM room_categories WHERE lower(name) = 'uncategorized'`
  );
  const uncategorizedByMasterId = new Map(categories.map((c) => [c.master_id, c.id]));

  const rooms = await all(
    `SELECT name, category_id, created_by, created_by_user_id, is_user_room FROM rooms`
  );

  for (const room of rooms) {
    if (room.category_id != null) continue;
    const createdBy = room.created_by_user_id ?? room.created_by ?? null;
    const isUserRoom = Number(room.is_user_room || 0) === 1 || createdBy != null;
    const masterName = isUserRoom ? "User Rooms" : "Site Rooms";
    const masterId = masterByName.get(masterName);
    const categoryId = masterId ? uncategorizedByMasterId.get(masterId) : null;
    if (!categoryId) continue;
    await run(`UPDATE rooms SET category_id=?, room_sort_order=COALESCE(room_sort_order, 0) WHERE name=?`, [
      categoryId,
      room.name,
    ]);
  }

  await run(`UPDATE rooms SET room_sort_order=0 WHERE room_sort_order IS NULL`);
}

async function runSqliteMigrations() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'User',
      created_at INTEGER NOT NULL,
      avatar TEXT,
      bio TEXT,
      mood TEXT,
      age INTEGER,
      gender TEXT,
      last_seen INTEGER,
      last_room TEXT,
      last_status TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS rooms (
      name TEXT PRIMARY KEY,
      created_by INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  // Discovery: room hierarchy lives in room_master_categories/room_categories + rooms columns (sort order + category).
  await ensureColumns("rooms", [
    ["room_id", "room_id TEXT"],
    ["description", "description TEXT"],
    ["slowmode_seconds", "slowmode_seconds INTEGER NOT NULL DEFAULT 0"],
    ["is_locked", "is_locked INTEGER NOT NULL DEFAULT 0"],
    ["pinned_message_ids", "pinned_message_ids TEXT"],
    ["maintenance_mode", "maintenance_mode INTEGER NOT NULL DEFAULT 0"],
    ["vip_only", "vip_only INTEGER NOT NULL DEFAULT 0"],
    ["staff_only", "staff_only INTEGER NOT NULL DEFAULT 0"],
    ["min_level", "min_level INTEGER NOT NULL DEFAULT 0"],
    ["events_enabled", "events_enabled INTEGER NOT NULL DEFAULT 1"],
    ["archived", "archived INTEGER NOT NULL DEFAULT 0"],
    ["is_system", "is_system INTEGER NOT NULL DEFAULT 0"],
  ]);

  await ensureRoomHierarchySqlite();

  await seedDefaultRooms();

  await run(`
    CREATE TABLE IF NOT EXISTS survival_seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      created_by_user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      day_index INTEGER NOT NULL DEFAULT 1,
      phase TEXT NOT NULL DEFAULT 'day',
      rng_seed TEXT,
      arena_state_json TEXT,
      winner_rewarded INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await ensureColumns("survival_seasons", [
    ["arena_state_json", "arena_state_json TEXT"],
    ["winner_rewarded", "winner_rewarded INTEGER NOT NULL DEFAULT 0"],
  ]);

  await run(`
    CREATE TABLE IF NOT EXISTS survival_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      alive INTEGER NOT NULL DEFAULT 1,
      hp INTEGER NOT NULL DEFAULT 100,
      kills INTEGER NOT NULL DEFAULT 0,
      alliance_id INTEGER,
      inventory_json TEXT DEFAULT '[]',
      traits_json TEXT DEFAULT '{}',
      location TEXT,
      last_event_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (season_id) REFERENCES survival_seasons(id) ON DELETE CASCADE
    )
  `);

  await ensureColumns("survival_participants", [
    ["location", "location TEXT"],
  ]);
  await run(`CREATE INDEX IF NOT EXISTS idx_survival_participants_season ON survival_participants(season_id)`);

  await run(`
    CREATE TABLE IF NOT EXISTS survival_alliances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (season_id) REFERENCES survival_seasons(id) ON DELETE CASCADE
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_survival_alliances_season ON survival_alliances(season_id)`);

  await run(`
    CREATE TABLE IF NOT EXISTS survival_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      day_index INTEGER NOT NULL,
      phase TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      involved_user_ids_json TEXT DEFAULT '[]',
      outcome_json TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (season_id) REFERENCES survival_seasons(id) ON DELETE CASCADE
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_survival_events_season ON survival_events(season_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_survival_events_day_phase ON survival_events(season_id, day_index, phase)`);

  // Backfill new survival columns safely for older installs
  await ensureColumns("survival_seasons", [
    ["arena_state_json", "arena_state_json TEXT"],
    ["winner_rewarded", "winner_rewarded INTEGER NOT NULL DEFAULT 0"],
  ]);
  await ensureColumns("survival_participants", [
    ["location", "location TEXT"],
  ]);

  const userColumns = [
    ["password_hash", "password_hash TEXT"],
    ["role", "role TEXT NOT NULL DEFAULT 'User'"],
    ["created_at", "created_at INTEGER"],
    ["avatar", "avatar TEXT"],
    ["bio", "bio TEXT"],
    ["mood", "mood TEXT"],
    ["age", "age INTEGER"],
    ["gender", "gender TEXT"],
    ["last_seen", "last_seen INTEGER"],
    ["last_room", "last_room TEXT"],
    ["last_status", "last_status TEXT"],
    ["theme", "theme TEXT NOT NULL DEFAULT 'Minimal Dark'"],
    ["prefs_json", "prefs_json TEXT NOT NULL DEFAULT '{}'"],
    ["gold", "gold INTEGER NOT NULL DEFAULT 0"],
    ["xp", "xp INTEGER NOT NULL DEFAULT 0"],
    ["level", "level INTEGER NOT NULL DEFAULT 1"],
    ["lastXpMessageAt", "lastXpMessageAt INTEGER"],
    ["lastMessageXpAt", "lastMessageXpAt INTEGER"],
    ["lastLoginXpAt", "lastLoginXpAt INTEGER"],
    ["lastOnlineXpAt", "lastOnlineXpAt INTEGER"],
    ["lastDailyLoginAt", "lastDailyLoginAt INTEGER"],
    ["lastGoldTickAt", "lastGoldTickAt INTEGER"],
    ["lastMessageGoldAt", "lastMessageGoldAt INTEGER"],
    ["lastDailyLoginGoldAt", "lastDailyLoginGoldAt INTEGER"],
    ["lastDiceRollAt", "lastDiceRollAt INTEGER"],
    ["dice_sixes", "dice_sixes INTEGER NOT NULL DEFAULT 0"],
    ["dice_total_rolls", "dice_total_rolls INTEGER NOT NULL DEFAULT 0"],
    ["dice_total_won", "dice_total_won INTEGER NOT NULL DEFAULT 0"],
    ["dice_biggest_win", "dice_biggest_win INTEGER NOT NULL DEFAULT 0"],
    ["dice_win_streak", "dice_win_streak INTEGER NOT NULL DEFAULT 0"],
    ["dice_current_streak", "dice_current_streak INTEGER NOT NULL DEFAULT 0"],
    ["luck", "luck REAL NOT NULL DEFAULT 0"],
    ["roll_streak", "roll_streak INTEGER NOT NULL DEFAULT 0"],
    ["last_qual_msg_hash", "last_qual_msg_hash TEXT"],
    ["last_qual_msg_at", "last_qual_msg_at INTEGER"],
    ["vibe_tags", "vibe_tags TEXT"],
    ["header_grad_a", "header_grad_a TEXT"],
    ["header_grad_b", "header_grad_b TEXT"],
    ["banner_url", "banner_url TEXT"],
    ["banner_gradient", "banner_gradient TEXT"],
    ["banner_style", "banner_style TEXT DEFAULT 'cover'"],
    ["custom_status", "custom_status TEXT"],
    ["status_emoji", "status_emoji TEXT"],
    ["status_color", "status_color TEXT"],
    ["status_expires_at", "status_expires_at INTEGER"],
  ];
  await ensureColumns("users", userColumns);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_username_nocase ON users(username COLLATE NOCASE)`);
  await run("UPDATE users SET vibe_tags='[]' WHERE vibe_tags IS NULL");
  await run("UPDATE users SET prefs_json='{}' WHERE prefs_json IS NULL OR prefs_json='' ");

  await migrateLegacyPasswords();

  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      text TEXT,
      tone TEXT,
      ts INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      attachment_url TEXT,
      attachment_type TEXT,
      attachment_mime TEXT,
      attachment_size INTEGER
    )
  `);

  await ensureColumns("messages", [
    ["reply_to_id", "reply_to_id INTEGER"],
    ["reply_to_user", "reply_to_user TEXT"],
    ["reply_to_text", "reply_to_text TEXT"],
    ["edited_at", "edited_at INTEGER"],
    ["tone", "tone TEXT"],
  ]);

  await run(`
    CREATE TABLE IF NOT EXISTS reactions (
      message_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      PRIMARY KEY (message_id, username)
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS message_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      room TEXT NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(message_id, room, username, emoji)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id, room)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(username)`);

  await run(`
    CREATE TABLE IF NOT EXISTS punishments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      expires_at INTEGER,
      reason TEXT,
      by_user_id INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  // Discovery: mod_logs persist moderation actions (mute/ban/kick/warn/report).
  await run(`
    CREATE TABLE IF NOT EXISTS mod_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      actor_user_id INTEGER,
      actor_username TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      target_username TEXT,
      room TEXT,
      details TEXT
    )
  `);


// --- Kick/Ban restrictions + appeals (persistent)
// Discovery: restrictions + appeals are stored in user_restrictions + appeals/appeal_messages.
await run(`
  CREATE TABLE IF NOT EXISTS user_restrictions (
    username TEXT PRIMARY KEY,
    restriction_type TEXT NOT NULL DEFAULT 'none', -- 'none'|'kick'|'ban'
    reason TEXT,
    set_by TEXT,
    set_at INTEGER NOT NULL,
    expires_at INTEGER,
    updated_at INTEGER NOT NULL
  )
`);

await run(`
  CREATE TABLE IF NOT EXISTS moderation_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_username TEXT NOT NULL,
    actor_username TEXT,
    action_type TEXT NOT NULL,
    reason TEXT,
    duration_seconds INTEGER,
    expires_at INTEGER,
    created_at INTEGER NOT NULL
  )
`);

  await run(`
    CREATE TABLE IF NOT EXISTS daily_challenge_progress (
      user_id INTEGER NOT NULL,
      day_key TEXT NOT NULL,
      progress_json TEXT NOT NULL DEFAULT '{}',
      claimed_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, day_key)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reward_type TEXT,
      reward_value TEXT,
      active_date TEXT NOT NULL,
      UNIQUE(challenge_id, active_date)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS user_challenge_progress (
      username TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      PRIMARY KEY(username, challenge_id, completed_date)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_challenge_progress ON user_challenge_progress(username, completed_date)`);
  await run(`
    INSERT OR IGNORE INTO daily_challenges (challenge_id, title, description, reward_type, reward_value, active_date) VALUES
    ('daily-messages-50', 'Chatterbox', 'Send 50 messages today', 'gold', '100', '2026-02-09'),
    ('daily-chess-3', 'Chess Champion', 'Win 3 chess games today', 'badge', 'daily-chess-master', '2026-02-09'),
    ('daily-theme', 'Theme Explorer', 'Try a new theme today', 'gold', '50', '2026-02-09'),
    ('daily-dice-5', 'Lucky Roller', 'Play 5 dice games today', 'xp', '100', '2026-02-09')
  `);


await run(`
  CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    restriction_type TEXT NOT NULL, -- 'kick'|'ban'
    reason_at_time TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open'|'resolved'|'closed'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_admin_reply_at INTEGER,
    last_user_reply_at INTEGER
  )
`);
await run(`CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status)`);
await run(`CREATE INDEX IF NOT EXISTS idx_appeals_username ON appeals(username)`);

  await run(`
    CREATE TABLE IF NOT EXISTS appeal_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appeal_id INTEGER NOT NULL,
    author_role TEXT NOT NULL, -- 'user'|'admin'
    author_name TEXT,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (appeal_id) REFERENCES appeals(id) ON DELETE CASCADE
  )
`);
await run(`CREATE INDEX IF NOT EXISTS idx_appeal_messages_appeal ON appeal_messages(appeal_id)`);

  await run(`
    CREATE TABLE IF NOT EXISTS profile_likes (
      user_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, target_user_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      room_id TEXT,
      type TEXT NOT NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      created_at INTEGER NOT NULL,
      metadata TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      pinned INTEGER NOT NULL DEFAULT 0,
      seen INTEGER NOT NULL DEFAULT 0
    )
  `);
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_user_key ON memories(user_id, key)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_memories_user_created ON memories(user_id, created_at DESC)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_memories_user_pinned ON memories(user_id, pinned)`);

  await run(`
    CREATE TABLE IF NOT EXISTS memory_settings (
      user_id INTEGER PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      last_seen_at INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS changelog_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seq INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      author_id INTEGER NOT NULL
    )
  `);
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_changelog_seq ON changelog_entries(seq)`);

  await run(`
    CREATE TABLE IF NOT EXISTS changelog_reactions (
      entry_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reaction TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(entry_id, user_id, reaction)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_changelog_react_entry ON changelog_reactions(entry_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_changelog_react_user ON changelog_reactions(user_id)`);

  await run(`
    CREATE TABLE IF NOT EXISTS faq_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      question_title TEXT NOT NULL,
      question_details TEXT,
      answer_body TEXT,
      answered_at INTEGER,
      answered_by INTEGER,
      is_deleted INTEGER NOT NULL DEFAULT 0
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_faq_created_at ON faq_questions(created_at DESC)`);

  await run(`
    CREATE TABLE IF NOT EXISTS faq_reactions (
      question_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      reaction_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(question_id, username, reaction_key)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_faq_react_question ON faq_reactions(question_id)`);

  await run(`
    CREATE TABLE IF NOT EXISTS command_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      executor_id INTEGER NOT NULL,
      executor_username TEXT NOT NULL,
      executor_role TEXT NOT NULL,
      command_name TEXT NOT NULL,
      args_json TEXT,
      target_ids TEXT,
      room TEXT,
      success INTEGER NOT NULL,
      error TEXT,
      ts INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS dm_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      is_group INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS dm_participants (
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      added_by INTEGER,
      joined_at INTEGER NOT NULL,
      UNIQUE(thread_id, user_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS dm_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      text TEXT,
      tone TEXT,
      ts INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  await ensureColumns("dm_messages", [
    ["reply_to_id", "reply_to_id INTEGER"],
    ["reply_to_user", "reply_to_user TEXT"],
    ["reply_to_text", "reply_to_text TEXT"],
    ["edited_at", "edited_at INTEGER"],
    ["tone", "tone TEXT"],
    ["attachment_url", "attachment_url TEXT"],
    ["attachment_mime", "attachment_mime TEXT"],
    ["attachment_type", "attachment_type TEXT"],
    ["attachment_size", "attachment_size INTEGER"],
    ["deleted", "deleted INTEGER NOT NULL DEFAULT 0"],
]);
  // DM reactions (1 reaction per user per DM message)
  await run(`
    CREATE TABLE IF NOT EXISTS dm_reactions (
      thread_id INTEGER NOT NULL,
      message_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      PRIMARY KEY (thread_id, message_id, username)
    )
  `);


  await ensureColumns("dm_threads", [
    ["title", "title TEXT"],
    ["is_group", "is_group INTEGER NOT NULL DEFAULT 0"],
    ["created_by", "created_by INTEGER NOT NULL DEFAULT 0"],
    ["created_at", "created_at INTEGER NOT NULL DEFAULT 0"],
    ["user_low", "user_low INTEGER"],
    ["user_high", "user_high INTEGER"],
    ["last_message_id", "last_message_id INTEGER"],
    ["last_message_at", "last_message_at INTEGER"],
    ["participants_key", "participants_key TEXT"],
    ["participants_json", "participants_json TEXT"],
  ]);

  await ensureColumns("dm_participants", [
    ["added_by", "added_by INTEGER"],
    ["joined_at", "joined_at INTEGER NOT NULL DEFAULT 0"],
    ["last_read_at", "last_read_at INTEGER NOT NULL DEFAULT 0"],
  ]);

  await run(`CREATE INDEX IF NOT EXISTS idx_dm_participants_user ON dm_participants(user_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_dm_participants_thread ON dm_participants(thread_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_ts ON dm_messages(thread_id, ts)`);
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_threads_pair
       ON dm_threads(user_low, user_high)
       WHERE is_group = 0 AND user_low IS NOT NULL AND user_high IS NOT NULL`
  );
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_threads_group_key
       ON dm_threads(participants_key)
       WHERE is_group = 1 AND participants_key IS NOT NULL`
  );

  // --- Chess (games, challenges, ratings)
  await run(`
    CREATE TABLE IF NOT EXISTS chess_user_stats (
      user_id INTEGER PRIMARY KEY,
      chess_elo INTEGER NOT NULL DEFAULT 1200,
      chess_games_played INTEGER NOT NULL DEFAULT 0,
      chess_wins INTEGER NOT NULL DEFAULT 0,
      chess_losses INTEGER NOT NULL DEFAULT 0,
      chess_draws INTEGER NOT NULL DEFAULT 0,
      chess_peak_elo INTEGER NOT NULL DEFAULT 1200,
      chess_last_game_at INTEGER,
      updated_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS chess_games (
      game_id TEXT PRIMARY KEY,
      context_type TEXT NOT NULL,
      context_id TEXT NOT NULL,
      white_user_id INTEGER,
      black_user_id INTEGER,
      fen TEXT NOT NULL,
      pgn TEXT NOT NULL,
      status TEXT NOT NULL,
      turn TEXT NOT NULL,
      result TEXT,
      rated INTEGER,
      rated_reason TEXT,
      plies_count INTEGER NOT NULL DEFAULT 0,
      draw_offer_by_user_id INTEGER,
      draw_offer_at INTEGER,
      white_elo_change INTEGER,
      black_elo_change INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_move_at INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS chess_challenges (
      challenge_id TEXT PRIMARY KEY,
      dm_thread_id INTEGER NOT NULL,
      challenger_user_id INTEGER NOT NULL,
      challenged_user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_chess_games_context ON chess_games(context_type, context_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_chess_games_status ON chess_games(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_chess_challenges_thread ON chess_challenges(dm_thread_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_chess_challenges_status ON chess_challenges(status)`);

  // Dice roll history table
  await run(`
    CREATE TABLE IF NOT EXISTS dice_rolls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      variant TEXT NOT NULL,
      result INTEGER NOT NULL,
      breakdown_json TEXT,
      delta_gold INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      is_jackpot INTEGER NOT NULL DEFAULT 0,
      rolled_at INTEGER NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_dice_rolls_user ON dice_rolls(user_id, rolled_at DESC)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_dice_rolls_jackpot ON dice_rolls(is_jackpot, rolled_at DESC)`);

  // Add chess time control columns
  const chessGameColumns = [
    ["time_control", "time_control TEXT"],
    ["time_limit_seconds", "time_limit_seconds INTEGER"],
    ["time_increment_seconds", "time_increment_seconds INTEGER"],
    ["white_time_remaining", "white_time_remaining INTEGER"],
    ["black_time_remaining", "black_time_remaining INTEGER"],
    ["last_move_color", "last_move_color TEXT"],
  ];
  await ensureColumns("chess_games", chessGameColumns);

  const chessStatsColumns = [
    ["blitz_elo", "blitz_elo INTEGER NOT NULL DEFAULT 1200"],
    ["rapid_elo", "rapid_elo INTEGER NOT NULL DEFAULT 1200"],
    ["classical_elo", "classical_elo INTEGER NOT NULL DEFAULT 1200"],
    ["blitz_games", "blitz_games INTEGER NOT NULL DEFAULT 0"],
    ["rapid_games", "rapid_games INTEGER NOT NULL DEFAULT 0"],
    ["classical_games", "classical_games INTEGER NOT NULL DEFAULT 0"],
  ];
  await ensureColumns("chess_user_stats", chessStatsColumns);

  // --- Role presets + user permission overrides (for Role Debug panel)
  await run(`
    CREATE TABLE IF NOT EXISTS role_presets (
      role TEXT PRIMARY KEY,
      perms_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS user_perm_overrides (
      username TEXT PRIMARY KEY,
      allow_json TEXT NOT NULL DEFAULT '[]',
      deny_json TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    )
  `);

  // --- Referrals (moderator -> admin escalation) — SQLite fallback/dev
  // Discovery: referrals are stored in referrals + referral_messages tables.
  await run(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      referred_by TEXT NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'open', -- 'open'|'acted'|'dismissed'
      action_by TEXT,
      action_type TEXT, -- 'ban'|'kick'|'dismiss'
      action_minutes INTEGER,
      action_reason TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS referral_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL,
      author_role TEXT NOT NULL, -- 'user'|'staff'
      author_name TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_referrals_username ON referrals(username)`);


  // Seed role presets once (Role Debug panel can edit later)
  const defaultPresets = {
    "Guest": [],
    "User": [],
    "VIP": ["chat:deleteSelf"],
    "Moderator": ["mod:kick","mod:mute","mod:warn","mod:delete","mod:unmute","mod:referralSubmit","tickets:appealCreate","tickets:appealReadMine"],
    "Admin": ["mod:kick","mod:ban","mod:mute","mod:warn","mod:delete","mod:unban","mod:unmute","mod:referralAction","tickets:appeals","tickets:referrals"],
    "Co-owner": ["site:roleManage","site:settingsLite","mod:kick","mod:ban","mod:mute","mod:warn","mod:delete","mod:unban","mod:unmute","mod:referralAction","tickets:appeals","tickets:referrals","debug:roles"],
    "Owner": ["site:roleManage","site:settings","site:maintenance","mod:kick","mod:ban","mod:mute","mod:warn","mod:delete","mod:unban","mod:unmute","mod:referralAction","tickets:appeals","tickets:referrals","debug:roles"]
  };

  const presetRows = await new Promise((resolve) => {
    db.all("SELECT role FROM role_presets LIMIT 1", [], (_e, rows) => resolve(rows || []));
  });

  if (!presetRows || presetRows.length === 0) {
    const now = Date.now();
    for (const [role, perms] of Object.entries(defaultPresets)) {
      await run(
        "INSERT OR REPLACE INTO role_presets (role, perms_json, updated_at) VALUES (?, ?, ?)",
        [role, JSON.stringify(perms), now]
      );
    }
  }



  // Discovery: unified moderation cases system tables live here (do not replace appeals/referrals).
  await run(`
    CREATE TABLE IF NOT EXISTS mod_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      subject_user_id INTEGER,
      created_by_user_id INTEGER,
      assigned_to_user_id INTEGER,
      room_id TEXT,
      title TEXT,
      summary TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      closed_at INTEGER,
      closed_reason TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS mod_case_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      actor_user_id INTEGER,
      event_type TEXT NOT NULL,
      event_payload TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS mod_case_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      author_user_id INTEGER,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS mod_case_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      evidence_type TEXT NOT NULL,
      room_id TEXT,
      message_id INTEGER,
      message_excerpt TEXT,
      url TEXT,
      text TEXT,
      created_by_user_id INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_mod_case_events_case ON mod_case_events(case_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_mod_case_notes_case ON mod_case_notes(case_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_mod_case_evidence_case ON mod_case_evidence(case_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_mod_cases_status ON mod_cases(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_mod_cases_type ON mod_cases(type)`);

  // Discovery: room structure audit log for create/reorder/move/reset actions.
  await run(`
    CREATE TABLE IF NOT EXISTS room_structure_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      actor_user_id INTEGER,
      payload TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // --- Friends system (requests + favorites)
  await run(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|declined|cancelled
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS friends (
      user_id INTEGER NOT NULL,
      friend_user_id INTEGER NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, friend_user_id)
    )
  `);

  // --- Message read receipts (persistent tracking)
  await run(`
    CREATE TABLE IF NOT EXISTS message_read_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      read_at INTEGER NOT NULL,
      UNIQUE(message_id, user_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS dm_read_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      last_read_message_id INTEGER,
      last_read_at INTEGER NOT NULL,
      UNIQUE(thread_id, user_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS message_delivery_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      delivered_at INTEGER NOT NULL,
      UNIQUE(message_id, user_id)
    )
  `);

  // Indexes for read receipts
  await run(`CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(user_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_read_receipts_room ON message_read_receipts(room_name)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_dm_read_thread ON dm_read_tracking(thread_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_dm_read_user ON dm_read_tracking(user_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_delivery_receipts_message ON message_delivery_receipts(message_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_delivery_receipts_user ON message_delivery_receipts(user_id)`);

  await run(`
    CREATE TABLE IF NOT EXISTS user_role_symbols (
      username TEXT PRIMARY KEY,
      vip_gemstone TEXT DEFAULT 'diamond',
      vip_color_variant TEXT DEFAULT 'blue',
      moderator_gemstone TEXT DEFAULT 'onyx',
      moderator_color_variant TEXT DEFAULT 'blue',
      enable_animations INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_role_symbols_username_lower ON user_role_symbols(lower(username))`);

  await run(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at INTEGER NOT NULL,
      UNIQUE(username, badge_id)
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS badge_definitions (
      badge_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      emoji TEXT,
      rarity TEXT,
      category TEXT,
      conditions_json TEXT
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_user_badges_username ON user_badges(username)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_user_badges_username_nocase ON user_badges(username COLLATE NOCASE)`);
  await run(`
    INSERT OR IGNORE INTO badge_definitions (badge_id, name, description, emoji, rarity, category) VALUES
    ('anniversary-1y', '1 Year Anniversary', 'Member for 1 year', '🎂', 'rare', 'milestone'),
    ('chatterbox', 'Chatterbox', 'Sent 10,000 messages', '💬', 'rare', 'achievement'),
    ('lucky-streak', 'Lucky Streak', 'Won 10 dice rolls in a row', '🎲', 'epic', 'achievement'),
    ('vip-member', 'VIP Member', 'Has VIP status', '👑', 'rare', 'special'),
    ('theme-collector', 'Theme Collector', 'Unlocked 20+ themes', '🎨', 'epic', 'achievement'),
    ('chess-master', 'Chess Master', 'Chess ELO over 1800', '♟️', 'legendary', 'achievement'),
    ('lovebirds', 'Lovebirds', 'Coupled for 6+ months', '💝', 'rare', 'special')
  `);

  // --- Presence System Tables
  await run(`
    CREATE TABLE IF NOT EXISTS user_presence (
      username TEXT PRIMARY KEY,
      status TEXT DEFAULT 'offline',
      last_seen INTEGER NOT NULL,
      current_room TEXT,
      socket_id TEXT
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_presence_status ON user_presence(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_presence_room ON user_presence(current_room)`);

  // Note: friendships table uses username strings instead of user IDs for compatibility
  await run(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1 TEXT NOT NULL,
      user2 TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      requested_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user1, user2)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2)`);
  // Add canonical ordering constraint to prevent duplicate friendships in reverse order
  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair_canonical
    ON friendships (
      CASE WHEN user1 < user2 THEN user1 ELSE user2 END,
      CASE WHEN user1 < user2 THEN user2 ELSE user1 END
    )
  `);

  // Note: friend_requests_new uses username strings for the new friend system
  await run(`
    CREATE TABLE IF NOT EXISTS friend_requests_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      message TEXT,
      created_at INTEGER NOT NULL,
      read_at INTEGER,
      UNIQUE(from_user, to_user)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_friend_requests_new_to_user_read_at ON friend_requests_new(to_user, read_at)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_friend_requests_new_from_user ON friend_requests_new(from_user)`);

  await run(`
    CREATE TABLE IF NOT EXISTS activity_feed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_data TEXT,
      created_at INTEGER NOT NULL,
      is_public INTEGER DEFAULT 1
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(username)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_activity_feed_time ON activity_feed(created_at)`);

  await run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      username TEXT PRIMARY KEY,
      friend_online INTEGER DEFAULT 1,
      mentions INTEGER DEFAULT 1,
      direct_messages INTEGER DEFAULT 1,
      activity_feed INTEGER DEFAULT 1,
      sound_enabled INTEGER DEFAULT 1
    )
  `);

  // Push subscriptions for PWA notifications
  await run(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(username, endpoint)
    )
  `);


// --- Fixed role assignments
  await run("UPDATE users SET role='Owner' WHERE lower(username)='iri'");
  await run("UPDATE users SET role='Co-owner' WHERE lower(username) IN ('lola henderson','amelia')");
  await run("UPDATE users SET role='Admin' WHERE lower(username)='ally'");
}

async function getRoleSymbolPrefs(username) {
  const rawName = String(username || "").trim();
  const safeName = normalizeRoleSymbolUsername(rawName);
  if (!safeName) return { ...DEFAULT_ROLE_SYMBOL_PREFS };
  const selectSql = `SELECT vip_gemstone, vip_color_variant, moderator_gemstone, moderator_color_variant, enable_animations
     FROM user_role_symbols`;
  const rows = await all(`${selectSql} WHERE lower(username) = ? LIMIT 1`, [safeName]);
  const row = rows?.[0];
  if (!row) return { ...DEFAULT_ROLE_SYMBOL_PREFS };
  return {
    vip_gemstone: row.vip_gemstone || DEFAULT_ROLE_SYMBOL_PREFS.vip_gemstone,
    vip_color_variant: row.vip_color_variant || DEFAULT_ROLE_SYMBOL_PREFS.vip_color_variant,
    moderator_gemstone: row.moderator_gemstone || DEFAULT_ROLE_SYMBOL_PREFS.moderator_gemstone,
    moderator_color_variant: row.moderator_color_variant || DEFAULT_ROLE_SYMBOL_PREFS.moderator_color_variant,
    enable_animations: row.enable_animations ?? DEFAULT_ROLE_SYMBOL_PREFS.enable_animations,
  };
}

async function updateRoleSymbolPrefs(username, prefs = {}) {
  const rawName = String(username || "").trim();
  const safeName = normalizeRoleSymbolUsername(rawName);
  if (!safeName) return null;
  const merged = {
    ...DEFAULT_ROLE_SYMBOL_PREFS,
    ...(prefs || {}),
  };
  const now = Date.now();
  await run(
    `DELETE FROM user_role_symbols WHERE lower(username) = ?`,
    [safeName]
  );
  await run(
    `INSERT INTO user_role_symbols (
      username, vip_gemstone, vip_color_variant, moderator_gemstone, moderator_color_variant, enable_animations, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       vip_gemstone = excluded.vip_gemstone,
       vip_color_variant = excluded.vip_color_variant,
       moderator_gemstone = excluded.moderator_gemstone,
       moderator_color_variant = excluded.moderator_color_variant,
       enable_animations = excluded.enable_animations,
       updated_at = excluded.updated_at`,
    [
      safeName,
      merged.vip_gemstone,
      merged.vip_color_variant,
      merged.moderator_gemstone,
      merged.moderator_color_variant,
      merged.enable_animations,
      now,
    ]
  );
  return merged;
}

async function updateUserBanner(username, { banner_url, banner_gradient, banner_style } = {}) {
  const safeName = String(username || "").trim();
  if (!safeName) return null;
  await run(
    `UPDATE users SET banner_url = ?, banner_gradient = ?, banner_style = ? WHERE username COLLATE NOCASE = ?`,
    [banner_url ?? null, banner_gradient ?? null, banner_style ?? "cover", safeName]
  );
  return true;
}

async function updateUserStatus(username, { custom_status, status_emoji, status_color, status_expires_at } = {}) {
  const safeName = String(username || "").trim();
  if (!safeName) return null;
  await run(
    `UPDATE users SET
      custom_status = ?,
      status_emoji = ?,
      status_color = ?,
      status_expires_at = ?
    WHERE username COLLATE NOCASE = ?`,
    [
      custom_status ?? null,
      status_emoji ?? null,
      status_color ?? null,
      status_expires_at ?? null,
      safeName,
    ]
  );
  return true;
}

async function getUserBadges(username) {
  const safeName = String(username || "").trim();
  if (!safeName) return [];
  const rows = await all(
    `SELECT ub.*, bd.name, bd.description, bd.emoji, bd.rarity, bd.category
     FROM user_badges ub
     JOIN badge_definitions bd ON ub.badge_id = bd.badge_id
     WHERE ub.username COLLATE NOCASE = ?
     ORDER BY ub.earned_at DESC`,
    [safeName]
  );
  return rows;
}

async function awardBadge(username, badge_id) {
  const safeName = String(username || "").trim();
  const safeBadge = String(badge_id || "").trim();
  if (!safeName || !safeBadge) return null;
  await run(
    `INSERT OR IGNORE INTO user_badges (username, badge_id, earned_at)
     VALUES (?, ?, ?)`,
    [safeName, safeBadge, Date.now()]
  );
  return true;
}

async function seedDevUser({ username, password, role }) {
  const safeName = String(username || "").trim();
  if (!safeName || !password) return null;
  const existing = await all("SELECT id FROM users WHERE lower(username)=lower(?) LIMIT 1", [safeName]);
  if (existing && existing[0]?.id) {
    const hash = await bcrypt.hash(String(password), 10);
    await run("UPDATE users SET role=?, password_hash=? WHERE id=?", [
      role || "Owner",
      hash,
      existing[0].id,
    ]);
    return existing[0].id;
  }
  const now = Date.now();
  const hash = await bcrypt.hash(String(password), 10);
  const result = await run(
    "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
    [safeName, hash, role || "Owner", now]
  );
  return result?.lastID || null;
}

const migrationsReady = runSqliteMigrations();

module.exports = {
  db,
  migrationsReady,
  runSqliteMigrations,
  DB_FILE,
  seedDevUser,
  getRoleSymbolPrefs,
  updateRoleSymbolPrefs,
  updateUserBanner,
  updateUserStatus,
  getUserBadges,
  awardBadge,
};
