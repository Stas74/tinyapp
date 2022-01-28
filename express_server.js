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
/*
const verifyPassword = function(password) {
  for (let id in users){
    if (users[id].password === password){
      console.log('func users[id]', users[id])
      return users[id];
    }
  }
  return false;
}
*/

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
  console.log("req.cookies 123", req.cookies["user_id"]); // Double check after logout
  console.log("users", users);
  if (req.cookies["user_id"]) {
    const id = req.cookies["user_id"];
    console.log("id", id);
    const templateVars = { urls: urlDatabase, username: users[id].email };
    console.log("users[id]", users[id]);
    console.log(users[id].email, users[id].email);
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
    res.sendStatus(400).end();
  } else if (verifyEmail(newEmail) === true) {
    res.sendStatus(400).end();
  } else {
    const newId = generateRandomString();
    users[newId] = {id: newId, email: newEmail, password: newPassword};
    console.log('Register valid');
    res.cookie('user_id',newId); // Set cookie by id
    console.log('users',users);
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
  if (verifyEmail(email) === false) {
    res.sendStatus(403).end();
  }
  // compare the password.  If it does not match, return a response with a 403 status code.
  for (let id in users) {
    if (users[id].password === password && verifyEmail(email) === true) {
      id = users[id]["id"];
      res.cookie('user_id', id);
      res.redirect("/urls");
    } else {
      res.sendStatus(403).end();
    }
  }
});

/*
// Cookie
app.post("/login", (req, res) => {
  // Get email
  const email = req.body.email;
  console.log("email", email);
  // Look for user in user database
  let id;
  for (let user in users) {
    if (users[user]["email"] === email) {
      id = users[user]["id"];
      break;
    }
    // console.log("user", user);
  }
  if (id) {
    res.cookie('user_id', id);
    res.redirect("/urls");
  } else {
    res.redirect("/register");
  }
  // Grab the id
  // set the cookie to the id
  // redirect
});
*/

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
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
    res.end();
  } else {
  const id = req.cookies["user_id"];
  const templateVars = {
    username: id ? users[id].email : null 
  };
  res.render("urls_new", templateVars);
  }
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
  res.clearCookie('user_id');
  console.log('Logout');
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