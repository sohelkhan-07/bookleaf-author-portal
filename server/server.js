const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const booksRoutes = require("./routes/books.routes");
const ticketsRoutes = require("./routes/tickets.routes");
const adminRoutes = require("./routes/admin.routes");
const ConnectDB = require("./db");
const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const io = initializeSocket(server);
app.set("io", io);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookLeaf API is running!",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/admin", adminRoutes);

async function startServer() {
  try {
    await ConnectDB();

    server.listen(PORT, () => {
      console.log(`BookLeaf API is running at http://localhost:${PORT}`);
      console.log("Socket.IO is ready.");
    });
  } catch (error) {
    console.error(
      "Server startup failed because MongoDB is unavailable.",
      error.message,
    );
    process.exit(1);
  }
}

startServer();
