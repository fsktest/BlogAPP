import express from "express";
import "dotenv/config";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import appRoutes from "./Routes/app.routes.js";
import postRoutes from "./Routes/blog.routes.js";
import Cors from "cors";

const DbConnection = async () => {
  try {
    const DB = await mongoose.connect(process.env.MONGO_URI);
    if (DB) {
      return console.log("DB Connection Successfully");
    }
  } catch (error) {
    console.log("DB Connection ERROR: ", error.message);
  }
};
DbConnection();

export const app = express();
app.use(Cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;

app.use("/", appRoutes);
app.use("/", postRoutes);

app.listen(PORT, () => {
  console.log(`Server is UP & RUNNING on PORT: ${PORT}`);
});
