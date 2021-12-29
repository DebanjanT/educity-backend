import express from "express";
//importing controllers to control routes callback , for maintainable code
import {
  uploadImage,
  removeImage,
  createNewCourse,
  getCourses,
  getSingleCourse,
} from "../controllers/course";
import { requireSignin, isInstructor } from "../middleware";

//creating router instance
const router = express.Router();

//course image handle endpoint
router.post("/course/image-upload", requireSignin, isInstructor, uploadImage);
router.post("/course/image-remove", requireSignin, isInstructor, removeImage);

//course creation endpoint
router.post(
  "/course/create-new-course",
  requireSignin,
  isInstructor,
  createNewCourse
);

router.get(
  "/course/get-instructor-courses",
  requireSignin,
  isInstructor,
  getCourses
);

router.get("/course/:slug", getSingleCourse);
module.exports = router;
