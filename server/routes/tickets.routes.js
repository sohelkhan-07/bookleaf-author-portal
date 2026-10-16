const { emitTicketChanged } = require("../realtime");
const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");

const Ticket = require("../models/Ticket");
const Book = require("../models/Book");
const { authenticateToken, requireRole } = require("../middleware/auth");

const {
  classifyTicket,
  draftTicketReply,
} = require("../services/ticket-ai.service");

const router = express.Router();

router.use(authenticateToken);

const ticketSchema = z.object({
  subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(5000),
  category: z
    .enum([
      "Royalty & Payments",
      "ISBN & Metadata Issues",
      "Printing & Quality",
      "Distribution & Availability",
      "Book Status & Production Updates",
      "General Inquiry",
    ])
    .optional()
    .default("General Inquiry"),
  book: z.string().optional().nullable(),
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

function hideInternalMessages(ticket) {
  return {
    ...ticket,
    messages: (ticket.messages || []).filter(
      (message) => message.internal === false,
    ),
  };
}

async function draftInitialReplyWithRetry(payload, maxAttempts = 1) {
  let lastError;

  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    try {
      return await draftTicketReply(payload);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

/**
 * POST /api/tickets
 * Create a ticket as an author.
 */
router.post("/", requireRole("author"), async (req, res) => {
  try {
    const parsed = ticketSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten();

      console.error("Ticket validation failed:", errors);

      return res.status(400).json({
        success: false,
        message: "Please check the ticket details and try again.",
        errors,
      });
    }

    const {
      subject,
      description,
      category = "General Inquiry",
      book,
    } = parsed.data;

    let selectedBook = null;

    if (book) {
      if (!mongoose.isValidObjectId(book)) {
        return res.status(400).json({
          success: false,
          message: "The selected book ID is invalid.",
        });
      }

      selectedBook = await Book.findOne({
        _id: book,
        author: req.user.id,
      });

      if (!selectedBook) {
        return res.status(404).json({
          success: false,
          message: "The selected book was not found in your account.",
        });
      }
    }

    // AI classification is optional.
    // A failure must not prevent ticket creation.
    let aiResult = null;

    try {
      aiResult = await classifyTicket({
        subject,
        description,
        category,
      });
    } catch (error) {
      console.error("Ticket AI classification failed:", error.message);
    }

    const ticket = await Ticket.create({
      author: req.user.id,
      book: selectedBook?._id || undefined,
      subject,
      description,
      category: aiResult?.category || category,
      priority: aiResult?.priority || "Medium",
      status: "Open",
      messages: [],
    });

    // Generate an initial AI response when the service is available.
    let aiReplyAvailable = false;

    try {
      const reply = await draftInitialReplyWithRetry({
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        authorName: req.user.name,
        bookTitle: selectedBook?.title || null,
        bookContext: selectedBook
          ? [
              {
                title: selectedBook.title,
                bookId: selectedBook.bookId,
                isbn: selectedBook.isbn,
                status: selectedBook.status,
                publicationDate: selectedBook.publicationDate,
                totalCopiesSold: selectedBook.totalCopiesSold,
                totalRoyaltyEarned: selectedBook.totalRoyaltyEarned,
                royaltyPaid: selectedBook.royaltyPaid,
                royaltyPending: selectedBook.royaltyPending,
                lastRoyaltyPayoutDate: selectedBook.lastRoyaltyPayoutDate,
              },
            ]
          : [],
      });

      if (reply && String(reply).trim()) {
        ticket.messages.push({
          sender: req.user.id,
          senderType: "ai",
          message: String(reply).trim(),
          internal: false,
        });

        await ticket.save();
        aiReplyAvailable = true;
      }
    } catch (error) {
      console.error("Initial AI reply generation failed:", error.message);
    }

    // Notify admins and the ticket's author.
    // The event contains only the ticket ID and action.
    emitTicketChanged(req, ticket, { action: "created" });

    const safeTicket = hideInternalMessages(ticket.toObject());

    return res.status(201).json({
      success: true,
      message: aiReplyAvailable
        ? "Ticket created and initial reply generated."
        : "Ticket created, but the initial AI reply could not be generated. Your ticket is saved for support.",
      ticketId: String(ticket._id),
      aiClassificationAvailable: Boolean(aiResult),
      aiReplyAvailable,
      ticket: safeTicket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create your ticket right now. Please try again.",
    });
  }
});

/**
 * GET /api/tickets/my-tickets
 * Get tickets belonging to the signed-in author.
 */
router.get("/my-tickets", requireRole("author"), async (req, res) => {
  try {
    const tickets = await Ticket.find({
      author: req.user.id,
    })
      .populate("book", "title bookId isbn status")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      tickets: tickets.map(hideInternalMessages),
    });
  } catch (error) {
    console.error("Get author tickets error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your tickets right now.",
    });
  }
});

/**
 * POST /api/tickets/:id/messages
 * Add a reply to the author's own ticket.
 */
router.post("/:id/messages", requireRole("author"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const parsed = messageSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid message.",
        errors: parsed.error.flatten(),
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      author: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (["Resolved", "Closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message:
          "This ticket is closed. Please create a new ticket if you need further assistance.",
      });
    }

    ticket.messages.push({
      sender: req.user.id,
      senderType: "author",
      message: parsed.data.message,
      internal: false,
    });

    if (ticket.status === "Waiting for Author") {
      ticket.status = "In Progress";
    }

    await ticket.save();

    // Notify admins and the author about the new reply.
    emitTicketChanged(req, ticket, { action: "message" });

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("book", "title bookId isbn status")
      .lean();

    return res.json({
      success: true,
      message: "Your reply has been sent.",
      ticket: hideInternalMessages(updatedTicket),
    });
  } catch (error) {
    console.error("Author ticket message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send your reply right now.",
    });
  }
});

/**
 * GET /api/tickets/:id
 * Get a specific ticket belonging to the signed-in author.
 */
router.get("/:id", requireRole("author"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      author: req.user.id,
    })
      .populate("book", "title bookId isbn status")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    return res.json({
      success: true,
      ticket: hideInternalMessages(ticket),
    });
  } catch (error) {
    console.error("Get ticket details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load ticket details right now.",
    });
  }
});

module.exports = router;
