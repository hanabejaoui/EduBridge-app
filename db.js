const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tutor.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT UNIQUE,
          password TEXT,
          role TEXT,
          phone TEXT,
          nationality TEXT,
          education_level TEXT,
          major TEXT
        )
      `);
      

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject TEXT,
      description TEXT,
      type TEXT,
      accepted_by INTEGER,  -- ✅ New column to store the tutor's ID who accepted
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(accepted_by) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS tutor_subjects (
      user_id INTEGER,
      subject TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS accepted_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tutor_id INTEGER,
      post_id INTEGER,
      FOREIGN KEY(tutor_id) REFERENCES users(id),
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      tutor_id INTEGER,
      message TEXT,
      FOREIGN KEY(post_id) REFERENCES posts(id),
      FOREIGN KEY(tutor_id) REFERENCES users(id)
    )
  `);
  
  
  
});

module.exports = db;

