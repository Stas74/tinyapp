const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const {getUserByEmail} = require("./helpers");
const {generateRandomString} = require("./helpers");
const {verifyEmail} = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: ["Lighthouse", "Some potatoes"],
  })
);

const urlsForUserId = function(id) {
  const result = {};
  const shortUrls = Object.keys(urlDatabase);
  for (const shortUrl of shortUrls) {
    const url = urlDatabase[shortUrl];
    if (url.userID === id) {
      result[shortUrl] = url;
    }
  }
  return result;
};

const urlDatabase = {};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (req.session.userId) {
    const id = req.session.userId;
    const urls = urlsForUserId(id);
    const templateVars = { urls, username: users[id].email };
    res.render("urls_index", templateVars);
  } else {
    res.sendStatus(401).end();
  }
});

// Register
app.get('/register', (req,res) => {
  res.render('urls_register');
  res.end();
});

// post register
app.post('/register', (req,res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  if (newEmail.length === 0 || newPassword.length === 0) {
    res.send('Empty fields').end();
  } else if (verifyEmail(newEmail, users) === true) {
    res.send('Email already exists').end();
  } else {
    const newId = generateRandomString();
    users[newId] = {id: newId, email: newEmail, password: hashedPassword};
    req.session.userId = newId;
    res.redirect('/login');
  }
});

// Login page
app.get('/login', (req,res) => {
  res.render('urls_login');
  res.end();
});

// Login action
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // If a e-mail cannot be found, return a response with a 403 status code.
  if (verifyEmail(email, users) === false) {
    return res.sendStatus(403).end();
  }
  const user = getUserByEmail(email, users);
  if (user) {
    const hashCheck = bcrypt.compareSync(password, user.password);
    if (!hashCheck) {
      return res.send('Incorrect password').end();
    }
    // compare the password.  If it does not match, return a response with a 403 status code.
    req.session.userId = user.id;
    res.redirect("/urls");
  } else {
    return res.send('User not found').end();
  }
});

// Short URL generation
app.post("/urls", (req, res) => {
  if (!req.session.userId) {
    res.sendStatus(403).end();
  } else {
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;
    const userID = req.session.userId;
    urlDatabase[shortURL] = {longURL, userID};
    res.redirect(`/urls/${shortURL}`);
  }
});


app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let found = false;
  for (let short in urlDatabase) { /// ???? /////
    if (short !== shortURL) {
      found = false;
    } else {
      found = true;
    }
  }
  if (found === true) {
    const longURL = urlDatabase[shortURL]["longURL"];
    return res.redirect(longURL);
  } else {
    return res.end("This page doesn`t exist");
  }
});

// Delete short URL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.userId) {
    res.send("Please register or log in!").end();
  } else {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// Update short URL
app.post("/urls/:shortURL/update", (req, res) => {
  if (!req.session.userId) {
    res.send("Please register or log in!").end();
  } else {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL]["longURL"];
    const id = req.session.userId;
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    const templateVars = { shortURL , longURL, username: id ? users[id].email : null };
    res.render("urls_show", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (!req.session.userId) {
    res.redirect('/login');
    res.end();
  } else {
    const id = req.session.userId;
    const templateVars = { username: id ? users[id].email : null };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.userId;
  const templateVars = { shortURL: req.params.shortURL, longURL: req.params.longURL, username: id ? users[id].email : null };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Logout
app.post("/logout", (req, res) => {
  req.session = null;
  const templateVars = { urls: null, username: null};
  res.render("urls_index", templateVars);
});


// 404 page
app.get('*', (req,res) => {
  res.render('404');
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});