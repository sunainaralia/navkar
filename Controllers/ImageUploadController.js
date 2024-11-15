import cloudinaryConfig from "../Utils/cloudinary.js";
import CustomErrorHandler from "../Utils/CustomErrorHandler.js";
export const imageUpload = function (req, res, next) {
  cloudinaryConfig.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      const error = new CustomErrorHandler(err[msg])
      next(error)
    } else {
      res.status(201).json({
        success: true,
        msg: "image uploaded",
        data: result
      })
    }
  })
};