const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { createApp } = require("../../src/app");
const { createAuthService } = require("../../src/services/authService");
const userService = require("../../src/services/userService");
const transferService = require("../../src/services/transferService");
const Account = require("../../src/models/Account");
const { badRequest, conflict, unauthorized, notFound } = require("../../src/utils/errors");
const { TEST_CONFIG } = require("../helpers");

const USER_ID = "65f1c0ffee0123456789abcd";
const OTHER_ID = "65f1c0ffee0123456789abce";

describe("API routes (services mocked)", () => {
  let app;
  let authService;
  let token;

  beforeEach(() => {
    authService = createAuthService(TEST_CONFIG);
    app = createApp(TEST_CONFIG, { authService });
    token = authService.issueToken(USER_ID);
  });

  afterEach(() => mock.restoreAll());

  const auth = () => ({ Authorization: `Bearer ${token}` });

  describe("auth", () => {
    it("rejects requests without a token with 401", async () => {
      const res = await request(app).get("/api/v1/account/balance");
      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Authentication required");
    });

    it("rejects tampered and expired tokens", async () => {
      const forged = jwt.sign({ sub: USER_ID }, "another-secret-of-enough-length");
      let res = await request(app).get("/api/v1/user/me").set("Authorization", `Bearer ${forged}`);
      assert.equal(res.status, 401);

      const expired = jwt.sign({ sub: USER_ID, exp: Math.floor(Date.now() / 1000) - 10 }, TEST_CONFIG.JWT_SECRET);
      res = await request(app).get("/api/v1/user/me").set("Authorization", `Bearer ${expired}`);
      assert.equal(res.status, 401);
      assert.match(res.body.message, /expired/);
    });

    it("signs up with normalised input and returns 201", async () => {
      const signup = mock.method(authService, "signup", async () => ({
        token: "t",
        user: { id: USER_ID, username: "ana@example.com", firstName: "Ana", lastName: "Lopez" },
        balance: 523450,
      }));
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({ username: "Ana@Example.com", password: "password123", firstName: "Ana", lastName: "Lopez" });
      assert.equal(res.status, 201);
      assert.equal(res.body.balance, 5234.5);
      assert.equal(signup.mock.calls[0].arguments[0].username, "ana@example.com");
    });

    it("returns field errors for invalid signup", async () => {
      const res = await request(app).post("/api/v1/user/signup").send({ username: "x", password: "1" });
      assert.equal(res.status, 400);
      assert.ok(res.body.details.some((d) => d.field === "username"));
      assert.ok(res.body.details.some((d) => d.field === "password"));
    });

    it("maps duplicate emails to 409 and bad credentials to 401", async () => {
      mock.method(authService, "signup", async () => {
        throw conflict("An account with this email already exists");
      });
      mock.method(authService, "signin", async () => {
        throw unauthorized("Invalid email or password");
      });
      const dup = await request(app)
        .post("/api/v1/user/signup")
        .send({ username: "a@b.co", password: "password123", firstName: "A", lastName: "B" });
      assert.equal(dup.status, 409);
      const bad = await request(app).post("/api/v1/user/signin").send({ username: "a@b.co", password: "wrong" });
      assert.equal(bad.status, 401);
    });

    it("rate-limits repeated sign-in attempts", async () => {
      const limited = createApp(TEST_CONFIG, { authService, authRateLimit: 2 });
      mock.method(authService, "signin", async () => {
        throw unauthorized("Invalid email or password");
      });
      const body = { username: "a@b.co", password: "x" };
      await request(limited).post("/api/v1/user/signin").send(body);
      await request(limited).post("/api/v1/user/signin").send(body);
      const res = await request(limited).post("/api/v1/user/signin").send(body);
      assert.equal(res.status, 429);
    });
  });

  describe("users", () => {
    it("searches users for the signed-in user", async () => {
      const search = mock.method(userService, "searchUsers", async () => [{ id: OTHER_ID, firstName: "Bo" }]);
      const res = await request(app).get("/api/v1/user/bulk?filter=bo").set(auth());
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.users, [{ id: OTHER_ID, firstName: "Bo" }]);
      assert.deepEqual(search.mock.calls[0].arguments, [USER_ID, "bo"]);
    });

    it("requires auth for search", async () => {
      assert.equal((await request(app).get("/api/v1/user/bulk")).status, 401);
    });

    it("returns the profile and balance", async () => {
      mock.method(userService, "getProfile", async () => ({ user: { id: USER_ID }, balance: 12345 }));
      const res = await request(app).get("/api/v1/user/me").set(auth());
      assert.equal(res.body.balance, 123.45);
    });

    it("updates the profile of the caller only", async () => {
      const update = mock.method(userService, "updateProfile", async (_id, body) => ({ id: USER_ID, ...body }));
      const res = await request(app).put("/api/v1/user").set(auth()).send({ firstName: "New" });
      assert.equal(res.status, 200);
      assert.equal(update.mock.calls[0].arguments[0], USER_ID);
      assert.equal((await request(app).put("/api/v1/user").set(auth()).send({})).status, 400);
    });
  });

  describe("account", () => {
    it("returns the balance in rupees", async () => {
      mock.method(Account, "findOne", async () => ({ balance: 250075 }));
      const res = await request(app).get("/api/v1/account/balance").set(auth());
      assert.equal(res.status, 200);
      assert.equal(res.body.balance, 2500.75);
    });

    it("returns 404 when the account is missing", async () => {
      mock.method(Account, "findOne", async () => null);
      assert.equal((await request(app).get("/api/v1/account/balance").set(auth())).status, 404);
    });

    it("transfers using integer paise", async () => {
      const transfer = mock.method(transferService, "transfer", async ({ amount }) => ({
        transaction: { _id: "tx1", amount },
        balance: 10000,
      }));
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set(auth())
        .send({ to: OTHER_ID, amount: 19.99, note: "Lunch" });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, { message: "Transfer successful", transactionId: "tx1", amount: 19.99, balance: 100 });
      assert.deepEqual(transfer.mock.calls[0].arguments[0], {
        fromUserId: USER_ID,
        toUserId: OTHER_ID,
        amount: 1999,
        note: "Lunch",
      });
    });

    it("rejects negative amounts before reaching the service", async () => {
      const transfer = mock.method(transferService, "transfer", async () => ({}));
      const res = await request(app).post("/api/v1/account/transfer").set(auth()).send({ to: OTHER_ID, amount: -100 });
      assert.equal(res.status, 400);
      assert.equal(transfer.mock.callCount(), 0);
    });

    it("surfaces insufficient balance and unknown recipients", async () => {
      mock.method(transferService, "transfer", async ({ toUserId }) => {
        throw toUserId === OTHER_ID ? badRequest("Insufficient balance") : notFound("Recipient not found");
      });
      const poor = await request(app).post("/api/v1/account/transfer").set(auth()).send({ to: OTHER_ID, amount: 10 });
      assert.equal(poor.status, 400);
      assert.equal(poor.body.message, "Insufficient balance");
      const ghost = await request(app)
        .post("/api/v1/account/transfer")
        .set(auth())
        .send({ to: "65f1c0ffee0123456789ffff", amount: 10 });
      assert.equal(ghost.status, 404);
    });
  });

  describe("errors", () => {
    it("handles malformed JSON and unknown routes", async () => {
      const bad = await request(app)
        .post("/api/v1/user/signin")
        .set("Content-Type", "application/json")
        .send("{not json");
      assert.equal(bad.status, 400);
      assert.equal((await request(app).get("/api/v1/nope")).status, 404);
    });

    it("hides unexpected errors behind a generic 500", async () => {
      mock.method(console, "error", () => {});
      mock.method(userService, "getProfile", async () => {
        throw new Error("db exploded with secrets");
      });
      const res = await request(app).get("/api/v1/user/me").set(auth());
      assert.equal(res.status, 500);
      assert.doesNotMatch(res.body.message, /secrets/);
    });
  });
});
