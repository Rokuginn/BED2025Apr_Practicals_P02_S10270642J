const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
// Load environment variables
dotenv.config();


const bookController = require("./controllers/bookController");
const userController = require("./controllers/userController"); // Import userController
const {
  validateBook,
  validateBookId,
} = require("./middlewares/bookValidation"); // import Book Validation Middleware

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware (Parsing request bodies)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
// --- Add other general middleware here (e.g., logging, security headers) ---

// Middleware to serve static files (if needed)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Ensure extended is true for urlencoded

// --- Serve static files from the 'public' directory ---
// When a request comes in for a static file (like /index.html, /styles.css, /script.js),
// Express will look for it in the 'public' folder relative to the project root.
app.use(express.static(path.join(__dirname, "public")));
// Routes for books
// Apply middleware *before* the controller function for routes that need it
app.get("/books", bookController.getAllBooks);
app.get("/books/:id", validateBookId, bookController.getBookById); // Use validateBookId middleware
app.post("/books", validateBook, bookController.createBook); // Use validateBook middleware
// Add routes for PUT/DELETE if implemented, applying appropriate middleware

// --- User Routes ---
app.get("/users", userController.getAllUsers);
app.get("/users/:id", userController.getUserById);
app.get("/users/search", userController.searchUsers); // Search users by username or email")
app.post("/users", userController.createUser);
app.put("/users/:id", userController.updateUser);
app.delete("/users/:id", userController.deleteUser);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});