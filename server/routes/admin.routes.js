const express = require("express");
const { z } = require("zod");
const Ticket = require("../models/Ticket");
const Book = require("../models/Book");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { draftTicketReply } = require("../services/ticket-ai.service");

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

// GET /api/admin/tickets
// View and filter the support queue.
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

      const query = {};
      const filters = validation.data;

      if (filters.status) query.status = filters.status;
      if (filters.category) query.category = filters.category;
      if (filters.priority) query.priority = filters.priority;

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

// PATCH /api/admin/tickets/:id
// Update status, priority, or assignee.
const updateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.assignedTo !== undefined,
    { message: "Provide at least one field to update." },
  );

router.patch(
  "/tickets/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
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
        .populate("assignedTo", "name email");

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

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
// Generate and save an editable draft. Nothing is sent automatically.
router.post(
  "/tickets/:id/ai-draft",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
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

      // Only retrieve books belonging to this ticket's author.
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

      // Use the linked book if it belongs to this author.
      const selectedBook = ticket.book
        ? books.find(
            (book) => book._id.toString() === ticket.book._id.toString(),
          )
        : null;

      // If a book is linked, use only that book. Otherwise provide the
      // author's books as context without assuming which one the ticket concerns.
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
// Add an author-facing reply or an internal note.
router.post(
  "/tickets/:id/messages",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const messageSchema = z.object({
        message: z.string().trim().min(1).max(5000),
        internal: z.boolean().default(false),
      });

      const validation = messageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid message.",
          errors: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      ticket.messages.push({
        sender: req.user.id,
        message: validation.data.message,
        internal: validation.data.internal,
      });

      await ticket.save();

      return res.status(201).json({
        success: true,
        message: validation.data.internal
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

module.exports = router;
