import express from "express";
//importing controllers to control routes callback , for maintainable code
import { register, login } from "../controllers/auth";

//creating router instance like app
const router = express.Router();

//register user endpoint
router.post("/register", register);
router.post("/login", login);

module.exports = router;
