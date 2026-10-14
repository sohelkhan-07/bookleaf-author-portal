const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password.",
      });
    }

    const email = validation.data.email.toLowerCase();
    const { password } = validation.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from server/.env");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        authorId: user.authorId,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
    });
  }
});

router.get("/me", authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
