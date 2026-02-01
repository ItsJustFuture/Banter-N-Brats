const assert = require("assert");
const sqlite3 = require("sqlite3").verbose();
const { rollDiceVariant, computeDiceReward } = require("../dice-utils");

async function run() {
  const db = new sqlite3.Database(":memory:");

  try {
    const runAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve(this);
        });
      });

    const getAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });

    const allAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });

    // Create users table
    await runAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        dice_total_rolls INTEGER NOT NULL DEFAULT 0,
        dice_total_won INTEGER NOT NULL DEFAULT 0,
        dice_biggest_win INTEGER NOT NULL DEFAULT 0,
        dice_win_streak INTEGER NOT NULL DEFAULT 0,
        dice_current_streak INTEGER NOT NULL DEFAULT 0,
        dice_sixes INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Create dice_rolls table
    await runAsync(`
      CREATE TABLE dice_rolls (
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

    // Create test user
    await runAsync(
      `INSERT INTO users (id, username) VALUES (1, 'test_user')`
    );

    // Test 1: Simulate a winning roll
    const winRoll = { variant: "d6", result: 6, breakdown: null, won: true };
    const winReward = computeDiceReward("d6", 6, null);
    assert.strictEqual(winReward.deltaGold, 500);
    assert.strictEqual(winReward.outcome, "win");

    // Record the roll
    await runAsync(
      `INSERT INTO dice_rolls (user_id, variant, result, breakdown_json, delta_gold, outcome, is_jackpot, rolled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, "d6", 6, JSON.stringify(null), 500, "win", 0, Date.now()]
    );

    // Update user stats (simulating a win)
    await runAsync(
      `UPDATE users 
       SET dice_total_rolls = dice_total_rolls + 1,
           dice_total_won = dice_total_won + 1,
           dice_current_streak = dice_current_streak + 1,
           dice_win_streak = MAX(dice_win_streak, dice_current_streak),
           dice_biggest_win = MAX(dice_biggest_win, ?)
       WHERE id = ?`,
      [500, 1]
    );

    // Verify user stats
    let user = await getAsync("SELECT * FROM users WHERE id = 1");
    assert.strictEqual(user.dice_total_rolls, 1);
    assert.strictEqual(user.dice_total_won, 1);
    assert.strictEqual(user.dice_biggest_win, 500);
    assert.strictEqual(user.dice_win_streak, 1);
    assert.strictEqual(user.dice_current_streak, 1);

    // Test 2: Simulate a losing roll (should break streak)
    const loseRoll = { variant: "d6", result: 3, breakdown: null, won: false };
    const loseReward = computeDiceReward("d6", 3, null);
    assert.strictEqual(loseReward.deltaGold, -50);
    assert.strictEqual(loseReward.outcome, "loss");

    await runAsync(
      `INSERT INTO dice_rolls (user_id, variant, result, breakdown_json, delta_gold, outcome, is_jackpot, rolled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, "d6", 3, JSON.stringify(null), -50, "loss", 0, Date.now()]
    );

    await runAsync(
      `UPDATE users 
       SET dice_total_rolls = dice_total_rolls + 1,
           dice_current_streak = 0
       WHERE id = ?`,
      [1]
    );

    user = await getAsync("SELECT * FROM users WHERE id = 1");
    assert.strictEqual(user.dice_total_rolls, 2);
    assert.strictEqual(user.dice_total_won, 1);
    assert.strictEqual(user.dice_current_streak, 0);
    assert.strictEqual(user.dice_win_streak, 1); // Preserved

    // Test 3: Verify history tracking
    const history = await allAsync(
      "SELECT * FROM dice_rolls WHERE user_id = 1 ORDER BY rolled_at DESC"
    );
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].result, 3); // Most recent
    assert.strictEqual(history[1].result, 6); // Older

    // Test 4: Jackpot roll tracking
    const jackpotRoll = { variant: "d100", result: 100, breakdown: null, won: true };
    const jackpotReward = computeDiceReward("d100", 100, null);
    assert.strictEqual(jackpotReward.deltaGold, 5000);
    assert.strictEqual(jackpotReward.isJackpot, true);

    await runAsync(
      `INSERT INTO dice_rolls (user_id, variant, result, breakdown_json, delta_gold, outcome, is_jackpot, rolled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, "d100", 100, JSON.stringify(null), 5000, "jackpot", 1, Date.now()]
    );

    await runAsync(
      `UPDATE users 
       SET dice_total_rolls = dice_total_rolls + 1,
           dice_total_won = dice_total_won + 1,
           dice_current_streak = dice_current_streak + 1,
           dice_win_streak = MAX(dice_win_streak, dice_current_streak),
           dice_biggest_win = MAX(dice_biggest_win, ?)
       WHERE id = ?`,
      [5000, 1]
    );

    user = await getAsync("SELECT * FROM users WHERE id = 1");
    assert.strictEqual(user.dice_biggest_win, 5000);

    const jackpots = await allAsync(
      "SELECT * FROM dice_rolls WHERE user_id = 1 AND is_jackpot = 1"
    );
    assert.strictEqual(jackpots.length, 1);
    assert.strictEqual(jackpots[0].result, 100);

    console.log("✓ Dice statistics tracking test passed");
  } finally {
    // Always close the database connection
    db.close();
  }
}

run().catch((err) => {
  console.error("Dice statistics test failed:", err);
  process.exit(1);
});
