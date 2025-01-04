import { Router } from "express";
import VerifyToken from '../Middlewares/VerifyToken.js'
import { getAllProvinces, deleteProvinceById, getProvinceById, updateProvinceById, createProvince, createZone, getAllZones, updateZoneById, deleteZoneById, getZoneById } from "../Controllers/ProvinceController.js";

export const ProvinceRouter = Router();
ProvinceRouter.route('/zone/')
  .post( createZone)
  .get( getAllZones)
ProvinceRouter.route('/zone/:id/')
  .delete(VerifyToken, deleteZoneById)
  .get(VerifyToken, getZoneById)
  .patch(VerifyToken, updateZoneById)
ProvinceRouter.route('/')
  .post(VerifyToken, createProvince)
  .get(VerifyToken, getAllProvinces)
ProvinceRouter.route('/:id/')
  .delete(VerifyToken, deleteProvinceById)
  .get(VerifyToken, getProvinceById)
  .patch(VerifyToken, updateProvinceById)


