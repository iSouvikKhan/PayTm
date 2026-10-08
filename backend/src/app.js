const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { createAuthService } = require("./services/authService");
const { createAuthMiddleware } = require("./middleware/auth");
const { createUserRouter } = require("./routes/user");
const { createAccountRouter } = require("./routes/account");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

/** Builds the Express app. Kept separate from server.js so tests can use it without listening. */
function createApp(config, { authRateLimit = 20, authService: injectedAuthService } = {}) {
  const app = express();
  const authService = injectedAuthService ?? createAuthService(config);
  const requireAuth = createAuthMiddleware(authService);

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGINS }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/health", (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", database: dbUp });
  });

  const api = express.Router();
  api.use("/user", createUserRouter({ authService, requireAuth, authRateLimit }));
  api.use("/account", createAccountRouter({ requireAuth }));
  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
