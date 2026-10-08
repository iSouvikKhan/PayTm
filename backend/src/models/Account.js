const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Integer paise. Can never go below zero.
    balance: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "balance must be an integer number of paise" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Account || mongoose.model("Account", accountSchema);
