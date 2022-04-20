const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
// const { checkEmail, generateRandomString } = require("./helpers/helperFunctions")

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
}


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
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  let foundEmail = checkEmail(users, email);
  if (email === "" || password === "") {
    return res.status(400).send("ERROR: INVALID EMAIL/PASSWORD")
  }
  if (foundEmail) {
    return res.status(400).send("ERROR: USER ALREADY EXISTS");
  }
  users[id] = { id, email, password }
  res.cookie("user_id", id)
  const templateVars = { users, id, urls: urlDatabase}
  // console.log("label:", users);
  res.render("urls_index", templateVars)
});

app.get("/urls", (req, res) => { 
  const id = req.cookies.user_id
  const templateVars = { users, id, urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username')
  res.redirect('/urls');
})

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  res.redirect(`/urls_show/${shortURL}`)
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL
  res.redirect(`/urls`)
})

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { users, id };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { users, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], id };
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