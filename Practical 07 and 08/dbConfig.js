const sql = require('mssql');
require('dotenv').config();

/**
 * Database configuration for Microsoft SQL Server
 * Uses environment variables for secure connection details
 */
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'PolytechnicLibrary',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true, // Enable encryption
        trustServerCertificate: true // Trust self-signed certificates (for development)
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

/**
 * Get database connection pool
 * @returns {Promise<sql.ConnectionPool>} Database connection pool
 */
async function getConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server database');
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
}

/**
 * Close database connection
 */
async function closeConnection() {
    try {
        await sql.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error.message);
    }
}

module.exports = {
    sql,
    getConnection,
    closeConnection
};
