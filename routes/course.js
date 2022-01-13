import express from "express";
//importing controllers to control routes callback , for maintainable code
import {
  uploadImage,
  removeImage,
  createNewCourse,
  getCourses,
  getSingleCourse,
  uploadLessonVideo,
  removeLessonVideo,
  addLessonToCourse,
  updateCourse,
  removeLesson,
  updateLesson,
  publishCourse,
  unpublishCourse,
  allPublishedCourse,
} from "../controllers/course";
import { requireSignin, isInstructor } from "../middleware";
import formidable from "express-formidable";
const { Client } = require("@notionhq/client");

// Initializing a client
const notion = new Client({
  auth: "secret_WuT7hfrTlf598FM8mp4b9YelMtHHR8xoohNUNIUt8aK",
});

//creating router instance
const router = express.Router();

const getNotion = async (req, res) => {
  try {
    const DatabaseId = "bfffea3efcc6453bbc77ad69b212a7b6";
    const data = await notion.databases.retrieve({
      database_id: DatabaseId,
    });
    console.log(data);
    return res.json(data);
    //   setNotionData();
  } catch (err) {
    console.log(err);
    return res.json(err);
    //   setNotionData(err);
  }
};
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

//max 1gb upload
router.post(
  "/course/lesson-video-upload/:instructorId",
  requireSignin,
  formidable({ maxFieldsSize: 1024 * 1024 * 1024 }),
  uploadLessonVideo
);

router.post(
  "/course/lesson-video-remove/:instructorId",
  requireSignin,
  isInstructor,
  removeLessonVideo
);

// /api/course/add-lesson/${slug}/${course.instructor._id}`
router.post(
  "/course/add-lesson/:slug/:instructorId",
  requireSignin,
  isInstructor,
  addLessonToCourse
);

router.get("/course/get-notion", getNotion);
router.put("/course/update-course/:slug", requireSignin, updateCourse);

//update course after removing lessons
router.put(
  "/course/remove-lesson/:slug/:lessonId",
  requireSignin,
  removeLesson
);

//update lesson
///api/course/update-lesson/${slug}/${currentLesson._id}
router.put(
  "/course/update-lessons/:slug/:lessonId",
  requireSignin,
  isInstructor,

  updateLesson
);

//publish course put it live to marketplace
router.put(
  "/course/publish/:courseId",
  requireSignin,
  isInstructor,
  publishCourse
);

//unpublish course from marketplace
router.put(
  "/course/unpublish/:courseId",
  requireSignin,
  isInstructor,
  unpublishCourse
);

//fetch all published course
router.get("/course/all/published", allPublishedCourse);

module.exports = router;
