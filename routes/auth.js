import express from "express";
//importing controllers to control routes callback , for maintainable code
import {
  register,
  login,
  logout,
  currentUser,
  sendEmail,
} from "../controllers/auth";
import { requireSignin } from "../middleware";

//creating router instance like app
const router = express.Router();

//register user endpoint
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);
router.get("/send-email", sendEmail);

module.exports = router;
