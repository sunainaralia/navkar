import express from "express";
import CustomErrorHandler from "./Utils/CustomErrorHandler.js";
import ErrorHandling from "./Controllers/ErrorHandling.js";
import { userRouter } from './Routes/UserRouter.js';
import { contactRouter } from "./Routes/ContactRouter.js";
import { CityRouter, ProvinceRouter, ZoneRouter, PostalCodeRouter } from "./Routes/ProvinceRouter.js";
import { uploadRouter } from "./Routes/uploadRouter.js";
import setupSwaggerDocs from "./Middlewares/swaggerConfig.js";
const app = express();
app.use(express.json());
// Initialize Swagger Docs
setupSwaggerDocs(app);
// routes for user
app.use('/api/v1/user/', userRouter);
// routes for service request
app.use('/api/v1/serviceReq/', contactRouter);
// routes for province 
app.use('/api/v1/province/', ProvinceRouter);
// routes for city
app.use('/api/v1/city/', CityRouter);
// routes for zone
app.use('/api/v1/zone/', ZoneRouter);
// routes for postal code 
app.use('/api/v1/postal/', PostalCodeRouter);
// routes for upload image
app.use('/api/v1/upload/', uploadRouter)
app.all("*", (req, res, next) => {
  let err = new CustomErrorHandler(`the given url ${req.originalUrl} is not present`, 400);
  next(err)
});
app.use(ErrorHandling);
export default app;

