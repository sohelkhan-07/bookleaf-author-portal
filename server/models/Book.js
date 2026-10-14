const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isbn: {
      type: String,
      default: null,
    },

    genre: {
      type: String,
      default: null,
    },

    publicationDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      required: true,
      trim: true,
    },

    mrp: {
      type: Number,
      default: null,
      min: 0,
    },

    authorRoyaltyPerCopy: {
      type: Number,
      default: null,
      min: 0,
    },

    totalCopiesSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRoyaltyEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    royaltyPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    royaltyPending: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastRoyaltyPayoutDate: {
      type: Date,
      default: null,
    },

    printPartner: {
      type: String,
      default: null,
    },

    availableOn: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);