import bcrypt from "bcrypt";

//hashing password
export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};
//comparing hased password
export const comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed);
};
