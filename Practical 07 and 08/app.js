const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getConnection } = require('./dbConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Middleware to authenticate JWT tokens
 * Extracts and verifies the JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            message: 'Please provide a valid JWT token in the Authorization header'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Invalid or expired token',
                message: 'Please login again to get a new token'
            });
        }
        req.user = user; // Add user info to request object
        next();
    });
};

/**
 * Middleware to authorize librarian-only actions
 * Must be used after authenticateToken middleware
 */
const authorizeLibrarian = (req, res, next) => {
    if (req.user.role !== 'librarian') {
        return res.status(403).json({ 
            error: 'Insufficient permissions',
            message: 'This action requires librarian privileges'
        });
    }
    next();
};

/**
 * POST /register - User registration endpoint
 * Accepts: username, password, role (member/librarian)
 * Returns: Success message or error
 */
app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Username and password are required'
            });
        }

        if (role && !['member', 'librarian'].includes(role)) {
            return res.status(400).json({ 
                error: 'Invalid role',
                message: 'Role must be either "member" or "librarian"'
            });
        }

        const userRole = role || 'member'; // Default to member if not specified

        const connection = await getConnection();

        // Check if username already exists
        const checkUserQuery = 'SELECT id FROM Users WHERE username = @username';
        const checkResult = await connection.request()
            .input('username', sql.NVarChar, username)
            .query(checkUserQuery);

        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ 
                error: 'Username already exists',
                message: 'Please choose a different username'
            });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertQuery = `
            INSERT INTO Users (username, passwordHash, role) 
            VALUES (@username, @passwordHash, @role)
        `;
        
        await connection.request()
            .input('username', sql.NVarChar, username)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('role', sql.NVarChar, userRole)
            .query(insertQuery);

        res.status(201).json({ 
            message: 'User registered successfully',
            username: username,
            role: userRole
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to register user'
        });
    }
});

/**
 * POST /login - User login endpoint
 * Accepts: username, password
 * Returns: JWT token and user information
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Missing credentials',
                message: 'Username and password are required'
            });
        }

        const connection = await getConnection();

        // Find user by username
        const userQuery = 'SELECT id, username, passwordHash, role FROM Users WHERE username = @username';
        const result = await connection.request()
            .input('username', sql.NVarChar, username)
            .query(userQuery);

        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Username or password is incorrect'
            });
        }

        const user = result.recordset[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Username or password is incorrect'
            });
        }

        // Generate JWT token
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to authenticate user'
        });
    }
});

/**
 * GET /books - Get all books endpoint
 * Accessible by both librarians and members
 * Returns: List of all books with availability status
 */
app.get('/books', authenticateToken, async (req, res) => {
    try {
        const connection = await getConnection();

        // Get all books
        const booksQuery = `
            SELECT id, title, author, availability, createdAt 
            FROM Books 
            ORDER BY title
        `;
        
        const result = await connection.request().query(booksQuery);

        // Format the response
        const books = result.recordset.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            availability: book.availability,
            isAvailable: book.availability === 'Y',
            createdAt: book.createdAt
        }));

        res.json({
            message: 'Books retrieved successfully',
            count: books.length,
            books: books
        });

    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to retrieve books'
        });
    }
});

/**
 * PUT /books/:bookId/availability - Update book availability
 * Accessible only by librarians
 * Accepts: availability (Y/N)
 * Returns: Updated book information
 */
app.put('/books/:bookId/availability', authenticateToken, authorizeLibrarian, async (req, res) => {
    try {
        const { bookId } = req.params;
        const { availability } = req.body;

        // Input validation
        if (!availability || !['Y', 'N'].includes(availability.toUpperCase())) {
            return res.status(400).json({ 
                error: 'Invalid availability value',
                message: 'Availability must be "Y" (available) or "N" (not available)'
            });
        }

        const connection = await getConnection();

        // Check if book exists
        const checkBookQuery = 'SELECT id, title, author FROM Books WHERE id = @bookId';
        const checkResult = await connection.request()
            .input('bookId', sql.Int, parseInt(bookId))
            .query(checkBookQuery);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ 
                error: 'Book not found',
                message: `No book found with ID ${bookId}`
            });
        }

        const book = checkResult.recordset[0];

        // Update book availability
        const updateQuery = 'UPDATE Books SET availability = @availability WHERE id = @bookId';
        await connection.request()
            .input('bookId', sql.Int, parseInt(bookId))
            .input('availability', sql.Char, availability.toUpperCase())
            .query(updateQuery);

        res.json({
            message: 'Book availability updated successfully',
            book: {
                id: parseInt(bookId),
                title: book.title,
                author: book.author,
                availability: availability.toUpperCase(),
                isAvailable: availability.toUpperCase() === 'Y'
            },
            updatedBy: {
                userId: req.user.userId,
                username: req.user.username
            }
        });

    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to update book availability'
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Polytechnic Library API is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * 404 handler for undefined routes
 */
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
    });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Polytechnic Library API server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});

module.exports = app;
