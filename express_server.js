const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");

// let urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

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


function generateRandomString() {
  let newShortURL = Math.random().toString(36).substring(2, 8);
  if (urlDatabase[newShortURL]) {
    return Math.random().toString(36).substring(2, 8);
  }
  return newShortURL;
}

const checkEmail = function(obj, email) {
  for (let key in obj) {
    if (obj[key].email === email) {
      return true;
    }
  }
  return false;
};

const checkUserID = function(obj, email) {
  for (let user of Object.values(obj)) {
    if (user.email === email) {
      return user;
    }
  }
};

const checkLogin = function(cookie) {
  if (cookie) {
    return true;
  }
};

const checkUrlsForUsers = function(id, urlDatabase) {
  let listOfUrls = {};
  for (let key in urlDatabase) {
    // console.log("key is:", key);
    if (id === urlDatabase[key].userID) {
      listOfUrls[key] = urlDatabase[key];
    }
  }
  return listOfUrls;
};


app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let id = req.cookies.user_id;
  let loggedIn = checkLogin(id);
  if (loggedIn) {
    return res.redirect("/urls")
  }
  const templateVars = { user: users[id] }
  res.render("login", templateVars)
});

app.post("/login", (req, res) => {
  console.log("obj is:", req.body.email)
  let email = req.body.email;
  let password = req.body.password;
  let user = checkUserID(users, email);
  let id = req.cookies.user_id;
  let loggedIn = checkLogin(id);
  if (loggedIn) {
    return res.redirect("/urls")
  }
  if (!user) {
    return res.status(403).send("ERROR: EMAIL NOT FOUND");
  }
  if (user.password !== password) {
    return res.status(403).send("ERROR: PASSWORD DOES NOT MATCH");
  }
  res.cookie('user_id', user.id)
  // req.session.user_id = user.id
  res.redirect("/urls");
});

app.get("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls');
})

app.get("/register", (req, res) => {
  let id = req.cookies.user_id;
  let loggedIn = checkLogin(id);
  if (loggedIn) {
    return res.redirect("/urls")
  }
  const templateVars = { user: users[id] }
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  let foundEmail = checkEmail(users, email);
  let userID = req.cookies.user_id;
  let loggedIn = checkLogin(userID);
  if (loggedIn) {
    return res.redirect("/urls")
  }
  if (email === "" || password === "") {
    return res.status(400).send("ERROR: INVALID EMAIL/PASSWORD")
  }
  if (foundEmail) {
    return res.status(400).send("ERROR: USER ALREADY EXISTS");
  }
  users[id] = { id, email, password }
  res.cookie("user_id", id)
  const templateVars = { user: users[id], urls: urlDatabase}
  res.redirect("/urls")
});

app.get("/urls", (req, res) => { 
  const id = req.cookies.user_id
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/register");
  }
  const getUrls = checkUrlsForUsers(id, urlDatabase);
  const templateVars = { user: users[id], urls: getUrls };
  res.render("urls_index", templateVars)
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  const id = req.cookies.user_id;
  console.log("id is:", id);
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/login");
  }
  urlDatabase[shortURL] = { 
    longURL: longURL,
    userID: req.cookies.user_id 
  }
  console.log("urls:", urlDatabase)
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.cookies.user_id;
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/login")
  }
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/urls/:shortURL/edit", (req, res) => {
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/login")
  }
  let shortURL = req.params.shortURL;
  res.redirect(`/urls_show/${shortURL}`)
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL
  res.redirect(`/urls`)
})

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id
  let loggedIn = checkLogin(id);
  if (!loggedIn) {
    return res.redirect("/login")
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { user: users[id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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