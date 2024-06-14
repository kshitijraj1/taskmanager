const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path to the SQLite database file
const dbPath = path.resolve(__dirname, 'database.db');

// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath);

// Serialize database operations
db.serialize(() => {
    // Create the users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Create the tasks table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        text TEXT,
        completed INTEGER
    )`);
});

// Export the database connection
module.exports = db;