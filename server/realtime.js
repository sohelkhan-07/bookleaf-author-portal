function emitTicketChanged(req, ticket, options = {}) {
  if (!ticket) return;

  const io = req.app.get("io");
  if (!io) return;

  const ticketId = String(ticket._id || ticket.id || "");
  const authorId = String(ticket.author?._id || ticket.author || "");

  if (!ticketId) return;

  const event = {
    ticketId,
    action: options.action || "updated",
  };

  io.to("admins").emit("ticket:changed", event);

  if (authorId && options.authorVisible !== false) {
    io.to(`author:${authorId}`).emit("ticket:changed", event);
  }
}

module.exports = { emitTicketChanged };
