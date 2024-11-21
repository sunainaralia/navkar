import { Province, City, Zone, PostalCode } from '../Models/Province.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import mongoose from 'mongoose';

// ////////////////////get all provinces//////////////////
export const getAllProvinces = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Default values for page and limit

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber; // Calculate the number of documents to skip

  // Aggregate pipeline with pagination
  const provinces = await Province.aggregate([
    {
      $lookup: {
        from: 'cities', // Join with the City collection
        localField: '_id', // Province._id
        foreignField: 'province', // City.province
        as: 'cities', // Name of the joined array
      },
    },
    {
      $addFields: {
        totalCities: { $size: '$cities' }, // Count the cities in the joined array
      },
    },
    {
      $project: {
        cities: 0, // Exclude the joined cities array (optional)
      },
    },
    { $skip: skip }, // Skip documents for previous pages
    { $limit: limitNumber }, // Limit the number of documents
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
  const province = await Province.create(req.body);
  res.status(201).json({ success: true, msg: "Province created successfully", data: province });
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

  // Validate province ID
  if (!mongoose.Types.ObjectId.isValid(provinceId)) {
    return next(new CustomErrorHandler("Invalid province ID", 400));
  }

  // Check if the province exists
  const province = await Province.findById(provinceId);
  if (!province) {
    return next(new CustomErrorHandler("No province found", 404));
  }

  // Delete all associated cities
  await City.deleteMany({ province: provinceId });

  // Delete the province itself
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


/////////////////////// get all City APIs ///////////////////////
export const getAllCities = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Default values for page and limit

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber; // Calculate the number of documents to skip

  // Fetch the cities with pagination and populate the 'province' field
  const cities = await City.find()
    .populate('province')
    .skip(skip)
    .limit(limitNumber);

  // Get the total count of cities
  const totalCities = await City.countDocuments();

  if (!cities.length) {
    return next(new CustomErrorHandler("No cities found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Cities fetched successfully",
    data: cities,
    pagination: {
      total: totalCities,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCities / limitNumber),
      perPage: limitNumber,
    },
  });
});

// ///////////////////// post city//////////////////////////
export const createCity = asyncFunHandler(async (req, res, next) => {
  const city = new City(req.body);
  await city.save();
  res.status(201).json({ success: true, msg: "City created successfully", data: city });
});

// ///////////////////////// get city by id//////////////
export const getCityById = asyncFunHandler(async (req, res, next) => {
  const cityId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    return next(new CustomErrorHandler("Invalid city ID", 400));
  }
  const city = await City.findById(cityId).populate('province');
  if (!city) {
    return next(new CustomErrorHandler("No city found", 404));
  }
  res.status(200).json({ success: true, msg: "City fetched successfully", data: city });
});
// //////////////////////update city by id ///////////////////////////
export const updateCityById = asyncFunHandler(async (req, res, next) => {
  const cityId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    return next(new CustomErrorHandler("Invalid city ID", 400));
  }
  const city = await City.findByIdAndUpdate(cityId, req.body, { new: true, runValidators: true }).populate('province');
  if (!city) {
    return next(new CustomErrorHandler("No city found", 404));
  }
  res.status(200).json({ success: true, msg: "City updated successfully", data: city });
});
/////////////////////////////// delete city by id ///////////////////////////
export const deleteCityById = asyncFunHandler(async (req, res, next) => {
  const cityId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    return next(new CustomErrorHandler("Invalid city ID", 400));
  }
  const city = await City.findByIdAndDelete(cityId);
  if (!city) {
    return next(new CustomErrorHandler("No city found", 404));
  }
  res.status(204).send();
});


/////////////////////// get all PostalCode API ///////////////////////
export const getAllPostalCodes = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Default values for page and limit

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber; // Calculate the number of documents to skip

  // Fetch postal codes with pagination
  const postalCodes = await PostalCode.find().skip(skip).limit(limitNumber);

  // Get the total count of postal codes
  const totalPostalCodes = await PostalCode.countDocuments();

  if (!postalCodes.length) {
    return next(new CustomErrorHandler("No postal codes found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Postal codes fetched successfully",
    data: postalCodes,
    pagination: {
      total: totalPostalCodes,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalPostalCodes / limitNumber),
      perPage: limitNumber,
    },
  });
});


// //////////////////////// create postal code api///////////////////////////////
export const createPostalCode = asyncFunHandler(async (req, res, next) => {
  const postalCode = new PostalCode(req.body);
  await postalCode.save();
  res.status(201).json({ success: true, msg: "Postal code created successfully", data: postalCode });
});
//////////////////////////// get postal code by id /////////////////////////
export const getPostalCodeById = asyncFunHandler(async (req, res, next) => {
  const postalCodeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(postalCodeId)) {
    return next(new CustomErrorHandler("Invalid postal code ID", 400));
  }
  const postalCode = await PostalCode.findById(postalCodeId);
  if (!postalCode) {
    return next(new CustomErrorHandler("No postal code found", 404));
  }
  res.status(200).json({ success: true, msg: "Postal code fetched successfully", data: postalCode });
});

// ///////////////////////// delete postal code by id////////////////////////
export const deletePostalCodeById = asyncFunHandler(async (req, res, next) => {
  const postalCodeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(postalCodeId)) {
    return next(new CustomErrorHandler("Invalid postal code ID", 400));
  }
  const postalCode = await PostalCode.findById(postalCodeId);
  if (!postalCode) {
    return next(new CustomErrorHandler("No postal code found", 404));
  }
  await Zone.deleteMany({ postalCode: postalCodeId });
  await PostalCode.findByIdAndDelete(postalCodeId);

  res.status(204).send();
});


/////////////////////////////// update postal code by id ////////////////
export const updatePostalCodeById = asyncFunHandler(async (req, res, next) => {
  const postalCodeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(postalCodeId)) {
    return next(new CustomErrorHandler("Invalid postal code ID", 400));
  }
  const postalCode = await PostalCode.findByIdAndUpdate(postalCodeId, req.body, { new: true, runValidators: true });
  if (!postalCode) {
    return next(new CustomErrorHandler("No postal code found", 404));
  }
  res.status(200).json({ success: true, msg: "Postal code updated successfully", data: postalCode });
});
///////////////////////find all Zone APIs ///////////////////////
export const getAllZones = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Default values for page and limit

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber; // Calculate the number of documents to skip

  // Fetch zones with pagination and populate the 'postalCode' field
  const zones = await Zone.find()
    .populate('postalCode')
    .skip(skip)
    .limit(limitNumber);

  // Get the total count of zones
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

// //////////////////////// create zone api//////////////////////
export const createZone = asyncFunHandler(async (req, res, next) => {
  const zone = new Zone(req.body);
  await zone.save();
  res.status(201).json({ success: true, msg: "Zone created successfully", data: zone });
});
// /////////////////// get zone by id ///////////////////////
export const getZoneById = asyncFunHandler(async (req, res, next) => {
  const zoneId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    return next(new CustomErrorHandler("Invalid zone ID", 400));
  }
  const zone = await Zone.findById(zoneId).populate('postalCode');
  if (!zone) {
    return next(new CustomErrorHandler("No zone found", 404));
  }
  res.status(200).json({ success: true, msg: "Zone fetched successfully", data: zone });
});
// //////////////////////////delete zone by id///////////////////
export const deleteZoneById = asyncFunHandler(async (req, res, next) => {
  const zoneId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    return next(new CustomErrorHandler("Invalid zone ID", 400));
  }
  const zone = await Zone.findByIdAndDelete(zoneId);
  if (!zone) {
    return next(new CustomErrorHandler("No zone found", 404));
  }
  res.status(204).send();
});

// /////////////////////////////// update zone by id//////////////////////
export const updateZoneById = asyncFunHandler(async (req, res, next) => {
  const zoneId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    return next(new CustomErrorHandler("Invalid zone ID", 400));
  }
  const zone = await Zone.findByIdAndUpdate(zoneId, req.body, { new: true, runValidators: true }).populate('postalCode');
  if (!zone) {
    return next(new CustomErrorHandler("No zone found", 404));
  }
  res.status(200).json({ success: true, msg: "Zone updated successfully", data: zone });
});





