import express from "express";
import CustomErrorHandler from "./Utils/CustomErrorHandler.js";
import ErrorHandling from "./Controllers/ErrorHandling.js";
import { userRouter } from './Routes/UserRouter.js';
import { contactRouter } from "./Routes/ContactRouter.js";
const app = express();
app.use(express.json());
// routes for user
app.use('/api/v1/user/', userRouter);
// routes for service request
app.use('/api/v1/serviceReq/', contactRouter)
app.all("*", (req, res, next) => {
  let err = new CustomErrorHandler(`the given url ${req.originalUrl} is not present`, 400);
  next(err)
});
app.use(ErrorHandling);
export default app;

