const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

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

//Generate a random 6-character string
function generateRandomString() {
  return Math.random().toString(36).substring(6);
}

//Check if email is in use
const doesEmailExist = function (email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { urls: urlDatabase, userId, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const id = generateRandomStr();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/login", (req, res) => {
  res.redirect("urls");
});

app.post("/logout", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { userId, user };
  return res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const { registration } = req.body;
  const userId = generateRandomString(registration);
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  if (!email || !password) {
    res.status(400).send("Error: Please fill all fields.");
  } else if (doesEmailExist(email)) {
    res.status(400).send("Email in Use.");
  } else {
    users[`${userId}`] = { id: `${userId}`, email, password};
    res.cookie("userId", userId);
    res.redirect("/urls");
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { userId, user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    userId,
    user,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const { urlUpdate } = req.body;
  const idToUpdate = req.params.id;
  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = urlUpdate;
  }
  res.redirect(`/urls/${idToUpdate}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
