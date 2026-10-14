const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const Book = require("../models/Book");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { classifyTicket } = require("../services/ticket-ai.service");

const router = express.Router();

const CATEGORIES = [
  "Royalty & Payments",
  "Book Production",
  "Distribution & Sales",
  "ISBN & Metadata",
  "Account & Dashboard",
  "General Inquiry",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

const ticketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters.")
    .max(150, "Subject cannot exceed 150 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(5000, "Description cannot exceed 5000 characters."),
  category: z.enum(CATEGORIES).optional(),
  book: z.string().optional(),
});

// Create a support ticket.
router.post("/", authenticateToken, requireRole("author"), async (req, res) => {
  try {
    const validation = ticketSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Please check the ticket details.",
        errors: validation.error.flatten(),
      });
    }

    const { subject, description, category, book: bookId } = validation.data;

    let linkedBook = null;

    if (bookId) {
      if (!mongoose.isValidObjectId(bookId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid book ID.",
        });
      }

      linkedBook = await Book.findOne({
        _id: bookId,
        author: req.user.id,
      });

      if (!linkedBook) {
        return res.status(400).json({
          success: false,
          message: "The selected book was not found in your account.",
        });
      }
    }

    let aiResult = null;

    try {
      aiResult = await classifyTicket({ subject, description });
    } catch (error) {
      console.error("Ticket classification failed:", error.message);
    }

    const finalCategory = category || aiResult?.category || "General Inquiry";

    const finalPriority = PRIORITIES.includes(aiResult?.priority)
      ? aiResult.priority
      : "Medium";

    const ticket = await Ticket.create({
      author: req.user.id,
      book: linkedBook?._id || null,
      subject,
      description,
      category: finalCategory,
      priority: finalPriority,
      status: "Open",
      aiClassification: aiResult
        ? {
            category: aiResult.category,
            priority: aiResult.priority,
            confidence: aiResult.confidence,
          }
        : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully.",
      aiClassificationAvailable: Boolean(aiResult),
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create the support ticket.",
    });
  }
});

// Get the authenticated author's tickets.
// Never expose internal admin notes to authors.
router.get(
  "/my-tickets",
  authenticateToken,
  requireRole("author"),
  async (req, res) => {
    try {
      const tickets = await Ticket.find({
        author: req.user.id,
      })
        .populate("book", "bookId title isbn")
        .sort({ createdAt: -1 })
        .lean();

      const safeTickets = tickets.map((ticket) => ({
        ...ticket,
        messages: (ticket.messages || []).filter(
          (message) => message.internal === false,
        ),
      }));

      return res.status(200).json({
        success: true,
        count: safeTickets.length,
        tickets: safeTickets,
      });
    } catch (error) {
      console.error("Fetch author tickets error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch your support tickets.",
      });
    }
  },
);

module.exports = router;
