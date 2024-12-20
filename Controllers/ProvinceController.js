import { Province} from '../Models/Province.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import mongoose from 'mongoose';

// ////////////////////get all provinces//////////////////
export const getAllProvinces = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; 

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber;

  // Aggregate pipeline with pagination
  const provinces = await Province.aggregate([
    { $skip: skip },
    { $limit: limitNumber },
  ]);

  // Get the total number of provinces
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


// /////////////////////////post province///////////////////////////
export const createProvince = asyncFunHandler(async (req, res, next) => {
  const { province } = req.body;

  // Validate request body
  if (!Array.isArray(province) || province.length === 0) {
    return res.status(400).json({
      success: false,
      msg: "Province must be a non-empty array.",
    });
  }

  // Validate each object in the province array
  const provincesData = province.map((item) => {
    if (!item.name || !item.city || !item.zone || !item.postal_code) {
      next (new CustomErrorHandler("Each province object must include name, city, zone, service_charge, and postal_code."))
    }
    return {
      province: item.name,
      city: item.city,
      zone: item.zone,
      postal_code: item.postal_code,
    };
  });

  try {
    // Insert all documents into the database
    const createdProvinces = await Province.insertMany(provincesData);

    res.status(201).json({
      success: true,
      msg: "Provinces created successfully.",
      data: createdProvinces,
    });
  } catch (error) {
    // Handle any error during insertion
    next(new CustomErrorHandler(error.message, 500));
  }
});



//////////////////////get province id//////////////////////
export const getProvinceById = asyncFunHandler(async (req, res, next) => {
  const provinceId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(provinceId)) {
    return next(new CustomErrorHandler("Invalid province ID", 400));
  }
  const province = await Province.findById(provinceId);
  if (!province) {
    return next(new CustomErrorHandler("No province found", 404));
  }
  res.status(200).json({ success: true, msg: "Province fetched successfully", data: province });
});



// ///////////////////////// delete province by id ////////////////////
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

// ////////////////// update province by id ///////////////////////////////
export const updateProvinceById = asyncFunHandler(async (req, res, next) => {
  const provinceId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(provinceId)) {
    return next(new CustomErrorHandler("Invalid province ID", 400));
  }
  const province = await Province.findByIdAndUpdate(provinceId, req.body, { new: true, runValidators: true });
  if (!province) {
    return next(new CustomErrorHandler("No province found", 404));
  }
  res.status(200).json({ success: true, msg: "Province updated successfully", data: province });
});


