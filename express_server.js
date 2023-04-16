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

//Registration page
app.get('/register', (req, res) => {
  //get user's cookie
  const userId = req.cookies['user_id'];
  //check if user is logged in
  if (userId) {
  return res.redirect('/urls');
  }
  const templateVars = {
    user: users[userId],
  };
  res.render('urls_register', templateVars);
});

//Login Page
app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  if (user) {
   return res.redirect('/urls');
  }
  const templateVars = {
    user: users[userId]
  };
  res.render('urls_login', templateVars);
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

app.get('/urls/new', (req, res) => {
  //get user's cookie
  const userId = req.cookies['user_id'];
  const user = users[userId];
  console.log(user);
  //check if user is logged in
  if (!user) {
   return res.redirect('/login');
  }
  const templateVars = { 
    user: users[req.cookies['user_id']],
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("URL not in database.")
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("URL not in database.")
  }
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//Register new user
app.post('/register', (req, res) => {
  const id = generateRandomString();
  //take email & password from body object
  const email = req.body.email;
  const password = req.body.password;
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Incorrect email or password');
  } else if (doesEmailExist(email)) {
    res.status(400);
    res.send("Unable to register, email in use.");
  } else {
    //makes new user object
    const user = {id, email, password};
    //adds new user to user object
    users[id] = user;
    //adds new user id cookie
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

//Login Authentication
app.post('/login', (req, res) => {
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
    res.cookie('user_id', userFound.id);
    res.redirect('/urls');
  }
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
   return res.send("Please log in or register to shorten URLs.");
  }
  const longURL = req.body.longURL;
  const newShortURL = generateRandomString();
  //add new url to database
  urlDatabase[newShortURL] = longURL;
  // Use route to view the new url you made
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const updatedLongUrl = req.body.longURL;
  urlDatabase[req.params.id] = updatedLongUrl;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const idURL = req.params.id;
  delete urlDatabase[idURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});