import { Router } from "express";
import { imageUpload } from "../Controllers/ImageUploadController.js";
import upload from "../Middlewares/multer.js";
export const uploadRouter = Router();
uploadRouter.route('/')
  .post(upload.single("image"), imageUpload)
