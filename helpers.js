//HELPER FUNCTIONS

//Generate a random 6-character string
function generateRandomString() {
  return Math.random().toString(36).substring(6);
}

//Check if email is in use
const getUserByEmail = function (email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };
