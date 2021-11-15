import express from "express";
import cors from "cors";
const morgan = require("morgan");
require("dotenv").config();
import { readdirSync } from "fs";
import mongoose from "mongoose";

// ** create express app
const app = express();

// ** express middleware (execute before sending response to client)
app.use(express.json());
app.use(cors());
//morgan for debug requestsß
app.use(morgan("dev"));

// ** routes using fileSystem of node by for loop after reading router folder
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

//db connect with atlas by mongoose
mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("Mongodb connected"))
  .catch((err) => console.log(err));

//** Listening Port
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
