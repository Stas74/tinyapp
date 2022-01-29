const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: ["Lighthouse", "Some potatoes"],
  })
);

const generateRandomString = function() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const verifyEmail = function(email, database) {
  for (let id in database) {
    if (database[id].email === email) {
      return true;
    }
  }
};

const urlsForUserId = function(id) {
  const result ={};
  const shortUrls = Object.keys(urlDatabase);
  for (const shortUrl of shortUrls) {
    const url = urlDatabase[shortUrl];
    if (url.userID === id) {
      result[shortUrl] = url;
    }
  }
  return result;
}

const getUserByEmail = function(email, database) {  
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null
}
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
/*
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
*/
const urlDatabase = {
  b6UTxQ: { // Short URL
      longURL: "https://www.tsn.ca", // Long URL
      userID: "aJ48lW" // userID
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

const users = { 
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "1"
  }/*,
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
  // if (req.cookies["user_id"]) {
  if (req.session.user_id) {
    // const id = req.cookies["user_id"];
    const id = req.session.user_id;
    const urls = urlsForUserId(id)
    const templateVars = { urls, username: users[id].email };
    
    res.render("urls_index", templateVars);
  } else {
    res.sendStatus(401).end();
    // const templateVars = { urls: urlDatabase, username: null};
    // res.render("urls_index", templateVars);
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
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  if (newEmail.length === 0 || newPassword.length === 0) {
    res.sendStatus(400).end();
  } else if (verifyEmail(newEmail, users) === true) {
    res.sendStatus(400).end();
  } else {
    const newId = generateRandomString();
    users[newId] = {id: newId, email: newEmail, password: hashedPassword};
    console.log('Register valid');
    // res.cookie('user_id',newId); // Set cookie by id
    req.session.user_id = newId; // Set cookie session
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
    // res.cookie('user_id', user.id);
    req.session.user_id = user.id; // // Set cookie session
    res.redirect("/urls");
  } else {
    return res.send('User not found').end();
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
  // if (!req.cookies["user_id"]) {  req.session.user_id
  if (!req.session.user_id) {
    res.sendStatus(403).end();
  } else {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {longURL, userID};  //
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
    const longURL = urlDatabase[shortURL]["longURL"]; //
    console.log("else longURL", longURL)
    return res.redirect(longURL);
  } else {
    return res.end("This page doesn`t exist");
  }
});

// Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  // if(!req.cookies["user_id"]) { req.session.user_id
  if(!req.session.user_id) {
    res.send("Please register or log in!").end();
  } else {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL]; //
  res.redirect("/urls");
  }
});

// Update
app.post("/urls/:shortURL/update", (req, res) => { 
  // if(!req.cookies["user_id"]) {  req.session.user_id
  if(!req.session.user_id) {
    res.send("Please register or log in!").end();
  } else {
  const shortURL = req.params.shortURL;  
  const longURL = urlDatabase[shortURL]["longURL"];  
  // const id = req.cookies["user_id"];
  const id = req.session.user_id;
  const editedUrl = req.body.longURL;
  
  console.log("update editedUrl", editedUrl)
  urlDatabase[shortURL]["longURL"] = req.body.longURL;
  const templateVars = { shortURL , longURL, username: id ? users[id].email : null };
  res.render("urls_show", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  // if (!req.cookies["user_id"]) {
  if(!req.session.user_id) {
    res.redirect('/login');
    res.end();
  } else {
  // const id = req.cookies["user_id"];
  const id = req.session.user_id;
  const templateVars = {
    username: id ? users[id].email : null 
  };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  // const id = req.cookies["user_id"];
  const id = req.session.user_id;
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
  res.redirect("/login");
});


// 404 page
app.get('*', (req,res) => {
  res.render('404');
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});