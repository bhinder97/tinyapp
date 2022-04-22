const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require('./helpers');


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['hello']
}));
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwater-funk"
  }
};

const generateRandomString = function() {
  let newShortURL = Math.random().toString(36).substring(2, 8);
  if (urlDatabase[newShortURL]) {
    return Math.random().toString(36).substring(2, 8);
  }
  return newShortURL;
};

const checkEmail = function(obj, email) {
  for (let key in obj) {
    if (obj[key].email === email) {
      return true;
    }
  }
  return false;
};

const checkLogin = function(cookie) {
  if (cookie) {
    return true;
  }
};

const checkUrlsForUsers = function(id, urlDatabase) {
  let listOfUrls = {};
  for (let key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      listOfUrls[key] = urlDatabase[key];
    }
  }
  return listOfUrls;
};

// Homepage link that redirects to /urls
app.get("/", (req, res) => {
  let id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.status(401).redirect("/login");
  }
  res.redirect("/urls");
});

//Login form, checks if logged in. If true, redirects to /urls, otherwise shows login form
app.get("/login", (req, res) => {
  let id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { user: users[id] };
  res.render("login", templateVars);
});

//Uses login info, if logged in redirects to /urls, shows error if email/pass cause error, otherwise logs you in and redirects to /urls
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user = getUserByEmail(email, users);
  let id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (loggedIn) {
    return res.redirect("/urls");
  }
  if (!user) {
    const templateVars = { user: undefined, message: "Email not found!" };
    return res.render("error", templateVars);
  }
  if (!bcrypt.compareSync(password, user.password)) {
    const templateVars = { user: undefined, message: "Password does not match!" };
    return res.render("error", templateVars);
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

//deletes cookie when you click logout and redirects to /urls page
app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//register form, if logged in, redirects to /urls. otherwise renders register form
app.get("/register", (req, res) => {
  let id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (loggedIn) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[id] };
  res.render("urls_registration", templateVars);
});

//if loggedin, auto redirects to /urls. if uses exists or email/pass are empty, sends out error msgs. if new user, registers email and redirects to /urls
app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);
  let foundEmail = checkEmail(users, email);
  let userID = req.session.user_id;
  let loggedIn = checkLogin(userID);
  if (loggedIn) {
    return res.redirect("/urls");
  }
  if (email === "" || password === "") {
    const templateVars = { user: undefined, message: "Invalid email/password!" };
    return res.render("error", templateVars);
  }
  if (foundEmail) {
    const templateVars = { user: undefined, message: "User already exists!" };
    return res.render("error", templateVars);
  }
  users[id] = { id, email, password: hashedPassword };
  req.session.user_id = id;
  res.redirect("/urls");
});

//get request to /urls_index template, if not logged in then redirects to login
app.get("/urls", (req, res) => {
  let id = req.session.user_id;
  if (!id) {
    const templateVars = { user: undefined, message: "User not logged in!" };
    return res.render("error", templateVars);
  }
  const getUrls = checkUrlsForUsers(id, urlDatabase);
  const templateVars = { user: users[id], urls: getUrls };
  res.render("urls_index", templateVars);
});

//post request to /urls, if not logged in then redirects to login. otherwise
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  const id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    const templateVars = { user: undefined, message: "User not logged in!" };
    return res.render("error", templateVars);
  }
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

//post request, if not logged in, redirects back to /login. otherwise it deletes the shortURL that we created earlier
app.post("/urls/:shortURL/delete", (req, res) => {
  let id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (loggedIn && id === urlDatabase[shortURL].userID) {
    let shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
    return;
  }
  return res.redirect("/login");
});

//makes a get request when you click the edit button, takes you to the edit page. if not logged in then redirects you to login
app.get("/urls/:shortURL/edit", (req, res) => {
  const id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/login");
  }
  let shortURL = req.params.shortURL;
  res.redirect(`/urls_show/${shortURL}`);
});

//post request to the edit page, if not logged in then sends an error msg. otherwise lets you edit and update your URL
app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  const id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    const templateVars = { user: undefined, message: "User not logged in!" };
    return res.render("error", templateVars);
  }
  let longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls`);
});

// 
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  const id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    const templateVars = { user: undefined, message: "User not logged in!" };
    return res.render("error", templateVars);
  }
  
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls`);
});

// get request, if not logged in, then redirects user to log in. otherwise renders the new urls page
app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

//
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    const templateVars = { user: undefined, message: "URL does not exist" };
    return res.render("error", templateVars);
  }
  res.redirect(longURL.longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.user_id;
  let templateVars = { user: users[id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    templateVars = { user: undefined, message: "User not logged in!" };
    return res.render("error", templateVars);
  }
  
  if (urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL].userID !== id) {
    templateVars = { user: undefined, message: "User not authorized!" };
    return res.render("error", templateVars);
  }

  if (!urlDatabase[req.params.shortURL]) {
    templateVars['message'] = "URL does not exist";
    return res.render("error", templateVars);
  }
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});