import express from "express";
import cors from "cors";
import CustomErrorHandler from "./Utils/CustomErrorHandler.js";
import ErrorHandling from "./Controllers/ErrorHandling.js";
import { userRouter } from './Routes/UserRouter.js';
import { contactRouter } from "./Routes/ContactRouter.js";
import { ProvinceRouter } from "./Routes/ProvinceRouter.js";
import { uploadRouter } from "./Routes/UploadRouter.js";
import setupSwaggerDocs from "./Middlewares/swaggerConfig.js";
import clientOrderRouter from "./Routes/OrderRouter.js";
const app = express();

// Enable CORS
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}));

app.use(express.json());

// Initialize Swagger Docs
setupSwaggerDocs(app);

// Routes for user
app.use('/api/v1/user/', userRouter);
// Routes for service request
app.use('/api/v1/serviceReq/', contactRouter);
// Routes for province 
app.use('/api/v1/province/', ProvinceRouter);
// Routes for upload image
app.use('/api/v1/upload/', uploadRouter);
// Handle undefined routes
app.use("/api/v1/orders/", clientOrderRouter)
app.all("*", (req, res, next) => {
  let err = new CustomErrorHandler(`The given URL ${req.originalUrl} is not present`, 400);
  next(err);
});

// Error handling middleware
app.use(ErrorHandling);

export default app;
