const sql = require("mssql");
const dbConfig = require("../dbConfig"); //

async function createUser(user) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const insertQuery = `
      INSERT INTO Users (username, email, password)
      VALUES (@username, @email, @password);
      SELECT SCOPE_IDENTITY() AS id;
    `;
    const request = connection.request();
    request.input("username", user.username);
    request.input("email", user.email);
    request.input("password", user.password);
    const result = await request.query(insertQuery);
    const newUserId = result.recordset[0].id;

    
    const selectQuery = "SELECT id, username, email FROM Users WHERE id = @id";
    const selectRequest = connection.request();
    selectRequest.input("id", newUserId);
    const userResult = await selectRequest.query(selectQuery);

    return userResult.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get all users
async function getAllUsers() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT id, username, email FROM Users";
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get user by ID
async function getUserById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT id, username, email FROM Users WHERE id = @id";
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null;
    }
    return result.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Update user by ID
async function updateUser(id, updatedUser) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE Users
      SET username = @username, email = @email, password = @password
      WHERE id = @id
    `;
    const request = connection.request();
    request.input("id", id);
    request.input("username", updatedUser.username);
    request.input("email", updatedUser.email);
    request.input("password", updatedUser.password);
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // No user updated
    }

    // Optionally, return the updated user
    return await getUserById(id);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Delete user by ID
async function deleteUser(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Users WHERE id = @id";
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0; // true if deleted
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function searchUsers(searchTerm) {
  let connection; // Declare connection outside try for finally access
  try {
    connection = await sql.connect(dbConfig);

    // Use parameterized query to prevent SQL injection
    const query = `
    SELECT *
    FROM Users
    WHERE username LIKE '%' + @searchTerm + '%'
        OR email LIKE '%' + @searchTerm + '%'
    `;

    const request = connection.request();
    request.input("searchTerm", sql.NVarChar, searchTerm); // Explicitly define type
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in searchUsers:", error); // More specific error logging
    throw error; // Re-throw the error for the controller to handle
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection after searchUsers:", err);
      }
    }
  }
}
async function getUsersWithBooks() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
    SELECT u.id AS user_id, u.username, u.email, b.id AS book_id, b.title, b.author
    FROM Users u
    LEFT JOIN UserBooks ub ON ub.user_id = u.id
    LEFT JOIN Books b ON ub.book_id = b.id
    ORDER BY u.username;
    `;

    const result = await connection.request().query(query);

    // Explanation of 'result' object and 'result.recordset':
    // The mssql package returns query results in a 'result' object.
    // 'result.recordset' is an array of JavaScript objects.
    // Each object in 'result.recordset' represents a row from the SQL query's output.
    // The keys of these objects correspond to the column aliases (e.g., 'user_id', 'username', 'book_id', 'title', 'author')
    // defined in the SQL SELECT statement.
    // For example, multiple rows from the SQL query like:
    // user_id | username | email             | book_id | title                         | author
    // --------|----------|-------------------|---------|-------------------------------|-----------------
    // 1       | user1    | user1@example.com | 1       | To Kill a Mockingbird       | Harper Lee
    // 1       | user1    | user1@example.com | 2       | The Hitchhiker's Guide to the Galaxy | Douglas Adams
    //
    // would be represented in 'result.recordset' as an array of objects:
    // [
    //   {
    //     user_id: 1,
    //     username: 'user1',
    //     email: 'user1@example.com',
    //     book_id: 1,
    //     title: 'To Kill a Mockingbird',
    //     author: 'Harper Lee'
    //   },
    //   {
    //     user_id: 1,
    //     username: 'user1',
    //     email: 'user1@example.com',
    //     book_id: 2,
    //     title: 'The Hitchhiker\'s Guide to the Galaxy',
    //     author: 'Douglas Adams'
    //   }
    // ]
    //
    // If a user has multiple books, there will be multiple rows for that user,
    // each with the same user information but different book information.
    // The subsequent JavaScript code then groups these rows by user.

    // Group users and their books
    const usersWithBooks = {};
    for (const row of result.recordset) {
      const userId = row.user_id;
      if (!usersWithBooks[userId]) {
        usersWithBooks[userId] = {
          id: userId,
          username: row.username,
          email: row.email,
          books: [],
        };
      }
      // Only add book if book_id is not null (for users with no books)
      if (row.book_id !== null) {
        usersWithBooks[userId].books.push({
          id: row.book_id,
          title: row.title,
          author: row.author,
        });
      }
    }

    return Object.values(usersWithBooks);
  } catch (error) {
    console.error("Database error in getUsersWithBooks:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          "Error closing connection after getUsersWithBooks:",
          err
        );
      }
    }
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  getUsersWithBooks
};