import { nanoid } from "nanoid";
import { awsConfig } from "../config/aws_config";
import AWS from "aws-sdk";
import slugify from "slugify";
import courseSchema from "../models/courseSchema";
import { readFileSync } from "fs";

const S3 = new AWS.S3(awsConfig);

export const uploadImage = async (req, res) => {
  const { image } = req.body;

  try {
    if (!image) return res.status(400).send("No image uploaded");

    //prepare image for uploading
    //as it appears as binary in console we have to remove data:image/jpeg tag from binary
    //remove data:image/jpeg;base64 tag by using regex

    const base64Image = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    //split and saving type of image from binary console data of image
    const type = image.split(";")[0].split("/")[1];

    //params for aws s3 config
    const params = {
      Bucket: "educity-india",
      Key: `${nanoid()}.${type}`,
      Body: base64Image,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    //using params config upload image to s3
    //upload takes two args
    //1.params, 2.callback
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

export const removeImage = async (req, res) => {
  try {
    const { image } = req.body;
    console.log(image);
    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log("Aws delete cb err", err);
        res.sendStatus(400);
      }
      res.send({ deleted: true });
    });
  } catch (err) {
    console.log("AWS express err", err);
  }
};

export const createNewCourse = async (req, res) => {
  try {
    //first check if name with that course exists with slugify

    const slugCheck = slugify(req.body.name.toLowerCase());
    const alreadyExistCourse = await courseSchema.findOne({
      slug: slugCheck,
    });
    if (alreadyExistCourse)
      return res
        .status(400)
        .send("Course name already taken, Please Change ❤️");

    //if not exists then create a course
    const newCourse = new courseSchema({
      instructor: req.user._id,
      slug: slugify(req.body.name),
      title: req.body.name,
      price: parseInt(req.body.price),
      ...req.body,
    });
    await newCourse.save();
    res.json(newCourse);
  } catch (err) {
    console.log("course create err", err);
    return res.status(400).send("Something went wrong");
  }
};

export const getCourses = async (req, res) => {
  try {
    //query database for searching current instructor's course
    //in courseSchema we have instructor as objectID

    const courses = await courseSchema
      .find({ instructor: req.user._id })
      .sort({ createdAt: -1 })
      .exec();

    res.json(courses);
  } catch (err) {
    console.log("Error getting courses =>", err);
    res.sendStatus(400);
  }
};

export const getSingleCourse = async (req, res) => {
  try {
    //find course according to slug param
    //populate gives the details of any ObjectId reffered schema
    const course = await courseSchema
      .findOne({ slug: req.params.slug })
      .populate("instructor", "_id name")
      .exec();
    res.json(course);
  } catch (err) {
    console.log(err);
  }
};

export const uploadLessonVideo = async (req, res) => {
  if (req.user._id !== req.params.instructorId)
    return res.status(403).send("You are not allowed");
  const { lessonVideo } = req.files;
  const params = {
    Bucket: "educity-india",
    Key: `${nanoid()}.${lessonVideo.type.split("/")[1]}`,
    Body: readFileSync(lessonVideo.path),
    ACL: "public-read",
    ContentType: lessonVideo.type,
  };
  S3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      return res.sendStatus(400);
    }
    console.log(data);
    res.send(data);
  });
  // console.log(lessonVideo);
};

export const removeLessonVideo = async (req, res) => {
  try {
    if (req.user._id !== req.params.instructorId)
      return res.status(403).send("You are not allowed");
    const { Key, Bucket } = req.body;
    const params = {
      Bucket: Bucket,
      Key: Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log("Aws delete cb err", err);
        res.sendStatus(400);
      }
      res.send({ deleted: true });
    });
  } catch (err) {
    console.log(err);
  }
};

// ADD LESSON to existing course
export const addLessonToCourse = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;
    if (req.user._id !== req.params.instructorId)
      return res.status(403).send("You are not allowed");

    //$push method add data to reffered schema object of array
    const updatedCourse = await courseSchema
      .findOneAndUpdate(
        { slug },
        {
          $push: {
            lessons: {
              title: title,
              slug: slugify(title),
              content: content,
              video: video,
            },
          },
        },
        { new: true }
      )
      .populate("instructor", "_id name")
      .exec();

    res.json(updatedCourse);
  } catch (err) {
    console.log("Lesson add err ==>", err);
    res.sendStatus(400);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await courseSchema.findOne({ slug }).exec();
    console.log(req.user._id);
    console.log(course.instructor._id);

    if (req.user._id != course.instructor._id)
      return res.status(403).send("Unauthorized Action");

    //update course
    const updatedCourse = await courseSchema
      .findOneAndUpdate({ slug }, req.body, { new: true })
      .exec();
    res.json(updatedCourse);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Oops course update failed");
  }
};

//@function : Remove Lesson from course
//@endpoint: /course/remove-lesson/:slug/:lessonId
//@access: Instructor
export const removeLesson = async (req, res) => {
  try {
    const { slug, lessonId } = req.params;
    const course = await courseSchema.findOne({ slug }).exec();
    if (req.user._id != course.instructor._id)
      return res.status(403).send("Unauthorized Action");

    //find the course and update
    //$pull to remove from array, & $push to add object into array
    const deleteLessonFromCourse = await courseSchema
      .findByIdAndUpdate(course._id, {
        $pull: { lessons: { _id: lessonId } },
      })
      .exec();
    res.json({ deleted: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Opps! Contact Support");
  }
};

//@function : Update whole lesson
//@endpoint: /course/update-lesson/:slug:/:lessonId
//@access: Instructor
export const updateLesson = async (req, res) => {
  try {
    const { slug, lessonId } = req.params;
    const { _id, title, content, video, free_preview } = req.body;
    const course = await courseSchema.findOne({ slug }).exec();
    if (req.user._id != course.instructor._id)
      return res.status(403).send("Unauthorized Action");

    //update sigle lesson using updateone(filter, update)
    const updateLesson = await courseSchema.updateOne(
      { "lessons._id": lessonId },
      {
        $set: {
          "lessons.$.title": title,
          "lessons.$.content": content,
          "lessons.$.video": video,
          "lessons.$.free_preview": free_preview,
        },
      }
    );
    console.log(updateLesson);
    res.json({ updated: true });
  } catch (err) {
    console.log(err);
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseSchema.findOne({ _id: courseId }).exec();
    if (course.instructor._id != req.user._id)
      return res.status(403).send("Unauthorized Action");

    const publishCourse = await courseSchema
      .findByIdAndUpdate(
        courseId,
        {
          published: true,
        },
        { new: true }
      )
      .populate("instructor", "_id name")
      .exec();

    return res.json(publishCourse);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Something went wrong with publish");
  }
};

export const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseSchema.findOne({ _id: courseId }).exec();
    if (course.instructor._id != req.user._id)
      return res.status(403).send("Unauthorized Action");

    const unpublishCourse = await courseSchema
      .findByIdAndUpdate(
        courseId,
        {
          published: false,
        },
        { new: true }
      )
      .populate("instructor", "_id name")
      .exec();

    return res.json(unpublishCourse);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Something went wrong with unpublish");
  }
};

export const allPublishedCourse = async (req, res) => {
  try {
    const allPubCourses = await courseSchema
      .find({ published: true })
      .populate("instructor", "_id name")
      .exec();
    res.json(allPubCourses);
  } catch (err) {
    console.timeLog(err);
  }
};
