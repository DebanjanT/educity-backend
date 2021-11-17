import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
const jwt = require("jsonwebtoken");
require("dotenv").config();

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    //validations ->
    if (!name) return res.status(400).send("Enter your full name please!");
    if (!password || password.length < 6)
      return res
        .status(400)
        .send("Password is required & must be atleast 6 char long");

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
    const token = jwt.sign(
      { _id: user._id },
      "SDYBUDSHFS7NH87EY3Q7SEZQNS78ZZQDNP78YN73ZYQ478S3Q4NNQPS78E78Y37QSNOZQ78FYQSZD77Q3NP7CQDHQ0Q9QDQ0FS7N8347",
      {
        expiresIn: "7d",
      }
    );
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
