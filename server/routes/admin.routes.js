const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const Book = require("../models/Book");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { draftTicketReply } = require("../services/ticket-ai.service");
const { emitTicketChanged } = require("../realtime");

const router = express.Router();

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const STATUSES = [
  "Open",
  "In Progress",
  "Waiting for Author",
  "Resolved",
  "Closed",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const messageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  internal: z.boolean().default(false),
});

const updateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z.string().regex(OBJECT_ID_REGEX).nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.category !== undefined ||
      data.priority !== undefined ||
      data.assignedTo !== undefined,
    { message: "Provide at least one field to update." },
  );

function validTicketId(id) {
  return OBJECT_ID_REGEX.test(id);
}

// GET /api/admin/tickets
// List and filter the admin ticket queue.
router.get(
  "/tickets",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const filterSchema = z.object({
        status: z.enum(STATUSES).optional(),
        category: z.enum(CATEGORIES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        from: z.iso.datetime({ offset: true }).optional(),
        to: z.iso.datetime({ offset: true }).optional(),
      });

      const validation = filterSchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket filters.",
          errors: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const filters = validation.data;
      const query = {};

      if (filters.status) query.status = filters.status;
      if (filters.category) query.category = filters.category;
      if (filters.priority) query.priority = filters.priority;

      if (filters.from || filters.to) {
        query.createdAt = {};

        if (filters.from) {
          query.createdAt.$gte = new Date(filters.from);
        }

        if (filters.to) {
          query.createdAt.$lte = new Date(filters.to);
        }

        if (
          filters.from &&
          filters.to &&
          new Date(filters.from) > new Date(filters.to)
        ) {
          return res.status(400).json({
            success: false,
            message: "The start date must be before the end date.",
          });
        }
      }

      const tickets = await Ticket.find(query)
        .populate("author", "name email authorId")
        .populate("book", "title bookId isbn")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
      });
    } catch (error) {
      console.error("Admin ticket listing error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve the support queue.",
      });
    }
  },
);

// GET /api/admin/tickets/:id
// Return the ticket conversation, including private internal notes.
router.get(
  "/tickets/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!validTicketId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const ticket = await Ticket.findById(req.params.id)
        .populate("author", "name email authorId")
        .populate("book", "title bookId isbn status")
        .populate("assignedTo", "name email")
        .populate("messages.sender", "name email role")
        .lean();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    } catch (error) {
      console.error("Admin ticket detail error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve ticket details.",
      });
    }
  },
);

// PATCH /api/admin/tickets/:id
// Update status, category, priority, or assignee.
router.patch(
  "/tickets/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!validTicketId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const validation = updateTicketSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket update.",
          errors: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const updates = validation.data;

      if (updates.assignedTo) {
        const assignee = await User.findOne({
          _id: updates.assignedTo,
          role: "admin",
        }).select("_id");

        if (!assignee) {
          return res.status(400).json({
            success: false,
            message: "Assignee must be an existing admin account.",
          });
        }
      }

      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      )
        .populate("author", "name email authorId")
        .populate("book", "title bookId isbn")
        .populate("assignedTo", "name email");

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      emitTicketChanged(req, ticket, { action: "updated" });

      return res.status(200).json({
        success: true,
        message: "Ticket updated successfully.",
        ticket,
      });
    } catch (error) {
      console.error("Admin ticket update error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update the ticket.",
      });
    }
  },
);

// POST /api/admin/tickets/:id/ai-draft
// Generate a draft for admin review; never send it automatically.
router.post(
  "/tickets/:id/ai-draft",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!validTicketId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const ticket = await Ticket.findById(req.params.id)
        .populate("author", "name")
        .populate("book", "title bookId isbn status publicationDate");

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      if (!ticket.author) {
        return res.status(400).json({
          success: false,
          message: "The ticket does not have a valid author account.",
        });
      }

      const books = await Book.find({
        author: ticket.author._id,
      })
        .select(
          [
            "bookId",
            "title",
            "isbn",
            "status",
            "publicationDate",
            "totalCopiesSold",
            "totalRoyaltyEarned",
            "royaltyPaid",
            "royaltyPending",
            "lastRoyaltyPayoutDate",
          ].join(" "),
        )
        .lean();

      const selectedBook = ticket.book
        ? books.find(
            (book) => book._id.toString() === ticket.book._id.toString(),
          )
        : null;

      const relevantBooks = selectedBook ? [selectedBook] : books;

      const bookContext = relevantBooks.map((book) => ({
        title: book.title,
        bookId: book.bookId,
        isbn: book.isbn,
        status: book.status,
        publicationDate: book.publicationDate,
        totalCopiesSold: book.totalCopiesSold,
        totalRoyaltyEarned: book.totalRoyaltyEarned,
        royaltyPaid: book.royaltyPaid,
        royaltyPending: book.royaltyPending,
        lastRoyaltyPayoutDate: book.lastRoyaltyPayoutDate,
      }));

      const draft = await draftTicketReply({
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        authorName: ticket.author.name,
        bookTitle: selectedBook?.title || ticket.book?.title || null,
        bookContext,
      });

      ticket.aiDraftReply = draft;
      await ticket.save();

      emitTicketChanged(req, ticket, {
        action: "updated",
        authorVisible: false,
      });

      return res.status(200).json({
        success: true,
        message:
          "AI reply draft generated successfully. Review it before sending.",
        aiDraftReply: draft,
        context: {
          authorBooksFound: books.length,
          bookContextUsed: relevantBooks.length,
        },
      });
    } catch (error) {
      console.error("AI reply draft error:", error.message);

      return res.status(503).json({
        success: false,
        message:
          "Unable to generate an AI reply draft right now. Please try again later.",
      });
    }
  },
);

// POST /api/admin/tickets/:id/messages
// Send a public reply or private internal note.
router.post(
  "/tickets/:id/messages",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!validTicketId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const validation = messageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid message.",
          errors: validation.error.flatten(),
        });
      }

      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      const isInternal = validation.data.internal;

      ticket.messages.push({
        sender: req.user.id,
        senderType: "admin",
        message: validation.data.message,
        internal: isInternal,
      });

      if (
        !isInternal &&
        ["Open", "Waiting for Author"].includes(ticket.status)
      ) {
        ticket.status = "In Progress";
      }

      await ticket.save();

      emitTicketChanged(req, ticket, {
        action: isInternal ? "internal-note" : "message",
        authorVisible: !isInternal,
      });

      return res.status(201).json({
        success: true,
        message: isInternal
          ? "Internal note added successfully."
          : "Reply added successfully.",
      });
    } catch (error) {
      console.error("Admin ticket message error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to add the message.",
      });
    }
  },
);

// DELETE /api/admin/tickets/:id/messages/:messageId
// Permanently delete one message, leaving the ticket intact.
router.delete(
  "/tickets/:id/messages/:messageId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id, messageId } = req.params;

      if (!validTicketId(id) || !validTicketId(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID or message ID.",
        });
      }

      const ticket = await Ticket.findById(id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      const message = ticket.messages.id(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      // Remember visibility before removing the message.
      const wasInternal = message.internal === true;

      ticket.messages.pull(messageId);
      await ticket.save();

      emitTicketChanged(req, ticket, {
        action: "message-deleted",
        authorVisible: !wasInternal,
      });

      return res.status(200).json({
        success: true,
        message: "Message deleted successfully.",
        deletedMessageId: messageId,
        ticketId: id,
      });
    } catch (error) {
      console.error("Admin message deletion error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete the message.",
      });
    }
  },
);

// DELETE /api/admin/tickets/:id
// Permanently delete a ticket. The frontend must ask for confirmation.
router.delete(
  "/tickets/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!validTicketId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      // Fetch first so the author ID is available for the delete event.
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      // Notify clients before removing the ticket from the database.
      emitTicketChanged(req, ticket, { action: "deleted" });

      await Ticket.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Ticket permanently deleted.",
        deletedTicketId: ticket._id,
      });
    } catch (error) {
      console.error("Admin ticket deletion error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete the ticket.",
      });
    }
  },
);

module.exports = router;
