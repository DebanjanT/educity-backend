import express from "express";
import cors from "cors";
const morgan = require("morgan");
require("dotenv").config();
import { readdirSync } from "fs";
import mongoose from "mongoose";
import csrf from "csurf";
import cookieParser from "cookie-parser";

// ** create express app
const app = express();

//csrf protection
const csrfProtection = csrf({ cookie: true });

// ** express middleware (execute before sending response to client)
// use limit to express to allow user image upload upto 5mb , this is required to avoid "payload too large error" while api hit
app.use(express.json({ limit: "5mb" }));
app.use(cors());
//morgan for debug requestsß
app.use(morgan("dev"));
app.use(cookieParser());

// ** routes using fileSystem of node by for loop after reading router folder
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

//csrf middleware
app.use(csrfProtection);

//csrf API endpoint to recieve CSRF from frontend
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

//db connect with atlas/localdb by mongoose
mongoose
  .connect(process.env.LOCALDB)
  .then(() => console.log("Mongodb connected"))
  .catch((err) => console.log(err));

//** Listening Port
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
