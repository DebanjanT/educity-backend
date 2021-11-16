import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";

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
