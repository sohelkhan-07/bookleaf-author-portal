require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const connectDB = require("./db");
const User = require("./models/User");
const Book = require("./models/Book");

const dataPath = path.join(__dirname, "data", "sample-data.json");

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    if (!process.env.SEED_AUTHOR_PASSWORD) {
      throw new Error("SEED_AUTHOR_PASSWORD is missing from server/.env");
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(rawData);

    if (!Array.isArray(data.authors)) {
      throw new Error('Invalid sample data: expected an "authors" array.');
    }

    await connectDB();

    const hashedPassword = await bcrypt.hash(
      process.env.SEED_AUTHOR_PASSWORD,
      12,
    );

    let authorCount = 0;
    let bookCount = 0;

    for (const authorData of data.authors) {
      const {
        author_id,
        name,
        email,
        phone,
        city,
        joined_date,
        books = [],
      } = authorData;

      let author = await User.findOne({ authorId: author_id });

      if (!author) {
        author = await User.findOne({ email: email.toLowerCase() });
      }

      if (!author) {
        author = await User.create({
          authorId: author_id,
          name,
          email,
          phone: phone ?? null,
          city: city ?? null,
          joinedDate: joined_date ? new Date(joined_date) : null,
          password: hashedPassword,
          role: "author",
        });
      } else {
        author.authorId = author_id;
        author.name = name;
        author.email = email.toLowerCase();
        author.phone = phone ?? null;
        author.city = city ?? null;
        author.joinedDate = joined_date ? new Date(joined_date) : null;

        await author.save();
      }

      authorCount++;

      for (const bookData of books) {
        const book = {
          bookId: bookData.book_id,
          title: bookData.title,
          author: author._id,
          isbn: bookData.isbn ?? null,
          genre: bookData.genre ?? null,
          publicationDate: bookData.publication_date
            ? new Date(bookData.publication_date)
            : null,
          status: bookData.status,
          mrp: bookData.mrp ?? null,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy ?? null,
          totalCopiesSold: bookData.total_copies_sold ?? 0,
          totalRoyaltyEarned: bookData.total_royalty_earned ?? 0,
          royaltyPaid: bookData.royalty_paid ?? 0,
          royaltyPending: bookData.royalty_pending ?? 0,
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date
            ? new Date(bookData.last_royalty_payout_date)
            : null,
          printPartner: bookData.print_partner ?? null,
          availableOn: bookData.available_on ?? [],
        };

        await Book.findOneAndUpdate(
          { bookId: book.bookId },
          { $set: book },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        );

        bookCount++;
      }
    }

    console.log("\nSample data imported successfully!");
    console.log(`Authors processed: ${authorCount}`);
    console.log(`Books processed: ${bookCount}`);
  } catch (error) {
    console.error("\nSample data import failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
