-- Polytechnic Library API Database Setup Script
-- Execute these commands in Microsoft SQL Server Management Studio or Azure Data Studio

-- Create database (if not exists)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PolytechnicLibrary')
BEGIN
    CREATE DATABASE PolytechnicLibrary;
END
GO

USE PolytechnicLibrary;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) UNIQUE NOT NULL,
        passwordHash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'member',
        createdAt DATETIME DEFAULT GETDATE()
    );
    
    -- Create index on username for faster lookups
    CREATE INDEX IX_Users_Username ON Users(username);
    
    PRINT 'Users table created successfully';
END
ELSE
BEGIN
    PRINT 'Users table already exists';
END
GO

-- Create Books table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Books' AND xtype='U')
BEGIN
    CREATE TABLE Books (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        author NVARCHAR(255) NOT NULL,
        availability CHAR(1) NOT NULL DEFAULT 'Y',
        createdAt DATETIME DEFAULT GETDATE(),
        
        -- Add constraint to ensure availability is either 'Y' or 'N'
        CONSTRAINT CHK_Books_Availability CHECK (availability IN ('Y', 'N'))
    );
    
    -- Create index on title for faster searches
    CREATE INDEX IX_Books_Title ON Books(title);
    
    PRINT 'Books table created successfully';
END
ELSE
BEGIN
    PRINT 'Books table already exists';
END
GO

-- Insert sample books data (only if table is empty)
IF NOT EXISTS (SELECT * FROM Books)
BEGIN
    INSERT INTO Books (title, author, availability) VALUES
    ('The Great Gatsby', 'F. Scott Fitzgerald', 'Y'),
    ('To Kill a Mockingbird', 'Harper Lee', 'Y'),
    ('1984', 'George Orwell', 'N'),
    ('Pride and Prejudice', 'Jane Austen', 'Y'),
    ('The Catcher in the Rye', 'J.D. Salinger', 'N'),
    ('Lord of the Flies', 'William Golding', 'Y'),
    ('The Hobbit', 'J.R.R. Tolkien', 'Y'),
    ('Fahrenheit 451', 'Ray Bradbury', 'N'),
    ('Jane Eyre', 'Charlotte Brontë', 'Y'),
    ('Of Mice and Men', 'John Steinbeck', 'Y'),
    ('The Odyssey', 'Homer', 'Y'),
    ('Brave New World', 'Aldous Huxley', 'N'),
    ('The Lord of the Rings', 'J.R.R. Tolkien', 'Y'),
    ('Animal Farm', 'George Orwell', 'Y'),
    ('Wuthering Heights', 'Emily Brontë', 'N');
    
    PRINT 'Sample books data inserted successfully';
END
ELSE
BEGIN
    PRINT 'Books table already contains data';
END
GO

-- Create sample users (only if Users table is empty)
-- Note: In a real application, users would register through the API
-- These are just for testing purposes
IF NOT EXISTS (SELECT * FROM Users)
BEGIN
    -- Sample librarian (password: librarian123)
    -- Hash generated using bcryptjs with saltRounds=10
    INSERT INTO Users (username, passwordHash, role) VALUES
    ('librarian1', '$2a$10$qPZ9P9xMkYrF1QfYt7ZJVu0aP5FXJ8XqGkFvN2X9Y6oJ8nF3E7cGe', 'librarian');
    
    -- Sample member (password: member123)
    INSERT INTO Users (username, passwordHash, role) VALUES
    ('student1', '$2a$10$rHZ2L7yKnXsD3QeZu8YHMe1aC6GYJ9ZrGlGwN3X8Y7pK9nF4E8dHf', 'member');
    
    PRINT 'Sample users created successfully';
    PRINT 'Librarian login: username=librarian1, password=librarian123';
    PRINT 'Member login: username=student1, password=member123';
END
ELSE
BEGIN
    PRINT 'Users table already contains data';
END
GO

-- Display table information
PRINT 'Database setup completed successfully!';
PRINT 'Tables created:';
SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM Users) AS Users_Count,
    (SELECT COUNT(*) FROM Books) AS Books_Count;

-- Show sample data
PRINT 'Sample Books:';
SELECT TOP 5 id, title, author, availability FROM Books ORDER BY title;

PRINT 'Sample Users:';
SELECT id, username, role, createdAt FROM Users;
