/**
 * End-to-end API tests against a real (in-memory) MongoDB replica set, so multi-document
 * transactions and concurrent transfers behave exactly as in production.
 * The first run downloads a MongoDB binary (see mongodb-memory-server).
 */
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const { createApp } = require("../../src/app");
const Account = require("../../src/models/Account");
const User = require("../../src/models/User");
const Transaction = require("../../src/models/Transaction");
const { TEST_CONFIG } = require("../helpers");

let replSet;
let app;

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(replSet.getUri("paytm-test"));
  await Promise.all([User.init(), Account.init(), Transaction.init()]);
  app = createApp(TEST_CONFIG, { authRateLimit: 1000 });
});

after(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Account.deleteMany({}), Transaction.deleteMany({})]);
});

async function signup(firstName, balanceRupees) {
  const res = await request(app)
    .post("/api/v1/user/signup")
    .send({ username: `${firstName.toLowerCase()}@example.com`, password: "password123", firstName, lastName: "Test" });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  if (balanceRupees !== undefined) {
    await Account.updateOne({ userId: res.body.user.id }, { balance: Math.round(balanceRupees * 100) });
  }
  return { ...res.body.user, token: res.body.token };
}

const bearer = (u) => ({ Authorization: `Bearer ${u.token}` });
const balanceOf = async (u) => (await request(app).get("/api/v1/account/balance").set(bearer(u))).body.balance;

describe("auth flow", () => {
  it("signs up, stores a bcrypt hash, and signs in case-insensitively", async () => {
    const ana = await signup("Ana");
    const stored = await User.findById(ana.id).select("+password");
    assert.match(stored.password, /^\$2[aby]\$/);
    assert.notEqual(stored.password, "password123");

    const bal = await balanceOf(ana);
    assert.ok(bal >= 1000 && bal <= 10000, `starting balance ${bal}`);

    const res = await request(app).post("/api/v1/user/signin").send({ username: "ANA@example.com", password: "password123" });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);

    const wrong = await request(app).post("/api/v1/user/signin").send({ username: "ana@example.com", password: "nope-nope" });
    assert.equal(wrong.status, 401);
  });

  it("rejects duplicate emails regardless of case and creates no orphan account", async () => {
    await signup("Ana");
    const res = await request(app)
      .post("/api/v1/user/signup")
      .send({ username: "ANA@EXAMPLE.COM", password: "password123", firstName: "X", lastName: "Y" });
    assert.equal(res.status, 409);
    assert.equal(await User.countDocuments(), 1);
    assert.equal(await Account.countDocuments(), 1);
  });

  it("changes the password only with the current password", async () => {
    const ana = await signup("Ana");
    const bad = await request(app).put("/api/v1/user").set(bearer(ana)).send({ password: "newpassword1", currentPassword: "wrong" });
    assert.equal(bad.status, 400);
    const ok = await request(app)
      .put("/api/v1/user")
      .set(bearer(ana))
      .send({ password: "newpassword1", currentPassword: "password123", firstName: "Anabel" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.firstName, "Anabel");
    const signin = await request(app).post("/api/v1/user/signin").send({ username: "ana@example.com", password: "newpassword1" });
    assert.equal(signin.status, 200);
  });
});

describe("user search", () => {
  it("finds other users case-insensitively, excludes the caller and survives regex characters", async () => {
    const ana = await signup("Ana");
    await signup("Bob");
    await signup("Bobby");
    let res = await request(app).get("/api/v1/user/bulk?filter=BOB").set(bearer(ana));
    assert.deepEqual(res.body.users.map((u) => u.firstName).sort(), ["Bob", "Bobby"]);
    res = await request(app).get("/api/v1/user/bulk").set(bearer(ana));
    assert.ok(!res.body.users.some((u) => u.id === ana.id));
    res = await request(app).get("/api/v1/user/bulk?filter=" + encodeURIComponent("(.*")).set(bearer(ana));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.users, []);
  });
});

describe("transfers", () => {
  it("moves money atomically and records the transaction", async () => {
    const ana = await signup("Ana", 500);
    const bob = await signup("Bob", 100);
    const res = await request(app).post("/api/v1/account/transfer").set(bearer(ana)).send({ to: bob.id, amount: 120.5, note: "Dinner" });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.balance, 379.5);
    assert.equal(await balanceOf(ana), 379.5);
    assert.equal(await balanceOf(bob), 220.5);

    const history = await request(app).get("/api/v1/account/transactions").set(bearer(bob));
    assert.equal(history.body.transactions[0].direction, "received");
    assert.equal(history.body.transactions[0].amount, 120.5);
    assert.equal(history.body.transactions[0].counterparty.firstName, "Ana");
    assert.equal(history.body.transactions[0].note, "Dinner");
  });

  it("rejects insufficient balance without changing anything", async () => {
    const ana = await signup("Ana", 50);
    const bob = await signup("Bob", 0);
    const res = await request(app).post("/api/v1/account/transfer").set(bearer(ana)).send({ to: bob.id, amount: 50.01 });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Insufficient balance");
    assert.equal(await balanceOf(ana), 50);
    assert.equal(await balanceOf(bob), 0);
    assert.equal(await Transaction.countDocuments(), 0);
  });

  it("rejects unknown recipients and transfers to yourself", async () => {
    const ana = await signup("Ana", 50);
    const ghost = await request(app).post("/api/v1/account/transfer").set(bearer(ana)).send({ to: new mongoose.Types.ObjectId().toString(), amount: 10 });
    assert.equal(ghost.status, 404);
    const self = await request(app).post("/api/v1/account/transfer").set(bearer(ana)).send({ to: ana.id, amount: 10 });
    assert.equal(self.status, 400);
    assert.equal(await balanceOf(ana), 50);
  });

  it("never overdraws under concurrent transfers", async () => {
    const ana = await signup("Ana", 100);
    const bob = await signup("Bob", 0);
    const carol = await signup("Carol", 0);

    // 20 concurrent transfers of 10 from a balance of 100: exactly 10 can succeed.
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post("/api/v1/account/transfer")
          .set(bearer(ana))
          .send({ to: i % 2 ? bob.id : carol.id, amount: 10 }),
      ),
    );
    const ok = results.filter((r) => r.status === 200).length;
    const insufficient = results.filter((r) => r.status === 400 && r.body.message === "Insufficient balance").length;
    assert.equal(ok, 10, results.map((r) => `${r.status} ${r.body.message}`).join(", "));
    assert.equal(insufficient, 10);
    assert.equal(await balanceOf(ana), 0);
    assert.equal((await balanceOf(bob)) + (await balanceOf(carol)), 100);
    assert.equal(await Transaction.countDocuments(), 10);
  });

  it("keeps the total amount of money constant with transfers in both directions", async () => {
    const ana = await signup("Ana", 300);
    const bob = await signup("Bob", 300);
    await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        request(app)
          .post("/api/v1/account/transfer")
          .set(bearer(i % 2 ? ana : bob))
          .send({ to: i % 2 ? bob.id : ana.id, amount: 7.25 }),
      ),
    );
    const a = await balanceOf(ana);
    const b = await balanceOf(bob);
    assert.equal(Math.round((a + b) * 100), 60000);
    assert.ok(a >= 0 && b >= 0);
  });
});
