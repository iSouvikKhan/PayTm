const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { validate } = require("../middleware/validate");
const { signupSchema, signinSchema, updateProfileSchema, searchSchema } = require("../validation");
const userService = require("../services/userService");
const { paiseToRupees } = require("../utils/money");

function createUserRouter({ authService, requireAuth, authRateLimit }) {
  const router = express.Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authRateLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again in a few minutes" },
  });

  router.post("/signup", limiter, validate(signupSchema), async (req, res) => {
    const { token, user, balance } = await authService.signup(req.valid.body);
    res.status(201).json({ message: "Account created", token, user, balance: paiseToRupees(balance) });
  });

  router.post("/signin", limiter, validate(signinSchema), async (req, res) => {
    const { token, user } = await authService.signin(req.valid.body);
    res.json({ token, user });
  });

  router.get("/me", requireAuth, async (req, res) => {
    const { user, balance } = await userService.getProfile(req.userId);
    res.json({ user, balance: paiseToRupees(balance) });
  });

  router.put("/", requireAuth, validate(updateProfileSchema), async (req, res) => {
    const user = await userService.updateProfile(req.userId, req.valid.body);
    res.json({ message: "Profile updated", user });
  });

  router.get("/bulk", requireAuth, validate(searchSchema, "query"), async (req, res) => {
    const users = await userService.searchUsers(req.userId, req.valid.query.filter);
    res.json({ users });
  });

  return router;
}

module.exports = { createUserRouter };
