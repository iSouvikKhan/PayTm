const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Account = require("../models/Account");
const { conflict, unauthorized } = require("../utils/errors");
const { randomPaiseBetween } = require("../utils/money");

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so both paths take similar time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

function createAuthService(config) {
  function issueToken(userId) {
    return jwt.sign({ sub: userId.toString() }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });
  }

  /** Returns the user id from a valid token, or throws 401. */
  function verifyToken(token) {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET);
      if (!payload.sub || !mongoose.isValidObjectId(payload.sub)) throw new Error("bad subject");
      return payload.sub;
    } catch (err) {
      throw unauthorized(err.name === "TokenExpiredError" ? "Session expired, please sign in again" : "Invalid token");
    }
  }

  /** Creates the user and their wallet atomically, with a random starting balance. */
  async function signup({ username, password, firstName, lastName }) {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const session = await mongoose.startSession();
    let user;
    let balance;
    try {
      await session.withTransaction(async () => {
        if (await User.exists({ username }).session(session)) {
          throw conflict("An account with this email already exists");
        }
        [user] = await User.create([{ username, password: hash, firstName, lastName }], { session });
        balance = randomPaiseBetween(config.SIGNUP_BONUS_MIN, config.SIGNUP_BONUS_MAX);
        await Account.create([{ userId: user._id, balance }], { session });
      });
    } catch (err) {
      if (err.code === 11000) throw conflict("An account with this email already exists");
      throw err;
    } finally {
      await session.endSession();
    }
    return { token: issueToken(user._id), user: user.toPublic(), balance };
  }

  async function signin({ username, password }) {
    const user = await User.findOne({ username }).select("+password");
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) throw unauthorized("Invalid email or password");
    return { token: issueToken(user._id), user: user.toPublic() };
  }

  return { issueToken, verifyToken, signup, signin };
}

module.exports = { createAuthService, BCRYPT_ROUNDS };
