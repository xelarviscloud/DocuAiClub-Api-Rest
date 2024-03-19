import bcrypt from "bcrypt";

// Password hashing
function hashPassword(password) {
  const encryptedPassword = bcrypt.hashSync(password, 10);
  return encryptedPassword;
}

export default hashPassword;
