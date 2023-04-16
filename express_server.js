//REQUIREMENTS
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

//MIDDLEWARE
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//DATABASE
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

const urlsForUser = function (id, urlDatabase) {
  const customURLs = {};
  for (const shortcutURL in urlDatabase) {
    if (urlDatabase[shortcutURL].userID === id) {
      customURLs[shortcutURL] = urlDatabase[shortcutURL];
    }
  }
  return customURLs;
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

//Registration page
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_register", templateVars);
});

//Login Page
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_login", templateVars);
});

//URL index page
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  }
  const templateVars = {
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase),
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortcutURL = req.params.id;
  if (!urlDatabase[shortcutURL]) {
    return res.status(404).send("URL ID not in database.");
  }
  if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  }
  if (userId !== urlDatabase[shortcutURL].userID) {
    return res
      .status(401)
      .send("Access denied: You do not have proper permissions.");
  }
  const templateVars = {
    user: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("URL not in database.");
  }
  const shortcutURL = req.params.id;
  const longURL = urlDatabase[shortcutURL].longURL;
  res.redirect(longURL);
});

//Register new user
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send("Email/password field empty.");
  } else if (doesEmailExist(email)) {
    res.status(400);
    res.send("Unable to register, email in use.");
  } else {
    const user = { id, email, password };
    users[id] = user;
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

//Login Authentication
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userFound = doesEmailExist(email);
  if (!userFound.id) {
    res.status(403);
    res.send("Please register.");
  } else if (userFound.password !== password) {
    res.status(403);
    res.send("Incorrect password.");
  } else {
    res.cookie("user_id", userFound.id);
    res.redirect("/urls");
  }
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(401).send("Please log in or register to shorten a URL.");
  }
  const longURLNew = req.body.longURL;
  const shortURLNew = generateRandomString();
  urlDatabase[shortURLNew] = {
    longURL: longURLNew,
    userID: userId,
  };
  res.redirect(`/urls/${shortURLNew}`);
});

app.post('/urls/:id/', (req, res) => {
  const userId = req.cookies['user_id'];
  const usersURLs = urlsForUser(userId, urlDatabase);
  const shortcutURL = req.params.id;
  if (!urlDatabase[shortcutURL]) {
    return res.status(404).send("URL ID not in database.");
  //if not logged in
  } if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  //if it is not user's url
  } if (!Object.keys(usersURLs).includes(shortcutURL)) {
    return res.status(401).send("Access denied: You do not have proper permissions.");
  } else {
    const changeLongURL = req.body.type;
    urlDatabase[req.params.id].longURL = changeLongURL;
    return res.redirect('/urls');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  const userId = req.cookies['user_id'];
  const usersURLs = urlsForUser(userId, urlDatabase);
  const shortcutURL = req.params.id;
  if (!urlDatabase[shortcutURL]) {
    return res.status(404).send("URL ID not in database.");
  } if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  } if (!Object.keys(usersURLs).includes(shortcutURL)) {
    return res.status(401).send("Access denied: You do not have proper permissions.");
  } else {
    const urlID = req.params.id;
    delete urlDatabase[urlID];
    return res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
