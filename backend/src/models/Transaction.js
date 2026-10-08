const mongoose = require("mongoose");

/** A completed transfer, written in the same database transaction as the balance changes. */
const transactionSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: "amount must be an integer number of paise" },
    },
    note: { type: String, trim: true, maxLength: 140 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
