import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDB = async () => {
  await mongoose
    .connect(config.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
};
