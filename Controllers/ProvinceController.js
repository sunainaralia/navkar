import { Province,Zone } from '../Models/Province.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import mongoose from 'mongoose';

// //////////////////// Get all provinces ////////////////////
export const getAllProvinces = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber;
  const provinces = await Province.aggregate([
    { $skip: skip },
    { $limit: limitNumber },
  ]);
  const totalProvinces = await Province.countDocuments();

  if (!provinces.length) {
    return next(new CustomErrorHandler("No provinces found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Provinces fetched successfully",
    data: provinces,
    pagination: {
      total: totalProvinces,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProvinces / limitNumber),
      perPage: limitNumber,
    },
  });
});

// /////////////////////// Post new province ////////////////////////
export const createProvince = asyncFunHandler(async (req, res, next) => {
  const { province, city } = req.body;

  if (!province || !city || !Array.isArray(city) || city.length === 0) {
    return res.status(400).json({
      success: false,
      msg: "Province and city array are required. Cities must be non-empty.",
    });
  }

  const newProvince = new Province({
    province: province,
    city: city,
  });

  try {
    const createdProvince = await newProvince.save();
    res.status(201).json({
      success: true,
      msg: "Province created successfully.",
      data: createdProvince,
    });
  } catch (error) {
    next(new CustomErrorHandler(error.message, 500));
  }
});

// ///////////////////// Get province by ID /////////////////////
export const getProvinceById = asyncFunHandler(async (req, res, next) => {
  const provinceId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(provinceId)) {
    return next(new CustomErrorHandler("Invalid province ID", 400));
  }

  const province = await Province.findById(provinceId);

  if (!province) {
    return next(new CustomErrorHandler("No province found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Province fetched successfully",
    data: province,
  });
});

// //////////////////// Delete province by ID ////////////////////
export const deleteProvinceById = asyncFunHandler(async (req, res, next) => {
  const provinceId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(provinceId)) {
    return next(new CustomErrorHandler("Invalid province ID", 400));
  }

  const province = await Province.findById(provinceId);

  if (!province) {
    return next(new CustomErrorHandler("No province found", 404));
  }

  await Province.findByIdAndDelete(provinceId);

  res.status(204).send();
});

// //////////////////// Update province by ID ////////////////////
export const updateProvinceById = asyncFunHandler(async (req, res, next) => {
  const provinceId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(provinceId)) {
    return next(new CustomErrorHandler("Invalid province ID", 400));
  }

  const province = await Province.findByIdAndUpdate(provinceId, req.body, { new: true, runValidators: true });

  if (!province) {
    return next(new CustomErrorHandler("No province found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Province updated successfully",
    data: province,
  });
});

// //////////////////////// Get all zones ////////////////////////
export const getAllZones = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber;
  const zones = await Zone.aggregate([
    { $skip: skip },
    { $limit: limitNumber },
  ]);
  const totalZones = await Zone.countDocuments();

  if (!zones.length) {
    return next(new CustomErrorHandler("No zones found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Zones fetched successfully",
    data: zones,
    pagination: {
      total: totalZones,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalZones / limitNumber),
      perPage: limitNumber,
    },
  });
});

// ///////////////////// Post new zone ////////////////////////
export const createZone = asyncFunHandler(async (req, res, next) => {
  const { zone, postalCode } = req.body;

  if (!zone || !postalCode || !Array.isArray(postalCode) || postalCode.length === 0) {
    return res.status(400).json({
      success: false,
      msg: "Zone and postalCode array are required. Postal codes must be non-empty.",
    });
  }

  const newZone = new Zone({
    Zone: zone,
    postalCode: postalCode,
  });

  try {
    const createdZone = await newZone.save();
    res.status(201).json({
      success: true,
      msg: "Zone created successfully.",
      data: createdZone,
    });
  } catch (error) {
    next(new CustomErrorHandler(error.message, 500));
  }
});

// ////////////////////// Get zone by ID ////////////////////////
export const getZoneById = asyncFunHandler(async (req, res, next) => {
  const zoneId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    return next(new CustomErrorHandler("Invalid zone ID", 400));
  }

  const zone = await Zone.findById(zoneId);

  if (!zone) {
    return next(new CustomErrorHandler("No zone found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Zone fetched successfully",
    data: zone,
  });
});

// /////////////////////// Delete zone by ID ////////////////////
export const deleteZoneById = asyncFunHandler(async (req, res, next) => {
  const zoneId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    return next(new CustomErrorHandler("Invalid zone ID", 400));
  }

  const zone = await Zone.findById(zoneId);

  if (!zone) {
    return next(new CustomErrorHandler("No zone found", 404));
  }

  await Zone.findByIdAndDelete(zoneId);

  res.status(204).send();
});

// /////////////////////// Update zone by ID ////////////////////
export const updateZoneById = asyncFunHandler(async (req, res, next) => {
  const zoneId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    return next(new CustomErrorHandler("Invalid zone ID", 400));
  }

  const zone = await Zone.findByIdAndUpdate(zoneId, req.body, { new: true, runValidators: true });

  if (!zone) {
    return next(new CustomErrorHandler("No zone found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Zone updated successfully",
    data: zone,
  });
});
