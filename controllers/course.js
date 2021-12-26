import { nanoid } from "nanoid";
import { awsConfig } from "../config/aws_config";
import AWS from "aws-sdk";

export const uploadImage = async (req, res) => {
  const { image } = req.body;
  const S3 = new AWS.S3(awsConfig);

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
