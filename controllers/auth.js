import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
const jwt = require("jsonwebtoken");
require("dotenv").config();
import AWS from "aws-sdk";
import { awsConfig } from "../config/aws_config";
import { nanoid } from "nanoid";

//creating new ses instance
const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    //validations ->
    if (!name) return res.status(400).send("Enter your full name please!");
    if (!password || password.length < 6)
      return res
        .status(400)
        .send("Password is required & must be atleast 6 char long");

    if (!email) return res.status(400).send("Email is required");

    const emailExists = await User.findOne({ email }).exec();
    if (emailExists)
      return res.status(400).send("User with this email already exists");

    //hash password
    const hashedPassword = await hashPassword(password);
    //create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Opps. Something wrong with api try again");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check user is valid
    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(400).send("No user found with this email");

    //if user found then comapre password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch)
      return res.status(400).send("Please Enter correct Password");
    //generate token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    //send cookie without user's password
    user.password = undefined;
    res.cookie("token", token, {
      httpOnly: true,
    });
    //send data to user frontend
    res.json(user);
  } catch (err) {
    console.log("Error", err);
    res.status(400).send("Error with Login");
  }
};

export const logout = async (req, res) => {
  try {
    //remove cookie
    res.clearCookie("token");

    return res.json({ message: "You have logged out" });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .select("-passwordResetCode")
      .exec();
    return res.json({ secure: true });
  } catch (err) {
    console.log("Current user error", err);
  }
};

//sending email by aws SES service
export const sendEmail = async (req, res) => {
  // console.log("sending email route test using aws ses");
  // res.json({ ok: true });
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: ["debanjantewary.1997@gmail.com"],
    },
    ReplyToAddresses: [process.env.EMAIL_FROM],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
          <html>
          <h1>Reset Password Link</h1>
          <p>Please use this following link to reset password</p>
          </html>
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Password reset educity",
      },
    },
  };
  const emailSent = SES.sendEmail(params).promise();
  emailSent
    .then((data) => {
      console.log(data);
      res.json({ ok: true });
    })
    .catch((err) => {
      console.log(err);
    });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const shortCode = nanoid(8).toUpperCase();

    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );
    if (!user) return res.status(400).send("User not found with this email");

    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
            <html>
            <h1>Reset Password Link</h1>
            <p>Please use this following code <strong> ${shortCode} </strong> to reset password</p>

            </html>
            `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Password reset educity",
        },
      },
    };
    const emailSent = SES.sendEmail(params).promise();
    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    //password length check
    if (newPassword.length < 6)
      return res
        .status(400)
        .send("Password must be atleast 6 characters long ");

    //hash password
    const newHashedPassword = await hashPassword(newPassword);

    //find user with email and code and update
    const user = await User.findOneAndUpdate(
      {
        email,
        passwordResetCode: code,
      },
      {
        password: newHashedPassword,
        passwordResetCode: "",
      }
    );

    if (!user)
      return res.status(400).send("Incorrect Credentials , check reset code");
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Something went wrong! Try again");
  }
};

export const stripeOnboard = async (req, res) => {
  //intit stripe onvoarding for instructors
  console.log("stripe onboard api hit");
};
