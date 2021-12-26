import User from "../models/user";
import queryString from "query-string";
const stripe = require("stripe")(process.env.STRIPE_SECRET);

export const makeInstructor = async (req, res) => {
  try {
    // FLOW

    // 1. Check user from db
    const user = await User.findById(req.user._id).exec();

    // 2. Check if he had stripe_account_id or create new one if don't
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: "standard" });
      console.log("Account =>", account.id);
      user.stripe_account_id = account.id;
      await user.save();
    }

    // 3. create account link and send it to frontedn
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.SRRIPE_REDERECT_URL,
      return_url: process.env.SRRIPE_REDERECT_URL,
      type: "account_onboarding",
    });

    // 4. Pre-fill info like email send url response to fronted
    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });
    // console.log(`${accountLink.url}?${queryString.stringify(accountLink)}`);
    // 5. Send account link as response to frontend
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (err) {
    console.log(err);
    res.status(400).send("Currently Unavailable for India");
  }
};

//get account status is for to call stripe api for user account info
export const getAccountStatus = async (req, res) => {
  const user = await User.findById(req.user._id).exec();
  const account = await stripe.accounts.retrieve(user.stripe_account_id);

  if (!account.charges_enabled) {
    return res.status(401).send("Please complete stripe account");
  } else {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        stripe_seller: account,
        $addToSet: { role: "Instructor" },
      },
      { new: true }
    )
      .select("-password")
      .exec();

    res.json(updatedUser);
  }
};

//endpoint to check if the current loggedin user is an instructor or not
//it will not return any data , only return status to frontend
//status will be used to protect instructor page routes
export const currentInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").exec();
    if (!user.role.includes("Instructor")) {
      //to send only status use sendStatus instead of status
      return res.sendStatus(403);
    } else {
      res.json({ secure: true });
    }
  } catch (err) {
    console.log(err);
  }
};
