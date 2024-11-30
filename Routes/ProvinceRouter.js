import { Router } from "express";
import VerifyToken from '../Middlewares/VerifyToken.js'
import { getAllProvinces, deleteProvinceById, getProvinceById, updateProvinceById,createProvince } from "../Controllers/ProvinceController.js";

export const ProvinceRouter = Router();
ProvinceRouter.route('/')
  .post(VerifyToken, createProvince)
  .get(VerifyToken, getAllProvinces)
ProvinceRouter.route('/:id/')
  .delete(VerifyToken, deleteProvinceById)
  .get(VerifyToken, getProvinceById)
  .patch(VerifyToken, updateProvinceById)

