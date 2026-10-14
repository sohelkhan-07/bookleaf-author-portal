const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    authorId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["author", "admin"],
      default: "author",
      required: true,
    },

    phone: {
      type: String,
      default: null,
    },

    city: {
      type: String,
      default: null,
    },

    joinedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);