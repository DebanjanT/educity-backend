import express from "express";
//importing controllers to control routes callback , for maintainable code
import { uploadImage } from "../controllers/course";
import { requireSignin } from "../middleware";

//creating router instance like app
const router = express.Router();

//register user endpoint
router.post("/course/image-upload", requireSignin, uploadImage);

module.exports = router;
