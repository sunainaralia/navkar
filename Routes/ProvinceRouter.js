import { Router } from "express";
import VerifyToken from '../Middlewares/VerifyToken.js'
import { getAllCities, getAllZones, getAllPostalCodes, getAllProvinces, getPostalCodeById, getCityById, getZoneById, deleteCityById, deleteProvinceById, deletePostalCodeById, deleteZoneById, getProvinceById, updateCityById, updatePostalCodeById, updateProvinceById, updateZoneById, createProvince, createZone, createCity, createPostalCode } from "../Controllers/ProvinceController.js";

export const ProvinceRouter = Router();
ProvinceRouter.route('/')
  .post(VerifyToken, createProvince)
  .get(VerifyToken, getAllProvinces)
ProvinceRouter.route('/:id/')
  .delete(VerifyToken, deleteProvinceById)
  .get(VerifyToken, getProvinceById)
  .patch(VerifyToken, updateProvinceById)

export const ZoneRouter = Router();
ZoneRouter.route('/')
  .post(VerifyToken, createZone)
  .get(VerifyToken, getAllZones)
ZoneRouter.route('/:id/')
  .delete(VerifyToken, deleteZoneById)
  .get(VerifyToken, getZoneById)
  .patch(VerifyToken, updateZoneById)

export const CityRouter = Router();
CityRouter.route('/')
  .post(VerifyToken, createCity)
  .get(VerifyToken, getAllCities)
CityRouter.route('/:id/')
  .delete(VerifyToken, deleteCityById)
  .get(VerifyToken, getCityById)
  .patch(VerifyToken, updateCityById)

export const PostalCodeRouter = Router();
PostalCodeRouter.route('/')
  .post(VerifyToken, createPostalCode)
  .get(VerifyToken, getAllPostalCodes)
PostalCodeRouter.route('/:id/')
  .delete(VerifyToken, deletePostalCodeById)
  .get(VerifyToken, getPostalCodeById)
  .patch(VerifyToken, updatePostalCodeById)