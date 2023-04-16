//REQUIREMENTS
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers");

const app = express();
const PORT = 8080; 

//MIDDLEWARE
app.use(
  cookieSession({
    name: "user-session",
    keys: ["tinyapp"],
    maxAge: 5 * 60 * 60 * 1000,
  })
);
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

const users = {};

//ROUTES
//Loads URL home page
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Registration page
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
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
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_login", templateVars);
});

//URL home page
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  //Deny access if not a user
  if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  }
  const templateVars = {
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase),
  };
  res.render("urls_index", templateVars);
});

//Create New URL Page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  //Redirect to login page if not a user
  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("urls_new", templateVars);
});

//Edit URL page
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const shortcutURL = req.params.id;
  //Check if URL ID is in database
  if (!urlDatabase[shortcutURL]) {
    return res.status(404).send("URL ID not in database.");
  }
  //Error message if user is not logged in
  if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  }
  //Error message if URL ID is not linked to that user's profile
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
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  //Check if fields are empty
  if (!email || !password) {
    return res.status(400).send("Please provide a valid email and password.");
  }
  //Check if email is registered to another user
  if (getUserByEmail(email, users)) {
    return res.status(400).send("This email is already in use.");
  }
  //Generate unique user ID
  const userId = generateRandomString();
  //Add new user to user object
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword,
  };
  req.session.user_id = userId;
  res.redirect("/urls");
});

//Login Authentication
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userFound = getUserByEmail(email, users);
  if (!userFound) {
    res.status(403).send("Please register first.");
  } else if (!bcrypt.compareSync(password, userFound.password)) {
    res.status(403).send("Incorrect password.");
  } else {
    req.session.user_id = userFound.id;
    res.redirect("/urls");
  }
});

//Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.clearCookie("session");
  res.redirect("/login");
});

//Add new URL to database
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  //Throw error if not logged in
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

//Edit long URL
app.post("/urls/:id/", (req, res) => {
  const userId = req.session.user_id;
  const usersURLs = urlsForUser(userId, urlDatabase);
  const shortcutURL = req.params.id;
  //url ID doesn't exist
  if (!urlDatabase[shortcutURL]) {
    return res.status(404).send("URL ID not in database.");
  }
  //Throw error if user not logged in
  if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  }
  //Check if URL ID is in users database
  if (!Object.keys(usersURLs).includes(shortcutURL)) {
    return res
      .status(401)
      .send("Access denied: You do not have proper permissions.");
  } else {
    const changeLongURL = req.body.type;
    urlDatabase[req.params.id].longURL = changeLongURL;
    return res.redirect("/urls");
  }
});

//Delete URLs
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const usersURLs = urlsForUser(userId, urlDatabase);
  const shortcutURL = req.params.id;
  if (!urlDatabase[shortcutURL]) {
    return res.status(404).send("URL ID not in database.");
  }
  if (!userId) {
    return res.status(401).send("Please log in/register to access.");
  }
  if (!Object.keys(usersURLs).includes(shortcutURL)) {
    return res
      .status(401)
      .send("Access denied: You do not have proper permissions.");
  } else {
    const urlID = req.params.id;
    delete urlDatabase[urlID];
    return res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
