const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Account = require("../models/Account");
const { badRequest, notFound } = require("../utils/errors");
const { BCRYPT_ROUNDS } = require("./authService");

const SEARCH_LIMIT = 20;

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getProfile(userId) {
  const [user, account] = await Promise.all([User.findById(userId), Account.findOne({ userId })]);
  if (!user || !account) throw notFound("Account not found");
  return { user: user.toPublic(), balance: account.balance };
}

/** Case-insensitive search on first name, last name or email, excluding the caller. */
async function searchUsers(currentUserId, filter = "") {
  const text = filter.trim();
  const query = { _id: { $ne: currentUserId } };
  if (text) {
    const pattern = new RegExp(escapeRegex(text), "i");
    query.$or = [{ firstName: pattern }, { lastName: pattern }, { username: pattern }];
  }
  const users = await User.find(query).sort({ firstName: 1, lastName: 1 }).limit(SEARCH_LIMIT);
  return users.map((u) => u.toPublic());
}

/** Updates names and/or password. Changing the password requires the current one. */
async function updateProfile(userId, { firstName, lastName, password, currentPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw notFound("Account not found");
  if (password !== undefined) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      throw badRequest("Current password is incorrect");
    }
    user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  await user.save();
  return user.toPublic();
}

module.exports = { getProfile, searchUsers, updateProfile, escapeRegex, SEARCH_LIMIT };
