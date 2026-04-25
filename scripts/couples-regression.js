"use strict";

const assert = require("assert");
const request = require("supertest");

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test_secret_1234567890";


if (!process.env.DATABASE_URL) {
  console.log("Skipping couples regression: DATABASE_URL is not set.");
  process.exit(0);
}

const { app, startupReady } = require("../server");

const TEST_ORIGIN = "http://localhost";

function withOrigin(req) {
  return req.set("Origin", TEST_ORIGIN).set("Referer", `${TEST_ORIGIN}/`);
}

async function ensureLogin(agent, username, password) {
  const reg = await withOrigin(agent.post("/register")).send({ username, password });
  if (reg.status === 409) {
    const login = await withOrigin(agent.post("/login")).send({ username, password });
    assert.strictEqual(login.status, 200, `Login failed for ${username}: ${login.text}`);
    return;
  }
  assert.strictEqual(reg.status, 200, `Registration failed for ${username}: ${reg.text}`);
}

async function setCouplesV2Flags(agent, allowlist = []) {
  const res = await withOrigin(agent.post("/api/owner/flags")).send({
    flags: {
      COUPLES_V2_ENABLED: true,
      COUPLES_V2_ALLOWLIST: allowlist,
    },
  });
  assert.strictEqual(res.status, 200, `Failed to set flags: ${res.text}`);
}

async function run() {
  await startupReady;

  const ownerAgent = request.agent(app);
  const partnerAgent = request.agent(app);

  const ownerName = "iri";
  const partnerName = `partner_${Date.now()}`;
  const password = "password12345";

  await ensureLogin(ownerAgent, ownerName, password);
  await ensureLogin(partnerAgent, partnerName, password);
  await setCouplesV2Flags(ownerAgent, [partnerName]);

  const requestRes = await withOrigin(ownerAgent.post("/api/couples/request")).send({ targetUsername: partnerName });
  assert.strictEqual(requestRes.status, 200, `Couple request failed: ${requestRes.text}`);

  const pendingRes = await withOrigin(partnerAgent.get("/api/couples/me"));
  assert.strictEqual(pendingRes.status, 200, `Couple pending fetch failed: ${pendingRes.text}`);
  const incoming = pendingRes.body?.incoming || [];
  assert.ok(incoming.length === 1, "Expected one incoming couple request");

  const acceptRes = await withOrigin(partnerAgent.post("/api/couples/respond")).send({ linkId: incoming[0].linkId, accept: true });
  assert.strictEqual(acceptRes.status, 200, `Couple accept failed: ${acceptRes.text}`);

  const ownerMe = await withOrigin(ownerAgent.get("/api/couples/me"));
  const partnerMe = await withOrigin(partnerAgent.get("/api/couples/me"));
  assert.strictEqual(ownerMe.status, 200, `Owner /me failed: ${ownerMe.text}`);
  assert.strictEqual(partnerMe.status, 200, `Partner /me failed: ${partnerMe.text}`);

  assert.ok(ownerMe.body?.active, "Owner should see active couple");
  assert.ok(partnerMe.body?.active, "Partner should see active couple");
  assert.strictEqual(ownerMe.body?.isCoupleMember, true, "Owner should be couple member");
  assert.strictEqual(partnerMe.body?.isCoupleMember, true, "Partner should be couple member");
  assert.strictEqual(ownerMe.body?.active?.settingsAvailable, true, "Owner settings should be available");
  assert.strictEqual(partnerMe.body?.active?.settingsAvailable, true, "Partner settings should be available");

  const settingsResA = await withOrigin(ownerAgent.post("/api/couples/settings")).send({
    privacy: "public",
    couple_name: "Test Pair",
    couple_bio: "Testing the couple card.",
    show_badge: true,
    bonuses_enabled: false,
  });
  assert.strictEqual(settingsResA.status, 200, `Owner settings update failed: ${settingsResA.text}`);
  assert.strictEqual(settingsResA.body?.couple?.couple_name, "Test Pair", "Owner settings should update couple name");

  const ownerCheck = await withOrigin(ownerAgent.get("/api/couples/me"));
  const partnerCheck = await withOrigin(partnerAgent.get("/api/couples/me"));
  assert.strictEqual(ownerCheck.body?.couple?.couple_name, "Test Pair", "Owner should see updated couple name");
  assert.strictEqual(partnerCheck.body?.couple?.couple_name, "Test Pair", "Partner should see updated couple name");

  const settingsResB = await withOrigin(partnerAgent.post("/api/couples/settings")).send({
    privacy: "public",
    couple_name: "Test Pair Updated",
    couple_bio: "Partner updated the card.",
    show_badge: true,
    bonuses_enabled: false,
  });
  assert.strictEqual(settingsResB.status, 200, `Partner settings update failed: ${settingsResB.text}`);

  const ownerFinal = await withOrigin(ownerAgent.get("/api/couples/me"));
  const partnerFinal = await withOrigin(partnerAgent.get("/api/couples/me"));
  assert.strictEqual(ownerFinal.body?.couple?.couple_name, "Test Pair Updated", "Owner should see partner update");
  assert.strictEqual(partnerFinal.body?.couple?.couple_name, "Test Pair Updated", "Partner should see update");

  console.log("Couples regression test passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
