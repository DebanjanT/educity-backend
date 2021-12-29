import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

//every course will have lessions
//every lession will follow this schema structure
//title, slug, content, video link as response object from S3, boolean free preiview if its freepreview video

const lessonSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 320,
      required: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    content: {
      type: {},
      minlength: 200,
    },
    video_link: {},
    free_preview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//Main course schema structure
//every course will have lession which is following above schema
//course schema will contain main details about the whole course
//along with all related lessions connected to a perticualr course
const courseSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 320,
      required: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    price: {
      type: Number,
    },
    image: {
      type: {},
    },
    category: {
      type: String,
    },
    published: {
      type: Boolean,
      default: false,
    },
    paid: {
      type: Boolean,
      default: true,
    },
    instructor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

export default mongoose.model("courseSchema", courseSchema);
