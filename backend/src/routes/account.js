const express = require("express");
const Account = require("../models/Account");
const { validate } = require("../middleware/validate");
const { transferSchema, historySchema } = require("../validation");
const transferService = require("../services/transferService");
const { notFound } = require("../utils/errors");
const { paiseToRupees, rupeesToPaise } = require("../utils/money");

function createAccountRouter({ requireAuth }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/balance", async (req, res) => {
    const account = await Account.findOne({ userId: req.userId });
    if (!account) throw notFound("Account not found");
    res.json({ balance: paiseToRupees(account.balance) });
  });

  router.post("/transfer", validate(transferSchema), async (req, res) => {
    const { to, amount, note } = req.valid.body;
    const { transaction, balance } = await transferService.transfer({
      fromUserId: req.userId,
      toUserId: to,
      amount: rupeesToPaise(amount),
      note,
    });
    res.json({
      message: "Transfer successful",
      transactionId: transaction._id.toString(),
      amount: paiseToRupees(transaction.amount),
      balance: paiseToRupees(balance),
    });
  });

  router.get("/transactions", validate(historySchema, "query"), async (req, res) => {
    const items = await transferService.history(req.userId, req.valid.query.limit);
    res.json({ transactions: items.map((t) => ({ ...t, amount: paiseToRupees(t.amount) })) });
  });

  return router;
}

module.exports = { createAccountRouter };
