const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // The email address is the username.
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxLength: 254,
    },
    // bcrypt hash. Never returned by the API.
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxLength: 50 },
    lastName: { type: String, required: true, trim: true, maxLength: 50 },
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
  };
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
