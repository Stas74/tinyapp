const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const generateRandomString = function() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
const verifyEmail = function(email) {
  for (let id in users) {
    if (users[id].email === email) {
      return true;
    }
  }
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { /*
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }*/
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"] !== null) {
    const id = req.cookies["user_id"];
    const templateVars = { urls: urlDatabase, username: users[id].email };
    res.render("urls_index", templateVars);
  } else {
    const templateVars = { urls: urlDatabase, username: null};
    res.render("urls_index", templateVars);
  }
  // res.render("urls_index", templateVars);
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

  if (newEmail.length === 0 || newPassword.length === 0) {
    console.log("Empty");
    res.sendStatus(400).end();
  } else if (verifyEmail(newEmail) === true) {
    res.sendStatus(400).end();
  } else {
    const newId = generateRandomString();
    users[newId] = {id: newId, email: newEmail, password: newPassword};
    console.log('Register valid');
    res.cookie('user_id',newId); // Set cookie by id
    console.log('users',users);
    res.redirect('/urls');
  }
});

// Login
app.get('/login', (req,res) => {
  res.render('urls_login');
  res.end();
});

// Cookie
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

// Short URL generation
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let dbLongUrl = req.body.longURL;
  urlDatabase[shortURL] = dbLongUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const id = req.cookies["user_id"];
  urlDatabase[shortURL] = req.body.longURL;
  const templateVars = { shortURL , longURL, username: id ? users[id].email : null };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = {
    username: id ? users[id].email : null
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies["user_id"];
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
  res.clearCookie('username');
  res.redirect("/urls");
});


// 404 page
app.get('*', (req,res) => {
  res.render('404');
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});