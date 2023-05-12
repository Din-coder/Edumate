// Import express.js
const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session Middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Login required
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    next();
};

// Create a route for root - /
app.get("/", function(req, res) {
    sql = 'select * from course';
    db.query(sql).then(results => {
        res.render("index", { courses: results });
    });
});

app.get("/signup-page", function(req, res) {
    res.render("signup");
});

app.post('/signup', async(req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Save user data to the database
    db.query('INSERT INTO profile (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err, result) => {
        if (err) {
            return res.redirect('/signup-page');
        }
        res.redirect('/login-page');
    });
});

app.get("/login-page", function(req, res) {
    res.render("loginpage");
});

app.post('/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        const results = await db.query("SELECT * FROM profile WHERE username = ?", [username]);

        if (results.length > 0 && bcrypt.compareSync(password, results[0]["password"])) {
            req.session.user = {
                id: results[0].id,
                username: results[0].username,
                email: results[0].email,
                firstname: results[0].firstname,
                lastname: results[0].lastname,
                age: results[0].age,
                occupation: results[0].occupation,
                joined_date: results[0].joined_date,

            };

            const courses = await db.query("SELECT * FROM course");
            const categories = await db.query("SELECT * FROM category");
            res.render('home', { user: req.session.user, courses, categories, message: "Logged In successfully" });
        } else {
            res.redirect("/login-page");
        }
    } catch (error) {
        console.log(error);
        res.redirect("/login-page");
    }
});

app.get("/home", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render("home", { user: req.session.user });
});

app.get("/profile", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render("profile", { user: req.session.user });
});

app.get('/edit-profile/:id', requireLogin, (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render('editprofile', { user: req.session.user });
});

app.post('/update-profile/:id', requireLogin, async(req, res) => {
    try {
        const { id } = req.params;

        const { firstname, lastname, age, occupation, email } = req.body;

        const results = await db.query("UPDATE profile SET firstname = ?, lastname = ?, age = ?, occupation = ? WHERE email = ?", [firstname, lastname, age, occupation, email]);

        res.redirect("/profile");
    } catch (error) {
        console.log(error);
        res.redirect("/edit-profile");
    }
});

app.post('/update-profile/:id', requireLogin, async(req, res) => {
    try {
        const saltRounds = 10;
        const { id, username, password, firstname, lastname, age, occupation } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(hashedPassword)
        await db.query("UPDATE profile SET username = ?, password = ?, firstname = ?, lastname = ?, age = ?, occupation = ? WHERE id = ?", [username, hashedPassword, firstname, lastname, age, occupation, id]);
        const updatedUser = await db.query("SELECT * FROM profile WHERE id = ?", [id]);
        req.session.user = {
            id: updatedUser[0].id,
            username: updatedUser[0].username,
            email: updatedUser[0].email,
            firstname: updatedUser[0].firstname,
            lastname: updatedUser[0].lastname,
            age: updatedUser[0].age,
            occupation: updatedUser[0].occupation
        };
        res.redirect('/profile');
    } catch (error) {
        console.log(error);
        res.redirect('/edit-profile');
    }
});

app.get("/contact", function(req, res) {
    res.render("contact");
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/courses", function(req, res) {
    sql = 'select * from course';
    db.query(sql).then(results => {
        console.log(results);
        res.render("courses", { courses: results });
    });
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.get("/error", function(req, res) {
    res.render("error");
});

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000/`);
});