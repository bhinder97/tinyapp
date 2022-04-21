const getUserByEmail = function(email, database) {
  for (let user of Object.values(database)) {
    if (user.email === email) {
      return user;
    }
  }
};


module.exports = { getUserByEmail };