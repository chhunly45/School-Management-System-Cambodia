const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= MIN_PASSWORD_LENGTH;
}

module.exports = { validatePassword };
