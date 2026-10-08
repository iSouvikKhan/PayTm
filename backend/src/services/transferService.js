const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { AppError, badRequest, notFound } = require("../utils/errors");

/**
 * Moves `amount` paise from one user to another inside a MongoDB transaction.
 *
 * Correctness under concurrency:
 * - The sender is debited with a conditional update (`balance >= amount`), so the balance can
 *   never go negative, even when several transfers run at the same time.
 * - Debit, credit and the transaction record are written in one multi-document transaction:
 *   either all of them are committed or none is.
 * - `session.withTransaction()` retries automatically on transient errors such as write
 *   conflicts between concurrent transactions touching the same account.
 */
async function transfer({ fromUserId, toUserId, amount, note }) {
  if (!Number.isInteger(amount) || amount <= 0) throw badRequest("Amount must be a positive number");
  if (!mongoose.isValidObjectId(toUserId)) throw badRequest("Invalid recipient");
  if (fromUserId.toString() === toUserId.toString()) throw badRequest("You cannot send money to yourself");

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const recipient = await Account.findOne({ userId: toUserId }).session(session);
      if (!recipient) throw notFound("Recipient not found");

      const sender = await Account.findOneAndUpdate(
        { userId: fromUserId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { returnDocument: "after", session },
      );
      if (!sender) {
        const exists = await Account.exists({ userId: fromUserId }).session(session);
        throw exists ? badRequest("Insufficient balance") : notFound("Your account was not found");
      }

      await Account.updateOne({ userId: toUserId }, { $inc: { balance: amount } }, { session });
      const [record] = await Transaction.create(
        [{ from: fromUserId, to: toUserId, amount, note: note || undefined }],
        { session },
      );
      result = { transaction: record, balance: sender.balance };
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (/replica set|Transaction numbers are only allowed/i.test(err.message || "")) {
      throw new AppError(
        500,
        "Transfers need MongoDB to run as a replica set. See 'MongoDB replica set' in the README.",
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }
  return result;
}

/** Most recent transfers involving the user, with the other party's name. */
async function history(userId, limit = 20) {
  const id = new mongoose.Types.ObjectId(userId.toString());
  const records = await Transaction.find({ $or: [{ from: id }, { to: id }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const otherIds = [...new Set(records.map((t) => (t.from.equals(id) ? t.to : t.from).toString()))];
  const users = await User.find({ _id: { $in: otherIds } }).lean();
  const names = new Map(users.map((u) => [u._id.toString(), u]));
  return records.map((t) => {
    const outgoing = t.from.equals(id);
    const other = names.get((outgoing ? t.to : t.from).toString());
    return {
      id: t._id.toString(),
      direction: outgoing ? "sent" : "received",
      amount: t.amount,
      note: t.note ?? null,
      createdAt: t.createdAt,
      counterparty: other
        ? { id: other._id.toString(), firstName: other.firstName, lastName: other.lastName }
        : { id: null, firstName: "Deleted", lastName: "user" },
    };
  });
}

module.exports = { transfer, history };
