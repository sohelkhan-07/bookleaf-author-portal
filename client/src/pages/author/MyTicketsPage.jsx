import { createTicketSocket } from "../../lib/socket";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Ticket,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../context/useAuth";
import LoadingState from "../../components/LoadingState";

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

function getId(item) {
  return String(item?._id || item?.id || "");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusStyle(status) {
  switch (status) {
    case "Open":
      return "bg-blue-50 text-blue-700";
    case "In Progress":
      return "bg-amber-50 text-amber-700";
    case "Waiting for Author":
      return "bg-violet-50 text-violet-700";
    case "Resolved":
      return "bg-emerald-50 text-emerald-700";
    case "Closed":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getMessageLabel(message) {
  if (message.senderType === "ai") {
    return "BookLeaf AI Assistant";
  }

  if (message.senderType === "admin") {
    return "BookLeaf Support";
  }

  if (message.sender?.role === "admin") {
    return "BookLeaf Support";
  }

  return "You";
}

async function copyTextToClipboard(value) {
  const text = String(value || "");

  if (!text) {
    throw new Error("There is no ticket ID to copy.");
  }

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to document.execCommand.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");

  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "-9999px",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("The browser could not copy the ticket ID.");
    }
  } finally {
    textarea.remove();
  }
}

export default function MyTicketsPage() {
  const { token } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copyingId, setCopyingId] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [bookId, setBookId] = useState("");
  const [reply, setReply] = useState("");

  const loadTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [ticketData, bookData] = await Promise.all([
          apiRequest("/tickets/my-tickets", { token }),
          apiRequest("/books/my-books", { token }),
        ]);

        const ticketList = Array.isArray(ticketData)
          ? ticketData
          : ticketData.tickets || [];

        const bookList = Array.isArray(bookData)
          ? bookData
          : bookData.books || [];

        setTickets(ticketList);
        setBooks(bookList);

        if (
          selectedId &&
          !ticketList.some((ticket) => getId(ticket) === selectedId)
        ) {
          setSelectedId("");
          setSelectedTicket(null);
        }
      } catch (err) {
        setError(err.message || "Unable to load your tickets.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, selectedId],
  );

  const loadConversation = useCallback(
    async (id, { silent = false } = {}) => {
      if (!id) return;

      if (!silent) setConversationLoading(true);

      try {
        const data = await apiRequest(`/tickets/${id}`, { token });
        const ticket = data.ticket || data;

        setSelectedTicket(ticket);

        setTickets((current) =>
          current.map((item) =>
            getId(item) === id ? { ...item, ...ticket } : item,
          ),
        );
      } catch (err) {
        if (!silent) {
          setError(err.message || "Unable to load this conversation.");
        }
      } finally {
        if (!silent) setConversationLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Real-time ticket updates from the server.
  useEffect(() => {
    if (!token) return undefined;

    const socket = createTicketSocket(token);

    if (!socket) return undefined;

    const handleTicketChanged = ({ ticketId } = {}) => {
      loadTickets({ silent: true });

      if (ticketId && ticketId === selectedId) {
        loadConversation(ticketId, { silent: true });
      }
    };

    socket.on("ticket:changed", handleTicketChanged);

    return () => {
      socket.off("ticket:changed", handleTicketChanged);
      socket.disconnect();
    };
  }, [token, selectedId, loadTickets, loadConversation]);

  // Keep polling as a fallback if a real-time event is missed.
  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null);
      return undefined;
    }

    loadConversation(selectedId);

    const timer = setInterval(() => {
      loadConversation(selectedId, { silent: true });
    }, 15000);

    return () => clearInterval(timer);
  }, [selectedId, loadConversation]);

  const openConversation = (ticket) => {
    const id = getId(ticket);

    if (!id) return;

    setSelectedId(id);
    setSelectedTicket(ticket);
    setReply("");
    setError("");
    setNotice("");
  };

  const handleCopyTicketId = async (ticketId) => {
    if (!ticketId) {
      setError("The ticket ID is unavailable.");
      return;
    }

    setCopyingId(true);
    setError("");
    setNotice("");

    try {
      await copyTextToClipboard(ticketId);
      setNotice(`Ticket ID ${ticketId} copied to clipboard.`);
    } catch (err) {
      console.error("Copy ticket ID failed:", err);

      setError(
        "Your browser could not copy the ticket ID. You can select the ID above and copy it manually.",
      );
    } finally {
      setCopyingId(false);
    }
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setCreating(true);

    try {
      const data = await apiRequest("/tickets", {
        method: "POST",
        token,
        body: {
          subject: subject.trim(),
          description: description.trim(),
          ...(category ? { category } : {}),
          ...(bookId ? { book: bookId } : {}),
        },
      });

      const newTicket = data?.ticket || data;
      const newTicketId = String(
        data?.ticketId || getId(newTicket) || "",
      );

      setSubject("");
      setDescription("");
      setCategory("");
      setBookId("");
      setShowForm(false);

      setNotice(
        newTicketId
          ? `Your ticket has been created successfully. Ticket ID: ${newTicketId}`
          : data?.message ||
              "Your ticket was created, but its ID was not returned by the server.",
      );

      await loadTickets();

      if (newTicketId) {
        openConversation({
          ...newTicket,
          _id: getId(newTicket) || newTicketId,
        });
      }
    } catch (err) {
      setError(err.message || "Unable to create your ticket.");
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (event) => {
    event.preventDefault();

    if (!selectedId || !reply.trim()) return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/tickets/${selectedId}/messages`, {
        method: "POST",
        token,
        body: { message: reply.trim() },
      });

      setReply("");

      await Promise.all([
        loadConversation(selectedId),
        loadTickets({ silent: true }),
      ]);

      setNotice("Your reply has been sent.");
    } catch (err) {
      setError(err.message || "Unable to send your reply.");
    } finally {
      setSending(false);
    }
  };

  const activeTicket =
    selectedTicket ||
    tickets.find((ticket) => getId(ticket) === selectedId) ||
    null;

  const activeTicketId = getId(activeTicket);
  const messages = activeTicket?.messages || [];
  const canReply =
    activeTicket &&
    !["Resolved", "Closed"].includes(activeTicket.status);

  if (loading) {
    return <LoadingState message="Loading your support tickets..." />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-rose-700">
            Author support
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            My tickets
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Track your requests and continue the conversation with BookLeaf
            Support.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadTickets({ silent: true })}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setSelectedId("");
              setSelectedTicket(null);
              setError("");
              setNotice("");
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Cancel" : "New ticket"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={handleCreateTicket}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create a support ticket
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Describe the issue clearly so we can help you.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Subject
            </span>
            <input
              required
              minLength={5}
              maxLength={200}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Briefly describe your issue"
              className="min-h-11 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </span>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain what happened and what help you need"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Category (optional)
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              >
                <option value="">Let AI suggest a category</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Related book (optional)
              </span>
              <select
                value={bookId}
                onChange={(event) => setBookId(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              >
                <option value="">No specific book</option>
                {books.map((book) => (
                  <option key={getId(book)} value={getId(book)}>
                    {book.title || "Untitled book"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-10 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              <Send size={16} />
              {creating ? "Creating..." : "Submit ticket"}
            </button>
          </div>
        </form>
      ) : selectedId && activeTicket ? (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <button
              type="button"
              onClick={() => {
                setSelectedId("");
                setSelectedTicket(null);
                setError("");
                setNotice("");
              }}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-800"
            >
              <ArrowLeft size={16} />
              All tickets
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(activeTicket.status)}`}
              >
                {activeTicket.status || "Unknown"}
              </span>
              <span className="text-xs text-gray-400">
                Created {formatDate(activeTicket.createdAt)}
              </span>
            </div>

            <h2 className="mt-3 break-words text-xl font-semibold text-gray-900 sm:text-2xl">
              {activeTicket.subject}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>Ticket ID:</span>
              <code className="break-all rounded-md bg-gray-100 px-2 py-1 font-mono text-gray-700">
                {activeTicketId || "Unavailable"}
              </code>

              {activeTicketId && (
                <button
                  type="button"
                  onClick={() => handleCopyTicketId(activeTicketId)}
                  disabled={copyingId}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {copyingId ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : notice.includes("copied to clipboard") ? (
                    <Check size={13} />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copyingId
                    ? "Copying..."
                    : notice.includes("copied to clipboard")
                      ? "Copied"
                      : "Copy ID"}
                </button>
              )}
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
              {activeTicket.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
              <span>{activeTicket.category}</span>
              <span>Priority: {activeTicket.priority}</span>
              {activeTicket.book?.title && (
                <span>Book: {activeTicket.book.title}</span>
              )}
            </div>
          </div>

          <div className="space-y-4 bg-gray-50/70 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MessageCircle size={17} className="text-rose-600" />
                Conversation
              </h3>

              <button
                type="button"
                onClick={() => loadConversation(selectedId)}
                disabled={conversationLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-rose-700 disabled:opacity-60"
              >
                <RefreshCw
                  size={13}
                  className={conversationLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {conversationLoading && messages.length === 0 ? (
              <LoadingState message="Loading conversation..." />
            ) : messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                <MessageCircle
                  size={22}
                  className="mx-auto text-gray-400"
                />
                <p className="mt-2 text-sm text-gray-600">
                  No replies yet. Your support conversation will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isAuthor = message.senderType === "author";
                  const isAI = message.senderType === "ai";

                  return (
                    <article
                      key={message._id || `${message.createdAt}-${index}`}
                      className={`max-w-3xl rounded-2xl border p-4 ${
                        isAuthor
                          ? "ml-auto border-rose-200 bg-rose-50"
                          : isAI
                            ? "mr-auto border-violet-200 bg-violet-50"
                            : "mr-auto border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-800">
                          {getMessageLabel(message)}
                        </p>
                        <time className="text-xs text-gray-400">
                          {formatDate(message.createdAt)}
                        </time>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                        {message.message}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}

            {canReply ? (
              <form
                onSubmit={handleSendReply}
                className="space-y-3 border-t border-gray-200 pt-4"
              >
                <label
                  htmlFor="ticket-reply"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Your reply
                </label>

                <textarea
                  id="ticket-reply"
                  required
                  maxLength={5000}
                  rows={4}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write your message to BookLeaf Support..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />

                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={15} />
                  {sending ? "Sending..." : "Send reply"}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                This ticket is {activeTicket.status?.toLowerCase()}. Create a
                new ticket if you need further assistance.
              </div>
            )}
          </div>
        </section>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Ticket size={23} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No tickets yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            When you need help with a book or your account, create a ticket and
            track replies here.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Plus size={16} />
            Create your first ticket
          </button>
        </div>
      ) : (
        <section className="space-y-3" aria-label="Your support tickets">
          {tickets.map((ticket) => {
            const id = getId(ticket);

            return (
              <button
                type="button"
                key={id}
                onClick={() => openConversation(ticket)}
                className="group flex w-full min-w-0 items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-rose-200 hover:shadow-md sm:gap-4 sm:p-5"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                  <BookOpen size={20} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-words font-semibold text-gray-900">
                      {ticket.subject}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(ticket.status)}`}
                    >
                      {ticket.status || "Unknown"}
                    </span>
                  </span>

                  <span className="mt-1 block line-clamp-2 text-sm leading-6 text-gray-500">
                    {ticket.description}
                  </span>

                  <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span>{ticket.category}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                    <span>{(ticket.messages || []).length} message(s)</span>
                  </span>
                </span>

                <ArrowRight
                  size={18}
                  className="mt-1 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-rose-600"
                />
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}