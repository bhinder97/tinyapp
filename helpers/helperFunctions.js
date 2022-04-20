const checkEmail = function(obj, email) {
  for (let key in obj) {
    if (key[email] === email) {
      return true;
    } else {
      return false;
    }
  }
};

function generateRandomString(urlDatabase) {
  let newShortURL = Math.random().toString(36).substring(2, 8);
  if (urlDatabase[newShortURL]) {
    return Math.random().toString(36).substring(2, 8);
  }
  return newShortURL;
}


module.exports = { checkEmail, generateRandomString }