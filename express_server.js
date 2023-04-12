//REQUIREMENTS
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

//MIDDLEWARE
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//DATABASE CONFIGURATION
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "ilovecoding",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "thisisa-badpassword",
  },
};

//HELPER FUNCTIONS

//Generate a random 6-character string
function generateRandomString() {
  return Math.random().toString(36).substring(6);
}

//Check if email is in use
const doesEmailExist = function (email) {
  let userExists = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      userExists = user;
      return userExists;
    }
  }
  return false;
};

//ROUTES
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Login Page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_login", templateVars);
});

//Registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_register", templateVars);
});

//URL functionality

//URL index page
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const shortcutURL = req.params.id;
  const longURL = urlDatabase[shortcutURL];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  console.log("we're here");
  const user = users[req.cookies["user_id"]];
  console.log("user", user);
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const newURL = generateRandomString();
  urlDatabase[newURL] = longURL;
  res.redirect(`/urls/${newURL}`);
});

app.post("/urls/:id", (req, res) => {
  const updatedLongUrl = req.body.longURL;
  urlDatabase[req.params.id] = updatedLongUrl;
  res.redirect("/urls");
});

//Login Authentication
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400);
    res.send("Error 403: Email and/or password field empty.");
  } else {
    const userExists = doesEmailExist(email);
    if (!userExists) {
      res.status(403);
      res.send("Error 403: Account does not exist. Please create new account.");
    } else if (userExists.password !== password) {
      res.status(403);
      res.send("Error 403: Invalid password.");
    } else {
      res.cookie("user_id", userExists.id);
      console.log("user_id");
      res.redirect("/urls");
    }
  }
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

//Register new user
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send("Email and/or password field empty.");
  } else if (doesEmailExist(email)) {
    res.status(400);
    res.send("Error: Email in use.");
  } else {
    const user = { id, email, password };
    //Add user
    users[id] = user;
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const idURL = req.params.id;
  delete urlDatabase[idURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
