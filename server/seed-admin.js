require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./db");

async function seedAdmin() {
  try {
    if (
      !process.env.ADMIN_NAME ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env",
      );
    }

    if (process.env.ADMIN_PASSWORD.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    }

    await connectDB();

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    const existingUser = await User.findOne({ email }).select("+password");

    if (existingUser && existingUser.role !== "admin") {
      throw new Error(
        "That email already belongs to a non-admin account. Choose another email.",
      );
    }

    if (existingUser) {
      console.log("Admin account already exists; no changes made.");
    } else {
      await User.create({
        name: process.env.ADMIN_NAME.trim(),
        email,
        password: passwordHash,
        role: "admin",
      });

      console.log("Admin account created successfully.");
    }
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seedAdmin();
