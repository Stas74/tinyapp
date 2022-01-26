const express = require("express");
const app = express();
const cookies = require('cookie');
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (req, res) => {
  res.send("Hello!");
  res.cookie('username', 'test');
  console.log(req.cookies)
});

app.get("/urls", (req, res) => {
  res.cookie('username', 'test');
  if (req.cookie["username"] != null) {
  const templateVars = { urls: urlDatabase, username: req.cookie["username"] };
  res.render("urls_index", templateVars);  
} else {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
}
  // res.render("urls_index", templateVars);
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
  urlDatabase[shortURL] = req.body.longURL;
  const templateVars = { shortURL , longURL, username: req.cookie["username"] };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: req.params.longURL, username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});