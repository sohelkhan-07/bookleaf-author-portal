const express = require("express");
const cors = require("cors");
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
