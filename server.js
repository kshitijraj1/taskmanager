const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Middleware to check if user is logged in
function checkAuth(req, res, next) {
    if (req.session.userId || req.url === '/login.html') {
        next();
    } else {
        res.redirect('/login.html');
    }
}


// Redirect root URL to login if not authenticated
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(__dirname + '/public/index.html');
    } else {
        res.redirect('/login.html');
    }
});

// User Registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return res.status(500).send('User registration failed.');
        }
        req.session.userId = this.lastID;
        res.redirect('/');
    });
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send('Invalid credentials.');
        }
        req.session.userId = user.id;
        res.redirect('/');
    });
});

// User Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Fetch Tasks
app.get('/tasks', checkAuth, (req, res) => {
    db.all(`SELECT * FROM tasks WHERE userId = ?`, [req.session.userId], (err, tasks) => {
        if (err) {
            return res.status(500).send('Error fetching tasks.');
        }
        res.json(tasks);
    });
});

// Add Task
app.post('/tasks', checkAuth, (req, res) => {
    const { text } = req.body;
    db.run(`INSERT INTO tasks (userId, text, completed) VALUES (?, ?, 0)`, [req.session.userId, text], function(err) {
        if (err) {
            return res.status(500).send('Error adding task.');
        }
        res.json({ id: this.lastID, text, completed: 0 });
    });
});

// Delete Task
app.delete('/tasks/:id', checkAuth, (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM tasks WHERE id = ? AND userId = ?`, [id, req.session.userId], (err) => {
        if (err) {
            return res.status(500).send('Error deleting task.');
        }
        res.sendStatus(204);
    });
});

// Edit Task
app.put('/tasks/:id', checkAuth, (req, res) => {
    const id = req.params.id;
    const { text, completed } = req.body;
    db.run(`UPDATE tasks SET text = ?, completed = ? WHERE id = ? AND userId = ?`, [text, completed, id, req.session.userId], (err) => {
        if (err) {
            return res.status(500).send('Error updating task.');
        }
        res.sendStatus(204);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
