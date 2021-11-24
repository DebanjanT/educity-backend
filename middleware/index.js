import expressJwt from "express-jwt";

//this is required to verify token sent from client to protect routes

export const requireSignin = expressJwt({
  getToken: (req, res) => req.cookies.token,
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});
