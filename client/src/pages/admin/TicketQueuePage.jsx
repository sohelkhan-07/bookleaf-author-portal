import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  Bot,
  Check,
  Copy,
  CheckCircle2,
  Clock3,
  Filter,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../context/useAuth";
import { createTicketSocket } from "../../lib/socket";
import LoadingState from "../../components/LoadingState";

const STATUSES = [
  "Open",
  "In Progress",
  "Waiting for Author",
  "Resolved",
  "Closed",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const POLL_INTERVAL = 12000;
const OLD_TICKET_HOURS = 48;

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

async function copyTicketId(ticketId) {
  if (!ticketId) return;

  try {
    await navigator.clipboard.writeText(ticketId);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = ticketId;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

function unwrapTicket(data) {
  return data?.ticket || data?.data?.ticket || data?.data || data;
}

function unwrapTickets(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.data?.tickets)) return data.data.tickets;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function unwrapMessages(data) {
  const ticket = unwrapTicket(data);
  return Array.isArray(ticket?.messages) ? ticket.messages : [];
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isUnresolved(ticket) {
  return !["Resolved", "Closed"].includes(ticket?.status);
}

function isOldTicket(ticket) {
  if (!isUnresolved(ticket)) return false;

  const created = new Date(ticket?.createdAt).getTime();
  if (!Number.isFinite(created)) return false;

  return Date.now() - created > OLD_TICKET_HOURS * 60 * 60 * 1000;
}

function isUrgent(ticket) {
  return ["Critical", "High"].includes(ticket?.priority);
}

function getMessageText(message) {
  if (typeof message === "string") return message;
  return message?.message || message?.text || "";
}

function getMessageLabel(message) {
  if (message?.internal) return "Internal note";
  if (message?.senderType === "ai") return "AI draft";

  const role = String(
    message?.sender?.role || message?.senderType || "",
  ).toLowerCase();

  if (role === "admin") return "Admin reply";
  if (role === "author") return "Author reply";

  return "Message";
}

function getMessageStyle(message) {
  if (message?.internal) {
    return "border-amber-200 bg-amber-50";
  }

  if (message?.senderType === "ai") {
    return "border-violet-200 bg-violet-50";
  }

  return "border-gray-200 bg-white";
}

function getAssigneeName(ticket) {
  const assigned = ticket?.assignedTo;

  if (!assigned) return "Unassigned";
  if (typeof assigned === "string") return "Assigned";

  return assigned.name || assigned.email || "Assigned";
}

export default function TicketQueuePage() {
  const { token, user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const selectedTicketId = getId(selectedTicket);
  const selectedTicketIdRef = useRef("");
  const queueRequestRef = useRef(0);
  const detailRequestRef = useRef(0);

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

    if (fromDate) {
      params.set("from", new Date(`${fromDate}T00:00:00`).toISOString());
    }

    if (toDate) {
      params.set("to", new Date(`${toDate}T23:59:59.999`).toISOString());
    }

    const query = params.toString();
    return query ? `?${query}` : "";
  }, [statusFilter, categoryFilter, priorityFilter, fromDate, toDate]);

  const loadTickets = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = ++queueRequestRef.current;

      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await apiRequest(`/admin/tickets${buildQuery()}`, {
          token,
        });

        if (requestId !== queueRequestRef.current) return;

        setTickets(unwrapTickets(data));
        setLastUpdated(new Date());
        setError("");
      } catch (err) {
        if (requestId === queueRequestRef.current && !silent) {
          setError(getErrorMessage(err, "Could not load the ticket queue."));
        }
      } finally {
        if (requestId === queueRequestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, buildQuery],
  );

  const loadTicketDetail = useCallback(
    async (ticketId, { silent = false } = {}) => {
      if (!ticketId) return;

      const requestId = ++detailRequestRef.current;

      if (!silent) setDetailLoading(true);

      try {
        const data = await apiRequest(`/admin/tickets/${ticketId}`, {
          token,
        });

        if (requestId !== detailRequestRef.current) return;

        const ticket = unwrapTicket(data);

        if (!ticket || !getId(ticket)) {
          throw new Error("The server returned an invalid ticket.");
        }

        // Don't reopen or replace a conversation that the admin has closed.
        if (selectedTicketIdRef.current !== ticketId) return;

        setSelectedTicket(ticket);

        if (!silent) {
          setReply("");
          setInternalNote(false);
        }
      } catch (err) {
        if (requestId === detailRequestRef.current) {
          setError(
            getErrorMessage(err, "Could not load the ticket conversation."),
          );
        }
      } finally {
        if (requestId === detailRequestRef.current) {
          setDetailLoading(false);
        }
      }
    },
    [token],
  );

  // Initial queue load.
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Real-time updates through Socket.IO.
  useEffect(() => {
    if (!token) return undefined;

    const socket = createTicketSocket(token);

    if (!socket) return undefined;

    const handleTicketChanged = (payload = {}) => {
      // Refresh the filtered queue after any ticket change.
      loadTickets({ silent: true });

      const currentId = selectedTicketIdRef.current;
      const changedTicketId = getId(
        payload.ticketId || payload.ticket?._id || payload.ticket?.id,
      );

      // Refresh the conversation only if the selected ticket changed.
      if (currentId && (!changedTicketId || changedTicketId === currentId)) {
        loadTicketDetail(currentId, { silent: true });
      }

      // If the selected ticket was deleted, clear the conversation.
      if (
        currentId &&
        changedTicketId === currentId &&
        (payload.action === "deleted" || payload.deleted === true)
      ) {
        detailRequestRef.current += 1;
        selectedTicketIdRef.current = "";
        setSelectedTicket(null);
        setReply("");
        setInternalNote(false);
      }
    };

    socket.on("ticket:changed", handleTicketChanged);

    return () => {
      socket.off("ticket:changed", handleTicketChanged);
      socket.disconnect();
    };
  }, [token, loadTickets, loadTicketDetail]);

  // Polling remains as a fallback if the socket disconnects.
  useEffect(() => {
    const interval = setInterval(() => {
      loadTickets({ silent: true });

      const currentId = selectedTicketIdRef.current;

      if (currentId) {
        loadTicketDetail(currentId, { silent: true });
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [loadTickets, loadTicketDetail]);

  const visibleTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (!query) return true;

      const searchable = [
        ticket.subject,
        ticket.description,
        ticket.category,
        ticket.priority,
        ticket.status,
        ticket.author?.name,
        ticket.author?.email,
        ticket.book?.title,
        ticket._id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [tickets, search]);

  const counts = useMemo(() => {
    const unresolved = tickets.filter(isUnresolved);

    return {
      total: tickets.length,
      unresolved: unresolved.length,
      urgent: unresolved.filter(isUrgent).length,
      old: unresolved.filter(isOldTicket).length,
    };
  }, [tickets]);

  async function updateTicket(ticketId, changes, label) {
    if (!ticketId) return;

    setActionLoading(label);
    setError("");
    setNotice("");

    try {
      const data = await apiRequest(`/admin/tickets/${ticketId}`, {
        method: "PATCH",
        token,
        body: changes,
      });

      const updated = unwrapTicket(data);

      if (updated && typeof updated === "object") {
        setTickets((current) =>
          current.map((ticket) =>
            getId(ticket) === ticketId ? { ...ticket, ...updated } : ticket,
          ),
        );

        if (getId(selectedTicket) === ticketId) {
          setSelectedTicket((current) => ({
            ...current,
            ...updated,
          }));
        }
      }

      await Promise.all([
        loadTickets({ silent: true }),
        getId(selectedTicket) === ticketId
          ? loadTicketDetail(ticketId, { silent: true })
          : Promise.resolve(),
      ]);

      setNotice("Ticket updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update the ticket."));
    } finally {
      setActionLoading("");
    }
  }

  async function assignToMe(ticket) {
    const ticketId = getId(ticket);
    const adminId = getId(user);

    if (!adminId) {
      setError("Your admin ID is missing. Please sign out and sign in again.");
      return;
    }

    await updateTicket(ticketId, { assignedTo: adminId }, `assign-${ticketId}`);
  }

  async function openTicket(ticket) {
    const ticketId = getId(ticket);

    setError("");
    setNotice("");
    setSelectedTicket(ticket);
    selectedTicketIdRef.current = ticketId;
    setReply("");
    setInternalNote(false);

    await loadTicketDetail(ticketId);
  }

  async function handleGenerateDraft() {
    if (!selectedTicketId) return;

    if (["Resolved", "Closed"].includes(selectedTicket?.status)) {
      setError("Reopen this ticket before generating a reply.");
      return;
    }

    setDraftLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await apiRequest(
        `/admin/tickets/${selectedTicketId}/ai-draft`,
        {
          method: "POST",
          token,
          body: {},
        },
      );

      const draft =
        data?.aiDraftReply ??
        data?.ticket?.aiDraftReply ??
        data?.data?.aiDraftReply ??
        data?.data?.ticket?.aiDraftReply ??
        data?.draftReply ??
        data?.draft?.reply ??
        data?.draft?.message ??
        data?.draft ??
        data?.reply;

      if (typeof draft !== "string" || !draft.trim()) {
        throw new Error(
          data?.error ||
            data?.message ||
            "The server did not return an AI draft. Check the backend logs and AI quota.",
        );
      }

      setReply(draft.trim());

      await Promise.all([
        loadTickets({ silent: true }),
        loadTicketDetail(selectedTicketId, { silent: true }),
      ]);

      setNotice("AI draft generated. Review and edit it before sending.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not generate the AI draft. Check the AI service and server logs.",
        ),
      );
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!selectedTicketId) return;

    const message = reply.trim();

    if (!message) {
      setError("Enter a message before sending.");
      return;
    }

    if (["Resolved", "Closed"].includes(selectedTicket?.status)) {
      setError("Reopen this ticket before sending a message.");
      return;
    }

    const wasInternal = internalNote;

    setActionLoading("send-message");
    setError("");
    setNotice("");

    try {
      await apiRequest(`/admin/tickets/${selectedTicketId}/messages`, {
        method: "POST",
        token,
        body: {
          message,
          internal: wasInternal,
        },
      });

      setReply("");
      setInternalNote(false);

      await Promise.all([
        loadTickets({ silent: true }),
        loadTicketDetail(selectedTicketId, { silent: true }),
      ]);

      setNotice(
        wasInternal
          ? "Internal note added. The author cannot see it."
          : "Reply sent to the author.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not send the message."));
    } finally {
      setActionLoading("");
    }
  }

  async function handleDeleteMessage(message) {
    const ticketId = selectedTicketId;
    const messageId = getId(message);

    if (!ticketId || !messageId) {
      setError("Unable to identify this message.");
      return;
    }

    const confirmed = window.confirm(
      "Permanently delete this message? This action cannot be undone.",
    );

    if (!confirmed) return;

    const actionId = `delete-message-${messageId}`;

    setActionLoading(actionId);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/admin/tickets/${ticketId}/messages/${messageId}`, {
        method: "DELETE",
        token,
      });

      await Promise.all([
        loadTicketDetail(ticketId, { silent: true }),
        loadTickets({ silent: true }),
      ]);

      setNotice("Message deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete the message."));
    } finally {
      setActionLoading("");
    }
  }

  async function handleDeleteTicket(ticket) {
    const ticketId = getId(ticket);

    const confirmed = window.confirm(
      `Permanently delete ticket "${ticket.subject || ticketId}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setActionLoading(`delete-${ticketId}`);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/admin/tickets/${ticketId}`, {
        method: "DELETE",
        token,
      });

      if (selectedTicketIdRef.current === ticketId) {
        detailRequestRef.current += 1;
        selectedTicketIdRef.current = "";
        setSelectedTicket(null);
        setReply("");
        setInternalNote(false);
      }

      await loadTickets({ silent: true });
      setNotice("Ticket deleted.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete the ticket."));
    } finally {
      setActionLoading("");
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setPriorityFilter("");
    setFromDate("");
    setToDate("");
  }

  if (loading && tickets.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-rose-600">
              BookLeaf Publishing
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Support ticket queue
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Review author issues, manage ticket status, and prepare replies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadTickets()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh queue
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span className="min-w-0 flex-1">{error}</span>
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
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <span className="min-w-0 flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Tickets in queue",
              value: counts.total,
              icon: MessageSquare,
            },
            {
              label: "Unresolved",
              value: counts.unresolved,
              icon: Clock3,
            },
            {
              label: "Critical / High",
              value: counts.urgent,
              icon: AlertCircle,
            },
            {
              label: "Older than 48 hours",
              value: counts.old,
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-gray-500 sm:text-sm">
                    {item.label}
                  </p>
                  <Icon size={17} className="shrink-0 text-rose-500" />
                </div>
                <p className="mt-3 text-2xl font-bold">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <h2 className="font-semibold">Filters</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="relative block">
              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                Search tickets
              </span>
              <Search
                size={16}
                className="absolute left-3 top-9.25 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Subject, author, book, or ID"
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              >
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                Category
              </span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                Priority
              </span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              >
                <option value="">All priorities</option>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                Created from
              </span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                Created to
              </span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {visibleTickets.length} ticket
              {visibleTickets.length === 1 ? "" : "s"} shown
              {lastUpdated
                ? ` · Updated ${lastUpdated.toLocaleTimeString()}`
                : ""}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-rose-600 hover:text-rose-700"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold">All tickets</h2>
              <p className="mt-1 text-xs text-gray-500">
                Critical and older unresolved tickets are highlighted.
              </p>
            </div>
            <ArrowDownUp size={17} className="text-gray-400" />
          </div>

          {visibleTickets.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <MessageSquare size={28} className="mx-auto text-gray-300" />
              <h3 className="mt-3 font-semibold">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleTickets.map((ticket) => {
                const ticketId = getId(ticket);
                const urgent = isUrgent(ticket);
                const old = isOldTicket(ticket);
                const active = ticketId === selectedTicketId;

                return (
                  <article
                    key={ticketId}
                    className={`border-l-4 p-4 transition sm:px-5 ${
                      active
                        ? "border-l-rose-500 bg-rose-50/50"
                        : urgent
                          ? "border-l-red-400 bg-red-50/40"
                          : old
                            ? "border-l-amber-400 bg-amber-50/40"
                            : "border-l-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <button
                        type="button"
                        onClick={() => openTicket(ticket)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-all text-sm font-semibold">
                              {ticket.subject || "Untitled ticket"}
                            </span>

                            {urgent && isUnresolved(ticket) && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Urgent
                              </span>
                            )}

                            {old && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                Older than 48h
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Ticket ID:
                            </span>

                            <code className="break-all rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              {ticketId}
                            </code>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                copyTicketId(ticketId);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                              aria-label="Copy ticket ID"
                              title="Copy ticket ID"
                            >
                              <Copy size={12} />
                              Copy ID
                            </button>
                          </div>

                          {urgent && isUnresolved(ticket) && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                              Urgent
                            </span>
                          )}

                          {old && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Older than 48h
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {ticket.description || "No description provided."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>
                            Author:{" "}
                            {ticket.author?.name ||
                              ticket.author?.email ||
                              "Unknown"}
                          </span>
                          <span>
                            Book: {ticket.book?.title || "No book linked"}
                          </span>
                          <span>Created: {formatDate(ticket.createdAt)}</span>
                          <span>Assignee: {getAssigneeName(ticket)}</span>
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center gap-2 lg:max-w-sm lg:justify-end">
                        <select
                          aria-label="Ticket status"
                          value={ticket.status || "Open"}
                          disabled={actionLoading === `status-${ticketId}`}
                          onChange={(event) =>
                            updateTicket(
                              ticketId,
                              { status: event.target.value },
                              `status-${ticketId}`,
                            )
                          }
                          className="max-w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-rose-400"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label="Ticket category"
                          value={
                            CATEGORIES.includes(ticket.category)
                              ? ticket.category
                              : "General Inquiry"
                          }
                          disabled={actionLoading === `category-${ticketId}`}
                          onChange={(event) =>
                            updateTicket(
                              ticketId,
                              { category: event.target.value },
                              `category-${ticketId}`,
                            )
                          }
                          className="max-w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-rose-400"
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label="Ticket priority"
                          value={
                            PRIORITIES.includes(ticket.priority)
                              ? ticket.priority
                              : "Medium"
                          }
                          disabled={actionLoading === `priority-${ticketId}`}
                          onChange={(event) =>
                            updateTicket(
                              ticketId,
                              { priority: event.target.value },
                              `priority-${ticketId}`,
                            )
                          }
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-rose-400"
                        >
                          {PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => assignToMe(ticket)}
                          disabled={actionLoading === `assign-${ticketId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-100 disabled:opacity-50"
                        >
                          {actionLoading === `assign-${ticketId}` ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <UserRound size={14} />
                          )}
                          Assign to me
                        </button>

                        <button
                          type="button"
                          onClick={() => openTicket(ticket)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                        >
                          <MessageSquare size={14} />
                          Open
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selectedTicket && (
          <section
            id="ticket-conversation"
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Ticket conversation
                </p>
                <h2 className="mt-1 wrap-break-word text-lg font-bold">
                  {selectedTicket.subject || "Untitled ticket"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    Ticket ID:
                  </span>

                  <code className="break-all rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                    {selectedTicketId}
                  </code>

                  <button
                    type="button"
                    onClick={() => copyTicketId(selectedTicketId)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <Copy size={12} />
                    Copy ID
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedTicket.author?.name ||
                    selectedTicket.author?.email ||
                    "Unknown author"}
                  {" · "}
                  {selectedTicket.book?.title || "No book linked"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  detailRequestRef.current += 1;
                  selectedTicketIdRef.current = "";
                  setSelectedTicket(null);
                  setReply("");
                  setInternalNote(false);
                  setError("");
                  setNotice("");
                }}
                className="self-end rounded-lg p-2 text-gray-500 hover:bg-gray-200 sm:self-start"
                aria-label="Close ticket conversation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)] lg:p-5">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Conversation history</h3>
                  <button
                    type="button"
                    onClick={() =>
                      loadTicketDetail(selectedTicketId, { silent: false })
                    }
                    disabled={detailLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    <RefreshCw
                      size={13}
                      className={detailLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                {detailLoading && !selectedTicket.messages ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
                    <LoaderCircle size={16} className="animate-spin" />
                    Loading conversation…
                  </div>
                ) : (
                  <div className="max-h-140 space-y-3 overflow-y-auto pr-1">
                    {unwrapMessages(selectedTicket).length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No messages have been added yet.
                      </div>
                    ) : (
                      unwrapMessages(selectedTicket).map((message, index) => {
                        const messageId = getId(message);
                        const deleting =
                          actionLoading === `delete-message-${messageId}`;

                        return (
                          <div
                            key={messageId || `${index}-${message.createdAt}`}
                            className={`rounded-xl border p-3 ${getMessageStyle(message)}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-700">
                                {getMessageLabel(message)}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>

                            {message.sender?.name && (
                              <p className="mt-1 text-xs text-gray-500">
                                {message.sender.name}
                              </p>
                            )}

                            <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-800">
                              {getMessageText(message)}
                            </p>

                            {message.internal && (
                              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-800">
                                <ShieldCheck size={13} />
                                Visible to admins only
                              </p>
                            )}

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(message)}
                                disabled={!messageId || Boolean(actionLoading)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Delete ${getMessageLabel(message)}`}
                              >
                                {deleting ? (
                                  <LoaderCircle
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                                Delete message
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                      <Sparkles size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">AI reply assistant</h3>
                      <p className="mt-1 text-sm leading-5 text-gray-600">
                        Generate a knowledge-base-grounded suggestion, then
                        review and edit it before sending.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={
                      draftLoading ||
                      ["Resolved", "Closed"].includes(selectedTicket.status)
                    }
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {draftLoading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Bot size={16} />
                    )}
                    {draftLoading ? "Generating draft…" : "Generate AI draft"}
                  </button>

                  {["Resolved", "Closed"].includes(selectedTicket.status) && (
                    <p className="mt-2 text-xs text-gray-500">
                      Reopen the ticket before generating a reply.
                    </p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div>
                    <label
                      htmlFor="ticket-reply"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      {internalNote ? "Internal note" : "Reply to author"}
                    </label>
                    <textarea
                      id="ticket-reply"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={9}
                      maxLength={10000}
                      placeholder={
                        internalNote
                          ? "Write an internal note for the support team…"
                          : "Write or edit your reply to the author…"
                      }
                      disabled={["Resolved", "Closed"].includes(
                        selectedTicket.status,
                      )}
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm leading-6 outline-none placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-gray-50"
                    />
                    <p className="mt-1 text-right text-xs text-gray-400">
                      {reply.length}/10000
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3">
                    <input
                      type="checkbox"
                      checked={internalNote}
                      onChange={(event) =>
                        setInternalNote(event.target.checked)
                      }
                      className="mt-0.5 accent-rose-600"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        Add as internal note
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        The author will not be able to see this note.
                      </span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={
                      actionLoading === "send-message" ||
                      !reply.trim() ||
                      ["Resolved", "Closed"].includes(selectedTicket.status)
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === "send-message" ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : internalNote ? (
                      <Check size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    {actionLoading === "send-message"
                      ? "Saving…"
                      : internalNote
                        ? "Save internal note"
                        : "Send reply"}
                  </button>
                </form>

                <div className="border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => handleDeleteTicket(selectedTicket)}
                    disabled={
                      actionLoading === `delete-${selectedTicketId}` ||
                      Boolean(actionLoading)
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionLoading === `delete-${selectedTicketId}` ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    Delete ticket
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Deletion is permanent. Confirm carefully before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <span>
            Queue refreshes automatically every 12 seconds, with real-time
            updates when connected.
          </span>
          <span>
            {lastUpdated
              ? `Last refresh: ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for first refresh"}
          </span>
        </footer>
      </div>
    </div>
  );
}
