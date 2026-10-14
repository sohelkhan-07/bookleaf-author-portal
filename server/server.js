const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const booksRoutes = require("./routes/books.routes");
const ticketsRoutes = require("./routes/tickets.routes");
const adminRoutes = require("./routes/admin.routes");
require("dotenv").config();

const app = express();

const ConnectDB = require("./db");
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bookleaf API is running!",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/admin", adminRoutes);

async function startServer() {
  try {
    await ConnectDB();
    app.listen(PORT, () => {
      console.log(`Bookleaf API is running at http://localhost: ${PORT}`);
    });
  } catch (error) {
    console.log(
      "Server startup failed because MongoDB is unavailable.",
      error.message,
    );
    process.exit(1);
  }
}

startServer();
