const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  rupeesToPaise,
  paiseToRupees,
  hasAtMostTwoDecimals,
  randomPaiseBetween,
} = require("../../src/utils/money");
const { signupSchema, signinSchema, transferSchema, updateProfileSchema } = require("../../src/validation");
const { escapeRegex } = require("../../src/services/userService");
const { loadConfig } = require("../../src/config");

describe("money", () => {
  it("converts between rupees and integer paise without float drift", () => {
    assert.equal(rupeesToPaise(0.1 + 0.2), 30);
    assert.equal(rupeesToPaise("19.99"), 1999);
    assert.equal(paiseToRupees(1999), 19.99);
  });

  it("detects more than two decimals", () => {
    assert.ok(hasAtMostTwoDecimals(10.25));
    assert.ok(hasAtMostTwoDecimals(100));
    assert.ok(!hasAtMostTwoDecimals(10.255));
  });

  it("draws a random integer paise amount within bounds", () => {
    assert.equal(randomPaiseBetween(1000, 10000, () => 0), 100000);
    assert.equal(randomPaiseBetween(1000, 10000, () => 0.999999999), 1000000);
    assert.ok(Number.isInteger(randomPaiseBetween(1, 2)));
  });
});

describe("validation", () => {
  it("normalises signup input", () => {
    const r = signupSchema.parse({
      username: "  John@Example.COM ",
      password: "password123",
      firstName: " John ",
      lastName: "Doe",
    });
    assert.equal(r.username, "john@example.com");
    assert.equal(r.firstName, "John");
  });

  it("rejects weak or malformed signup input", () => {
    const r = signupSchema.safeParse({ username: "nope", password: "short", firstName: "", lastName: "x" });
    assert.ok(!r.success);
    const fields = r.error.issues.map((i) => i.path[0]);
    assert.deepEqual(new Set(fields), new Set(["username", "password", "firstName"]));
  });

  it("requires a password on signin", () => {
    assert.ok(!signinSchema.safeParse({ username: "a@b.co", password: "" }).success);
  });

  it("accepts valid transfers and coerces numeric strings", () => {
    const r = transferSchema.parse({ to: "65f1c0ffee0123456789abcd", amount: "250.50" });
    assert.equal(r.amount, 250.5);
  });

  for (const [label, body] of [
    ["negative amount", { to: "65f1c0ffee0123456789abcd", amount: -5 }],
    ["zero amount", { to: "65f1c0ffee0123456789abcd", amount: 0 }],
    ["three decimals", { to: "65f1c0ffee0123456789abcd", amount: 1.234 }],
    ["huge amount", { to: "65f1c0ffee0123456789abcd", amount: 1e9 }],
    ["not a number", { to: "65f1c0ffee0123456789abcd", amount: "abc" }],
    ["invalid recipient id", { to: "not-an-id", amount: 10 }],
    ["missing recipient", { amount: 10 }],
  ]) {
    it(`rejects transfer with ${label}`, () => {
      assert.ok(!transferSchema.safeParse(body).success);
    });
  }

  it("requires at least one profile field", () => {
    assert.ok(!updateProfileSchema.safeParse({}).success);
    assert.ok(updateProfileSchema.safeParse({ firstName: "Ana" }).success);
  });

  it("escapes regex metacharacters in search filters", () => {
    const pattern = new RegExp(escapeRegex("a.b(c"), "i");
    assert.ok(pattern.test("A.B(C"));
    assert.ok(!pattern.test("axb(c"));
  });
});

describe("config", () => {
  const base = { MONGODB_URI: "mongodb://localhost/paytm", JWT_SECRET: "a-secret-of-16-chars-or-more" };

  it("applies defaults and splits CORS origins", () => {
    const cfg = loadConfig({ ...base, CORS_ORIGINS: "http://a.com, http://b.com" });
    assert.equal(cfg.PORT, 3000);
    assert.deepEqual(cfg.CORS_ORIGINS, ["http://a.com", "http://b.com"]);
  });

  it("fails fast with a clear message when required values are missing", () => {
    assert.throws(() => loadConfig({}), /MONGODB_URI[\s\S]*JWT_SECRET/);
    assert.throws(() => loadConfig({ ...base, JWT_SECRET: "short" }), /at least 16/);
  });
});
