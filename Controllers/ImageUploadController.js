import cloudinaryConfig from "../Utils/cloudinary.js";
import CustomErrorHandler from "../Utils/CustomErrorHandler.js";
export const imageUpload = function (req, res, next) {
  cloudinaryConfig.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      console.log(err)
      return next(new CustomErrorHandler(err, 400))
    } else {
      return res.status(201).json({
        success: true,
        msg: "image uploaded",
        data: result
      })
    }
  })
};