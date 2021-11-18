import express from "express";
//importing controllers to control routes callback , for maintainable code
import { register, login, logout } from "../controllers/auth";

//creating router instance like app
const router = express.Router();

//register user endpoint
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

module.exports = router;
