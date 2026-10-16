const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || !process.env.JWT_SECRET) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("Account not found."));
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
      };

      next();
    } catch {
      next(new Error("Invalid or expired session."));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user.role === "admin") {
      socket.join("admins");
    } else if (socket.user.role === "author") {
      socket.join(`author:${socket.user.id}`);
    }

    socket.on("disconnect", () => {});
  });

  return io;
}

module.exports = initializeSocket;
