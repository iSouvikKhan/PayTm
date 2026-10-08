const TEST_CONFIG = {
  NODE_ENV: "test",
  PORT: 0,
  MONGODB_URI: "mongodb://unused",
  JWT_SECRET: "test-secret-that-is-long-enough",
  JWT_EXPIRES_IN: "1h",
  CORS_ORIGINS: ["http://localhost:5173"],
  SIGNUP_BONUS_MIN: 1000,
  SIGNUP_BONUS_MAX: 10000,
};

module.exports = { TEST_CONFIG };
