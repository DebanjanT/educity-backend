import { nanoid } from "nanoid";
import { awsConfig } from "../config/aws_config";
import AWS from "aws-sdk";
import slugify from "slugify";
import courseSchema from "../models/courseSchema";
import { requireSignin } from "../middleware";
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
