const express = require("express");
const Book = require("../models/Book");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/my-books",
  authenticateToken,
  requireRole("author"),
  async (req, res) => {
    try {
      const books = await Book.find({ author: req.user.id })
        .select(
          "bookId title isbn genre publicationDate status mrp authorRoyaltyPerCopy totalCopiesSold totalRoyaltyEarned royaltyPaid royaltyPending lastRoyaltyPayoutDate printPartner availableOn",
        )
        .sort({ title: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: books.length,
        books,
      });
    } catch (error) {
      console.error("Fetch author books error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve your books at this time.",
      });
    }
  },
);

module.exports = router;
