// Import express.js
const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');
const router = express.Router();

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

/* Rahul Raju */

app.get("/contact", function(req, res) {
    res.render("contact");
});

app.get("/contactlogin", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render("contact", { user: req.session.user });
});

app.post('/send-email', (req, res) => {
    // Get the form data
    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;

    // Create a transporter for sending email
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: email, // replace with your email
            pass: 'edumate@admin' // replace with your password
        }
    });

    // Set up email options
    const mailOptions = {
        from: email, // replace with your email
        to: "dinsojoseph@gmail.com", // replace with recipient email
        subject: 'message',
        html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.redirect('/contact?success=false');
        } else {
            console.log('Email sent: ' + info.response);
            res.redirect('/contact?success=true');
        }
    });
});

/* Rahul Raju ENDS */

/* Arun Mohan */

// Create a route for root - /
app.get("/", function(req, res) {
    sql = 'select * from course';
    sqlcat = 'select * from category';
    db.query(sql).then(results => {
        db.query(sqlcat).then(resultscat => {
            res.render("index", { courses: results, categories: resultscat });
        });
    });
});

app.get("/home", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render("home", { user: req.session.user });
});

/* Arun Mohan ENDS */


/* Dinso Joseph Manavalan */

// Login required
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    next();
};

app.get("/loginerror", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render("error", { user: req.session.user });
});

app.get("/error", function(req, res) {
    res.render("error");
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

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

/* Dinso Joseph Manavalan ENDS */


/* Dilsha Benny */

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
        const saltRounds = 10;
        const userid = req.session.user.id;
        const { username, password, firstname, lastname, age, occupation, email } = req.body;
        if (password == "") {
            await db.query("UPDATE profile SET username = ?, firstname = ?, lastname = ?, age = ?, occupation = ?, email = ? WHERE id = ?", [username, firstname, lastname, age, occupation, email, userid]);
        } else {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            await db.query("UPDATE profile SET username = ?, password = ?, firstname = ?, lastname = ?, age = ?, occupation = ?, email = ? WHERE id = ?", [username, hashedPassword, firstname, lastname, age, occupation, email, userid]);
        }
        const updatedUser = await db.query("SELECT * FROM profile WHERE id = ?", [userid]);
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
        res.redirect(`/edit-profile/${req.session.user.id}`);
    }
});

/* Dilsha Benny ENDS */


/* Kinal Hirpara */

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/aboutlogin", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    res.render("about", { user: req.session.user });
});

app.get("/courses", function(req, res) {
    sql = 'select * from course';
    db.query(sql).then(results => {
        console.log(results);
        res.render("courses", { courses: results });
    });
});

app.get("/courseslogin", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    sql = 'select * from course';
    db.query(sql).then(results => {
        res.render("courses", { courses: results, user: req.session.user });
    });
});

app.get("/mycourses", requireLogin, function(req, res) {
    if (!req.session.user) {
        return res.redirect('/login-page');
    }
    const sql = 'select * from my_course where profile_id = ?';
    const valu = [req.session.user.id];

    db.query(sql, valu).then(results => {
        const course_id_list = [];
        for (let i = 0; i < results.length; i++) {
            course_id_list.push(results[i]["course_id"]);
        }

        const coursePromises = course_id_list.map(course_id => {
            const csql = 'select * from course where id = ?';
            const cvalu = [course_id];
            return db.query(csql, cvalu);
        });
        Promise.all(coursePromises).then(course => {
            const coursess = [];
            for (let i = 0; i < course.length; i++) {
                coursess.push(course[i][0]);
            }
            console.log(coursess);
            res.render("mycourses", { courses: coursess, user: req.session.user });
        }).catch(error => {
            console.error(error);
            res.redirect("/loginerror"); // Render an error page if there's an issue with fetching courses
        });
    }).catch(error => {
        console.error(error);
        res.redirect("/loginerror"); // Render an error page if there's an issue with fetching the initial results
    });
});

/* Kinal Hirpara ENDS */


// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000/`);
});

module.exports = router;