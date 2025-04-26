const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: false
}));

// Homepage redirection
app.get('/', (req, res) => {
  if (req.session.userId) {
    if (req.session.role === 'Tutor') {
      return res.redirect('/tutor-dashboard.html');
    } else {
      return res.redirect('/dashboard.html');
    }
  } else {
    res.redirect('/login.html');
  }
});

// Register user
app.post('/register', async (req, res) => {
  const { name, email, password, role, phone, nationality, education_level, major } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  db.run(`INSERT INTO users (name, email, password, role, phone, nationality, education_level, major) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, hashed, role, phone, nationality, education_level, major], function (err) {
      if (err) {
        console.error(err.message);
        return res.send('Registration error: email already in use.');
      }

      req.session.userId = this.lastID;
      req.session.role = role;

      if (role === 'Tutor') {
        db.get(`SELECT COUNT(*) as count FROM tutor_subjects WHERE user_id = ?`, [req.session.userId], (err, row) => {
          if (err) return res.redirect('/');
          if (row.count === 0) {
            return res.redirect('/tutor-subjects.html');
          } else {
            return res.redirect('/tutor-dashboard.html');
          }
        });
      } else {
        return res.redirect('/student_ask_question.html');
      }
    });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.send('Invalid credentials.');

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = user.id;
      req.session.role = user.role;
      res.redirect('/');
    } else {
      res.send('Incorrect password.');
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.get('/profile', (req, res) => {
  if (!req.session.userId || !req.session.role) {
    return res.redirect('/login.html');
  }
  if (req.session.role === 'Tutor') {
    res.redirect('/tutor-profile.html');
  } else {
    res.redirect('/student-profile.html');
  }
});


app.get('/api/profile', (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send('Not logged in');

  db.get(`
    SELECT name, email, role, phone, nationality, education_level, major
    FROM users WHERE id = ?
  `, [userId], (err, row) => {
    if (err) return res.status(500).send(err);
    if (!row) return res.status(404).send('User not found');
    res.json(row);
  });
});




// Tutor accepts student request
app.post('/accept-request/:postId', (req, res) => {
  const tutorId = req.session.userId;
  const { postId } = req.params;
  if (!tutorId) return res.status(403).send('Unauthorized');

  db.run(`UPDATE posts SET accepted_by = ? WHERE id = ?`, [tutorId, postId], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.get('/accepted-requests', (req, res) => {
  const tutorId = req.session.userId;

  db.all(`
    SELECT posts.id, posts.subject, posts.description, users.name AS student_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.accepted_by = ?
      AND NOT EXISTS (
        SELECT 1 FROM responses
        WHERE responses.post_id = posts.id AND responses.tutor_id = ?
      )
  `, [tutorId, tutorId], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});


// Student requests visible to tutors
app.get('/student-requests', (req, res) => {
  const tutorId = req.session.userId;
  if (req.session.role !== 'Tutor') return res.status(403).send('Forbidden');

  db.all(`SELECT subject FROM tutor_subjects WHERE user_id = ?`, [tutorId], (err, rows) => {
    if (err) return res.status(500).send(err);
    const subjects = rows.map(row => row.subject);
    if (subjects.length === 0) return res.json([]);

    const placeholders = subjects.map(() => '?').join(',');
    db.all(`
      SELECT posts.*, users.name
      FROM posts
      JOIN users ON users.id = posts.user_id
      WHERE posts.type = 'request'
      AND posts.accepted_by IS NULL
      AND posts.subject IN (${placeholders})
      ORDER BY posts.id DESC
    `, subjects, (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    });
  });
});

// Student posts a question
app.post('/student_ask_question', (req, res) => {
  const userId = req.session.userId;
  const { subject, helpType, message } = req.body;
  if (!userId) return res.status(403).send('Login required');

  const normalizedSubject = subject.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

  db.run(`
    INSERT INTO posts (user_id, subject, description, type)
    VALUES (?, ?, ?, 'request')
  `, [userId, normalizedSubject, `${helpType}: ${message}`], (err) => {
    if (err) return res.status(500).send(err);
    res.redirect('/matched-tutors.html');
  });
});

// Tutor sends a response
app.post('/submit-response', (req, res) => {
  const tutorId = req.session.userId;
  const { postId, message } = req.body;
  if (!tutorId || !postId || !message) return res.status(400).send('Missing fields');

  db.run(`INSERT INTO responses (post_id, tutor_id, message) VALUES (?, ?, ?)`, [postId, tutorId, message], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

// Get responses received by student
app.get('/my-responses', (req, res) => {
  const userId = req.session.userId;

  db.all(`
    SELECT posts.subject, posts.description, responses.message, users.name AS tutor_name
    FROM responses
    JOIN posts ON posts.id = responses.post_id
    JOIN users ON users.id = responses.tutor_id
    WHERE posts.user_id = ?
  `, [userId], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// Get matched tutors
app.get('/matched-tutors', (req, res) => {
  const userId = req.session.userId;

  db.get(`SELECT subject FROM posts WHERE user_id = ? AND type = 'request' ORDER BY id DESC LIMIT 1`, [userId], (err, row) => {
    if (err || !row) return res.json([]);

    const subject = row.subject.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    db.all(`
      SELECT users.name, users.email, GROUP_CONCAT(tutor_subjects.subject) as subjects
      FROM users
      JOIN tutor_subjects ON users.id = tutor_subjects.user_id
      WHERE users.role = 'Tutor' AND tutor_subjects.subject = ?
      GROUP BY users.id
    `, [subject], (err, tutors) => {
      if (err) return res.status(500).send(err);
      const formattedTutors = tutors.map(tutor => ({
        name: tutor.name,
        email: tutor.email,
        subjects: tutor.subjects.split(',')
      }));
      res.json(formattedTutors);
    });
  });
});

// Tutor selects subjects
app.post('/tutor-subjects', (req, res) => {
  const userId = req.session.userId;
  const selected = req.body.subjects;
  const subjectsArray = Array.isArray(selected) ? selected : [selected];

  const stmt = db.prepare(`INSERT INTO tutor_subjects (user_id, subject) VALUES (?, ?)`);
  subjectsArray.forEach(subject => {
    stmt.run(userId, subject.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()));
  });
  stmt.finalize();

  res.redirect('/tutor-dashboard.html');
});

// Tutor updates subjects
app.post('/update-subjects', (req, res) => {
  const userId = req.session.userId;
  const subjects = req.body.subjects || [];

  db.run(`DELETE FROM tutor_subjects WHERE user_id = ?`, [userId], err => {
    if (err) return res.status(500).send(err);

    const stmt = db.prepare(`INSERT INTO tutor_subjects (user_id, subject) VALUES (?, ?)`);
    subjects.forEach(subj => stmt.run(userId, subj.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase())));
    stmt.finalize();

    res.sendStatus(200);
  });
});

// Get tutor's subjects
app.get('/my-subjects', (req, res) => {
  const userId = req.session.userId;
  db.all(`SELECT subject FROM tutor_subjects WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).send(err);
    const subjects = rows.map(row => row.subject);
    res.json(subjects);
  });
});

// Get all posts
app.get('/posts', (req, res) => {
  db.all(`
    SELECT posts.id, posts.subject, posts.description, posts.type, posts.user_id, users.name
    FROM posts
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.id DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// Session info
app.get('/session', (req, res) => {
  res.json({ userId: req.session.userId });
});

// Delete post
app.delete('/posts/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  db.run(`DELETE FROM posts WHERE id = ? AND user_id = ?`, [id, userId], function (err) {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
